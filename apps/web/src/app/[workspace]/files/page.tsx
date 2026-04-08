"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    FileText, File as FileIcon, Download, Search, MoreVertical, 
    Filter, ChevronDown, Star, Layout, Image as ImageIcon,
    Music, Video as VideoIcon, Archive
} from 'lucide-react';

export default function FilesPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    const filters = ['All', 'Created by you', 'Shared with you'];

    useEffect(() => {
        const fetchFiles = async () => {
            const { data } = await supabase
                .from('files')
                .select('*, profiles(full_name, avatar_url)')
                .order('created_at', { ascending: false });

            if (data) setFiles(data);
            setLoading(false);
        };
        fetchFiles();
    }, []);

    const getFileIcon = (mime: string, name: string) => {
        if (mime?.includes('image')) return <ImageIcon className="text-pink-500" size={20} />;
        if (mime?.includes('video')) return <VideoIcon className="text-purple-500" size={20} />;
        if (mime?.includes('audio')) return <Music className="text-orange-500" size={20} />;
        if (name.endsWith('.docx') || name.endsWith('.doc')) return <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">W</div>;
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold text-xs">X</div>;
        if (name.endsWith('.pdf')) return <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">PDF</div>;
        if (name.endsWith('.zip') || name.endsWith('.rar')) return <Archive className="text-yellow-600" size={20} />;
        return <FileIcon className="text-gray-500" size={20} />;
    };

    return (
        <div className="flex flex-col h-full bg-white bg-slate-50/30">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-xl text-gray-900 tracking-tight flex items-center space-x-2">
                        <span>All files</span>
                        <ChevronDown size={16} className="text-gray-400" />
                    </h2>
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors">
                            <Plus size={20} className="text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="relative group mb-4 max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        placeholder="Search workspace files"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveTab(f)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    activeTab === f 
                                        ? 'bg-blue-700 text-white shadow-sm' 
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 cursor-pointer text-xs font-bold shadow-sm">
                            <Filter size={14} />
                            <span>5 Types</span>
                            <ChevronDown size={14} />
                        </div>
                        <div className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 cursor-pointer text-xs font-bold shadow-sm">
                            <span>Recently viewed</span>
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
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
                        {files.map((file) => (
                            <div key={file.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group border-b border-gray-100 first:border-t-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 min-w-0">
                                        <div className="shrink-0">
                                            {getFileIcon(file.mime_type, file.file_name)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate tracking-tight">{file.file_name}</h3>
                                            <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                                                <span className="font-semibold text-gray-600">{file.profiles?.full_name}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>Last viewed {new Date(file.created_at).toLocaleDateString([], { month: 'long', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="p-2 rounded hover:bg-gray-200 text-gray-500 cursor-pointer transition-colors">
                                            <Download size={18} strokeWidth={2} />
                                        </div>
                                        <div className="p-2 rounded hover:bg-gray-200 text-gray-500 cursor-pointer transition-colors">
                                            <MoreVertical size={18} strokeWidth={2} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {files.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                <FileText size={48} className="text-gray-100" />
                                <div className="text-center">
                                    <p className="text-gray-900 font-bold">No files found</p>
                                    <p className="text-gray-500 text-sm">Upload files in channels to see them here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Plus({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
