<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'user_id',
        'transaction_date',
        'quantity_sold',
        'unit_price',
        'total_amount',
        'source',
        'order_ref',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'unit_price'       => 'decimal:2',
        'total_amount'     => 'decimal:2',
        'quantity_sold'    => 'integer',
    ];

    // ----- Relationships -----

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ----- Scopes -----

    public function scopeInPeriod($query, $start, $end)
    {
        return $query->whereBetween('transaction_date', [$start, $end]);
    }

    public function scopeBySource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeByProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }
}
