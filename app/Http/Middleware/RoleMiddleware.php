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
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated
        if (!auth()->check()) {
            return redirect('login');
        }

        // Check if user has one of the required roles
        if (!in_array(auth()->user()->role, $roles)) {
            abort(403, 'Unauthorized - Role tidak sesuai');
        }

        // Check if user is active
        if (!auth()->user()->is_active) {
            auth()->logout();
            return redirect('login')->with('error', 'Akun Anda telah dinonaktifkan');
        }

        return $next($request);
    }
}
