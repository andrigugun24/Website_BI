<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['sku' => 'TR-001', 'name' => 'Cincin Emas 24K 5gr',      'category' => 'Cincin',   'price' => 5500000,  'current_stock' => 25, 'min_stock_threshold' => 5],
            ['sku' => 'TR-002', 'name' => 'Kalung Emas 18K 10gr',     'category' => 'Kalung',   'price' => 8200000,  'current_stock' => 15, 'min_stock_threshold' => 3],
            ['sku' => 'TR-003', 'name' => 'Gelang Emas 22K 8gr',      'category' => 'Gelang',   'price' => 7100000,  'current_stock' => 18, 'min_stock_threshold' => 5],
            ['sku' => 'TR-004', 'name' => 'Anting Emas 18K 3gr',      'category' => 'Anting',   'price' => 2800000,  'current_stock' => 30, 'min_stock_threshold' => 8],
            ['sku' => 'TR-005', 'name' => 'Liontin Emas 24K 2gr',     'category' => 'Liontin',  'price' => 2200000,  'current_stock' => 40, 'min_stock_threshold' => 10],
            ['sku' => 'TR-006', 'name' => 'Cincin Berlian 0.5ct',     'category' => 'Cincin',   'price' => 15000000, 'current_stock' => 8,  'min_stock_threshold' => 2],
            ['sku' => 'TR-007', 'name' => 'Kalung Mutiara Laut',      'category' => 'Kalung',   'price' => 3500000,  'current_stock' => 50, 'min_stock_threshold' => 10],
            ['sku' => 'TR-008', 'name' => 'Gelang Perak 925 Sterling', 'category' => 'Gelang',   'price' => 850000,   'current_stock' => 60, 'min_stock_threshold' => 15],
            ['sku' => 'TR-009', 'name' => 'Cincin Tunangan Rose Gold', 'category' => 'Cincin',   'price' => 4200000,  'current_stock' => 12, 'min_stock_threshold' => 3],
            ['sku' => 'TR-010', 'name' => 'Bros Emas Vintage',        'category' => 'Aksesoris','price' => 3800000,  'current_stock' => 45, 'min_stock_threshold' => 10],
            ['sku' => 'TR-011', 'name' => 'Jam Tangan Emas 22K',      'category' => 'Aksesoris','price' => 25000000, 'current_stock' => 5,  'min_stock_threshold' => 1],
            ['sku' => 'TR-012', 'name' => 'Anting Mutiara Air Tawar', 'category' => 'Anting',   'price' => 1500000,  'current_stock' => 35, 'min_stock_threshold' => 8],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }

        // Generate sample transactions for the last 4 months
        $this->generateSampleTransactions();
    }

    private function generateSampleTransactions(): void
    {
        $products = Product::all();
        $now      = Carbon::now();

        foreach ($products as $product) {
            // Generate data for last 4 months
            for ($month = 3; $month >= 0; $month--) {
                $monthStart = $now->copy()->subMonths($month)->startOfMonth();
                $monthEnd   = $month === 0
                    ? $now->copy()
                    : $now->copy()->subMonths($month)->endOfMonth();

                // Vary quantity per product to simulate underperforming
                $baseQty = match (true) {
                    in_array($product->sku, ['TR-007', 'TR-008', 'TR-010']) => max(1, 8 - ($month * 2)), // Declining products
                    in_array($product->sku, ['TR-001', 'TR-006']) => 3 + $month,                         // Growing products
                    default => rand(2, 6),                                                                // Random
                };

                // Create 3-8 transactions per month
                $transactionsCount = rand(3, 8);

                for ($i = 0; $i < $transactionsCount; $i++) {
                    $date    = Carbon::createFromTimestamp(rand($monthStart->timestamp, $monthEnd->timestamp));
                    $qtySold = max(1, $baseQty + rand(-1, 2));

                    Transaction::create([
                        'product_id'       => $product->id,
                        'user_id'          => 1,
                        'transaction_date' => $date->toDateString(),
                        'quantity_sold'    => $qtySold,
                        'unit_price'       => $product->price,
                        'total_amount'     => $qtySold * $product->price,
                        'source'           => 'manual',
                        'order_ref'        => 'SEED-' . strtoupper(substr(md5(rand()), 0, 8)),
                    ]);
                }
            }
        }
    }
}
