<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EtlLog;
use App\Services\EtlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DataManagementController extends Controller
{
    protected EtlService $etlService;

    public function __construct(EtlService $etlService)
    {
        $this->etlService = $etlService;
    }

    /**
     * Manually trigger ETL process.
     */
    public function runEtl(Request $request): JsonResponse
    {
        $source = $request->input('source', 'manual');

        try {
            $log = $this->etlService->run($source);

            return response()->json([
                'message' => 'Proses ETL berhasil dijalankan.',
                'log'     => $log,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Proses ETL gagal.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get ETL logs.
     */
    public function etlLogs(Request $request): JsonResponse
    {
        $logs = EtlLog::orderByDesc('started_at')
            ->paginate($request->input('per_page', 20));

        return response()->json($logs);
    }

    /**
     * Import transactions from uploaded data.
     */
    public function importData(Request $request): JsonResponse
    {
        $request->validate([
            'data'   => 'required|array',
            'data.*.sku'              => 'required|string',
            'data.*.transaction_date' => 'required|date',
            'data.*.quantity_sold'    => 'required|integer|min:1',
            'data.*.unit_price'       => 'required|numeric|min:0',
            'data.*.source'           => 'nullable|string',
            'data.*.order_ref'        => 'nullable|string',
        ]);

        try {
            $processed = $this->etlService->processImportedData(
                $request->input('data'),
                $request->user()->id
            );

            return response()->json([
                'message'          => 'Data berhasil diimpor.',
                'records_processed'=> $processed,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Impor data gagal.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
