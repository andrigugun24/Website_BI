<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * List transactions with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['product:id,name,sku,category', 'user:id,name']);

        // Date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->inPeriod(
                Carbon::parse($request->start_date),
                Carbon::parse($request->end_date)
            );
        }

        // Filter by product
        if ($productId = $request->input('product_id')) {
            $query->byProduct($productId);
        }

        // Filter by source
        if ($source = $request->input('source')) {
            $query->bySource($source);
        }

        $perPage      = $request->input('per_page', 20);
        $transactions = $query->orderByDesc('transaction_date')->paginate($perPage);

        return response()->json($transactions);
    }

    /**
     * Store a new transaction (manual entry).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id'       => 'required|exists:products,id',
            'transaction_date' => 'required|date',
            'quantity_sold'    => 'required|integer|min:1',
            'unit_price'       => 'required|numeric|min:0',
            'order_ref'        => 'nullable|string|max:100',
        ]);

        $validated['user_id']      = $request->user()->id;
        $validated['total_amount'] = $validated['quantity_sold'] * $validated['unit_price'];
        $validated['source']       = 'manual';

        $transaction = Transaction::create($validated);

        // Update product stock
        $transaction->product->decrement('current_stock', $validated['quantity_sold']);

        return response()->json([
            'message'     => 'Transaksi berhasil dicatat.',
            'transaction' => $transaction->load('product'),
        ], 201);
    }

    /**
     * Show a single transaction.
     */
    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json(
            $transaction->load(['product', 'user'])
        );
    }

    /**
     * Get sales summary grouped by period.
     */
    public function summary(Request $request): JsonResponse
    {
        $groupBy = $request->input('group_by', 'day'); // day | week | month
        $startDate = $request->input('start_date', Carbon::now()->subMonths(3)->toDateString());
        $endDate   = $request->input('end_date', Carbon::now()->toDateString());

        $dateExpr = match ($groupBy) {
            'week'  => DB::raw("DATE_FORMAT(transaction_date, '%x-W%v') as period"),
            'month' => DB::raw("DATE_FORMAT(transaction_date, '%Y-%m') as period"),
            default => DB::raw("DATE(transaction_date) as period"),
        };

        $summary = Transaction::select(
                $dateExpr,
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('SUM(quantity_sold) as qty_sold'),
                DB::raw('COUNT(*) as trx_count')
            )
            ->inPeriod(Carbon::parse($startDate), Carbon::parse($endDate))
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json($summary);
    }
}
