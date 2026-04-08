"use client";

import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getSocket } from '@/lib/socket';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [channels, setChannels] = useState<any[]>([]);
    const [people, setPeople] = useState<any[]>([]);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/login');
                return;
            }

            // Seed logic
            const { data: existingWs } = await supabase.from('workspaces').select('id').limit(1);
            if (!existingWs || existingWs.length === 0) {
                const { data: newWs } = await supabase.from('workspaces').insert({
                    name: 'Default Workspace',
                    slug: 'default',
                    owner_id: session.user.id
                }).select().single();

                if (newWs) {
                    await supabase.from('workspace_members').insert({ workspace_id: newWs.id, user_id: session.user.id, role: 'owner' });
                    const { data: general } = await supabase.from('channels').insert({ workspace_id: newWs.id, name: 'general', is_private: false }).select().single();
                    const { data: random } = await supabase.from('channels').insert({ workspace_id: newWs.id, name: 'random', is_private: false }).select().single();
                    if (general) await supabase.from('channel_members').insert({ channel_id: general.id, user_id: session.user.id });
                    if (random) await supabase.from('channel_members').insert({ channel_id: random.id, user_id: session.user.id });
                }
            }

            // Fetch Channels
            const { data: userChannels } = await supabase.from('channels').select('*').eq('is_private', false).order('name');
            if (userChannels) setChannels(userChannels);

            // Fetch People (Direct Messages)
            // Show all registered users except self for simple DM list
            const { data: users } = await supabase.from('profiles').select('*').neq('id', session.user.id);
            if (users) setPeople(users);

            // Initialize connection
            const socket = getSocket(session.access_token);
            socket.on('connect', () => { console.log('Connected to socket server'); });
            return () => { socket.disconnect(); };
        };
        checkAuth();
    }, [router]);

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-4 font-bold text-xl border-b border-gray-800">Workspace</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Channels</div>
                        {channels.map(ch => (
                            <Link key={ch.id} href={`/default/channel/${ch.id}`}>
                                <div className="text-gray-300 hover:bg-gray-800 p-2 rounded cursor-pointer transition-colors break-words"># {ch.name}</div>
                            </Link>
                        ))}
                    </div>

                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 mt-6">Direct Messages</div>
                        {people.map(person => (
                            <Link key={person.id} href={`/default/dm/${person.id}`}>
                                <div className="flex items-center space-x-2 text-gray-300 hover:bg-gray-800 p-2 rounded cursor-pointer transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="truncate">{person.full_name || 'Anonymous User'}</span>
                                </div>
                            </Link>
                        ))}
                        {people.length === 0 && <div className="text-gray-600 text-sm italic px-2">No other users yet</div>}
                    </div>

                </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
