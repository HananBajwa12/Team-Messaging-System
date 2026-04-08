"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return alert("Please enter your email and password first.");
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert(error.message);
        } else {
            router.push('/');
        }
        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return alert("Please type an email and password first to create an account.");
        setLoading(true);
        // On free Supabase projects, email confirmations are ON by default.
        // We will just attempt to sign up directly.
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: email.split('@')[0]
                }
            }
        });
        if (error) {
            alert("Signup error: " + error.message);
        } else {
            alert("Success! If email confirmation is off, you can now sign in. If it is on, please check your email.");
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Sign in to Workspace</h1>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input 
                            type="email" 
                            required 
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input 
                            type="password" 
                            required 
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex space-x-2 pt-2">
                        <button 
                            type="button" 
                            onClick={handleSignup}
                            disabled={loading}
                            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                        >
                            Sign Up
                        </button>
                        <button 
                            type="button"
                            onClick={handleLogin} 
                            disabled={loading}
                            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 transition-colors"
                        >
                            Sign In
                        </button>
                    </div>
                    <div className="text-center mt-4 text-xs text-gray-500">
                        (Since this is your own Supabase project, you must sign up your first account here!)
                    </div>
                </form>
            </div>
        </div>
    );
}
