<?php

namespace App\Services;

use App\Models\EtlLog;
use App\Models\Product;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EtlService
{
    protected TrendRatioCalculator $calculator;

    public function __construct(TrendRatioCalculator $calculator)
    {
        $this->calculator = $calculator;
    }

    /**
     * Run the complete ETL pipeline.
     *
     * Steps:
     * 1. Extract raw data from configured sources
     * 2. Transform & validate data
     * 3. Load into standardized tables
     * 4. Recalculate trend analyses
     */
    public function run(string $source = 'manual'): EtlLog
    {
        $log = EtlLog::create([
            'source'     => $source,
            'status'     => 'running',
            'started_at' => Carbon::now(),
        ]);

        try {
            Log::info("ETL Process started for source: {$source}");

            $recordsProcessed = 0;

            switch ($source) {
                case 'import':
                    $recordsProcessed = $this->extractFromImport();
                    break;
                default:
                    // For manual source, just recalculate trends
                    $recordsProcessed = $this->recalculateAllTrends();
                    break;
            }

            $log->update([
                'status'            => 'success',
                'records_processed' => $recordsProcessed,
                'completed_at'      => Carbon::now(),
            ]);

            Log::info("ETL Process completed. Records processed: {$recordsProcessed}");

            // Generate notification for ETL completion
            \App\Services\NotificationService::notifyEtlComplete('success', $recordsProcessed);

        } catch (\Exception $e) {
            $log->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at'  => Carbon::now(),
            ]);

            Log::error("ETL Process failed: " . $e->getMessage());

            // Generate notification for ETL failure
            \App\Services\NotificationService::notifyEtlComplete('failed', 0, $e->getMessage());

            throw $e;
        }

        return $log;
    }

    /**
     * Recalculate trend ratios for all products (monthly).
     */
    protected function recalculateAllTrends(): int
    {
        $results = $this->calculator->calculateMonthly();
        return $results->count();
    }


    /**
     * Extract data from CSV/Excel import files.
     */
    protected function extractFromImport(): int
    {
        // This will be triggered by file upload in the Data Management module
        Log::info('Import ETL: Triggered by file upload');
        return 0;
    }

    /**
     * Process imported data rows into transactions.
     *
     * @param  array  $rows  Array of associative arrays with keys:
     *   sku, transaction_date, quantity_sold, unit_price, source, order_ref
     */
    public function processImportedData(array $rows, int $userId): int
    {
        $processed = 0;

        DB::beginTransaction();

        try {
            foreach ($rows as $row) {
                $product = Product::where('sku', $row['sku'])->first();

                if (!$product) {
                    Log::warning("ETL: Product SKU not found: {$row['sku']}");
                    continue;
                }

                $quantity  = (int) ($row['quantity_sold'] ?? 0);
                $unitPrice = (float) ($row['unit_price'] ?? $product->price);

                Transaction::create([
                    'product_id'       => $product->id,
                    'user_id'          => $userId,
                    'transaction_date' => Carbon::parse($row['transaction_date']),
                    'quantity_sold'    => $quantity,
                    'unit_price'       => $unitPrice,
                    'total_amount'     => $quantity * $unitPrice,
                    'source'           => $row['source'] ?? 'import',
                    'order_ref'        => $row['order_ref'] ?? null,
                ]);

                // Update product stock
                $product->decrement('current_stock', $quantity);

                $processed++;
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $processed;
    }
}
