<?php

namespace App\Services;

use App\Models\Product;
use App\Models\TrendAnalysis;
use Illuminate\Support\Collection;

class UnderperformingDetector
{
    /**
     * Threshold below which a product is considered underperforming.
     */
    const RATIO_THRESHOLD = 100;

    /**
     * Number of consecutive declines that triggers a critical alert.
     */
    const CRITICAL_DECLINE_COUNT = 2;

    /**
     * Get all currently underperforming products with their latest analysis.
     */
    public function detect(): Collection
    {
        return TrendAnalysis::with('product')
            ->latestPerProduct()
            ->underperforming()
            ->orderBy('trend_ratio', 'asc')
            ->get()
            ->map(function (TrendAnalysis $analysis) {
                return [
                    'product_id'          => $analysis->product_id,
                    'product_name'        => $analysis->product->name,
                    'product_sku'         => $analysis->product->sku,
                    'category'            => $analysis->product->category,
                    'current_stock'       => $analysis->product->current_stock,
                    'trend_ratio'         => $analysis->trend_ratio,
                    'consecutive_decline'  => $analysis->consecutive_decline,
                    'current_value'       => $analysis->current_value,
                    'base_value'          => $analysis->base_value,
                    'period'              => $analysis->period_start->format('Y-m-d') . ' to ' . $analysis->period_end->format('Y-m-d'),
                    'severity'            => $this->getSeverity($analysis),
                    'recommendation'      => $this->getRecommendation($analysis),
                ];
            });
    }

    /**
     * Determine severity level based on ratio and decline count.
     *
     * @return string 'critical' | 'warning' | 'watch'
     */
    public function getSeverity(TrendAnalysis $analysis): string
    {
        if ($analysis->trend_ratio < 50 || $analysis->consecutive_decline >= 3) {
            return 'critical';
        }

        if ($analysis->trend_ratio < 80 || $analysis->consecutive_decline >= self::CRITICAL_DECLINE_COUNT) {
            return 'warning';
        }

        return 'watch';
    }

    /**
     * Generate automatic recommendation based on analysis data.
     */
    public function getRecommendation(TrendAnalysis $analysis): string
    {
        $ratio   = $analysis->trend_ratio;
        $decline = $analysis->consecutive_decline;
        $stock   = $analysis->product->current_stock;

        if ($ratio < 50 && $decline >= 3) {
            return 'KRITIS: Penjualan turun drastis. Pertimbangkan diskon besar, bundling, atau stop restock. Stok saat ini: ' . $stock;
        }

        if ($ratio < 80) {
            return 'PERLU AKSI: Lakukan promo atau diskon untuk meningkatkan penjualan. Review strategi harga.';
        }

        if ($decline >= self::CRITICAL_DECLINE_COUNT) {
            return 'TREN MENURUN: Penjualan menurun ' . $decline . ' periode berturut-turut. Evaluasi ulang produk ini.';
        }

        return 'PANTAU: Rasio di bawah 100%. Monitor perkembangan periode berikutnya.';
    }

    /**
     * Get summary statistics for the dashboard.
     */
    public function getSummary(): array
    {
        $latest = TrendAnalysis::latestPerProduct()->get();

        $total           = $latest->count();
        $underperforming = $latest->where('is_underperforming', true)->count();
        $critical        = $latest->where('trend_ratio', '<', 50)->count();
        $healthy         = $latest->where('trend_ratio', '>=', 100)->count();

        return [
            'total_products'       => $total,
            'underperforming'      => $underperforming,
            'critical'             => $critical,
            'healthy'              => $healthy,
            'underperforming_pct'  => $total > 0 ? round(($underperforming / $total) * 100, 1) : 0,
            'avg_trend_ratio'      => round($latest->avg('trend_ratio'), 2),
        ];
    }
}
