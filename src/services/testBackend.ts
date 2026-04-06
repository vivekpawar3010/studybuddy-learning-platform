import { supabase } from "./supabase";
import { auth } from "./firebase";

export const runBackendTests = async () => {
  console.log("🚀 Starting Backend Tests...");

  // 1️⃣ Check Firebase Auth
  const user = auth.currentUser;

  if (!user) {
    console.error("❌ Firebase user not logged in");
    alert("Please log in first to run tests.");
    return;
  }

  console.log("✅ Firebase Auth Working:", user.uid);

  const firebase_uid = user.uid;

  // 2️⃣ Check Profile in Supabase
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("firebase_uid", firebase_uid)
    .single();

  if (profileError) {
    console.error("❌ Profile fetch error:", profileError);
    alert("Profile fetch error: " + profileError.message);
    return;
  } else {
    console.log("✅ Profile exists:", profile);
  }

  try {
    // 3️⃣ Test Notes System
    const { data: notebook, error: notebookError } = await supabase
      .from("notebooks")
      .insert([{ user_id: profile.id, title: "Test Notebook" }])
      .select()
      .single();

    if (notebookError) throw notebookError;
    console.log("✅ Notebook created:", notebook);

    // 4️⃣ Test Section
    const { data: section, error: sectionError } = await supabase
      .from("sections")
      .insert([{ notebook_id: notebook.id, title: "Test Section" }])
      .select()
      .single();

    if (sectionError) throw sectionError;
    console.log("✅ Section created:", section);

    // 5️⃣ Test Page
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .insert([{ section_id: section.id, title: "Test Page" }])
      .select()
      .single();

    if (pageError) throw pageError;
    console.log("✅ Page created:", page);

    // 6️⃣ Test Content
    const { data: content, error: contentError } = await supabase
      .from("notes_content")
      .insert([
        {
          page_id: page.id,
          content: { type: "doc", content: [] },
        },
      ])
      .select()
      .single();

    if (contentError) throw contentError;
    console.log("✅ Content saved:", content);

    // 7️⃣ Test Community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert([
        {
          name: "Test Group",
          description: "Testing",
          created_by: profile.id,
        },
      ])
      .select()
      .single();

    if (communityError) throw communityError;
    console.log("✅ Community created:", community);

    // 8️⃣ Test Message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert([
        {
          community_id: community.id,
          sender_id: profile.id,
          message_text: "Hello Test",
        },
      ])
      .select()
      .single();

    if (messageError) throw messageError;
    console.log("✅ Message sent:", message);

    // 9️⃣ Test AI Tutor
    const { data: convo, error: convoError } = await supabase
      .from("ai_conversations")
      .insert([{ user_id: profile.id }])
      .select()
      .single();

    if (convoError) throw convoError;
    console.log("✅ AI Conversation created:", convo);

    const { data: aiMessage, error: aiMessageError } = await supabase
      .from("ai_messages")
      .insert([
        {
          conversation_id: convo.id,
          sender_type: "user",
          message: "Test AI",
        },
      ])
      .select()
      .single();

    if (aiMessageError) throw aiMessageError;
    console.log("✅ AI Message stored:", aiMessage);

    console.log("🎉 All backend tests completed!");
    alert("🎉 All backend tests completed successfully! Check console for details.");

    // Cleanup
    console.log("🧹 Cleaning up test data...");
    await supabase.from("notebooks").delete().eq("id", notebook.id);
    await supabase.from("communities").delete().eq("id", community.id);
    await supabase.from("ai_conversations").delete().eq("id", convo.id);
    console.log("✅ Cleanup complete.");

  } catch (err: any) {
    console.error("❌ Test failed:", err);
    alert("❌ Test failed: " + (err.message || JSON.stringify(err)));
  }
};

export const seedRealisticData = async () => {
  console.log("🌱 Seeding Realistic Data...");
  const user = auth.currentUser;

  if (!user) {
    alert("Please log in first to seed data.");
    return;
  }

  const firebase_uid = user.uid;

  // 1. Get Profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("firebase_uid", firebase_uid)
    .single();

  if (profileError) {
    console.error("❌ Profile fetch error:", profileError);
    return;
  }

  try {
    // 2. Seed Notebooks
    const notebooks = [
      { user_id: profile.id, title: "Biology 101" },
      { user_id: profile.id, title: "World History" },
      { user_id: profile.id, title: "Advanced Mathematics" }
    ];

    const { data: createdNotebooks, error: nbError } = await supabase
      .from("notebooks")
      .insert(notebooks)
      .select();

    if (nbError) throw nbError;
    console.log("✅ Notebooks seeded");

    // 3. Seed Sections for Biology
    const bioNotebook = createdNotebooks.find(n => n.title === "Biology 101");
    if (bioNotebook) {
      const sections = [
        { notebook_id: bioNotebook.id, title: "Genetics" },
        { notebook_id: bioNotebook.id, title: "Cell Biology" }
      ];
      const { data: createdSections, error: secError } = await supabase
        .from("sections")
        .insert(sections)
        .select();
      
      if (secError) throw secError;

      // 4. Seed Pages for Genetics
      const geneticsSection = createdSections.find(s => s.title === "Genetics");
      if (geneticsSection) {
        const pages = [
          { section_id: geneticsSection.id, title: "DNA Structure" },
          { section_id: geneticsSection.id, title: "Mendelian Inheritance" }
        ];
        const { data: createdPages, error: pageError } = await supabase
          .from("pages")
          .insert(pages)
          .select();
        
        if (pageError) throw pageError;

        // 5. Seed Content for DNA Structure
        const dnaPage = createdPages.find(p => p.title === "DNA Structure");
        if (dnaPage) {
          await supabase.from("notes_content").insert([{
            page_id: dnaPage.id,
            content: { 
              type: "doc", 
              content: [
                { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "DNA Structure & Replication" }] },
                { type: "paragraph", content: [{ type: "text", text: "DNA is a double helix formed by base pairs attached to a sugar-phosphate backbone." }] }
              ] 
            }
          }]);
        }
      }
    }

    // 6. Seed Communities
    const { data: community, error: commError } = await supabase
      .from("communities")
      .insert([{ name: "AP Chem Study Group", description: "Preparing for the AP Chemistry exam together!", created_by: profile.id }])
      .select()
      .single();

    if (commError) throw commError;

    // 7. Join Community
    await supabase.from("community_members").insert([{ community_id: community.id, user_id: profile.id, role: 'admin' }]);

    // 8. Seed Messages
    await supabase.from("messages").insert([
      { community_id: community.id, sender_id: profile.id, message_text: "Hey everyone! I just uploaded the notes for Chapter 4." },
      { community_id: community.id, sender_id: profile.id, message_text: "Does anyone want to study together this weekend?" }
    ]);

    console.log("🎉 Seeding complete!");
    alert("🎉 Database seeded with realistic data! Refresh the app to see changes.");
  } catch (err: any) {
    console.error("❌ Seeding failed:", err);
    alert("❌ Seeding failed: " + err.message);
  }
};
