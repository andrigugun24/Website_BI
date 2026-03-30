<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('transaction_date');
            $table->integer('quantity_sold')->default(0);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('source', ['manual', 'shopee', 'import'])->default('manual');
            $table->string('order_ref', 100)->nullable();
            $table->timestamps();

            $table->index('transaction_date');
            $table->index('source');
            $table->index(['product_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
