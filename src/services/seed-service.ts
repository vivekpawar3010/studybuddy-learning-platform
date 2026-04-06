import { supabase } from './supabase';

/**
 * Seeds initial data for a new user to help them get started.
 */
export const seedUserData = async (userId: string) => {
  try {
    // 1. Create a Welcome Notebook
    const { data: notebook, error: notebookError } = await supabase
      .from('notebooks')
      .insert([{
        user_id: userId,
        title: 'Study Buddy Guide',
        color: '#4F46E5'
      }])
      .select()
      .single();

    if (!notebookError && notebook) {
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .insert([{
          notebook_id: notebook.id,
          title: 'Getting Started'
        }])
        .select()
        .single();

      if (!sectionError && section) {
        const { data: page, error: pageError } = await supabase
          .from('pages')
          .insert([{
            section_id: section.id,
            title: 'How to use Notes'
          }])
          .select()
          .single();

        if (!pageError && page) {
          await supabase
            .from('notes_content')
            .insert([{
              page_id: page.id,
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Welcome to your personal notebook! Here you can organize your study material by books and pages. You can also share these pages in community chats.'
                      }
                    ]
                  }
                ]
              }
            }]);
        }
      }
    }

    // 2. Join Global Communities
    const globalCommunities = [
      '00000000-0000-0000-0000-000000000001', // Global Study Group
      '00000000-0000-0000-0000-000000000002'  // Official Updates
    ];

    for (const communityId of globalCommunities) {
      await supabase
        .from('community_members')
        .upsert({
          community_id: communityId,
          user_id: userId,
          role: 'member'
        }, { onConflict: 'community_id, user_id' });
    }

    // 3. Create initial AI Tutor conversation
    const { data: aiConv, error: aiError } = await supabase
      .from('ai_conversations')
      .insert([{
        user_id: userId,
        title: 'Welcome to AI Tutor'
      }])
      .select()
      .single();

    if (!aiError && aiConv) {
      await supabase
        .from('ai_messages')
        .insert([
          {
            conversation_id: aiConv.id,
            sender_type: 'ai',
            message: 'Hi! I am your AI Tutor. You can ask me anything about your subjects, and I will help you understand complex topics. Just type your question below!'
          },
          {
            conversation_id: aiConv.id,
            sender_type: 'user',
            message: 'How do I chat with you?'
          },
          {
            conversation_id: aiConv.id,
            sender_type: 'ai',
            message: 'Just like this! You can also upload images of your problems, and I will solve them for you.'
          }
        ]);
    }

    // 4. Send a Welcome Direct Message
    // Note: This requires a system admin user to exist.
    // We'll skip this for now as it depends on a specific admin UID.

  } catch (error) {
    console.error('Error seeding user data:', error);
  }
};
