"use client";

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';

export default function DMView({ params }: { params: { workspace: string, userId: string } }) {
    const { messages, setMessages, addMessage } = useStore();
    const [input, setInput] = useState('');
    const [channelId, setChannelId] = useState<string | null>(null);
    const [recipient, setRecipient] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const setupDM = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch recipient info
            const { data: userData } = await supabase.from('profiles').select('*').eq('id', params.userId).single();
            setRecipient(userData);

            // Find or create a private channel between session.user.id and params.userId
            // This is a simplified logic: look for a private channel where both are members
            const { data: existingChannels } = await supabase
                .from('channels')
                .select('id, channel_members(user_id)')
                .eq('is_private', true);

            let foundChannelId = null;

            if (existingChannels) {
                for (const ch of existingChannels) {
                    const memberIds = ch.channel_members.map((m: any) => m.user_id);
                    if (memberIds.length === 2 && memberIds.includes(session.user.id) && memberIds.includes(params.userId)) {
                        foundChannelId = ch.id;
                        break;
                    }
                }
            }

            if (!foundChannelId) {
                // Create new private channel
                const { data: workspace } = await supabase.from('workspaces').select('id').eq('slug', params.workspace).single();
                if (!workspace) return;

                const { data: newChannel } = await supabase.from('channels').insert({
                    workspace_id: workspace.id,
                    name: `dm-${session.user.id.slice(0,4)}-${params.userId.slice(0,4)}`,
                    is_private: true
                }).select().single();

                if (newChannel) {
                    await supabase.from('channel_members').insert([
                        { channel_id: newChannel.id, user_id: session.user.id },
                        { channel_id: newChannel.id, user_id: params.userId }
                    ]);
                    foundChannelId = newChannel.id;
                }
            }

            setChannelId(foundChannelId);
        };

        setupDM();
    }, [params.userId, params.workspace]);

    useEffect(() => {
        if (!channelId) return;

        const loadMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, profiles(id, full_name, avatar_url)')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (data) {
                setMessages(data.reverse());
            }
        };

        loadMessages();

        const initializeSocket = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const socket = getSocket(session.access_token);
                socket.emit('join_channel', { channelId });

                socket.on('message_received', (msg) => {
                    if (msg.channel_id === channelId) {
                        addMessage(msg);
                    }
                });

                return () => {
                    socket.emit('leave_channel', { channelId });
                    socket.off('message_received');
                };
            }
        };
        initializeSocket();
    }, [channelId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !channelId) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const socket = getSocket(session.access_token);
            socket.emit('send_message', { channelId, content: input });
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    {recipient?.full_name || 'Loading...'}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} className="flex space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-500">
                            {msg.profiles?.avatar_url ? (
                                <img src={msg.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (msg.profiles?.full_name?.[0] || '?').toUpperCase()
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline space-x-2">
                                <span className="font-bold text-gray-900">{msg.profiles?.full_name || 'Unknown User'}</span>
                                <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-gray-800 break-words mt-1">{msg.content}</div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSend} className="flex items-end space-x-2 border border-gray-300 rounded-lg p-2 focus-within:ring-1 ring-blue-500 shadow-sm bg-gray-50">
                    <textarea 
                        className="flex-1 max-h-32 bg-transparent border-0 focus:ring-0 resize-none px-2 py-1"
                        placeholder={`Message ${recipient?.full_name || 'user'}`}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                    />
                    <button type="submit" disabled={!input.trim() || !channelId} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded disabled:opacity-50 transition-colors">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
