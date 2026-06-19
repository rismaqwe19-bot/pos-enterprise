<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales_reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date');
            $table->unsignedBigInteger('user_id')->nullable(); // Kasir (jika spesifik)
            $table->unsignedInteger('total_transactions'); // Jumlah transaksi
            $table->unsignedBigInteger('total_items'); // Total item terjual
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax', 15, 2);
            $table->decimal('discount', 15, 2);
            $table->decimal('total_sales', 15, 2); // Total penjualan
            $table->decimal('total_cost', 15, 2); // Total harga beli
            $table->decimal('profit', 15, 2); // Keuntungan (total_sales - total_cost)
            $table->decimal('profit_margin', 8, 2)->nullable(); // Margin keuntungan %
            $table->timestamps();
            
            // Foreign key
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            
            // Index
            $table->index('report_date');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_reports');
    }
};
