import { supabase } from './supabase';
import { auth } from './firebase';
import { ChatConversation, ChatMessage } from '../types';

export interface CommunityInfo {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  type: string;
  invite_code: string;
  member_count?: number;
  request_status?: 'pending' | 'approved' | 'rejected' | null;
  is_member?: boolean;
}

export const communitiesService = {
  /**
   * Fetches all communities the user is a member of,
   * including last message preview for each.
   */
  async getUserCommunities(userId: string): Promise<ChatConversation[]> {
    try {
      const [communitiesRes, directRes] = await Promise.all([
        supabase
          .from('community_members')
          .select(`
            community_id,
            role,
            communities (
              id,
              name,
              description,
              avatar_url,
              type,
              invite_code
            )
          `)
          .eq('user_id', userId),

        supabase
          .from('conversations')
          .select('id, user1_id, user2_id, status, created_at')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      ]);

      if (communitiesRes.error) throw communitiesRes.error;

      // --- Build Direct Message list ---
      let directList: ChatConversation[] = [];
      if (!directRes.error && directRes.data && directRes.data.length > 0) {
        const otherUserIds = directRes.data.map(conv =>
          conv.user1_id === userId ? conv.user2_id : conv.user1_id
        );

        const { data: profiles } = await supabase
          .from('profiles')
          .select('firebase_uid, full_name, avatar_url')
          .in('firebase_uid', otherUserIds);

        // Fetch last DM for each conversation
        const convIds = directRes.data.map(c => c.id);
        const { data: lastDMs } = await supabase
          .from('direct_messages')
          .select('conversation_id, message_text, created_at')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false });

        directList = directRes.data.map(conv => {
          const otherUsrId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          const profile = profiles?.find(p => p.firebase_uid === otherUsrId);
          const otherName = profile?.full_name || 'Unknown User';
          const lastMsg = lastDMs?.find(m => m.conversation_id === conv.id);
          return {
            id: conv.id,
            name: otherName,
            avatar: profile?.avatar_url || null,
            type: 'direct' as const,
            unreadCount: 0,
            members: [conv.user1_id, conv.user2_id],
            description: 'Direct Message',
            status: conv.status || 'pending',
            initiatorId: conv.user1_id,
            lastMessage: lastMsg?.message_text || '',
            lastMessageTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          };
        });
      }

      // --- Build Group / Broadcast list ---
      // Fetch last message per community
      const communityData = (communitiesRes.data || []).filter((item: any) => item?.communities);
      const communityIds = communityData.map((item: any) => item.communities.id);
      
      let lastGroupMessages: any[] = [];
      if (communityIds.length > 0) {
        const { data: lastMsgs } = await supabase
          .from('messages')
          .select('community_id, message_text, created_at')
          .in('community_id', communityIds)
          .order('created_at', { ascending: false });
        lastGroupMessages = lastMsgs || [];
      }

      const communitiesList: ChatConversation[] = communityData.map((item: any) => {
        const lastMsg = lastGroupMessages.find(m => m.community_id === item.communities.id);
        // DB type is 'public' | 'private' | 'broadcast'
        // ChatConversation type must be 'group' | 'broadcast' | 'direct'
        const dbType: string = item.communities.type || 'public';
        const chatType: 'group' | 'broadcast' = dbType === 'broadcast' ? 'broadcast' : 'group';
        return {
          id: item.communities.id,
          name: item.communities.name,
          avatar: item.communities.avatar_url || null,
          type: chatType,
          communityType: dbType as 'public' | 'private' | 'broadcast',
          inviteCode: item.communities.invite_code || '',
          unreadCount: 0,
          members: [],
          description: item.communities.description,
          userRole: item.role as 'admin' | 'member',
          lastMessage: lastMsg?.message_text || '',
          lastMessageTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        };
      });

      return [...communitiesList, ...directList];
    } catch (error) {
      console.error('Error fetching user communities:', error);
      return [];
    }
  },

  /**
   * Creates a new community and adds the creator as admin.
   */
  async createCommunity(name: string, description: string, type: 'public' | 'private', avatar_url?: string | null): Promise<ChatConversation | null> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const generateInviteCode = () => Math.random().toString(36).substring(2, 10);

      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert([{
          name,
          description,
          type,
          avatar_url: avatar_url || null,
          created_by: userId,
          invite_code: generateInviteCode()
        }])
        .select()
        .single();

      if (communityError) throw communityError;

      const { error: memberError } = await supabase
        .from('community_members')
        .insert([{
          community_id: community.id,
          user_id: userId,
          role: 'admin'
        }]);

      if (memberError) throw memberError;

      // DB type is 'public' | 'private' | 'broadcast'
      const dbType: string = community.type || 'public';
      const chatType: 'group' | 'broadcast' = dbType === 'broadcast' ? 'broadcast' : 'group';
      return {
        id: community.id,
        name: community.name,
        avatar: community.avatar_url || null,
        type: chatType,
        communityType: dbType as 'public' | 'private' | 'broadcast',
        inviteCode: community.invite_code || '',
        unreadCount: 0,
        members: [],
        description: community.description,
        userRole: 'admin',
        lastMessage: '',
        lastMessageTime: '',
      };
    } catch (error: any) {
      console.error('Error creating community:', error);
      throw error;
    }
  },

  /**
   * Fetches messages for a specific community or direct conversation.
   * Fetches sender profiles separately to avoid FK join issues.
   */
  async getCommunityMessages(chatId: string, isDirect: boolean = false): Promise<ChatMessage[]> {
    try {
      const dbTable = isDirect ? 'direct_messages' : 'messages';
      const fKey = isDirect ? 'conversation_id' : 'community_id';

      const { data, error } = await supabase
        .from(dbTable)
        .select('id, sender_id, message_text, type, metadata, created_at')
        .eq(fKey, chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch sender profiles separately (avoids FK join 406 errors)
      const senderIds = [...new Set(data.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('firebase_uid, full_name, avatar_url')
        .in('firebase_uid', senderIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.firebase_uid, p]));

      return data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: profileMap.get(msg.sender_id)?.full_name || 'Unknown',
        senderAvatar: profileMap.get(msg.sender_id)?.avatar_url,
        content: msg.message_text,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: msg.created_at,
        type: msg.type || 'text',
        ...(msg.metadata || {})
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Sends a message to a community or direct chat.
   */
  async sendMessage(chatId: string, senderId: string, text: string, type: string = 'text', metadata: any = {}, isDirect: boolean = false) {
    try {
      const dbTable = isDirect ? 'direct_messages' : 'messages';
      const fKey = isDirect ? 'conversation_id' : 'community_id';

      const { data, error } = await supabase
        .from(dbTable)
        .insert([{
          [fKey]: chatId,
          sender_id: senderId,
          message_text: text,
          type,
          metadata
        }])
        .select('id, sender_id, message_text, type, metadata, created_at')
        .single();

      if (error) throw error;

      // If this is a DM in pending state and the receiver just replied → auto-accept
      if (isDirect) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('status, user1_id')
          .eq('id', chatId)
          .maybeSingle();

        // If pending and the replier is NOT the initiator (user1), auto-accept
        if (conv && conv.status === 'pending' && conv.user1_id !== senderId) {
          await supabase
            .from('conversations')
            .update({ status: 'accepted' })
            .eq('id', chatId);
        }
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Uploads a file to Supabase storage.
   */
  async uploadFile(file: File): Promise<{ url: string, name: string }> {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(`messages/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(`messages/${fileName}`);

      return {
        url: publicUrlData.publicUrl,
        name: file.name
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Fetches community info by invite code.
   */
  async getByInviteCode(inviteCode: string): Promise<CommunityInfo | null> {
    try {
      const userId = auth.currentUser?.uid;
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          community_members (user_id),
          community_join_requests (user_id, status)
        `)
        .eq('invite_code', inviteCode)
        .single();

      if (error) throw error;
      if (!data) return null;

      const isMember = data.community_members?.some((m: any) => m.user_id === userId);
      const requestStatus = data.community_join_requests?.find((r: any) => r.user_id === userId)?.status;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        avatar_url: data.avatar_url,
        type: data.type,
        invite_code: data.invite_code,
        member_count: data.community_members?.length || 0,
        request_status: requestStatus,
        is_member: isMember
      };
    } catch (error) {
      console.error('Error fetching community by invite code:', error);
      return null;
    }
  },

  /**
   * Requests to join a community.
   */
  async requestToJoin(communityId: string) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('community_join_requests')
        .insert([{
          community_id: communityId,
          user_id: userId,
          status: 'pending'
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error requesting to join community:', error);
      throw error;
    }
  },

  /**
   * Joins a public community immediately.
   */
  async joinPublicCommunity(communityId: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Double check it's actually public
      const { data: community } = await supabase
        .from('communities')
        .select('type')
        .eq('id', communityId)
        .single();

      if (community?.type !== 'public') {
        throw new Error('This community is not public.');
      }

      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: communityId,
          user_id: userId,
          role: 'member'
        }]);

      if (error && error.code !== '23505') throw error;
      return true;
    } catch (error) {
      console.error('Error joining public community:', error);
      throw error;
    }
  },

  /**
   * Fetches pending join requests for a community.
   */
  async getJoinRequests(communityId: string) {
    try {
      const { data, error } = await supabase
        .from('community_join_requests')
        .select(`
          id,
          user_id,
          status,
          created_at,
          profiles (firebase_uid, full_name, avatar_url, username)
        `)
        .eq('community_id', communityId)
        .eq('status', 'pending');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching join requests:', error);
      return [];
    }
  },

  /**
   * Approves or rejects a join request.
   */
  async respondToJoinRequest(requestId: string, communityId: string, userId: string, approve: boolean) {
    try {
      if (approve) {
        // Add to members
        const { error: memberError } = await supabase
          .from('community_members')
          .insert([{ community_id: communityId, user_id: userId, role: 'member' }]);
        
        if (memberError && memberError.code !== '23505') throw memberError;
      }

      // Update request status
      const { error } = await supabase
        .from('community_join_requests')
        .update({ status: approve ? 'approved' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error responding to join request:', error);
      throw error;
    }
  },

  /**
   * Subscribes to new messages in real-time.
   * Fetches sender profile separately per message to avoid FK join issues.
   */
  subscribeToMessages(chatId: string, onMessage: (msg: ChatMessage) => void, isDirect: boolean = false) {
    const dbTable = isDirect ? 'direct_messages' : 'messages';
    const fKey = isDirect ? 'conversation_id' : 'community_id';

    const channel = supabase
      .channel(`rt:${dbTable}:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: dbTable,
          filter: `${fKey}=eq.${chatId}`
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('firebase_uid', payload.new.sender_id)
            .maybeSingle();

          const newMsg: ChatMessage = {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            senderName: profileData?.full_name || 'Unknown',
            senderAvatar: profileData?.avatar_url,
            content: payload.new.message_text,
            timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: payload.new.created_at,
            type: (payload.new.type as any) || 'text',
            ...(payload.new.metadata || {})
          };

          onMessage(newMsg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Search for users by email or username.
   */
  async searchUsers(query: string) {
    if (!query || query.length < 2) return [];
    const currentUserId = auth.currentUser?.uid;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('firebase_uid, full_name, email, username, avatar_url')
        .or(`email.ilike.%${query}%,username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('firebase_uid', currentUserId || '')
        .limit(10);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error searching users:', e);
      return [];
    }
  },

  /**
   * Start or get an existing direct message conversation.
   * Properly handles the PGRST116 "no rows" case so first-time DMs are created.
   */
  async startDirectMessage(targetUserId: string): Promise<string | null> {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || currentUserId === targetUserId) return null;

    try {
      // Check for existing conversation (either direction)
      const { data: existing, error: existError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserId})`)
        .maybeSingle(); // Use maybeSingle() — returns null (not error) when no row found

      if (existError) throw existError;
      if (existing) return existing.id;

      // No existing conversation — create a new pending one
      const { data: newConv, error: newError } = await supabase
        .from('conversations')
        .insert([{
          user1_id: currentUserId,
          user2_id: targetUserId,
          status: 'pending'
        }])
        .select('id')
        .single();

      if (newError) throw newError;
      return newConv.id;
    } catch (e) {
      console.error('Error starting direct message:', e);
      return null;
    }
  },

  /**
   * Updates a specific direct message conversation status.
   */
  async updateConversationStatus(conversationId: string, status: 'accepted' | 'blocked'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating conversation status:', error);
      return false;
    }
  },

  /**
   * Fetches the real member list for a community with profile data.
   */
  async getCommunityMembers(communityId: string): Promise<{ firebase_uid: string; full_name: string; avatar_url: string | null; username: string | null; role: string }[]> {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('user_id, role')
        .eq('community_id', communityId);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map((m: any) => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('firebase_uid, full_name, avatar_url, username')
        .in('firebase_uid', userIds);

      if (profileError) throw profileError;

      return (profiles || []).map((p: any) => ({
        firebase_uid: p.firebase_uid,
        full_name: p.full_name || 'Unknown',
        avatar_url: p.avatar_url,
        username: p.username,
        role: data.find((m: any) => m.user_id === p.firebase_uid)?.role || 'member',
      }));
    } catch (error) {
      console.error('Error fetching community members:', error);
      return [];
    }
  },

  /**
   * Directly add a user to a community (admin action — no invite needed for contacts).
   * Throws with a descriptive message on failure so the caller can display it.
   */
  async addMemberDirectly(communityId: string, targetUserId: string): Promise<boolean> {
    const { error } = await supabase
      .from('community_members')
      .insert([{ community_id: communityId, user_id: targetUserId, role: 'member' }]);

    if (error) {
      if (error.code === '23505') return true; // Already a member — treat as success
      // Throw with the real DB message so the UI can show it
      throw new Error(error.message || `DB error ${error.code}`);
    }
    return true;
  },

  /**
   * Remove a member from a community (admin only).
   */
  async removeMember(communityId: string, targetUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  },

  /**
   * Leave a community (current user exits).
   */
  async leaveGroup(communityId: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  },

  /**
   * Update community name, description, and/or type (admin only).
   * Throws with actual DB error message on failure.
   */
  async updateCommunityDetails(
    communityId: string,
    updates: { name?: string; description?: string; type?: 'public' | 'private'; avatar_url?: string | null }
  ): Promise<boolean> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('communities')
      .update(updates)
      .eq('id', communityId);

    if (error) throw new Error(error.message || `DB error ${error.code}`);
    return true;
  },

  /**
   * Get all pending community invites for the current user.
   */
  async getPendingInvitesForUser(userId: string): Promise<{ id: string; community_id: string; community_name: string; community_avatar: string | null; invited_by_name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('community_invites')
        .select('id, community_id, invited_by, status')
        .eq('invited_user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const communityIds = data.map((inv: any) => inv.community_id);
      const inviterIds = data.map((inv: any) => inv.invited_by);

      const [{ data: communities }, { data: inviters }] = await Promise.all([
        supabase.from('communities').select('id, name, avatar_url').in('id', communityIds),
        supabase.from('profiles').select('firebase_uid, full_name').in('firebase_uid', inviterIds),
      ]);

      return data.map((inv: any) => {
        const comm = communities?.find((c: any) => c.id === inv.community_id);
        const inviter = inviters?.find((p: any) => p.firebase_uid === inv.invited_by);
        return {
          id: inv.id,
          community_id: inv.community_id,
          community_name: comm?.name || 'Unknown Group',
          community_avatar: comm?.avatar_url || null,
          invited_by_name: inviter?.full_name || 'Someone',
        };
      });
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      return [];
    }
  },

  /**
   * Accept or decline a group invite.
   * On accept: add to community_members, update invite status.
   * On decline: update invite status to 'declined'.
   */
  async respondToInvite(inviteId: string, communityId: string, accept: boolean): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      if (accept) {
        // Add to community members first
        const { error: memberError } = await supabase
          .from('community_members')
          .insert([{ community_id: communityId, user_id: userId, role: 'member' }]);

        if (memberError && memberError.code !== '23505') throw memberError;
      }

      const { error } = await supabase
        .from('community_invites')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', inviteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error responding to invite:', error);
      return false;
    }
  },

  /**
   * Subscribe to new community invites for the current user.
   */
  subscribeToMemberInvites(userId: string, onInvite: () => void) {
    const channel = supabase
      .channel(`invites:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_invites',
          filter: `invited_user_id=eq.${userId}`,
        },
        () => onInvite()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  /**
   * Invite a user to a community (creates a pending invite, but they are added directly by admin for contacts).
   * Use addMemberDirectly for contacts; this is for non-contacts (future use or notification only).
   */
  async sendCommunityInvite(communityId: string, targetUserId: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_invites')
        .insert([{
          community_id: communityId,
          invited_user_id: targetUserId,
          invited_by: userId,
          status: 'pending',
        }]);

      if (error && error.code !== '23505') throw error;
      return true;
    } catch (error) {
      console.error('Error sending invite:', error);
      return false;
    }
  },
};

