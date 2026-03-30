<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Usage in routes: ->middleware('role:admin,manager')
     *
     * @param  string  ...$roles  Comma-separated role slugs
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_active) {
            return response()->json([
                'message' => 'Unauthorized. Akun tidak aktif atau belum login.',
            ], 401);
        }

        $userRole = $user->role?->slug;

        if (!in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak memiliki akses ke resource ini.',
                'required_roles' => $roles,
                'your_role'      => $userRole,
            ], 403);
        }

        return $next($request);
    }
}
