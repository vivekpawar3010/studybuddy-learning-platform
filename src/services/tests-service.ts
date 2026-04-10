import { supabase } from './supabase';
import { GoogleGenAI, Type } from "@google/genai";

export interface Test {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic?: string;
  teacher_id: string;
  duration: number;
  total_marks: number;
  negative_marks: number;
  start_time?: string;
  end_time?: string;
  visibility: 'public' | 'private';
  status: 'draft' | 'published';
  test_code?: string;  // shown only to teacher, used by student to access test
  created_at: string;
  randomize_questions?: boolean;
  test_distributions?: { community_id: string }[];
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_type: 'mcq' | 'multi_select' | 'short_answer' | 'long_answer';
  options: any[];
  correct_answer: any;
  marks: number;
  explanation?: string;
  order_index: number;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  score: number;
  status: 'in_progress' | 'submitted';
  is_graded: boolean;
  started_at: string;
  submitted_at?: string;
  tab_violations?: number;
  time_remaining?: number;
  last_heartbeat?: string;
}

export interface SubmittedStudent {
  attempt_id: string;
  student_id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  score: number | null;
  is_graded: boolean;
  submitted_at: string;
  tab_violations: number;
}

/** Generate a 6-character uppercase alphanumeric test join code. */
function generateTestCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const testsService = {
  async createTest(testData: Partial<Test>) {
    const payload = {
      ...testData,
      // Auto-generate a unique join code if not provided
      test_code: testData.test_code || generateTestCode(),
    };
    const { data, error } = await supabase
      .from('tests')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTest(id: string, testData: Partial<Test>) {
    const { data, error } = await supabase
      .from('tests')
      .update(testData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTest(id: string) {
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) throw error;
  },

  async getTests(role: 'student' | 'teacher', userId: string) {
    if (role === 'teacher') {
      // Teachers see their tests OR published public tests from anyone
      const { data, error } = await supabase
        .from('tests')
        .select('*, test_distributions(community_id)')
        .or(`teacher_id.eq.${userId},and(status.eq.published,visibility.eq.public)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      // 1. Get user's communities
      const { data: memberOf } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);
      
      const communityIds = (memberOf || []).map(m => m.community_id);

      // 2. Fetch tests: 
      //    - Public Published
      //    - Private/Public Published assigned to user's communities
      // Note: We use a left join on test_distributions to find matches.
      let query = supabase
        .from('tests')
        .select('*, test_distributions!left(community_id)')
        .eq('status', 'published');

      if (communityIds.length > 0) {
        query = query.or(`visibility.eq.public,test_distributions.community_id.in.(${communityIds.map(id => `"${id}"`).join(',')})`);
      } else {
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      // Filter out tests that have expired (end_time < now)
      const now = new Date();
      return (data || []).filter(t => !t.end_time || new Date(t.end_time) > now);
    }
  },

  /**
   * Find a published test by its 6-character join code.
   * Used by students to access private or public tests via code.
   */
  async getTestByCode(code: string) {
    const { data, error } = await supabase
      .from('tests')
      .select('*, questions(*)')
      .eq('test_code', code.trim().toUpperCase())
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getTestById(id: string) {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getTestWithQuestions(id: string) {
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*, questions(*), test_distributions(community_id)')
      .eq('id', id)
      .single();
    if (testError) throw testError;
    return test;
  },

  async distributeTest(testId: string, communityIds: string[]) {
    // 1. Remove existing distributions
    await supabase.from('test_distributions').delete().eq('test_id', testId);
    
    if (communityIds.length === 0) return;

    // 2. Add new ones
    const payload = communityIds.map(cid => ({ test_id: testId, community_id: cid }));
    const { error } = await supabase.from('test_distributions').insert(payload);
    if (error) throw error;

    // 3. Send notifications to all members of these communities
    for (const cid of communityIds) {
      this.notifyCommunityOfTest(testId, cid).catch(console.error);
    }
  },

  async notifyCommunityOfTest(testId: string, communityId: string) {
    const { data: test } = await supabase.from('tests').select('title, teacher_id').eq('id', testId).single();
    const { data: community } = await supabase.from('communities').select('name').eq('id', communityId).single();
    const { data: members } = await supabase.from('community_members').select('user_id').eq('community_id', communityId);

    if (!test || !members || members.length === 0) return;

    const notifications = members
      .filter(m => m.user_id !== test.teacher_id) // don't notify the teacher
      .map(m => ({
        user_id: m.user_id,
        type: 'info',
        title: 'New Assessment Assigned',
        message: `A new test "${test.title}" has been assigned to the ${community?.name || 'community'}.`,
        sender_id: test.teacher_id,
        link: '/tests'
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  },

  async getMyCommunities(userId: string) {
    const { data, error } = await supabase
      .from('community_members')
      .select('community_id, communities(name, avatar_url)')
      .eq('user_id', userId);
    if (error) throw error;
    return data.map((m: any) => ({
      id: m.community_id,
      name: m.communities.name,
      avatar_url: m.communities.avatar_url
    }));
  },

  async saveQuestions(testId: string, questions: Partial<Question>[]) {
    // Delete existing questions for this test
    const { error: deleteError } = await supabase.from('questions').delete().eq('test_id', testId);
    if (deleteError) throw deleteError;

    // Remove the temporary frontend ID if it's not a valid UUID, 
    // or just remove it entirely to let Supabase generate new ones.
    const formatted = questions.map((q, idx) => {
      const { id, ...rest } = q;
      return {
        ...rest,
        test_id: testId,
        order_index: idx,
      };
    });

    if (formatted.length === 0) return [];

    const { data, error } = await supabase
      .from('questions')
      .insert(formatted)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Check for an existing in-progress attempt for this test+student.
   * If the deadline has passed, auto-submits it and returns null.
   * Returns { attempt, timeRemaining } if still valid.
   */
  async checkExistingAttempt(
    testId: string,
    studentId: string
  ): Promise<{ attempt: any; timeRemaining: number } | null> {
    const { data, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (error || !data) return null;

    const { data: test } = await supabase
      .from('tests')
      .select('duration')
      .eq('id', testId)
      .single();

    if (!test) return null;

    const startedAt = new Date(data.started_at).getTime();
    const totalMs = test.duration * 60 * 1000;
    const elapsed = Date.now() - startedAt;

    if (elapsed >= totalMs) {
      // Time is up — auto-submit and return null
      await this.finishAttempt(data.id);
      return null;
    }

    // Use saved time_remaining as the source of truth; fall back to calculation
    const timeRemaining =
      data.time_remaining !== null && data.time_remaining !== undefined
        ? data.time_remaining
        : Math.max(0, Math.floor((totalMs - elapsed) / 1000));

    return { attempt: data, timeRemaining };
  },

  async startAttempt(testId: string, studentId: string) {
    const { data, error } = await supabase
      .from('test_attempts')
      .insert({
        test_id: testId,
        student_id: studentId,
        status: 'in_progress',
        tab_violations: 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async submitAnswer(attemptId: string, questionId: string, answer: any) {
    const { error } = await supabase.from('answers').upsert(
      { attempt_id: attemptId, question_id: questionId, answer },
      { onConflict: 'attempt_id, question_id' }
    );
    if (error) throw error;
  },

  /**
   * Heartbeat: persist current timer and all answers so the student can
   * resume on another device if disconnected.
   */
  async saveProgress(
    attemptId: string,
    timeRemaining: number,
    answers: { questionId: string; answer: any }[]
  ) {
    await supabase
      .from('test_attempts')
      .update({
        time_remaining: timeRemaining,
        last_heartbeat: new Date().toISOString(),
      })
      .eq('id', attemptId);

    if (answers.length > 0) {
      await supabase.from('answers').upsert(
        answers.map((a) => ({
          attempt_id: attemptId,
          question_id: a.questionId,
          answer: a.answer,
        })),
        { onConflict: 'attempt_id, question_id' }
      );
    }
  },

  /**
   * Record a tab-switch or fullscreen-exit violation.
   * Returns the updated violation count.
   */
  async recordViolation(attemptId: string, newCount: number): Promise<number> {
    const { data } = await supabase
      .from('test_attempts')
      .update({ tab_violations: newCount })
      .eq('id', attemptId)
      .select('tab_violations')
      .single();
    return data?.tab_violations ?? newCount;
  },

  async finishAttempt(attemptId: string) {
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*, tests(id, negative_marks, questions(*))')
      .eq('id', attemptId)
      .single();

    if (attemptError) throw attemptError;

    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('attempt_id', attemptId);

    if (answersError) throw answersError;

    const questions = (attempt.tests as any).questions as Question[];
    const test = attempt.tests as any;
    let totalScore = 0;

    const hasManualGrading = questions.some(
      (q) => q.question_type === 'short_answer' || q.question_type === 'long_answer'
    );

    const evaluations = (answers || []).map((ans) => {
      const q = questions.find((q) => q.id === ans.question_id);
      if (!q) return ans;

      let isCorrect = false;
      let marksAwarded = 0;

      if (q.question_type === 'mcq') {
        isCorrect = ans.answer === q.correct_answer;
      } else if (q.question_type === 'multi_select') {
        const studentAns = Array.isArray(ans.answer) ? (ans.answer as string[]) : [];
        const correctAns = Array.isArray(q.correct_answer) ? (q.correct_answer as string[]) : [];
        isCorrect =
          studentAns.length === correctAns.length &&
          studentAns.every((v) => correctAns.includes(v));
      }

      if (isCorrect) {
        marksAwarded = q.marks;
      } else if (q.question_type === 'mcq' || q.question_type === 'multi_select') {
        marksAwarded = -(test.negative_marks || 0);
      }

      totalScore += marksAwarded;
      return { ...ans, is_correct: isCorrect, marks_awarded: marksAwarded };
    });

    for (const eval_ans of evaluations) {
      await supabase
        .from('answers')
        .update({ is_correct: eval_ans.is_correct, marks_awarded: eval_ans.marks_awarded })
        .eq('id', eval_ans.id);
    }

    const { data, error } = await supabase
      .from('test_attempts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        score: totalScore,
        is_graded: !hasManualGrading,
        time_remaining: 0,
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAttemptResults(attemptId: string) {
    const { data, error } = await supabase
      .from('test_attempts')
      .select('*, tests(*, questions(*)), answers(*)')
      .eq('id', attemptId)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Get all students who submitted a test — for the teacher analytics view.
   */
  async getSubmittedStudents(testId: string): Promise<SubmittedStudent[]> {
    const { data: attempts, error } = await supabase
      .from('test_attempts')
      .select('id, student_id, score, is_graded, status, submitted_at, tab_violations')
      .eq('test_id', testId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    if (!attempts || attempts.length === 0) return [];

    const studentIds = attempts.map((a) => a.student_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('firebase_uid, full_name, avatar_url, email')
      .in('firebase_uid', studentIds);

    return attempts.map((attempt) => {
      const profile = profiles?.find((p) => p.firebase_uid === attempt.student_id);
      return {
        attempt_id: attempt.id,
        student_id: attempt.student_id,
        full_name: profile?.full_name || 'Unknown Student',
        avatar_url: profile?.avatar_url || null,
        email: profile?.email || '',
        score: attempt.score,
        is_graded: attempt.is_graded,
        submitted_at: attempt.submitted_at,
        tab_violations: attempt.tab_violations || 0,
      };
    });
  },

  async getTestAnalytics(testId: string) {
    const { data: attempts, error: attemptsError } = await supabase
      .from('test_attempts')
      .select('id, student_id, score, is_graded, status, submitted_at, tab_violations, started_at')
      .eq('test_id', testId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (attemptsError) throw attemptsError;

    // Fetch student profiles separately
    const studentIds = (attempts || []).map((a) => a.student_id);
    const { data: profiles } = studentIds.length > 0
      ? await supabase
          .from('profiles')
          .select('firebase_uid, full_name, avatar_url, email')
          .in('firebase_uid', studentIds)
      : { data: [] };

    const attemptsWithProfiles = (attempts || []).map((a) => ({
      ...a,
      profiles: profiles?.find((p) => p.firebase_uid === a.student_id) ?? null,
    }));

    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('question_id, is_correct')
      .in('attempt_id', (attempts || []).map((a) => a.id));

    if (answersError) throw answersError;

    const questionStats: Record<string, { correct: number; total: number }> = {};
    answers?.forEach((ans) => {
      if (!questionStats[ans.question_id]) {
        questionStats[ans.question_id] = { correct: 0, total: 0 };
      }
      questionStats[ans.question_id].total++;
      if (ans.is_correct) questionStats[ans.question_id].correct++;
    });

    return { attempts: attemptsWithProfiles, questionStats };
  },

  async gradeAttempt(
    attemptId: string,
    grades: { question_id: string; marks: number; is_correct: boolean }[]
  ) {
    for (const grade of grades) {
      await supabase
        .from('answers')
        .update({ marks_awarded: grade.marks, is_correct: grade.is_correct })
        .eq('attempt_id', attemptId)
        .eq('question_id', grade.question_id);
    }

    const { data: answers } = await supabase
      .from('answers')
      .select('marks_awarded')
      .eq('attempt_id', attemptId);

    const totalScore = (answers || []).reduce(
      (sum, ans) => sum + (ans.marks_awarded || 0),
      0
    );

    const { data, error } = await supabase
      .from('test_attempts')
      .update({ score: totalScore, is_graded: true })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async generateAiQuestions(content: string, count: number = 5) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Act as an expert educator. Generate ${count} high-quality multiple-choice questions based on the provided content:
"${content}"
Ensure the distractors (incorrect options) are plausible and address common misconceptions. Provide a clear, educational explanation for why the correct answer is right. Return strictly as a JSON array matching the established schema.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question_text: { type: Type.STRING },
              question_type: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                },
              },
              correct_answer: { type: Type.STRING },
              marks: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
            },
            required: ['question_text', 'question_type', 'options', 'correct_answer', 'marks'],
          },
        },
      },
    });

    try {
      return JSON.parse(response.text ?? '[]');
    } catch (e) {
      console.error('Failed to parse AI response', e);
      return [];
    }
  },
};
