<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List all users.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::with('role')->orderBy('name')->get();
        return response()->json($users);
    }

    /**
     * Store a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        if (!isset($validated['is_active'])) {
             $validated['is_active'] = true;
        }

        $user = User::create($validated);

        // Generate notification for new user
        $roleName = Role::find($validated['role_id'])->name ?? 'Unknown';
        \App\Services\NotificationService::notifyNewUser($user->name, $roleName);

        return response()->json([
            'message' => 'Pengguna berhasil ditambahkan.',
            'user' => $user->load('role'),
        ], 201);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role_id' => 'sometimes|exists:roles,id',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Pengguna berhasil diperbarui.',
            'user' => $user->load('role'),
        ]);
    }

    /**
     * Delete (soft/hard) a user.
     * We'll just delete them for simplicity or deactivate. Let's delete if no transactions, else deactivate.
     */
    public function destroy(User $user): JsonResponse
    {
        // Don't let users delete themselves
        if (request()->user()->id === $user->id) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Anda sendiri.'], 403);
        }

        if ($user->transactions()->count() > 0) {
            $user->update(['is_active' => false]);
            return response()->json(['message' => 'Pengguna dinonaktifkan karena memiliki riwayat transaksi.']);
        }

        $user->delete();
        return response()->json(['message' => 'Pengguna berhasil dihapus.']);
    }

    /**
     * Get all roles.
     */
    public function roles(): JsonResponse
    {
        $roles = Role::orderBy('name')->get();
        return response()->json($roles);
    }
}
