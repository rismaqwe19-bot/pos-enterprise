<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\AccessControl;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Users dengan 3 role
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '081234567890',
            'is_active' => true,
        ]);

        $kasir1 = User::create([
            'name' => 'Kasir Satu',
            'email' => 'kasir1@example.com',
            'password' => Hash::make('password'),
            'role' => 'kasir',
            'phone' => '081234567891',
            'is_active' => true,
        ]);

        $kasir2 = User::create([
            'name' => 'Kasir Dua',
            'email' => 'kasir2@example.com',
            'password' => Hash::make('password'),
            'role' => 'kasir',
            'phone' => '081234567892',
            'is_active' => true,
        ]);

        $kepala = User::create([
            'name' => 'Kepala Toko',
            'email' => 'kepala@example.com',
            'password' => Hash::make('password'),
            'role' => 'kepala',
            'phone' => '081234567893',
            'is_active' => true,
        ]);

        // Create Access Controls
        $permissions = [
            'admin' => [
                'view_dashboard',
                'manage_users',
                'manage_categories',
                'manage_products',
                'manage_customers',
                'view_transactions',
                'create_transaction',
                'view_reports',
                'manage_access_control',
                'view_stock_movements',
            ],
            'kasir' => [
                'view_dashboard',
                'view_transactions',
                'create_transaction',
                'view_own_transactions',
                'print_invoice',
            ],
            'kepala' => [
                'view_dashboard',
                'view_transactions',
                'view_reports',
                'view_sales_reports',
                'view_profit_reports',
                'view_stock_movements',
            ],
        ];

        foreach ($permissions as $role => $perms) {
            foreach ($perms as $perm) {
                AccessControl::create([
                    'role' => $role,
                    'permission' => $perm,
                    'description' => ucfirst(str_replace('_', ' ', $perm)),
                    'is_active' => true,
                ]);
            }
        }

        // Create Categories
        $categories = [
            [
                'name' => 'Elektronik',
                'description' => 'Produk elektronik dan gadget',
            ],
            [
                'name' => 'Makanan & Minuman',
                'description' => 'Produk makanan dan minuman',
            ],
            [
                'name' => 'Fashion',
                'description' => 'Produk fashion dan pakaian',
            ],
            [
                'name' => 'Perawatan',
                'description' => 'Produk perawatan dan kecantikan',
            ],
            [
                'name' => 'Kebutuhan Rumah',
                'description' => 'Kebutuhan rumah tangga',
            ],
        ];

        foreach ($categories as $cat) {
            Category::create([
                'name' => $cat['name'],
                'slug' => str_replace(' ', '-', strtolower($cat['name'])),
                'description' => $cat['description'],
                'is_active' => true,
                'created_by' => $admin->id,
            ]);
        }

        // Get categories
        $elektronik = Category::where('name', 'Elektronik')->first();
        $makanan = Category::where('name', 'Makanan & Minuman')->first();
        $fashion = Category::where('name', 'Fashion')->first();

        // Create Products
        $products = [
            // Elektronik
            [
                'code' => 'ELEC001',
                'name' => 'Mouse Wireless',
                'description' => 'Mouse nirkabel dengan USB receiver',
                'category_id' => $elektronik->id,
                'purchase_price' => 50000,
                'selling_price' => 75000,
                'stock' => 50,
                'min_stock' => 10,
            ],
            [
                'code' => 'ELEC002',
                'name' => 'Keyboard Mekanik',
                'description' => 'Keyboard mekanik dengan lampu RGB',
                'category_id' => $elektronik->id,
                'purchase_price' => 300000,
                'selling_price' => 450000,
                'stock' => 20,
                'min_stock' => 5,
            ],
            [
                'code' => 'ELEC003',
                'name' => 'USB Hub 4 Port',
                'description' => 'Hub USB dengan 4 port',
                'category_id' => $elektronik->id,
                'purchase_price' => 75000,
                'selling_price' => 120000,
                'stock' => 30,
                'min_stock' => 8,
            ],
            // Makanan & Minuman
            [
                'code' => 'FOOD001',
                'name' => 'Air Mineral 1.5L',
                'description' => 'Air minum kemasan 1.5 liter',
                'category_id' => $makanan->id,
                'purchase_price' => 3000,
                'selling_price' => 5000,
                'stock' => 200,
                'min_stock' => 50,
            ],
            [
                'code' => 'FOOD002',
                'name' => 'Kopi Instan Pack',
                'description' => 'Kopi instan dalam kemasan box',
                'category_id' => $makanan->id,
                'purchase_price' => 25000,
                'selling_price' => 35000,
                'stock' => 100,
                'min_stock' => 30,
            ],
            [
                'code' => 'FOOD003',
                'name' => 'Snack Keripik Kentang',
                'description' => 'Snack keripik kentang rasa original',
                'category_id' => $makanan->id,
                'purchase_price' => 8000,
                'selling_price' => 12000,
                'stock' => 150,
                'min_stock' => 40,
            ],
            // Fashion
            [
                'code' => 'FASH001',
                'name' => 'T-Shirt Pria',
                'description' => 'T-Shirt pria dari bahan katun 100%',
                'category_id' => $fashion->id,
                'purchase_price' => 30000,
                'selling_price' => 60000,
                'stock' => 80,
                'min_stock' => 20,
            ],
            [
                'code' => 'FASH002',
                'name' => 'Jeans Pria',
                'description' => 'Jeans pria dengan design terkini',
                'category_id' => $fashion->id,
                'purchase_price' => 100000,
                'selling_price' => 180000,
                'stock' => 40,
                'min_stock' => 10,
            ],
        ];

        foreach ($products as $prod) {
            Product::create([
                'code' => $prod['code'],
                'name' => $prod['name'],
                'description' => $prod['description'],
                'category_id' => $prod['category_id'],
                'purchase_price' => $prod['purchase_price'],
                'selling_price' => $prod['selling_price'],
                'stock' => $prod['stock'],
                'min_stock' => $prod['min_stock'],
                'is_active' => true,
                'created_by' => $admin->id,
            ]);
        }

        echo "Database seeding completed successfully!\n";
        echo "Admin: admin@example.com / password\n";
        echo "Kasir 1: kasir1@example.com / password\n";
        echo "Kasir 2: kasir2@example.com / password\n";
        echo "Kepala: kepala@example.com / password\n";
    }
}
