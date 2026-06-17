<?php

namespace App\Imports;

use App\Models\Transaction;
use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use Carbon\Carbon;

class TransactionImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    /**
    * @param Collection $rows
    */
    public function collection(Collection $rows)
    {
        $userId = auth()->id() ?? 1; // Fallback jika dijalankan via console

        foreach ($rows as $row) {
            if (!isset($row['product_sku'])) {
                continue;
            }

            $sku = trim($row['product_sku']);
            $product = Product::where('sku', $sku)->first();

            // Abaikan jika produk tidak ditemukan
            if (!$product) {
                continue;
            }

            $qtySold = (int) ($row['quantity_sold'] ?? 1);
            $unitPrice = (float) ($row['unit_price'] ?? $product->price);
            $totalAmount = $qtySold * $unitPrice;
            
            // Format tanggal, gunakan hari ini jika kosong atau format salah
            $transactionDate = Carbon::now();
            if (!empty($row['transaction_date'])) {
                try {
                    // Coba parsing tanggal Excel atau string standar
                    $transactionDate = Carbon::parse($row['transaction_date']);
                } catch (\Exception $e) {
                    $transactionDate = Carbon::now();
                }
            }

            DB::transaction(function () use ($product, $qtySold, $unitPrice, $totalAmount, $transactionDate, $row, $userId) {
                // Buat transaksi
                Transaction::create([
                    'product_id' => $product->id,
                    'user_id' => $userId,
                    'transaction_date' => $transactionDate,
                    'quantity_sold' => $qtySold,
                    'unit_price' => $unitPrice,
                    'total_amount' => $totalAmount,
                    'source' => 'excel_import',
                    'order_ref' => $row['order_ref'] ?? null,
                ]);

                // Kurangi stok
                $product->decrement('current_stock', $qtySold);
                
                // Cek low stock
                $product->refresh();
                NotificationService::checkLowStock($product);
            });
        }
    }
}
