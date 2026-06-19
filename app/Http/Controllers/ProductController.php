<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of products
     */
    public function index()
    {
        $products = Product::with(['category', 'creator'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return view('admin.products.index', compact('products'));
    }

    /**
     * Show the form for creating a new product
     */
    public function create()
    {
        $categories = Category::active()->orderBy('name')->get();
        return view('admin.products.create', compact('categories'));
    }

    /**
     * Store a newly created product in database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            $validated['created_by'] = auth()->id();

            // Handle image upload otomatis
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->storeAs('public/products', $filename);
                $validated['image'] = $filename;
            }

            $product = Product::create($validated);

            // Record initial stock movement
            StockMovement::create([
                'product_id' => $product->id,
                'type' => 'in',
                'reason' => 'purchase',
                'quantity' => $product->stock,
                'stock_before' => 0,
                'stock_after' => $product->stock,
                'reference_id' => 'INIT-' . $product->code,
                'notes' => 'Initial stock entry',
                'created_by' => auth()->id(),
            ]);

            return redirect()->route('products.index')
                ->with('success', 'Produk berhasil ditambahkan');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menambahkan produk: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified product
     */
    public function show(Product $product)
    {
        $product->load(['category', 'creator', 'stockMovements' => function ($query) {
            $query->latest()->limit(10);
        }]);

        return view('admin.products.show', compact('product'));
    }

    /**
     * Show the form for editing the specified product
     */
    public function edit(Product $product)
    {
        $categories = Category::active()->orderBy('name')->get();
        return view('admin.products.edit', compact('product', 'categories'));
    }

    /**
     * Update the specified product in database
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products,code,' . $product->id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
        ]);

        try {
            $validated['updated_by'] = auth()->id();

            // Handle image upload otomatis
            if ($request->hasFile('image')) {
                // Delete old image
                if ($product->image) {
                    \Storage::disk('public')->delete('products/' . $product->image);
                }

                $image = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->storeAs('public/products', $filename);
                $validated['image'] = $filename;
            }

            $product->update($validated);

            return redirect()->route('products.show', $product)
                ->with('success', 'Produk berhasil diperbarui');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memperbarui produk: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Delete the specified product
     */
    public function destroy(Product $product)
    {
        try {
            // Delete image
            if ($product->image) {
                \Storage::disk('public')->delete('products/' . $product->image);
            }

            // Check if product has transaction history
            if ($product->transactionDetails()->count() > 0) {
                // Soft delete instead
                $product->delete();
                return redirect()->route('products.index')
                    ->with('success', 'Produk berhasil dihapus (soft delete)');
            }

            // Hard delete if no transaction history
            $product->forceDelete();

            return redirect()->route('products.index')
                ->with('success', 'Produk berhasil dihapus');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus produk: ' . $e->getMessage());
        }
    }

    /**
     * Adjust stock manually
     */
    public function adjustStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer',
            'reason' => 'required|in:adjustment,damage,return',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $oldStock = $product->stock;
            
            if ($validated['quantity'] > 0) {
                $product->stock += $validated['quantity'];
                $type = 'in';
            } else {
                $product->stock -= abs($validated['quantity']);
                $type = 'out';
            }

            $product->save();

            // Record stock movement otomatis
            StockMovement::create([
                'product_id' => $product->id,
                'type' => $type,
                'reason' => $validated['reason'],
                'quantity' => abs($validated['quantity']),
                'stock_before' => $oldStock,
                'stock_after' => $product->stock,
                'notes' => $validated['notes'] ?? '',
                'created_by' => auth()->id(),
            ]);

            return back()->with('success', 'Stok produk berhasil diatur');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengatur stok: ' . $e->getMessage());
        }
    }

    /**
     * Get low stock products
     */
    public function lowStock()
    {
        $products = Product::lowStock()
            ->with(['category', 'creator'])
            ->orderBy('stock', 'asc')
            ->paginate(15);

        return view('admin.products.low-stock', compact('products'));
    }

    /**
     * Show product stock movements history
     */
    public function stockHistory(Product $product)
    {
        $movements = $product->stockMovements()
            ->with('creator')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return view('admin.products.stock-history', compact('product', 'movements'));
    }
}
