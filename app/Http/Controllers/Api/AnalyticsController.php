<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\TrendAnalysis;
use App\Services\TrendRatioCalculator;
use App\Services\UnderperformingDetector;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    protected TrendRatioCalculator $calculator;
    protected UnderperformingDetector $detector;

    public function __construct(
        TrendRatioCalculator $calculator,
        UnderperformingDetector $detector
    ) {
        $this->calculator = $calculator;
        $this->detector   = $detector;
    }

    /**
     * Get trend analysis data.
     * Returns trend ratios for all or specific products.
     */
    public function trend(Request $request): JsonResponse
    {
        $query = TrendAnalysis::with('product:id,name,sku,category');

        if ($productId = $request->input('product_id')) {
            $query->where('product_id', $productId);
        }

        if ($request->boolean('latest_only')) {
            $query->latestPerProduct();
        }

        $data = $query->orderBy('period_end', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json($data);
    }

    /**
     * Get underperforming products with severity and recommendations.
     */
    public function underperforming(Request $request): JsonResponse
    {
        $products = $this->detector->detect();
        $summary  = $this->detector->getSummary();

        // For Owner role, return only summary counts
        if ($request->user()->isOwner()) {
            return response()->json([
                'summary'  => $summary,
                'products' => $products->map(function ($p) {
                    return [
                        'product_name' => $p['product_name'],
                        'severity'     => $p['severity'],
                        'trend_ratio'  => $p['trend_ratio'],
                    ];
                }),
            ]);
        }

        return response()->json([
            'summary'  => $summary,
            'products' => $products,
        ]);
    }

    /**
     * Trigger trend ratio calculation.
     * Admin only.
     */
    public function calculate(Request $request): JsonResponse
    {
        $request->validate([
            'period_type' => 'sometimes|in:monthly,weekly,custom',
            'current_start' => 'required_if:period_type,custom|date',
            'current_end'   => 'required_if:period_type,custom|date',
            'base_start'    => 'required_if:period_type,custom|date',
            'base_end'      => 'required_if:period_type,custom|date',
        ]);

        $periodType = $request->input('period_type', 'monthly');

        if ($periodType === 'custom') {
            $results = $this->calculator->calculateAll(
                Carbon::parse($request->current_start),
                Carbon::parse($request->current_end),
                Carbon::parse($request->base_start),
                Carbon::parse($request->base_end)
            );
        } elseif ($periodType === 'weekly') {
            $results = $this->calculator->calculateWeekly();
        } else {
            $results = $this->calculator->calculateMonthly();
        }

        return response()->json([
            'message'          => 'Perhitungan rasio tren selesai.',
            'products_analyzed'=> $results->count(),
            'underperforming'  => $results->where('is_underperforming', true)->count(),
            'avg_ratio'        => round($results->avg('trend_ratio'), 2),
        ]);
    }

    /**
     * Get heatmap data: product × time matrix.
     */
    public function heatmap(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', Carbon::now()->subMonths(6)->toDateString());
        $endDate   = $request->input('end_date', Carbon::now()->toDateString());
        $groupBy   = $request->input('group_by', 'month'); // week | month

        $dateFormat = $groupBy === 'week'
            ? "DATE_FORMAT(t.transaction_date, '%x-W%v')"
            : "DATE_FORMAT(t.transaction_date, '%Y-%m')";

        $data = DB::select("
            SELECT
                p.id as product_id,
                p.name as product_name,
                p.category,
                {$dateFormat} as period,
                SUM(t.quantity_sold) as qty_sold,
                SUM(t.total_amount) as revenue
            FROM transactions t
            JOIN products p ON t.product_id = p.id
            WHERE t.transaction_date BETWEEN ? AND ?
            GROUP BY p.id, p.name, p.category, period
            ORDER BY p.name, period
        ", [$startDate, $endDate]);

        return response()->json($data);
    }

    /**
     * Get period-over-period comparison data for column chart.
     */
    public function periodComparison(Request $request): JsonResponse
    {
        $currentStart = Carbon::parse($request->input('current_start', Carbon::now()->startOfMonth()));
        $currentEnd   = Carbon::parse($request->input('current_end', Carbon::now()));
        $baseStart    = Carbon::parse($request->input('base_start', Carbon::now()->subMonth()->startOfMonth()));
        $baseEnd      = Carbon::parse($request->input('base_end', Carbon::now()->subMonth()->endOfMonth()));

        // Get per-product comparison
        $products = Product::active()->get();

        $comparison = $products->map(function ($product) use ($currentStart, $currentEnd, $baseStart, $baseEnd) {
            $currentRevenue = $product->transactions()
                ->inPeriod($currentStart, $currentEnd)
                ->sum('total_amount');

            $baseRevenue = $product->transactions()
                ->inPeriod($baseStart, $baseEnd)
                ->sum('total_amount');

            $ratio = $baseRevenue > 0
                ? round(($currentRevenue / $baseRevenue) * 100, 2)
                : ($currentRevenue > 0 ? 999.99 : 0);

            return [
                'product_id'      => $product->id,
                'product_name'    => $product->name,
                'category'        => $product->category,
                'current_revenue' => $currentRevenue,
                'base_revenue'    => $baseRevenue,
                'trend_ratio'     => $ratio,
            ];
        })->sortBy('trend_ratio')->values();

        return response()->json([
            'current_period' => $currentStart->format('Y-m-d') . ' s/d ' . $currentEnd->format('Y-m-d'),
            'base_period'    => $baseStart->format('Y-m-d') . ' s/d ' . $baseEnd->format('Y-m-d'),
            'products'       => $comparison,
        ]);
    }
}
