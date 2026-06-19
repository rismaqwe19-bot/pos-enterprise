<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Product;
use App\Models\Customer;
use App\Models\StockMovement;
use App\Models\SalesReport;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TransactionController extends Controller
{
    /**
     * Display transactions list (filtered by role)
     */
    public function index(Request $request)
    {
        $query = Transaction::with(['user', 'customer', 'details']);

        // Filter berdasarkan role
        if (auth()->user()->isKasir()) {
            // Kasir hanya bisa melihat transaksi mereka sendiri
            $query->where('user_id', auth()->id());
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by user (admin & kepala saja)
        if ($request->filled('user_id') && auth()->user()->isAdmin()) {
            $query->where('user_id', $request->user_id);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(15);

        $users = auth()->user()->isAdmin() ? 
            \App\Models\User::where('role', 'kasir')->get() : 
            collect();

        return view('pos.transactions.index', compact('transactions', 'users'));
    }

    /**
     * Show the POS interface for creating new transaction
     */
    public function create()
    {
        $products = Product::active()
            ->with('category')
            ->orderBy('name')
            ->get();

        $customers = Customer::active()
            ->orderBy('name')
            ->get();

        return view('pos.transactions.create', compact('products', 'customers'));
    }

    /**
     * Store new transaction (AJAX endpoint for real-time data)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.discount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'payment_method' => 'required|in:cash,card,transfer',
            'amount_paid' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            \DB::beginTransaction();

            // Generate transaction code
            $code = $this->generateTransactionCode();

            // Calculate totals
            $subtotal = 0;
            $totalDiscount = 0;

            // Validate stock before creating transaction
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Stok {$product->name} tidak cukup. Stok tersedia: {$product->stock}");
                }
            }

            // Create transaction
            $transaction = Transaction::create([
                'code' => $code,
                'user_id' => auth()->id(),
                'customer_id' => $validated['customer_id'] ?? null,
                'subtotal' => 0, // Akan diisi setelah menghitung items
                'tax' => 0,
                'discount' => $validated['discount'] ?? 0,
                'total' => 0,
                'payment_method' => $validated['payment_method'],
                'amount_paid' => $validated['amount_paid'],
                'change' => 0,
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create transaction details and update stock otomatis
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $quantity = $item['quantity'];
                $unitPrice = $product->selling_price;
                $itemSubtotal = $quantity * $unitPrice;
                $itemDiscount = $item['discount'] ?? 0;
                $itemTotal = $itemSubtotal - $itemDiscount;

                // Create detail
                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_code' => $product->code,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $itemSubtotal,
                    'discount' => $itemDiscount,
                    'total' => $itemTotal,
                ]);

                // Update stok otomatis
                $oldStock = $product->stock;
                $product->stock -= $quantity;
                $product->save();

                // Record stock movement otomatis
                StockMovement::create([
                    'product_id' => $product->id,
                    'type' => 'out',
                    'reason' => 'sales',
                    'quantity' => $quantity,
                    'stock_before' => $oldStock,
                    'stock_after' => $product->stock,
                    'reference_id' => $code,
                    'notes' => "Penjualan transaksi {$code}",
                    'created_by' => auth()->id(),
                ]);

                $subtotal += $itemSubtotal;
                $totalDiscount += $itemDiscount;
            }

            // Calculate tax
            $taxRate = $validated['tax_rate'] ?? 0;
            $tax = ($subtotal * $taxRate) / 100;

            // Calculate final total
            $finalTotal = ($subtotal + $tax) - ($validated['discount'] ?? 0);

            // Update transaction with final values
            $transaction->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $validated['discount'] ?? 0,
                'total' => $finalTotal,
                'change' => max(0, $validated['amount_paid'] - $finalTotal),
            ]);

            // Complete transaction
            $transaction->complete();

            // Update customer debt if exists
            if ($validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                $customer->current_debt += $finalTotal;
                $customer->save();
            }

            \DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Transaksi berhasil dibuat',
                    'data' => [
                        'id' => $transaction->id,
                        'code' => $code,
                    ],
                ]);
            }

            return redirect()->route('transactions.show', $transaction)
                ->with('success', 'Transaksi berhasil dibuat');

        } catch (\Exception $e) {
            \DB::rollBack();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 400);
            }

            return back()->with('error', 'Gagal membuat transaksi: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified transaction
     */
    public function show(Transaction $transaction)
    {
        // Check authorization
        if (auth()->user()->isKasir() && $transaction->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $transaction->load(['user', 'customer', 'details.product']);

        return view('pos.transactions.show', compact('transaction'));
    }

    /**
     * Cancel transaction (return stock)
     */
    public function cancel(Transaction $transaction)
    {
        try {
            // Check authorization
            if (auth()->user()->isKasir() && $transaction->user_id !== auth()->id()) {
                abort(403, 'Unauthorized');
            }

            \DB::beginTransaction();

            // Cancel transaction and return stock
            $transaction->cancel();

            // Reduce customer debt if exists
            if ($transaction->customer_id) {
                $customer = Customer::find($transaction->customer_id);
                $customer->current_debt -= $transaction->total;
                $customer->save();
            }

            \DB::commit();

            return back()->with('success', 'Transaksi berhasil dibatalkan dan stok dikembalikan');
        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->with('error', 'Gagal membatalkan transaksi: ' . $e->getMessage());
        }
    }

    /**
     * Print invoice for transaction
     */
    public function printInvoice(Transaction $transaction)
    {
        // Check authorization
        if (auth()->user()->isKasir() && $transaction->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $transaction->load(['user', 'customer', 'details.product']);

        return view('pos.transactions.invoice', compact('transaction'));
    }

    /**
     * Print receipt (struk)
     */
    public function printReceipt(Transaction $transaction)
    {
        // Check authorization
        if (auth()->user()->isKasir() && $transaction->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $transaction->load(['user', 'customer', 'details.product']);

        return view('pos.transactions.receipt', compact('transaction'));
    }

    /**
     * Generate unique transaction code
     */
    private function generateTransactionCode(): string
    {
        $date = Carbon::now()->format('Ymd');
        $lastTransaction = Transaction::whereDate('created_at', Carbon::today())
            ->latest('id')
            ->first();

        if ($lastTransaction) {
            $lastNumber = (int)substr($lastTransaction->code, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return 'TRX' . $date . $newNumber;
    }

    /**
     * Get transactions summary for dashboard
     */
    public function summary()
    {
        $today = Carbon::today();

        $query = Transaction::completed()
            ->whereDate('created_at', $today);

        if (auth()->user()->isKasir()) {
            $query->where('user_id', auth()->id());
        }

        $transactions = $query->get();

        $summary = [
            'total_transactions' => $transactions->count(),
            'total_sales' => $transactions->sum('total'),
            'total_items' => $transactions->sum(function ($t) {
                return $t->details->sum('quantity');
            }),
            'total_discount' => $transactions->sum('discount'),
            'total_tax' => $transactions->sum('tax'),
        ];

        return response()->json($summary);
    }
}
