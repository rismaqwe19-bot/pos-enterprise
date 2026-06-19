<?php

namespace App\Http\Controllers;

use App\Models\SalesReport;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Display sales report
     */
    public function salesReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $userId = $request->input('user_id'); // Filter by kasir

        // Get transactions
        $query = Transaction::completed()
            ->betweenDates($startDate, $endDate);

        if ($userId) {
            $query->byUser($userId);
        }

        $transactions = $query->get();

        // Calculate summary
        $totalTransactions = $transactions->count();
        $totalItems = $transactions->sum(function ($t) {
            return $t->details->sum('quantity');
        });
        $totalSales = $transactions->sum('total');
        $totalTax = $transactions->sum('tax');
        $totalDiscount = $transactions->sum('discount');

        // Calculate cost
        $totalCost = $transactions->sum(function ($transaction) {
            return $transaction->details->sum(function ($detail) {
                return $detail->quantity * $detail->product->purchase_price;
            });
        });

        $profit = $totalSales - $totalCost;
        $profitMargin = $totalCost > 0 ? ($profit / $totalCost) * 100 : 0;

        // Get users for filter
        $users = User::where('role', 'kasir')->orderBy('name')->get();

        // Get daily breakdown
        $dailyReport = [];
        $currentDate = Carbon::parse($startDate);
        $endDateCarbon = Carbon::parse($endDate);

        while ($currentDate <= $endDateCarbon) {
            $dayQuery = Transaction::completed()
                ->byDate($currentDate->toDateString());

            if ($userId) {
                $dayQuery->byUser($userId);
            }

            $dayTransactions = $dayQuery->get();

            if ($dayTransactions->isNotEmpty()) {
                $dayCost = $dayTransactions->sum(function ($transaction) {
                    return $transaction->details->sum(function ($detail) {
                        return $detail->quantity * $detail->product->purchase_price;
                    });
                });

                $dayProfit = $dayTransactions->sum('total') - $dayCost;

                $dailyReport[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'formatted_date' => $currentDate->format('d M Y'),
                    'transactions' => $dayTransactions->count(),
                    'items' => $dayTransactions->sum(function ($t) {
                        return $t->details->sum('quantity');
                    }),
                    'sales' => $dayTransactions->sum('total'),
                    'cost' => $dayCost,
                    'profit' => $dayProfit,
                ];
            }

            $currentDate->addDay();
        }

        return view('reports.sales-report', compact(
            'startDate',
            'endDate',
            'totalTransactions',
            'totalItems',
            'totalSales',
            'totalTax',
            'totalDiscount',
            'totalCost',
            'profit',
            'profitMargin',
            'users',
            'userId',
            'dailyReport',
            'transactions'
        ));
    }

    /**
     * Display profit report
     */
    public function profitReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $userId = $request->input('user_id'); // Filter by kasir

        // Get transactions
        $query = Transaction::completed()
            ->betweenDates($startDate, $endDate);

        if ($userId) {
            $query->byUser($userId);
        }

        $transactions = $query->get();

        // Calculate by product
        $productProfit = [];
        foreach ($transactions as $transaction) {
            foreach ($transaction->details as $detail) {
                $product = $detail->product;
                $productKey = $product->id;

                if (!isset($productProfit[$productKey])) {
                    $productProfit[$productKey] = [
                        'product_id' => $product->id,
                        'code' => $product->code,
                        'name' => $product->name,
                        'category' => $product->category->name,
                        'quantity' => 0,
                        'sales' => 0,
                        'cost' => 0,
                        'profit' => 0,
                    ];
                }

                $productProfit[$productKey]['quantity'] += $detail->quantity;
                $productProfit[$productKey]['sales'] += $detail->total;
                $productProfit[$productKey]['cost'] += $detail->quantity * $product->purchase_price;
                $productProfit[$productKey]['profit'] = $productProfit[$productKey]['sales'] - $productProfit[$productKey]['cost'];
            }
        }

        // Sort by profit descending
        usort($productProfit, function ($a, $b) {
            return $b['profit'] <=> $a['profit'];
        });

        // Calculate totals
        $totalSales = array_sum(array_column($productProfit, 'sales'));
        $totalCost = array_sum(array_column($productProfit, 'cost'));
        $totalProfit = array_sum(array_column($productProfit, 'profit'));
        $profitMargin = $totalCost > 0 ? ($totalProfit / $totalCost) * 100 : 0;

        // Get users for filter
        $users = User::where('role', 'kasir')->orderBy('name')->get();

        // Calculate by user/kasir
        $userProfit = [];
        $userQuery = Transaction::completed()
            ->betweenDates($startDate, $endDate)
            ->with(['user', 'details.product'])
            ->get();

        if ($userId) {
            $userQuery = $userQuery->where('user_id', $userId);
        }

        foreach ($userQuery as $transaction) {
            $userKey = $transaction->user_id;
            if (!isset($userProfit[$userKey])) {
                $userProfit[$userKey] = [
                    'user_id' => $transaction->user_id,
                    'user_name' => $transaction->user->name,
                    'transactions' => 0,
                    'sales' => 0,
                    'cost' => 0,
                    'profit' => 0,
                ];
            }

            $userProfit[$userKey]['transactions']++;
            $userProfit[$userKey]['sales'] += $transaction->total;
            
            foreach ($transaction->details as $detail) {
                $userProfit[$userKey]['cost'] += $detail->quantity * $detail->product->purchase_price;
            }
            $userProfit[$userKey]['profit'] = $userProfit[$userKey]['sales'] - $userProfit[$userKey]['cost'];
        }

        return view('reports.profit-report', compact(
            'startDate',
            'endDate',
            'productProfit',
            'totalSales',
            'totalCost',
            'totalProfit',
            'profitMargin',
            'users',
            'userId',
            'userProfit'
        ));
    }

    /**
     * Display transaction history report
     */
    public function transactionHistory(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $userId = $request->input('user_id'); // Filter by kasir
        $status = $request->input('status'); // Filter by status

        $query = Transaction::betweenDates($startDate, $endDate)
            ->with(['user', 'customer', 'details']);

        if ($userId) {
            $query->byUser($userId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(20);

        // Get users for filter
        $users = User::where('role', 'kasir')->orderBy('name')->get();

        return view('reports.transaction-history', compact(
            'startDate',
            'endDate',
            'users',
            'userId',
            'status',
            'transactions'
        ));
    }

    /**
     * Export sales report to CSV
     */
    public function exportSalesReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $userId = $request->input('user_id');

        $query = Transaction::completed()
            ->betweenDates($startDate, $endDate)
            ->with(['user', 'customer', 'details']);

        if ($userId) {
            $query->byUser($userId);
        }

        $transactions = $query->get();

        $filename = 'sales-report-' . date('Y-m-d-H-i-s') . '.csv';
        $path = storage_path('reports/' . $filename);

        $file = fopen($path, 'w');
        fputcsv($file, ['Nomor Transaksi', 'Tanggal', 'Kasir', 'Pelanggan', 'Total Penjualan', 'Total Diskon', 'Pajak', 'Total Akhir', 'Metode Pembayaran']);

        foreach ($transactions as $transaction) {
            fputcsv($file, [
                $transaction->code,
                $transaction->created_at->format('d-m-Y H:i:s'),
                $transaction->user->name,
                $transaction->customer->name ?? 'Walk-in Customer',
                $transaction->subtotal,
                $transaction->discount,
                $transaction->tax,
                $transaction->total,
                $transaction->payment_method,
            ]);
        }

        fclose($file);

        return response()->download($path)->deleteFileAfterSend(true);
    }

    /**
     * Export profit report to CSV
     */
    public function exportProfitReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        $filename = 'profit-report-' . date('Y-m-d-H-i-s') . '.csv';
        $path = storage_path('reports/' . $filename);

        $file = fopen($path, 'w');
        fputcsv($file, ['Produk', 'Kategori', 'Qty Terjual', 'Total Penjualan', 'Total Harga Beli', 'Keuntungan']);

        $query = Transaction::completed()
            ->betweenDates($startDate, $endDate)
            ->with('details.product')
            ->get();

        $productProfit = [];
        foreach ($query as $transaction) {
            foreach ($transaction->details as $detail) {
                $product = $detail->product;
                $productKey = $product->id;

                if (!isset($productProfit[$productKey])) {
                    $productProfit[$productKey] = [
                        'name' => $product->name,
                        'category' => $product->category->name,
                        'quantity' => 0,
                        'sales' => 0,
                        'cost' => 0,
                    ];
                }

                $productProfit[$productKey]['quantity'] += $detail->quantity;
                $productProfit[$productKey]['sales'] += $detail->total;
                $productProfit[$productKey]['cost'] += $detail->quantity * $product->purchase_price;
            }
        }

        foreach ($productProfit as $data) {
            fputcsv($file, [
                $data['name'],
                $data['category'],
                $data['quantity'],
                $data['sales'],
                $data['cost'],
                $data['sales'] - $data['cost'],
            ]);
        }

        fclose($file);

        return response()->download($path)->deleteFileAfterSend(true);
    }
}
