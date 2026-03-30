<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trend_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->date('period_start');
            $table->date('period_end');
            $table->date('base_period_start');
            $table->date('base_period_end');
            $table->decimal('current_value', 15, 2)->default(0);
            $table->decimal('base_value', 15, 2)->default(0);
            $table->decimal('trend_ratio', 8, 2)->default(0);
            $table->boolean('is_underperforming')->default(false);
            $table->integer('consecutive_decline')->default(0);
            $table->timestamps();

            $table->index(['product_id', 'period_start']);
            $table->index('is_underperforming');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trend_analyses');
    }
};
