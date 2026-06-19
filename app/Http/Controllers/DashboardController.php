<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Product;
use App\Models\Customer;
use App\Models\User;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Show dashboard berdasarkan role user
     */
    public function index()
    {
        $user = auth()->user();

        if ($user->isAdmin()) {
            return $this->adminDashboard();
        } elseif ($user->isKasir()) {
            return $this->kasirDashboard();
        } elseif ($user->isKepala()) {
            return $this->kepalaaDashboard();
        }

        return abort(403, 'Unauthorized');
    }

    /**
     * Admin Dashboard - Overview semua data
     */
    private function adminDashboard()
    {
        // Today's summary
        $todayTransactions = Transaction::completed()
            ->whereDate('created_at', Carbon::today())
            ->get();

        $totalSalesToday = $todayTransactions->sum('total');
        $totalTransactionToday = $todayTransactions->count();
        $totalItemsToday = $todayTransactions->sum(function ($t) {
            return $t->details->sum('quantity');
        });

        // Monthly data
        $monthTransactions = Transaction::completed()
            ->whereMonth('created_at', Carbon::now()->month)
            ->get();

        $totalSalesMonth = $monthTransactions->sum('total');

        // Products analysis
        $lowStockProducts = Product::lowStock()->count();
        $outOfStockProducts = Product::outOfStock()->count();
        $totalProducts = Product::active()->count();

        // Users analysis
        $totalUsers = User::where('is_active', true)->count();
        $totalKasir = User::where('role', 'kasir')->where('is_active', true)->count();
        $totalKepala = User::where('role', 'kepala')->where('is_active', true)->count();

        // Customer analysis
        $totalCustomers = Customer::where('is_active', true)->count();
        $totalDebt = Customer::sum('current_debt');

        // Stock movements (last 10)
        $recentMovements = StockMovement::with(['product', 'creator'])
            ->latest()
            ->limit(10)
            ->get();

        // Transaction summary (last 5 days)
        $last5Days = [];
        for ($i = 4; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayTransactions = Transaction::completed()
                ->whereDate('created_at', $date)
                ->get();

            $last5Days[] = [
                'date' => $date->format('d M'),
                'sales' => $dayTransactions->sum('total'),
                'count' => $dayTransactions->count(),
            ];
        }

        return view('dashboard.admin', compact(
            'totalSalesToday',
            'totalTransactionToday',
            'totalItemsToday',
            'totalSalesMonth',
            'lowStockProducts',
            'outOfStockProducts',
            'totalProducts',
            'totalUsers',
            'totalKasir',
            'totalKepala',
            'totalCustomers',
            'totalDebt',
            'recentMovements',
            'last5Days'
        ));
    }

    /**
     * Kasir Dashboard - Personal sales data
     */
    private function kasirDashboard()
    {
        // Today's sales (kasir ini saja)
        $todayTransactions = Transaction::completed()
            ->where('user_id', auth()->id())
            ->whereDate('created_at', Carbon::today())
            ->get();

        $totalSalesToday = $todayTransactions->sum('total');
        $totalTransactionToday = $todayTransactions->count();
        $totalItemsToday = $todayTransactions->sum(function ($t) {
            return $t->details->sum('quantity');
        });
        $totalDiscountToday = $todayTransactions->sum('discount');
        $totalTaxToday = $todayTransactions->sum('tax');

        // Weekly summary
        $weekTransactions = Transaction::completed()
            ->where('user_id', auth()->id())
            ->whereBetween('created_at', [
                Carbon::now()->startOfWeek(),
                Carbon::now()->endOfWeek()
            ])
            ->get();

        $totalSalesWeek = $weekTransactions->sum('total');
        $totalTransactionWeek = $weekTransactions->count();

        // Monthly summary
        $monthTransactions = Transaction::completed()
            ->where('user_id', auth()->id())
            ->whereMonth('created_at', Carbon::now()->month)
            ->get();

        $totalSalesMonth = $monthTransactions->sum('total');
        $totalTransactionMonth = $monthTransactions->count();

        // Top products sold
        $topProducts = $this->getTopProductsSoldByKasir(auth()->id());

        // Quick stats for today
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayTransactions = Transaction::completed()
                ->where('user_id', auth()->id())
                ->whereDate('created_at', $date)
                ->get();

            $last7Days[] = [
                'date' => $date->format('d M'),
                'sales' => $dayTransactions->sum('total'),
                'count' => $dayTransactions->count(),
            ];
        }

        return view('dashboard.kasir', compact(
            'totalSalesToday',
            'totalTransactionToday',
            'totalItemsToday',
            'totalDiscountToday',
            'totalTaxToday',
            'totalSalesWeek',
            'totalTransactionWeek',
            'totalSalesMonth',
            'totalTransactionMonth',
            'topProducts',
            'last7Days'
        ));
    }

    /**
     * Kepala Dashboard - Reports & analytics
     */
    private function kepalaaDashboard()
    {
        // Today's summary (all kasir)
        $todayTransactions = Transaction::completed()
            ->whereDate('created_at', Carbon::today())
            ->get();

        $totalSalesToday = $todayTransactions->sum('total');
        $totalTransactionToday = $todayTransactions->count();
        $totalItemsToday = $todayTransactions->sum(function ($t) {
            return $t->details->sum('quantity');
        });

        // Calculate today's cost
        $totalCostToday = $todayTransactions->sum(function ($transaction) {
            return $transaction->details->sum(function ($detail) {
                return $detail->quantity * $detail->product->purchase_price;
            });
        });
        $profitToday = $totalSalesToday - $totalCostToday;

        // Monthly data
        $monthTransactions = Transaction::completed()
            ->whereMonth('created_at', Carbon::now()->month)
            ->get();

        $totalSalesMonth = $monthTransactions->sum('total');
        $totalCostMonth = $monthTransactions->sum(function ($transaction) {
            return $transaction->details->sum(function ($detail) {
                return $detail->quantity * $detail->product->purchase_price;
            });
        });
        $profitMonth = $totalSalesMonth - $totalCostMonth;

        // Kasir performance
        $kasirPerformance = $this->getKasirPerformance();

        // Top products
        $topProducts = $this->getTopProductsSoldAll();

        // Low stock alert
        $lowStockProducts = Product::lowStock()
            ->orderBy('stock', 'asc')
            ->limit(5)
            ->get();

        // Daily sales trend (last 30 days)
        $salesTrend = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayTransactions = Transaction::completed()
                ->whereDate('created_at', $date)
                ->get();

            $dayCost = $dayTransactions->sum(function ($transaction) {
                return $transaction->details->sum(function ($detail) {
                    return $detail->quantity * $detail->product->purchase_price;
                });
            });

            $dayProfit = $dayTransactions->sum('total') - $dayCost;

            $salesTrend[] = [
                'date' => $date->format('d M'),
                'sales' => $dayTransactions->sum('total'),
                'cost' => $dayCost,
                'profit' => $dayProfit,
                'count' => $dayTransactions->count(),
            ];
        }

        return view('dashboard.kepala', compact(
            'totalSalesToday',
            'totalTransactionToday',
            'totalItemsToday',
            'totalCostToday',
            'profitToday',
            'totalSalesMonth',
            'totalCostMonth',
            'profitMonth',
            'kasirPerformance',
            'topProducts',
            'lowStockProducts',
            'salesTrend'
        ));
    }

    /**
     * Get top products sold by specific kasir
     */
    private function getTopProductsSoldByKasir($kasirId, $limit = 5)
    {
        $transactions = Transaction::completed()
            ->where('user_id', $kasirId)
            ->with('details.product')
            ->get();

        $products = [];
        foreach ($transactions as $transaction) {
            foreach ($transaction->details as $detail) {
                $productId = $detail->product_id;
                
                if (!isset($products[$productId])) {
                    $products[$productId] = [
                        'id' => $detail->product_id,
                        'name' => $detail->product_name,
                        'code' => $detail->product_code,
                        'quantity' => 0,
                        'sales' => 0,
                    ];
                }

                $products[$productId]['quantity'] += $detail->quantity;
                $products[$productId]['sales'] += $detail->total;
            }
        }

        // Sort by quantity sold
        usort($products, function ($a, $b) {
            return $b['quantity'] <=> $a['quantity'];
        });

        return array_slice($products, 0, $limit);
    }

    /**
     * Get top products sold all kasir
     */
    private function getTopProductsSoldAll($limit = 5)
    {
        $transactions = Transaction::completed()
            ->with('details.product')
            ->get();

        $products = [];
        foreach ($transactions as $transaction) {
            foreach ($transaction->details as $detail) {
                $productId = $detail->product_id;
                
                if (!isset($products[$productId])) {
                    $products[$productId] = [
                        'id' => $detail->product_id,
                        'name' => $detail->product_name,
                        'code' => $detail->product_code,
                        'quantity' => 0,
                        'sales' => 0,
                    ];
                }

                $products[$productId]['quantity'] += $detail->quantity;
                $products[$productId]['sales'] += $detail->total;
            }
        }

        // Sort by sales
        usort($products, function ($a, $b) {
            return $b['sales'] <=> $a['sales'];
        });

        return array_slice($products, 0, $limit);
    }

    /**
     * Get kasir performance metrics
     */
    private function getKasirPerformance()
    {
        $kasirs = User::where('role', 'kasir')
            ->where('is_active', true)
            ->get();

        $performance = [];
        foreach ($kasirs as $kasir) {
            $transactions = Transaction::completed()
                ->where('user_id', $kasir->id)
                ->whereMonth('created_at', Carbon::now()->month)
                ->get();

            $cost = $transactions->sum(function ($transaction) {
                return $transaction->details->sum(function ($detail) {
                    return $detail->quantity * $detail->product->purchase_price;
                });
            });

            $sales = $transactions->sum('total');
            $profit = $sales - $cost;

            $performance[] = [
                'kasir_id' => $kasir->id,
                'kasir_name' => $kasir->name,
                'transactions' => $transactions->count(),
                'sales' => $sales,
                'cost' => $cost,
                'profit' => $profit,
            ];
        }

        // Sort by profit descending
        usort($performance, function ($a, $b) {
            return $b['profit'] <=> $a['profit'];
        });

        return $performance;
    }
}
