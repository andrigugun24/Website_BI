<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DataManagementController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StockRequestController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ActivityLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Tataruma BI
|--------------------------------------------------------------------------
|
| Semua route di-prefix dengan /api secara otomatis.
| Auth menggunakan Laravel Sanctum (Bearer token).
|
*/

// ── Public ──────────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:3,1');

// ── Authenticated ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me/profile', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);

    // General Settings & Logs
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'update'])->middleware('role:admin');
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);

    // Dashboard — accessible by all roles
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Analytics — Admin & Manager (full), Owner (summary)
    Route::prefix('analytics')->group(function () {
        Route::get('/trend', [AnalyticsController::class, 'trend'])
            ->middleware('role:admin,manager');

        Route::get('/underperforming', [AnalyticsController::class, 'underperforming']);

        Route::post('/calculate', [AnalyticsController::class, 'calculate'])
            ->middleware('role:admin');

        Route::get('/heatmap', [AnalyticsController::class, 'heatmap'])
            ->middleware('role:admin,manager');

        Route::get('/period-comparison', [AnalyticsController::class, 'periodComparison'])
            ->middleware('role:admin,manager');
    });

    // Products — Admin full CRUD, Manager read-only
    Route::get('/products', [ProductController::class, 'index'])
        ->middleware('role:admin,manager');

    Route::get('/products/categories', [ProductController::class, 'categories'])
        ->middleware('role:admin,manager');

    Route::get('/products/template/download', [ProductController::class, 'downloadTemplate'])
        ->middleware('role:admin,manager');
        
    Route::post('/products/import', [ProductController::class, 'import'])
        ->middleware('role:admin');

    Route::get('/products/{product}', [ProductController::class, 'show'])
        ->middleware('role:admin,manager');

    Route::post('/products', [ProductController::class, 'store'])
        ->middleware('role:admin');

    Route::put('/products/{product}', [ProductController::class, 'update'])
        ->middleware('role:admin');

    Route::delete('/products/{product}', [ProductController::class, 'destroy'])
        ->middleware('role:admin');

    // Stock Requests — Multi-stage workflow
    Route::get('/stock-requests', [StockRequestController::class, 'index']);
    Route::post('/stock-requests', [StockRequestController::class, 'store'])
        ->middleware('role:admin,manager,owner');
    Route::patch('/stock-requests/{stockRequest}/status', [StockRequestController::class, 'updateStatus'])
        ->middleware('role:owner');
    Route::patch('/stock-requests/{stockRequest}/execute', [StockRequestController::class, 'execute'])
        ->middleware('role:admin');

    // Transactions — Admin full, Manager read-only
    Route::get('/transactions', [TransactionController::class, 'index'])
        ->middleware('role:admin,manager');

    Route::get('/transactions/summary', [TransactionController::class, 'summary'])
        ->middleware('role:admin,manager');

    Route::get('/transactions/template/download', [TransactionController::class, 'downloadTemplate'])
        ->middleware('role:admin,manager');

    Route::post('/transactions/import', [TransactionController::class, 'import'])
        ->middleware('role:admin');

    Route::post('/transactions', [TransactionController::class, 'store'])
        ->middleware('role:admin');

    Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])
        ->middleware('role:admin,manager');

    // Reports — all roles (Owner gets summary only via controller logic)
    Route::prefix('reports')->group(function () {
        Route::get('/preview', [ReportController::class, 'preview']);
        Route::get('/export/csv', [ReportController::class, 'exportCsv'])
            ->middleware('role:admin,manager');
        Route::get('/export/pdf', [ReportController::class, 'exportPdf']);
        Route::get('/trend', [ReportController::class, 'trendReport'])
            ->middleware('role:admin,manager');
    });

    // Data Management — Admin only
    Route::prefix('data-management')->middleware('role:admin')->group(function () {
        Route::post('/etl/run', [DataManagementController::class, 'runEtl']);
        Route::get('/etl/logs', [DataManagementController::class, 'etlLogs']);
        Route::post('/import', [DataManagementController::class, 'importData']);
    });

    // Users Management (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/roles', [UserController::class, 'roles']);
        Route::apiResource('users', UserController::class)->except(['create', 'edit']);
    });
});
