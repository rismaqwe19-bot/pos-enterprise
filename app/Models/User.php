<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'no_identitas',
        'phone',
        'address',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function categoriesCreated()
    {
        return $this->hasMany(Category::class, 'created_by');
    }

    public function productsCreated()
    {
        return $this->hasMany(Product::class, 'created_by');
    }

    public function customersCreated()
    {
        return $this->hasMany(Customer::class, 'created_by');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'created_by');
    }

    // Helper methods for role checking
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isKasir(): bool
    {
        return $this->role === 'kasir';
    }

    public function isKepala(): bool
    {
        return $this->role === 'kepala';
    }

    public function canAccess($permission): bool
    {
        $control = AccessControl::where('role', $this->role)
            ->where('permission', $permission)
            ->where('is_active', true)
            ->first();
        return $control !== null;
    }
}
