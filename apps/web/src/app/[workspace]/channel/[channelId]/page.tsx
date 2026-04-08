"use client";

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';

export default function ChannelView({ params }: { params: { workspace: string, channelId: string } }) {
    const { messages, setMessages, addMessage } = useStore();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch initial messages
        const loadMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, profiles(id, full_name, avatar_url)')
                .eq('channel_id', params.channelId)
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
                socket.emit('join_channel', { channelId: params.channelId });

                socket.on('message_received', (msg: any) => {
                    if (msg.channel_id === params.channelId) {
                        addMessage(msg);
                    }
                });

                return () => {
                    socket.emit('leave_channel', { channelId: params.channelId });
                    socket.off('message_received');
                };
            }
        };
        initializeSocket();
    }, [params.channelId, setMessages, addMessage]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const socket = getSocket(session.access_token);
            // Optimistic UI update could go here
            socket.emit('send_message', { channelId: params.channelId, content: input });
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
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
                        placeholder="Message #channel"
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
                    <button type="submit" disabled={!input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded disabled:opacity-50 transition-colors">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
