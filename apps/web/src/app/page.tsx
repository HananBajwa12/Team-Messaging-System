"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Redirect user to the workspace base without a hardcoded channel slug
                router.push('/default');
            } else {
                // Redirect user to the login portal
                router.push('/login');
            }
        };
        checkSession();
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-gray-500 animate-pulse text-lg font-medium">Loading workspace...</div>
        </div>
    );
}
