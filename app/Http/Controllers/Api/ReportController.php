<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected ReportExportService $exportService;

    public function __construct(ReportExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Preview report data (JSON).
     */
    public function preview(Request $request): JsonResponse
    {
        $filters = $request->only(['start_date', 'end_date', 'category', 'product_id', 'source']);

        $data = $this->exportService->getReportData($filters);

        $summary = [
            'total_records'  => $data->count(),
            'total_revenue'  => $data->sum('total_amount'),
            'total_qty'      => $data->sum('quantity_sold'),
            'avg_transaction'=> $data->count() > 0 ? round($data->avg('total_amount'), 2) : 0,
        ];

        // Owner only sees summary
        if ($request->user()->isOwner()) {
            return response()->json(['summary' => $summary]);
        }

        return response()->json([
            'summary' => $summary,
            'data'    => $data->take(100), // Limit preview to 100 rows
        ]);
    }

    /**
     * Export to CSV.
     */
    public function exportCsv(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'category', 'product_id', 'source']);
        $path    = $this->exportService->exportCsv($filters);

        return response()->download($path)->deleteFileAfterSend(true);
    }

    /**
     * Export to PDF.
     */
    public function exportPdf(Request $request)
    {
        $filters     = $request->only(['start_date', 'end_date', 'category', 'product_id', 'source']);
        $summaryOnly = $request->user()->isOwner(); // Owner only gets summary PDF

        $path = $this->exportService->exportPdf($filters, $summaryOnly);

        return response()->download($path)->deleteFileAfterSend(true);
    }

    /**
     * Get trend analysis report.
     */
    public function trendReport(Request $request): JsonResponse
    {
        $filters = $request->only(['product_id', 'underperforming_only']);
        $data    = $this->exportService->getTrendReportData($filters);

        return response()->json($data);
    }
}
