<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccessControl extends Model
{
    use HasFactory;

    protected $fillable = [
        'role',
        'permission',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public $timestamps = true;

    // Scopes
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if a specific role has a permission
     */
    public static function hasPermission($role, $permission)
    {
        return self::where('role', $role)
            ->where('permission', $permission)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get all permissions for a role
     */
    public static function getPermissionsByRole($role)
    {
        return self::where('role', $role)
            ->where('is_active', true)
            ->pluck('permission')
            ->toArray();
    }
}
