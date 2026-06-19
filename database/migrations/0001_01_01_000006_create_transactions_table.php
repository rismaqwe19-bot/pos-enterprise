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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Nomor transaksi
            $table->unsignedBigInteger('user_id'); // Kasir yang melakukan transaksi
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->decimal('subtotal', 15, 2); // Subtotal sebelum pajak
            $table->decimal('tax', 15, 2)->default(0); // Pajak
            $table->decimal('discount', 15, 2)->default(0); // Diskon
            $table->decimal('total', 15, 2); // Total akhir
            $table->enum('payment_method', ['cash', 'card', 'transfer'])->default('cash');
            $table->decimal('amount_paid', 15, 2); // Jumlah pembayaran
            $table->decimal('change', 15, 2)->default(0); // Kembalian
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            
            // Index
            $table->index('code');
            $table->index('user_id'); // Untuk transaksi per kasir
            $table->index('status');
            $table->index('created_at'); // Untuk laporan by date
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
