<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etl_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 50);
            $table->enum('status', ['running', 'success', 'failed'])->default('running');
            $table->integer('records_processed')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('started_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etl_logs');
    }
};
