<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TrendAnalysis;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReportExportService
{
    /**
     * Get report data filtered by parameters.
     */
    public function getReportData(array $filters = []): Collection
    {
        $query = Transaction::with(['product', 'user']);

        // Date range filter
        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->inPeriod(
                Carbon::parse($filters['start_date']),
                Carbon::parse($filters['end_date'])
            );
        }

        // Category filter
        if (!empty($filters['category'])) {
            $query->whereHas('product', function ($q) use ($filters) {
                $q->where('category', $filters['category']);
            });
        }

        // Product filter
        if (!empty($filters['product_id'])) {
            $query->byProduct($filters['product_id']);
        }

        // Source filter
        if (!empty($filters['source'])) {
            $query->bySource($filters['source']);
        }

        return $query->orderBy('transaction_date', 'desc')->get();
    }

    /**
     * Get trend analysis report data.
     */
    public function getTrendReportData(array $filters = []): Collection
    {
        $query = TrendAnalysis::with('product');

        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (!empty($filters['underperforming_only'])) {
            $query->underperforming();
        }

        return $query->orderBy('period_end', 'desc')->get();
    }

    /**
     * Export transactions to CSV format.
     */
    public function exportCsv(array $filters = []): string
    {
        $data = $this->getReportData($filters);

        $filename = 'laporan_penjualan_' . Carbon::now()->format('Y-m-d_His') . '.csv';
        $path     = storage_path('app/exports/' . $filename);

        // Ensure directory exists
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $handle = fopen($path, 'w');

        // UTF-8 BOM for Excel compatibility
        fwrite($handle, "\xEF\xBB\xBF");

        // Header
        fputcsv($handle, [
            'Tanggal',
            'SKU',
            'Produk',
            'Kategori',
            'Qty Terjual',
            'Harga Satuan',
            'Total',
            'Sumber',
            'Ref Order',
        ]);

        // Data rows
        foreach ($data as $trx) {
            fputcsv($handle, [
                $trx->transaction_date->format('Y-m-d'),
                $trx->product->sku,
                $trx->product->name,
                $trx->product->category,
                $trx->quantity_sold,
                $trx->unit_price,
                $trx->total_amount,
                $trx->source,
                $trx->order_ref,
            ]);
        }

        fclose($handle);

        return $path;
    }

    /**
     * Export transactions to PDF.
     */
    public function exportPdf(array $filters = [], bool $summaryOnly = false): string
    {
        $data = $this->getReportData($filters);

        $filename = 'laporan_penjualan_' . Carbon::now()->format('Y-m-d_His') . '.pdf';
        $path     = storage_path('app/exports/' . $filename);

        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        // Build summary
        $summary = [
            'total_transactions' => $data->count(),
            'total_revenue'      => $data->sum('total_amount'),
            'total_qty'          => $data->sum('quantity_sold'),
            'avg_transaction'    => $data->count() > 0 ? round($data->avg('total_amount'), 2) : 0,
            'period'             => ($filters['start_date'] ?? 'All') . ' s/d ' . ($filters['end_date'] ?? 'All'),
        ];

        $viewData = [
            'summary'     => $summary,
            'summaryOnly' => $summaryOnly,
            'transactions'=> $summaryOnly ? collect() : $data,
            'generated_at'=> Carbon::now()->format('d M Y H:i'),
        ];

        $pdf = Pdf::loadView('reports.pdf', $viewData);
        $pdf->setPaper('a4', 'landscape');
        $pdf->save($path);

        return $path;
    }
}
