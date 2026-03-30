<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks — Tataruma BI
|--------------------------------------------------------------------------
|
| ETL process runs daily at 02:00 AM to:
| 1. Recalculate trend ratios (monthly comparison)
| 2. Update underperforming flags
| 3. Log ETL results
|
*/
Schedule::command('etl:run manual')
    ->dailyAt('02:00')
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/etl.log'));
