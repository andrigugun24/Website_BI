<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TrendAnalysis;
use App\Services\UnderperformingDetector;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected UnderperformingDetector $detector;

    public function __construct(UnderperformingDetector $detector)
    {
        $this->detector = $detector;
    }

    /**
     * Main dashboard data.
     * Returns KPI cards, recent trends, and summary.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // ----- KPI Cards -----
        $today     = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $kpi = [
            'total_products'      => Product::active()->count(),
            'total_revenue_month' => Transaction::inPeriod($thisMonth, $today)->sum('total_amount'),
            'total_sales_month'   => Transaction::inPeriod($thisMonth, $today)->sum('quantity_sold'),
            'total_transactions'  => Transaction::inPeriod($thisMonth, $today)->count(),
        ];

        // Revenue comparison
        $lastMonthRevenue = Transaction::inPeriod(
            $lastMonth,
            $lastMonth->copy()->endOfMonth()
        )->sum('total_amount');

        $kpi['revenue_change_pct'] = $lastMonthRevenue > 0
            ? round((($kpi['total_revenue_month'] - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : 0;

        // ----- Underperforming Summary -----
        $underperformingSummary = $this->detector->getSummary();

        // ----- If owner, return only summary -----
        if ($user->isOwner()) {
            return response()->json([
                'kpi'                    => $kpi,
                'underperforming_summary'=> $underperformingSummary,
            ]);
        }

        // ----- Revenue by Day (last 30 days) for charts -----
        $dailyRevenue = Transaction::select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('SUM(quantity_sold) as qty')
            )
            ->where('transaction_date', '>=', $today->copy()->subDays(30))
            ->groupBy(DB::raw('DATE(transaction_date)'))
            ->orderBy('date')
            ->get();

        // ----- Top 5 underperforming products -----
        $underperforming = $this->detector->detect()->take(5);

        // ----- Top selling products this month -----
        $topProducts = Transaction::select(
                'product_id',
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('SUM(quantity_sold) as total_qty')
            )
            ->inPeriod($thisMonth, $today)
            ->groupBy('product_id')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->with('product:id,name,sku,category')
            ->get();

        // ----- Revenue by Category -----
        $categoryRevenue = Transaction::select(
                DB::raw('p.category'),
                DB::raw('SUM(transactions.total_amount) as revenue')
            )
            ->join('products as p', 'transactions.product_id', '=', 'p.id')
            ->inPeriod($thisMonth, $today)
            ->groupBy('p.category')
            ->orderByDesc('revenue')
            ->get();

        return response()->json([
            'kpi'                    => $kpi,
            'underperforming_summary'=> $underperformingSummary,
            'daily_revenue'          => $dailyRevenue,
            'underperforming'        => $underperforming,
            'top_products'           => $topProducts,
            'category_revenue'       => $categoryRevenue,
        ]);
    }
}
