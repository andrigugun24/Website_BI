<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'permissions'];

    protected $casts = [
        'permissions' => 'array',
    ];

    // ----- Predefined role slugs -----
    const ADMIN   = 'admin';
    const MANAGER = 'manager';
    const OWNER   = 'owner';

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Check if this role has a given permission.
     */
    public function hasPermission(string $permission): bool
    {
        $permissions = $this->permissions ?? [];
        return in_array($permission, $permissions) || in_array('*', $permissions);
    }
}
