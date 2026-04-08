"use client";

import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getSocket } from '@/lib/socket';
import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';

import ActivityBar from './_components/ActivityBar';
import { Search, Clock, HelpCircle, Filter, Edit3, Plus } from 'lucide-react';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname() || '';
    const params = useParams();
    const workspaceSlug = params.workspace as string;
    const [channels, setChannels] = useState<any[]>([]);
    const [people, setPeople] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isActivity = pathname.includes('/activity');
    const isFiles = pathname.includes('/files');

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
            const { data: users } = await supabase.from('profiles').select('*').neq('id', session.user.id);
            if (users) setPeople(users);

            setLoading(false);

            // Initialize connection
            const socket = getSocket(session.access_token);
            socket.on('connect', () => { console.log('Connected to socket server'); });
            return () => { socket.disconnect(); };
        };
        checkAuth();
    }, [router, workspaceSlug]);

    return (
        <div className="flex flex-col h-screen bg-[#3f0e40]">
            {/* Top Bar */}
            <div className="h-10 flex items-center justify-between px-4 bg-[#350d36] text-white/70 select-none">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                        <Clock size={16} className="cursor-pointer hover:text-white" />
                    </div>
                </div>
                
                <div className="flex-1 max-w-2xl px-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50 group-hover:text-white/70">
                            <Search size={14} />
                        </div>
                        <input 
                            type="text" 
                            className="block w-full bg-white/10 border-0 rounded-md py-1 pl-10 pr-3 text-xs text-white placeholder-white/50 focus:ring-1 focus:ring-white/30 focus:bg-white/20 transition-all"
                            placeholder="Search Workspace"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <HelpCircle size={16} className="cursor-pointer hover:text-white" />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Activity Bar (Pane 1) */}
                <ActivityBar workspace={workspaceSlug} />

                {/* Sidebar (Pane 2) */}
                <div className="w-[300px] bg-[#4a154b] flex flex-col border-l border-white/5">
                    {/* Sidebar Header Container */}
                    <div className="p-4 flex items-center justify-between text-white">
                        <h2 className="font-bold text-lg flex items-center group cursor-pointer truncate">
                            {isActivity ? 'Activity' : isFiles ? 'Files' : 'Direct messages'}
                            <span className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </span>
                        </h2>
                        {!isActivity && !isFiles && (
                            <div className="flex items-center space-x-2">
                                <div className="p-1.5 hover:bg-white/10 rounded-md cursor-pointer transition-colors">
                                    <Edit3 size={18} strokeWidth={1.5} />
                                </div>
                            </div>
                        )}
                        {isFiles && (
                            <div className="p-1.5 hover:bg-white/10 rounded-md cursor-pointer transition-colors text-white/70">
                                <Plus size={18} />
                            </div>
                        )}
                    </div>

                    {/* Sidebar Search/Filter Area */}
                    <div className="px-4 pb-4">
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full bg-white/10 border-0 rounded-md py-1.5 pl-3 pr-3 text-sm text-white placeholder-white/50 focus:ring-0 focus:bg-white/20 transition-all"
                                placeholder={isActivity ? "Find notification" : isFiles ? "All files" : "Find a DM"}
                            />
                        </div>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto sidebar-scrollbar px-2 space-y-6 pt-2">
                        {isActivity ? (
                            <div className="space-y-1">
                                {['All', 'Mentions', 'Threads', 'Reactions'].map(filter => (
                                    <div key={filter} className={`flex items-center px-3 py-2 space-x-3 rounded-md cursor-pointer group transition-all duration-200 ${filter === 'All' ? 'bg-[#1164a3] text-white' : 'hover:bg-white/10 text-white/70'}`}>
                                        <span className="text-sm font-medium">{filter}</span>
                                    </div>
                                ))}
                            </div>
                        ) : isFiles ? (
                            <div className="space-y-1">
                                {['All files', 'Canvases', 'Starred'].map(filter => (
                                    <div key={filter} className={`flex items-center px-3 py-2 space-x-3 rounded-md cursor-pointer group transition-all duration-200 ${filter === 'All files' ? 'bg-[#1164a3] text-white' : 'hover:bg-white/10 text-white/70'}`}>
                                        <span className="text-sm font-medium">{filter}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Channels Section */}
                                <div className="space-y-1">
                                    <div className="px-3 py-2 flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm font-bold text-white/70 group-hover:text-white uppercase tracking-wider text-[11px]">Channels</span>
                                        <Plus size={14} className="text-white/40 group-hover:text-white" />
                                    </div>
                                    {channels.map(ch => (
                                        <Link key={ch.id} href={`/${workspaceSlug}/channel/${ch.id}`}>
                                            <div className="flex items-center px-3 py-1.5 space-x-2 rounded-md hover:bg-white/10 cursor-pointer group transition-all">
                                                <span className="text-white/60 group-hover:text-white text-lg">#</span>
                                                <span className="text-sm font-medium text-white/80 group-hover:text-white truncate">{ch.name}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Direct Messages Section */}
                                <div className="space-y-1">
                                    <div className="px-3 py-2 flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm font-bold text-white/70 group-hover:text-white uppercase tracking-wider text-[11px]">Direct Messages</span>
                                        <Plus size={14} className="text-white/40 group-hover:text-white" />
                                    </div>
                                    {loading ? (
                                        [1,2,3].map(i => (
                                            <div key={i} className="flex items-center px-3 py-2 space-x-3 animate-pulse">
                                                <div className="w-9 h-9 bg-white/10 rounded-lg"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        people.map(person => (
                                            <Link key={person.id} href={`/${workspaceSlug}/dm/${person.id}`}>
                                                <div className="flex items-center px-3 py-2 space-x-3 rounded-md hover:bg-white/10 cursor-pointer group transition-all duration-200">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-9 h-9 rounded-lg bg-gray-300 overflow-hidden flex items-center justify-center text-md font-bold text-gray-500">
                                                            {person.avatar_url ? (
                                                                <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                person.full_name?.[0]?.toUpperCase() || '?'
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#4a154b] rounded-full"></div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-white/90 group-hover:text-white truncate">{person.full_name || 'Anonymous User'}</span>
                                                            <span className="text-[10px] text-white/40 group-hover:text-white/60">2:31 PM</span>
                                                        </div>
                                                        <p className="text-xs text-white/40 group-hover:text-white/60 truncate leading-relaxed">Untitled document (3).docx</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content (Pane 3) */}
                <div className="flex-1 flex flex-col bg-white rounded-tl-xl overflow-hidden shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
