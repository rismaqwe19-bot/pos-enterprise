<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories
     */
    public function index()
    {
        $categories = Category::with('creator')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return view('admin.categories.index', compact('categories'));
    }

    /**
     * Show the form for creating a new category
     */
    public function create()
    {
        return view('admin.categories.create');
    }

    /**
     * Store a newly created category in database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name',
            'description' => 'nullable|string|max:500',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            $validated['slug'] = Str::slug($validated['name']);
            $validated['created_by'] = auth()->id();

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->storeAs('public/categories', $filename);
                $validated['image'] = $filename;
            }

            Category::create($validated);

            return redirect()->route('categories.index')
                ->with('success', 'Kategori berhasil ditambahkan');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menambahkan kategori: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Show the form for editing the specified category
     */
    public function edit(Category $category)
    {
        return view('admin.categories.edit', compact('category'));
    }

    /**
     * Update the specified category in database
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:500',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
        ]);

        try {
            $validated['slug'] = Str::slug($validated['name']);
            $validated['updated_by'] = auth()->id();

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image
                if ($category->image) {
                    \Storage::disk('public')->delete('categories/' . $category->image);
                }

                $image = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->storeAs('public/categories', $filename);
                $validated['image'] = $filename;
            }

            $category->update($validated);

            return redirect()->route('categories.index')
                ->with('success', 'Kategori berhasil diperbarui');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memperbarui kategori: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Delete the specified category
     */
    public function destroy(Category $category)
    {
        try {
            // Check if category has products
            if ($category->products()->count() > 0) {
                return back()->with('error', 'Tidak dapat menghapus kategori yang memiliki produk');
            }

            // Delete image
            if ($category->image) {
                \Storage::disk('public')->delete('categories/' . $category->image);
            }

            $category->delete();

            return redirect()->route('categories.index')
                ->with('success', 'Kategori berhasil dihapus');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus kategori: ' . $e->getMessage());
        }
    }

    /**
     * Toggle category status (active/inactive)
     */
    public function toggleStatus(Category $category)
    {
        try {
            $category->update([
                'is_active' => !$category->is_active,
                'updated_by' => auth()->id(),
            ]);

            $status = $category->is_active ? 'diaktifkan' : 'dinonaktifkan';
            return back()->with('success', 'Kategori berhasil ' . $status);
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengubah status: ' . $e->getMessage());
        }
    }
}
