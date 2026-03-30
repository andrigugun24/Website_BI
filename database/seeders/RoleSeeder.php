<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'permissions' => ['*'], // Full access
        ]);

        Role::create([
            'name' => 'Manajer Marketing',
            'slug' => 'manager',
            'permissions' => [
                'dashboard.view',
                'analytics.view',
                'products.view',
                'transactions.view',
                'reports.view',
                'reports.export',
                'shopee.read',
            ],
        ]);

        Role::create([
            'name' => 'Owner',
            'slug' => 'owner',
            'permissions' => [
                'dashboard.view',
                'analytics.summary',
                'reports.summary',
            ],
        ]);
    }
}
