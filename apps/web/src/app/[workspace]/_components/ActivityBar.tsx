"use client";

import { Home, MessageSquare, Bell, Files, MoreHorizontal, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ActivityIconProps {
  icon: any;
  label: string;
  href: string;
}

function ActivityIcon({ icon: Icon, label, href }: ActivityIconProps) {
  const pathname = usePathname();
  const active = pathname === href || (label === 'Home' && pathname.split('/').length === 3);

  return (
    <Link href={href}>
      <div className="group flex flex-col items-center cursor-pointer space-y-1">
        <div className={cn(
          "p-2 rounded-xl transition-all duration-200",
          active ? "bg-white/20 text-white" : "text-white/70 group-hover:bg-white/10 group-hover:text-white"
        )}>
          <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={cn(
          "text-[10px] font-medium transition-colors duration-200",
          active ? "text-white" : "text-white/70 group-hover:text-white"
        )}>
          {label}
        </span>
      </div>
    </Link>
  );
}

export default function ActivityBar({ workspace }: { workspace: string }) {
  return (
    <div className="w-[70px] bg-[#3f0e40] flex flex-col items-center py-4 space-y-6 flex-shrink-0">
      {/* Workspace Icon */}
      <Link href={`/${workspace}`}>
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2 hover:bg-white/30 cursor-pointer transition-colors">
          B
        </div>
      </Link>

      <ActivityIcon icon={Home} label="Home" href={`/${workspace}`} />
      <ActivityIcon icon={MessageSquare} label="DMs" href={`/${workspace}`} />
      <ActivityIcon icon={Bell} label="Activity" href={`/${workspace}/activity`} />
      <ActivityIcon icon={Files} label="Files" href={`/${workspace}/files`} />
      <ActivityIcon icon={MoreHorizontal} label="More" href={`/${workspace}`} />

      <div className="mt-auto flex flex-col items-center space-y-4">

        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 cursor-pointer transition-all">
          <Plus size={20} />
        </div>
        <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-[#3f0e40] overflow-hidden cursor-pointer relative">
            {/* User status indicator could go here */}
        </div>
      </div>
    </div>
  );
}
