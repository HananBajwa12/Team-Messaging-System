import { create } from 'zustand';

interface User {
    id: string;
    full_name: string;
    avatar_url: string;
}

interface Message {
    id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    profiles?: User;
}

interface ChatState {
    activeWorkspaceId: string | null;
    activeChannelId: string | null;
    messages: Message[];
    setActiveWorkspace: (id: string) => void;
    setActiveChannel: (id: string) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
}

export const useStore = create<ChatState>((set) => ({
    activeWorkspaceId: null,
    activeChannelId: null,
    messages: [],
    setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
    setActiveChannel: (id) => set({ activeChannelId: id }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] }))
}));
