"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Bell, Search, Star, MessageSquare, AtSign, ThumbsUp, UserPlus, Grid } from 'lucide-react';

export default function ActivityPage() {
    const params = useParams();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    const tabs = [
        { name: 'All', icon: Bell },
        { name: '@Mentions', icon: AtSign },
        { name: 'Threads', icon: MessageSquare },
        { name: 'Reactions', icon: ThumbsUp },
        { name: 'Invitations', icon: UserPlus },
        { name: 'Apps', icon: Grid }
    ];

    useEffect(() => {
        const fetchActivity = async () => {
            // Fetch recent messages across all channels in the workspace
            // This is a simplified "Activity" feed
            const { data } = await supabase
                .from('messages')
                .select('*, profiles(full_name, avatar_url), channels(name)')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setActivities(data);
            setLoading(false);
        };
        fetchActivity();
    }, []);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex flex-col border-b border-gray-200">
                <div className="h-14 px-4 flex items-center justify-between">
                    <h2 className="font-bold text-lg text-gray-900 tracking-tight">Activity</h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">Unreads</span>
                        <div className="w-8 h-4 bg-gray-200 rounded-full relative cursor-pointer">
                            <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                </div>

                <div className="flex px-4 items-center space-x-6 border-t border-gray-100 py-1 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center space-x-2 text-sm font-medium h-9 border-b-2 transition-all px-1 whitespace-nowrap ${
                                activeTab === tab.name
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon size={14} />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex items-center space-x-4 animate-pulse">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                                    <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {activities.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-500 text-lg">
                                        {item.profiles?.avatar_url ? (
                                            <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            (item.profiles?.full_name?.[0] || '?').toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                                                {item.parent_id ? 'Thread in ' : 'Mention in '} 
                                                <span className="text-gray-900 lowercase italic">#{item.channels?.name || 'unknown'}</span>
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="font-bold text-[14px] text-gray-900">{item.profiles?.full_name || 'Anonymous'}</span>
                                        </div>
                                        <div className="text-[14px] text-gray-700 truncate mt-0.5">
                                            {item.content}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="p-1.5 rounded-lg border border-gray-200 bg-white shadow-sm">
                                            <Star size={14} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <div className="p-10 text-center text-gray-500 italic">
                                No activity found in this workspace yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
