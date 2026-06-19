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
        Schema::create('transaction_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_id');
            $table->unsignedBigInteger('product_id');
            $table->string('product_name'); // Nama produk saat transaksi
            $table->string('product_code'); // Kode produk saat transaksi
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 12, 2); // Harga satuan saat transaksi
            $table->decimal('subtotal', 15, 2); // quantity * unit_price
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('total', 15, 2); // Harga total item
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            
            // Index
            $table->index('transaction_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_details');
    }
};
