'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/components/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { refreshSession } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    
    if (result?.error) {
      setError(result.error || 'Invalid credentials');
    } else {
      await refreshSession();
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-gray-900 p-6 rounded-lg w-80 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Log In</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded">
          Log In
        </button>

        <p className="mt-4 text-sm text-center">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-indigo-400 underline">
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
}
