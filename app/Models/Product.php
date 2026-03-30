<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'name',
        'category',
        'price',
        'current_stock',
        'min_stock_threshold',
        'shopee_item_id',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'price'         => 'decimal:2',
        'current_stock' => 'integer',
        'is_active'     => 'boolean',
    ];

    // ----- Relationships -----

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function trendAnalyses(): HasMany
    {
        return $this->hasMany(TrendAnalysis::class);
    }

    // ----- Scopes -----

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeUnderperforming($query)
    {
        return $query->whereHas('trendAnalyses', function ($q) {
            $q->where('is_underperforming', true)
              ->whereRaw('id = (SELECT MAX(id) FROM trend_analyses WHERE trend_analyses.product_id = products.id)');
        });
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_stock', '<=', 'min_stock_threshold');
    }

    // ----- Accessors -----

    /**
     * Get latest trend analysis for this product.
     */
    public function getLatestTrendAttribute(): ?TrendAnalysis
    {
        return $this->trendAnalyses()->latest('period_end')->first();
    }
}
