<?php

namespace App\Imports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class ProductImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    /**
    * @param Collection $rows
    */
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Pastikan kolom esensial ada
            if (!isset($row['sku']) || !isset($row['name'])) {
                continue;
            }

            Product::updateOrCreate(
                ['sku' => trim($row['sku'])],
                [
                    'name' => $row['name'],
                    'category' => $row['category'] ?? 'Uncategorized',
                    'price' => $row['price'] ?? 0,
                    'current_stock' => $row['current_stock'] ?? 0,
                    'min_stock_threshold' => $row['min_stock_threshold'] ?? 10,
                    'is_active' => true,
                ]
            );
        }
    }
}
