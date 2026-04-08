"use client";

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';
import ChatHeader from '../../_components/ChatHeader';
import RichInput from '../../_components/RichInput';

export default function ChannelView({ params }: { params: { workspace: string, channelId: string } }) {
    const { messages, setMessages, addMessage } = useStore();
    const [channelName, setChannelName] = useState('loading...');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadChannelInfo = async () => {
             const { data } = await supabase.from('channels').select('name').eq('id', params.channelId).single();
             if (data) setChannelName(data.name);
        };
        loadChannelInfo();

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

    const handleSend = async (content: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const socket = getSocket(session.access_token);
            socket.emit('send_message', { channelId: params.channelId, content });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <ChatHeader title={channelName} />
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-1" ref={scrollRef}>
                <div className="flex items-center my-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="px-4 py-1 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-full shadow-sm">
                        Yesterday
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {messages.map((msg, i) => (
                    <div key={msg.id || i} className="flex items-start space-x-3 group hover:bg-gray-50 px-4 py-2 -mx-4 transition-colors relative">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-500 text-lg">
                            {msg.profiles?.avatar_url ? (
                                <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (msg.profiles?.full_name?.[0] || '?').toUpperCase()
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline space-x-2">
                                <span className="font-black text-[15px] text-gray-900 leading-none hover:underline cursor-pointer">{msg.profiles?.full_name || 'Anonymous User'}</span>
                                <span className="text-[11px] text-gray-500 font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-[15px] text-gray-800 break-words mt-0.5 leading-relaxed">{msg.content}</div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute right-4 top-2 hidden group-hover:flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in duration-200">
                             <button className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-r border-gray-100 flex items-center space-x-1">
                                <span>React</span>
                             </button>
                             <button className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center space-x-1">
                                <span>Reply</span>
                             </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <RichInput 
                placeholder={`Message #${channelName}`} 
                onSend={handleSend} 
            />
        </div>
    );
}
