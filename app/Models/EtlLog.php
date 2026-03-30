<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EtlLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'source',
        'status',
        'records_processed',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];
}
