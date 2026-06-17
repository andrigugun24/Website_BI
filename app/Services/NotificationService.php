<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Product;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a notification record (global or targeted to a specific user).
     */
    public static function create(string $title, string $message, string $type = 'info', ?int $userId = null): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'title'   => $title,
            'message' => $message,
            'type'    => $type,
            'is_read' => false,
        ]);
    }

    /**
     * Create a notification for a specific user.
     */
    public static function createForUser(int $userId, string $title, string $message, string $type = 'info'): Notification
    {
        return self::create($title, $message, $type, $userId);
    }

    /**
     * Create notifications for ALL users with a given role slug.
     * Returns the number of notifications created.
     */
    public static function createForRole(string $roleSlug, string $title, string $message, string $type = 'info'): int
    {
        $role = Role::where('slug', $roleSlug)->first();
        if (!$role) {
            Log::warning("NotificationService::createForRole — Role '{$roleSlug}' not found.");
            return 0;
        }

        $users = User::where('role_id', $role->id)->where('is_active', true)->get();
        $count = 0;

        foreach ($users as $user) {
            self::create($title, $message, $type, $user->id);
            $count++;
        }

        return $count;
    }

    /**
     * Check all products for low stock and generate notifications.
     * Called after a transaction is created.
     */
    public static function checkLowStock(Product $product): void
    {
        if ($product->current_stock <= $product->min_stock_threshold && $product->is_active) {
            // Avoid duplicate notifications for the same product within 24 hours
            $exists = Notification::where('title', 'like', "%{$product->sku}%")
                ->where('type', 'warning')
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if (!$exists) {
                self::create(
                    "⚠️ Stok Rendah: {$product->name} ({$product->sku})",
                    "Stok produk {$product->name} tersisa {$product->current_stock} unit, di bawah batas minimum {$product->min_stock_threshold} unit. Segera lakukan restock.",
                    'warning'
                );
                Log::info("Notification: Low stock alert for {$product->sku}");
            }
        }
    }

    /**
     * Generate notifications for underperforming products.
     * Called after trend recalculation.
     */
    public static function checkUnderperforming(array $trendResults): void
    {
        $criticalProducts = [];
        $warningProducts = [];

        foreach ($trendResults as $trend) {
            $ratio = $trend->trend_ratio ?? 0;
            $productName = $trend->product->name ?? 'Unknown';

            if ($ratio < 50 || ($trend->consecutive_decline ?? 0) >= 3) {
                $criticalProducts[] = $productName;
            } elseif ($ratio < 80 || ($trend->consecutive_decline ?? 0) >= 2) {
                $warningProducts[] = $productName;
            }
        }

        if (count($criticalProducts) > 0) {
            self::create(
                "🔴 Produk Kritis Terdeteksi",
                count($criticalProducts) . " produk dalam kondisi kritis: " . implode(', ', array_slice($criticalProducts, 0, 5)) .
                    (count($criticalProducts) > 5 ? " dan " . (count($criticalProducts) - 5) . " lainnya." : ".") .
                    " Segera lakukan evaluasi strategi pemasaran.",
                'warning'
            );
        }

        if (count($warningProducts) > 0) {
            self::create(
                "🟡 Peringatan Performa Produk",
                count($warningProducts) . " produk menunjukkan tren penurunan: " . implode(', ', array_slice($warningProducts, 0, 5)) .
                    (count($warningProducts) > 5 ? " dan " . (count($warningProducts) - 5) . " lainnya." : ".") .
                    " Perlu perhatian khusus.",
                'info'
            );
        }
    }

    /**
     * Notify when ETL process completes.
     */
    public static function notifyEtlComplete(string $status, int $recordsProcessed, ?string $errorMessage = null): void
    {
        if ($status === 'success') {
            self::create(
                "✅ ETL Pipeline Berhasil",
                "Proses ETL telah selesai dengan sukses. {$recordsProcessed} record berhasil diproses dan disinkronisasi.",
                'success'
            );
        } else {
            self::create(
                "❌ ETL Pipeline Gagal",
                "Proses ETL gagal dijalankan. Error: " . ($errorMessage ?? 'Tidak diketahui') . ". Silakan periksa log sistem.",
                'warning'
            );
        }
    }

    /**
     * Notify when a new user is created.
     */
    public static function notifyNewUser(string $userName, string $roleName): void
    {
        self::create(
            "👤 Pengguna Baru Ditambahkan",
            "Pengguna baru \"{$userName}\" telah ditambahkan ke sistem dengan role {$roleName}.",
            'info'
        );
    }

    /**
     * Notify when data is imported via CSV.
     */
    public static function notifyDataImport(int $recordsProcessed): void
    {
        self::create(
            "📥 Import Data Berhasil",
            "{$recordsProcessed} record transaksi berhasil diimpor dari file CSV ke dalam sistem.",
            'success'
        );
    }
}
