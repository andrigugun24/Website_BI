<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\ActivityLogController;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Login and issue a Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('role')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan salah.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Akun Anda tidak aktif. Hubungi administrator.',
            ], 403);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth-token', [$user->role->slug])->plainTextToken;

        \App\Models\ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'resource' => 'Auth',
            'details' => json_encode(['ip' => $request->ip()])
        ]);

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->slug,
                'role_name' => $user->role->name,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Forgot Password — send reset link via email (with log fallback).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $token = \Illuminate\Support\Str::random(60);
        
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $token, 'created_at' => now()]
        );

        $resetLink = url('/#/reset-password?token=' . $token . '&email=' . urlencode($request->email));
        
        $user = User::where('email', $request->email)->first();
        $userName = $user ? $user->name : 'Pengguna';

        // Attempt to send email, fallback to log if SMTP is not configured
        try {
            \Illuminate\Support\Facades\Mail::to($request->email)
                ->send(new \App\Mail\ResetPasswordMail($resetLink, $userName));
            Log::info("Password reset email sent to: {$request->email}");
        } catch (\Exception $e) {
            // Fallback: log the reset link if email sending fails
            Log::warning("Email sending failed, logging reset link instead: " . $e->getMessage());
            Log::info("========================================");
            Log::info("PASSWORD RESET REQUEST (FALLBACK)");
            Log::info("To: " . $request->email);
            Log::info("Link: " . $resetLink);
            Log::info("========================================");
        }

        ActivityLogController::log('forgot_password', 'Auth', ['email' => $request->email]);

        return response()->json([
            'message' => 'Tautan pemulihan berhasil dikirim ke email Anda.',
        ]);
    }

    /**
     * Complete password reset
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $reset = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$reset) {
            return response()->json(['message' => 'Token reset kata sandi tidak valid atau telah usang.'], 400);
        }

        $user = \App\Models\User::where('email', $request->email)->first();
        // Since models cast 'password' as 'hashed', simply assigning will hash it
        $user->password = $request->password;
        $user->save();

        // Clear token
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        ActivityLogController::log('reset_password', 'Auth', ['email' => $request->email]);

        return response()->json(['message' => 'Kata sandi berhasil diubah.']);
    }

    /**
     * Logout and revoke token.
     */
    public function logout(Request $request): JsonResponse
    {
        ActivityLogController::log('logout', 'Auth', ['ip' => $request->ip()]);
        
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Berhasil logout.',
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->slug,
                'role_name' => $user->role->name,
                'is_active' => $user->is_active,
            ],
        ]);
    }
    /**
     * Update user profile (name).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->slug,
                'role_name' => $user->role->name,
            ],
        ]);
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Kata sandi saat ini salah.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'message' => 'Kata sandi berhasil diubah.',
        ]);
    }

    /**
     * Logout from all devices (revoke all tokens except current).
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()->id;

        $request->user()->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'message' => 'Semua sesi lain berhasil dihapus.',
        ]);
    }
}
