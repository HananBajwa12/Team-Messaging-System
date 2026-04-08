import express from 'express';
import { authenticateJWT, supabase } from './supabase';

const router = express.Router();

// Example REST endpoint for fetching paginated messages
router.get('/channels/:channelId/messages', authenticateJWT, async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Convert to pagination
    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const from = (p - 1) * l;
    const to = from + l - 1;

    try {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                profiles ( id, full_name, avatar_url ),
                reactions ( id, emoji, user_id )
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        
        res.json({ data, page: p, limit: l });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Workspace channels
router.get('/workspaces/:workspaceId/channels', authenticateJWT, async (req, res) => {
    const { workspaceId } = req.params;
    try {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .eq('workspace_id', workspaceId);

        if (error) throw error;
        res.json({ data });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
