<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Show the login form
     */
    public function showLoginForm()
    {
        if (auth()->check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    /**
     * Handle login request
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        // Check if user exists and is active
        $user = User::where('email', $credentials['email'])->first();

        if ($user && !$user->is_active) {
            return back()->with('error', 'Akun Anda telah dinonaktifkan. Hubungi administrator.');
        }

        // Attempt login
        if (Auth::attempt($credentials, $request->has('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'))
                ->with('success', 'Selamat datang, ' . auth()->user()->name);
        }

        return back()
            ->with('error', 'Email atau password salah.')
            ->withInput($request->only('email'));
    }

    /**
     * Handle logout
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Anda telah logout');
    }

    /**
     * Show user profile
     */
    public function profile()
    {
        $user = auth()->user();
        $permissions = \App\Models\AccessControl::byRole($user->role)->get();

        return view('auth.profile', compact('user', 'permissions'));
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:users,email,' . auth()->id(),
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
        ]);

        try {
            auth()->user()->update($validated);

            return back()->with('success', 'Profile berhasil diperbarui');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memperbarui profile: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            // Verify current password
            if (!Hash::check($validated['current_password'], auth()->user()->password)) {
                return back()->with('error', 'Password saat ini salah');
            }

            // Update password
            auth()->user()->update([
                'password' => Hash::make($validated['password']),
            ]);

            return back()->with('success', 'Password berhasil diubah');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengubah password: ' . $e->getMessage());
        }
    }
}
