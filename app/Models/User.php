<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // ----- Relationships -----

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // ----- Helpers -----

    public function isAdmin(): bool
    {
        return $this->role?->slug === Role::ADMIN;
    }

    public function isManager(): bool
    {
        return $this->role?->slug === Role::MANAGER;
    }

    public function isOwner(): bool
    {
        return $this->role?->slug === Role::OWNER;
    }

    public function hasPermission(string $permission): bool
    {
        return $this->role?->hasPermission($permission) ?? false;
    }
}
