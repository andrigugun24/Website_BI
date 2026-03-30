<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 50)->unique();
            $table->string('name');
            $table->string('category', 100)->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->integer('current_stock')->default(0);
            $table->integer('min_stock_threshold')->default(10);
            $table->string('shopee_item_id', 100)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('category');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
