<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = Role::where('slug', 'admin')->first();
        $manager = Role::where('slug', 'manager')->first();
        $owner   = Role::where('slug', 'owner')->first();

        User::create([
            'name'     => 'Administrator',
            'email'    => 'admin@tataruma.com',
            'password' => 'password123',
            'role_id'  => $admin->id,
            'is_active'=> true,
        ]);

        User::create([
            'name'     => 'Marketing Manager',
            'email'    => 'manager@tataruma.com',
            'password' => 'password123',
            'role_id'  => $manager->id,
            'is_active'=> true,
        ]);

        User::create([
            'name'     => 'Owner PT Tataruma',
            'email'    => 'owner@tataruma.com',
            'password' => 'password123',
            'role_id'  => $owner->id,
            'is_active'=> true,
        ]);
    }
}
