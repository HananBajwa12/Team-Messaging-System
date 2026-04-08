"use client";

import { 
    Bold, Italic, Strikethrough, Link as LinkIcon, 
    List, ListOrdered, Quote, Code, Terminal, 
    Plus, Type, Smile, AtSign, Video, Mic, Zap, SendHorizontal
} from 'lucide-react';
import { useState } from 'react';

interface RichInputProps {
  placeholder?: string;
  onSend: (content: string) => void;
}

export default function RichInput({ placeholder, onSend }: RichInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    return (
        <div className="p-4 bg-white">
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 ring-blue-500 shadow-sm transition-shadow">
                {/* Toolbar */}
                <div className="flex items-center px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
                    <ToolbarButton icon={Bold} />
                    <ToolbarButton icon={Italic} />
                    <ToolbarButton icon={Strikethrough} />
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <ToolbarButton icon={LinkIcon} />
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <ToolbarButton icon={ListOrdered} />
                    <ToolbarButton icon={List} />
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <ToolbarButton icon={Quote} />
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <ToolbarButton icon={Code} />
                    <ToolbarButton icon={Terminal} />
                </div>

                {/* Text Area */}
                <textarea 
                    className="w-full min-h-[100px] max-h-60 p-3 bg-white border-0 focus:ring-0 resize-none text-[15px] placeholder-gray-400 leading-relaxed"
                    placeholder={placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />

                {/* Footer */}
                <div className="flex items-center justify-between p-2 bg-white">
                    <div className="flex items-center space-x-0.5">
                        <ActionButton icon={Plus} />
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <ActionButton icon={Type} />
                        <ActionButton icon={Smile} />
                        <ActionButton icon={AtSign} />
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <ActionButton icon={Video} size={18} />
                        <ActionButton icon={Mic} size={18} />
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <ActionButton icon={Zap} size={18} />
                    </div>

                    <button 
                        onClick={() => handleSubmit()}
                        disabled={!input.trim()}
                        className={`p-1.5 rounded transition-all ${
                            input.trim() 
                                ? 'bg-green-700 text-white hover:bg-green-800' 
                                : 'text-gray-300 cursor-not-allowed'
                        }`}
                    >
                        <SendHorizontal size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500 text-right pr-1 italic">
                <b>Return</b> to send, <b>Shift + Return</b> to add a new line
            </div>
        </div>
    );
}

function ToolbarButton({ icon: Icon }: { icon: any }) {
    return (
        <button className="p-1 px-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors">
            <Icon size={16} strokeWidth={1.5} />
        </button>
    );
}

function ActionButton({ icon: Icon, size = 20 }: { icon: any, size?: number }) {
    return (
        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors">
            <Icon size={size} strokeWidth={1.5} />
        </button>
    );
}
