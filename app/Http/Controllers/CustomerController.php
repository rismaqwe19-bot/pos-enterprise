<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers
     */
    public function index()
    {
        $customers = Customer::with('creator')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return view('admin.customers.index', compact('customers'));
    }

    /**
     * Show the form for creating a new customer
     */
    public function create()
    {
        return view('admin.customers.create');
    }

    /**
     * Store a newly created customer in database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:customers,code',
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100|unique:customers,email',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'type' => 'required|in:retail,wholesale',
            'credit_limit' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $validated['created_by'] = auth()->id();
            $validated['current_debt'] = 0;

            Customer::create($validated);

            return redirect()->route('customers.index')
                ->with('success', 'Pelanggan berhasil ditambahkan');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menambahkan pelanggan: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified customer
     */
    public function show(Customer $customer)
    {
        $customer->load(['creator', 'transactions' => function ($query) {
            $query->latest()->limit(10);
        }]);

        return view('admin.customers.show', compact('customer'));
    }

    /**
     * Show the form for editing the specified customer
     */
    public function edit(Customer $customer)
    {
        return view('admin.customers.edit', compact('customer'));
    }

    /**
     * Update the specified customer in database
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:customers,code,' . $customer->id,
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100|unique:customers,email,' . $customer->id,
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'type' => 'required|in:retail,wholesale',
            'credit_limit' => 'required|numeric|min:0',
            'current_debt' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        try {
            $validated['updated_by'] = auth()->id();

            $customer->update($validated);

            return redirect()->route('customers.show', $customer)
                ->with('success', 'Pelanggan berhasil diperbarui');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memperbarui pelanggan: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Delete the specified customer
     */
    public function destroy(Customer $customer)
    {
        try {
            // Check if customer has transactions
            if ($customer->transactions()->count() > 0) {
                return back()->with('error', 'Tidak dapat menghapus pelanggan yang memiliki riwayat transaksi');
            }

            $customer->delete();

            return redirect()->route('customers.index')
                ->with('success', 'Pelanggan berhasil dihapus');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus pelanggan: ' . $e->getMessage());
        }
    }

    /**
     * Toggle customer status (active/inactive)
     */
    public function toggleStatus(Customer $customer)
    {
        try {
            $customer->update([
                'is_active' => !$customer->is_active,
                'updated_by' => auth()->id(),
            ]);

            $status = $customer->is_active ? 'diaktifkan' : 'dinonaktifkan';
            return back()->with('success', 'Pelanggan berhasil ' . $status);
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengubah status: ' . $e->getMessage());
        }
    }

    /**
     * Adjust customer debt
     */
    public function adjustDebt(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'action' => 'required|in:add,reduce',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            if ($validated['action'] === 'add') {
                $customer->current_debt += $validated['amount'];
            } else {
                $customer->current_debt = max(0, $customer->current_debt - $validated['amount']);
            }

            $customer->save();

            return back()->with('success', 'Utang pelanggan berhasil diatur');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengatur utang: ' . $e->getMessage());
        }
    }
}
