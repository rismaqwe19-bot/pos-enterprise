<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'user_id',
        'customer_id',
        'subtotal',
        'tax',
        'discount',
        'total',
        'payment_method',
        'amount_paid',
        'change',
        'status',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'change' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function details()
    {
        return $this->hasMany(TransactionDetail::class);
    }

    // Helper methods
    public function complete()
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();
    }

    public function cancel()
    {
        $this->status = 'cancelled';
        // Return stok ke gudang
        foreach ($this->details as $detail) {
            $product = $detail->product;
            $product->stock += $detail->quantity;
            $product->save();

            StockMovement::create([
                'product_id' => $detail->product_id,
                'type' => 'in',
                'reason' => 'return',
                'quantity' => $detail->quantity,
                'stock_before' => $product->stock - $detail->quantity,
                'stock_after' => $product->stock,
                'reference_id' => $this->code,
                'notes' => 'Pembatalan transaksi',
                'created_by' => auth()->id(),
            ]);
        }
        $this->save();
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('created_at', $date);
    }

    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
