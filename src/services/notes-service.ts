import { supabase } from './supabase';
import { auth } from './firebase';
import { Notebook, Section, Page } from '../types';

export const notesService = {
  /**
   * Fetches all notebooks for the current user.
   */
  async getMyNotebooks(): Promise<Notebook[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const { data: notebooks, error: nbError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: true });

      if (nbError) throw nbError;
      if (!notebooks) return [];

      // Fetch sections and pages in a single nested structure or sequentially
      // For simplicity in this MVP, we'll fetch them and assemble
      const fullNotebooks: Notebook[] = [];

      for (const nb of notebooks) {
        const { data: sections, error: secError } = await supabase
          .from('sections')
          .select('*')
          .eq('notebook_id', nb.id)
          .order('created_at', { ascending: true });

        if (secError) throw secError;

        const assembledSections: Section[] = [];
        for (const sec of (sections || [])) {
          const { data: pages, error: pageError } = await supabase
            .from('pages')
            .select(`
              id, title, tags, created_at,
              notes_content (content, updated_at)
            `)
            .eq('section_id', sec.id)
            .order('created_at', { ascending: true });

          if (pageError) throw pageError;

          assembledSections.push({
            id: sec.id,
            title: sec.title,
            pages: (pages || []).map((p: any) => {
              const contentObj = Array.isArray(p.notes_content) ? p.notes_content[0] : p.notes_content;
              return {
                id: p.id,
                title: p.title,
                content: contentObj?.content || '',
                lastEdited: new Date(contentObj?.updated_at || p.created_at).toLocaleDateString(),
                tags: p.tags || []
              };
            })
          });
        }

        fullNotebooks.push({
          id: nb.id,
          title: nb.title,
          color: nb.color,
          sections: assembledSections
        });
      }

      return fullNotebooks;
    } catch (error) {
      console.error('Error fetching notebooks:', error);
      return [];
    }
  },

  /**
   * Fetches pages shared with the current user.
   */
  async getSharedPages(): Promise<any[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const { data: shares, error: shareError } = await supabase
        .from('page_shares')
        .select(`
          access_type,
          pages (
            id, title, tags, 
            notes_content (content, updated_at),
            sections (notebook_id)
          )
        `)
        .eq('user_id', user.uid);

      if (shareError) throw shareError;
      if (!shares) return [];

      return shares.map((s: any) => {
        const contentObj = Array.isArray(s.pages.notes_content) ? s.pages.notes_content[0] : s.pages.notes_content;
        return {
          id: s.pages.id,
          title: s.pages.title,
          content: contentObj?.content || '',
          lastEdited: new Date(contentObj?.updated_at || s.pages.created_at).toLocaleDateString(),
          tags: s.pages.tags || [],
          accessType: s.access_type
        };
      });
    } catch (error) {
      console.error('Error fetching shared pages:', error);
      return [];
    }
  },

  async createNotebook(title: string, color: string): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthenticated');
    const { data, error } = await supabase
      .from('notebooks')
      .insert([{ user_id: user.uid, title, color }])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  async createSection(notebookId: string, title: string): Promise<string> {
    const { data, error } = await supabase
      .from('sections')
      .insert([{ notebook_id: notebookId, title }])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  async createPage(sectionId: string, title: string): Promise<string> {
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .insert([{ section_id: sectionId, title }])
      .select('id')
      .single();
    if (pageError) throw pageError;

    const { error: contentError } = await supabase
      .from('notes_content')
      .insert([{ page_id: page.id, content: '' }]);
    if (contentError) throw contentError;

    return page.id;
  },

  async updatePageContent(pageId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('notes_content')
      .upsert({ page_id: pageId, content, updated_at: new Date().toISOString() }, { onConflict: 'page_id' });
    if (error) throw error;
  },

  async renameItem(type: 'notebooks' | 'sections' | 'pages', id: string, title: string): Promise<void> {
    const { error } = await supabase.from(type).update({ title }).eq('id', id);
    if (error) throw error;
  },

  async deleteItem(type: 'notebooks' | 'sections' | 'pages', id: string): Promise<void> {
    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) throw error;
  },

  async sharePage(pageId: string, targetUserId: string, accessType: 'viewer' | 'editor'): Promise<void> {
    const { error } = await supabase
      .from('page_shares')
      .insert([{ page_id: pageId, user_id: targetUserId, access_type: accessType }]);
    if (error) {
      if (error.code === '23505') throw new Error('Already shared with this user');
      throw error;
    }
  },

  async clonePage(pageId: string, targetSectionId: string): Promise<string> {
    // Fetch original page title and content
    const { data: original, error: fetchError } = await supabase
      .from('pages')
      .select('title, notes_content(content)')
      .eq('id', pageId)
      .single();
    
    if (fetchError) throw fetchError;

    // Create new page
    const newPageId = await this.createPage(targetSectionId, original.title);
    const contentObj = Array.isArray(original.notes_content) ? original.notes_content[0] : original.notes_content;
    await this.updatePageContent(newPageId, contentObj?.content || '');
    
    return newPageId;
  },

  async updatePageTags(pageId: string, tags: string[]): Promise<void> {
    const { error } = await supabase
      .from('pages')
      .update({ tags })
      .eq('id', pageId);
    if (error) throw error;
  }
};
