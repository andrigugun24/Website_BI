<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TrendAnalysis;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TrendRatioCalculator
{
    /**
     * Calculate trend ratio for all active products.
     *
     * Formula: Trend Ratio (%) = (Current Period Value / Base Period Value) × 100
     *
     * @param  Carbon  $currentStart  Start of current period
     * @param  Carbon  $currentEnd    End of current period
     * @param  Carbon  $baseStart     Start of base/comparison period
     * @param  Carbon  $baseEnd       End of base/comparison period
     * @return Collection  Collection of TrendAnalysis records created
     */
    public function calculateAll(
        Carbon $currentStart,
        Carbon $currentEnd,
        Carbon $baseStart,
        Carbon $baseEnd
    ): Collection {
        $products = Product::active()->get();
        $results  = collect();

        DB::beginTransaction();

        try {
            foreach ($products as $product) {
                $analysis = $this->calculateForProduct(
                    $product,
                    $currentStart,
                    $currentEnd,
                    $baseStart,
                    $baseEnd
                );
                $results->push($analysis);
            }

            DB::commit();

            // Generate notifications for underperforming products
            \App\Services\NotificationService::checkUnderperforming($results->all());
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    /**
     * Calculate trend ratio for a single product.
     */
    public function calculateForProduct(
        Product $product,
        Carbon $currentStart,
        Carbon $currentEnd,
        Carbon $baseStart,
        Carbon $baseEnd
    ): TrendAnalysis {
        // Sum total_amount for each period
        $currentValue = Transaction::where('product_id', $product->id)
            ->inPeriod($currentStart, $currentEnd)
            ->sum('total_amount');

        $baseValue = Transaction::where('product_id', $product->id)
            ->inPeriod($baseStart, $baseEnd)
            ->sum('total_amount');

        // Calculate ratio
        $trendRatio = $baseValue > 0
            ? round(($currentValue / $baseValue) * 100, 2)
            : ($currentValue > 0 ? 999.99 : 0);

        // Determine underperforming status
        $isUnderperforming = $trendRatio < 100 && $trendRatio > 0;

        // Calculate consecutive decline
        $consecutiveDecline = $this->getConsecutiveDecline($product->id, $trendRatio);

        return TrendAnalysis::create([
            'product_id'         => $product->id,
            'period_start'       => $currentStart,
            'period_end'         => $currentEnd,
            'base_period_start'  => $baseStart,
            'base_period_end'    => $baseEnd,
            'current_value'      => $currentValue,
            'base_value'         => $baseValue,
            'trend_ratio'        => $trendRatio,
            'is_underperforming' => $isUnderperforming,
            'consecutive_decline'=> $consecutiveDecline,
        ]);
    }

    /**
     * Count how many consecutive periods the product has declined.
     */
    private function getConsecutiveDecline(int $productId, float $currentRatio): int
    {
        if ($currentRatio >= 100) {
            return 0; // Reset if not declining
        }

        // Get previous analyses ordered by period_end descending
        $previous = TrendAnalysis::where('product_id', $productId)
            ->orderBy('period_end', 'desc')
            ->limit(10)
            ->get();

        $count = 1; // Current period counts as 1

        foreach ($previous as $analysis) {
            if ($analysis->trend_ratio < 100) {
                $count++;
            } else {
                break; // Stop counting when we find a non-declining period
            }
        }

        return $count;
    }

    /**
     * Calculate monthly trend ratios: current month vs previous month.
     */
    public function calculateMonthly(?Carbon $date = null): Collection
    {
        $date = $date ?? Carbon::now();

        $currentStart = $date->copy()->startOfMonth();
        $currentEnd   = $date->copy()->endOfMonth();
        $baseStart    = $date->copy()->subMonth()->startOfMonth();
        $baseEnd      = $date->copy()->subMonth()->endOfMonth();

        return $this->calculateAll($currentStart, $currentEnd, $baseStart, $baseEnd);
    }

    /**
     * Calculate weekly trend ratios: current week vs previous week.
     */
    public function calculateWeekly(?Carbon $date = null): Collection
    {
        $date = $date ?? Carbon::now();

        $currentStart = $date->copy()->startOfWeek();
        $currentEnd   = $date->copy()->endOfWeek();
        $baseStart    = $date->copy()->subWeek()->startOfWeek();
        $baseEnd      = $date->copy()->subWeek()->endOfWeek();

        return $this->calculateAll($currentStart, $currentEnd, $baseStart, $baseEnd);
    }
}
