<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrendAnalysis extends Model
{
    use HasFactory;

    protected $table = 'trend_analyses';

    protected $fillable = [
        'product_id',
        'period_start',
        'period_end',
        'base_period_start',
        'base_period_end',
        'current_value',
        'base_value',
        'trend_ratio',
        'is_underperforming',
        'consecutive_decline',
    ];

    protected $casts = [
        'period_start'       => 'date',
        'period_end'         => 'date',
        'base_period_start'  => 'date',
        'base_period_end'    => 'date',
        'current_value'      => 'decimal:2',
        'base_value'         => 'decimal:2',
        'trend_ratio'        => 'decimal:2',
        'is_underperforming' => 'boolean',
        'consecutive_decline'=> 'integer',
    ];

    // ----- Relationships -----

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ----- Scopes -----

    public function scopeUnderperforming($query)
    {
        return $query->where('is_underperforming', true);
    }

    public function scopeLatestPerProduct($query)
    {
        return $query->whereRaw('id = (SELECT MAX(ta.id) FROM trend_analyses ta WHERE ta.product_id = trend_analyses.product_id)');
    }
}
