<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AccessControlController;

Route::get('/', function () {
    return redirect()->route('login');
});

// Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.store');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Protected Routes - Semua memerlukan authentication
Route::middleware('auth')->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // POS - Transaction (Kasir & Admin)
    Route::middleware('role:kasir,admin')->group(function () {
        Route::get('/pos/transactions', [TransactionController::class, 'index'])->name('transactions.index');
        Route::get('/pos/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
        Route::post('/pos/transactions', [TransactionController::class, 'store'])->name('transactions.store');
        Route::get('/pos/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');
        Route::post('/pos/transactions/{transaction}/cancel', [TransactionController::class, 'cancel'])->name('transactions.cancel');
        Route::get('/pos/transactions/{transaction}/print-invoice', [TransactionController::class, 'printInvoice'])->name('transactions.print-invoice');
        Route::get('/pos/transactions/{transaction}/print-receipt', [TransactionController::class, 'printReceipt'])->name('transactions.print-receipt');
        Route::get('/api/transactions/summary', [TransactionController::class, 'summary'])->name('api.transactions.summary');
    });

    // Master Data - Admin Only
    Route::middleware('role:admin')->group(function () {

        // Categories
        Route::resource('categories', CategoryController::class);
        Route::post('/categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus'])->name('categories.toggle-status');

        // Products
        Route::resource('products', ProductController::class);
        Route::post('/products/{product}/toggle-status', [ProductController::class, 'toggleStatus'])->name('products.toggle-status');
        Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock'])->name('products.adjust-stock');
        Route::get('/products/low-stock', [ProductController::class, 'lowStock'])->name('products.low-stock');
        Route::get('/products/{product}/stock-history', [ProductController::class, 'stockHistory'])->name('products.stock-history');

        // Customers
        Route::resource('customers', CustomerController::class);
        Route::post('/customers/{customer}/toggle-status', [CustomerController::class, 'toggleStatus'])->name('customers.toggle-status');
        Route::post('/customers/{customer}/adjust-debt', [CustomerController::class, 'adjustDebt'])->name('customers.adjust-debt');

        // Users Management
        Route::resource('users', UserController::class);
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
        Route::post('/users/{user}/change-password', [UserController::class, 'changePassword'])->name('users.change-password');

        // Access Control Management
        Route::resource('access-controls', AccessControlController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    // Reports - Kepala & Admin
    Route::middleware('role:kepala,admin')->group(function () {
        Route::get('/reports/sales', [ReportController::class, 'salesReport'])->name('reports.sales');
        Route::get('/reports/profit', [ReportController::class, 'profitReport'])->name('reports.profit');
        Route::get('/reports/transaction-history', [ReportController::class, 'transactionHistory'])->name('reports.transaction-history');
        
        // Export Reports
        Route::get('/reports/sales/export', [ReportController::class, 'exportSalesReport'])->name('reports.sales.export');
        Route::get('/reports/profit/export', [ReportController::class, 'exportProfitReport'])->name('reports.profit.export');
    });

    // Profile
    Route::get('/profile', [AuthController::class, 'profile'])->name('profile');
    Route::post('/profile/update', [AuthController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/change-password', [AuthController::class, 'changePassword'])->name('profile.change-password');
});
