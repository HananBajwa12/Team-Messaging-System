"use client";

import { Phone, Video, Info, Search, BellOff, Star } from 'lucide-react';
import { useState } from 'react';

interface ChatHeaderProps {
  title: string;
  avatar?: string;
  isPrivate?: boolean;
}

export default function ChatHeader({ title, avatar, isPrivate }: ChatHeaderProps) {
  const [activeTab, setActiveTab] = useState('Messages');
  const tabs = ['Messages', 'Weekly 1:1', 'Files', '+'];

  return (
    <div className="flex flex-col border-b border-gray-200 bg-white">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2 truncate">
            {avatar ? (
                 <div className="w-6 h-6 rounded bg-gray-200 overflow-hidden shrink-0">
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                 </div>
            ) : (
                <div className="w-6 h-6 rounded bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                    {title[0]}
                </div>
            )}
            <h2 className="font-bold text-lg text-gray-900 truncate tracking-tight">{title}</h2>
            <Star size={14} className="text-gray-400 hover:text-yellow-400 cursor-pointer transition-colors" />
          </div>
        </div>

        <div className="flex items-center space-x-4 text-gray-500">
           <div className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors">
              <Phone size={18} strokeWidth={1.5} />
           </div>
           <div className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors">
              <Video size={18} strokeWidth={1.5} />
           </div>
           <div className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors border-l border-gray-200 pl-4 h-6">
              <span className="text-xs font-semibold">4</span>
              <BellOff size={16} strokeWidth={1.5} />
           </div>
           <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                    <Search size={14} />
                </div>
                <input 
                    type="text" 
                    className="w-32 bg-gray-50 border-gray-200 rounded py-1 pl-8 pr-2 text-xs focus:ring-1 focus:ring-blue-500 focus:w-48 transition-all"
                    placeholder="Search"
                />
           </div>
           <div className="p-1.5 rounded hover:bg-gray-100 cursor-pointer transition-colors">
              <Info size={18} strokeWidth={1.5} />
           </div>
        </div>
      </div>

      <div className="flex px-4 items-center space-x-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium h-9 border-b-2 transition-all px-1 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
