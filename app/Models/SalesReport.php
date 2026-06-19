<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_date',
        'user_id',
        'total_transactions',
        'total_items',
        'subtotal',
        'tax',
        'discount',
        'total_sales',
        'total_cost',
        'profit',
        'profit_margin',
    ];

    protected $casts = [
        'report_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_sales' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'profit' => 'decimal:2',
        'profit_margin' => 'decimal:2',
    ];

    public $timestamps = true;

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('report_date', $date);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('report_date', [$startDate, $endDate]);
    }

    /**
     * Generate report for specific date and optional user
     */
    public static function generateDaily($date, $userId = null)
    {
        $query = Transaction::completed()
            ->byDate($date);

        if ($userId) {
            $query->byUser($userId);
        }

        $transactions = $query->get();

        if ($transactions->isEmpty()) {
            return null;
        }

        $totalTransactions = $transactions->count();
        $totalItems = $transactions->sum(function ($t) {
            return $t->details->sum('quantity');
        });

        $subtotal = $transactions->sum('subtotal');
        $tax = $transactions->sum('tax');
        $discount = $transactions->sum('discount');
        $totalSales = $transactions->sum('total');

        // Calculate total cost from transaction details
        $totalCost = $transactions->sum(function ($transaction) {
            return $transaction->details->sum(function ($detail) {
                return $detail->quantity * $detail->product->purchase_price;
            });
        });

        $profit = $totalSales - $totalCost;
        $profitMargin = $totalCost > 0 ? ($profit / $totalCost) * 100 : 0;

        $data = [
            'report_date' => $date,
            'user_id' => $userId,
            'total_transactions' => $totalTransactions,
            'total_items' => $totalItems,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'discount' => $discount,
            'total_sales' => $totalSales,
            'total_cost' => $totalCost,
            'profit' => $profit,
            'profit_margin' => $profitMargin,
        ];

        // Update or create the report
        return self::updateOrCreate(
            ['report_date' => $date, 'user_id' => $userId],
            $data
        );
    }
}
