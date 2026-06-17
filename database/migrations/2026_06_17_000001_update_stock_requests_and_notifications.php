<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // --- stock_requests: tambah kolom tracking approval & eksekusi ---
        Schema::table('stock_requests', function (Blueprint $table) {
            $table->foreignId('approved_by')->nullable()->after('status')
                  ->constrained('users')->nullOnDelete();
            $table->foreignId('executed_by')->nullable()->after('approved_by')
                  ->constrained('users')->nullOnDelete();
        });

        // Untuk SQLite: recreate kolom status dengan enum baru termasuk 'completed'
        // SQLite tidak mendukung ALTER COLUMN, jadi kita tambah kolom baru lalu pindah data
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('stock_requests', function (Blueprint $table) {
                $table->string('status_new')->default('pending')->after('status');
            });
            DB::table('stock_requests')->update(['status_new' => DB::raw('status')]);
            Schema::table('stock_requests', function (Blueprint $table) {
                $table->dropColumn('status');
            });
            Schema::table('stock_requests', function (Blueprint $table) {
                $table->renameColumn('status_new', 'status');
            });
        }

        // --- notifications: tambah kolom user_id untuk targeted notifications ---
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')
                  ->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_requests', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['executed_by']);
            $table->dropColumn(['approved_by', 'executed_by']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
