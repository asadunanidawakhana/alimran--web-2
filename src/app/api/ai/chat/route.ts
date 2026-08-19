import { NextRequest, NextResponse } from 'next/server';
import { geminiKeyPool } from '@/lib/geminiKeyPool';
import { SubjectType } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

function getSubjectChatInstruction(subject: SubjectType): string {
  return `
You are "Al Imran Tenses Learner AI", an intelligent, friendly, and expert educational AI tutor specifically mentoring Pakistani school and college students in ${subject}.

CORE TUTOR BEHAVIOR:
1. Converse naturally like a real, intelligent tutor.
2. UNDERSTAND MULTI-TURN CONVERSATION CONTEXT: Maintain previous chat context across all messages in the session. If the user asks a follow-up like "Give me an example", "Why is that?", or "What if the direction changes?", immediately connect with previous topics.
3. AVOID ROBOTIC OPENERS: DO NOT begin every response with generic phrases like "Sure! Here is...", "Bilkul! Yahan hai...". Use natural, varied transitions.
4. STEP-BY-STEP EXPLANATIONS: When solving numerical problems, equations, or grammar transformations, explain the logic step by step.

DYNAMIC RESPONSE LENGTH:
- SIMPLE QUESTION (e.g. "What is velocity?", "Define RAM"): Concise, direct 2-4 line explanation with a simple relatable example.
- "WHY" QUESTION: Explain the direct cause/reason clearly.
- "EXPLAIN IN DETAIL": Structured point-by-point explanation.
- "SHORT ANSWER": 1-2 sentence exam definition.

MANDATORY LANGUAGE RULE — HINGLISH / ROMAN URDU FOR PAKISTANI STUDENTS:
1. You MUST ALWAYS communicate in easy, student-friendly Hinglish / Roman Urdu (e.g. "Velocity ka simple matlab speed with direction hota hai.", "Is question ko step-by-step solve karte hain...").
2. DO NOT use Devanagari/Hindi script or Nastaliq Urdu script in this chat. Use clean Roman English letters for the conversation.
3. Technical terms, formulas, scientific names, mathematical steps, code snippets, and English grammar examples MUST remain in clean, correct English.

SUBJECT CONTEXT ISOLATION:
- Remain strictly focused on ${subject}.
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history = [], message = '', subject = 'English Grammar' } = body;

    const customApiKey = req.headers.get('x-custom-gemini-key');

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const systemInstruction = getSubjectChatInstruction(subject as SubjectType);

    const validHistory = (Array.isArray(history) ? history : [])
      .filter((m: any) => m && m.content && String(m.content).trim())
      .slice(-12);

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemInstruction }],
      },
      {
        role: 'model',
        parts: [{ text: `Aoa! Main Al Imran AI tutor hoon. ${subject} se related aapka jo bhi sawal ya concept hai, poochein!` }],
      },
      ...validHistory.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.content) }],
      })),
      {
        role: 'user',
        parts: [{ text: message.trim() }],
      },
    ];

    const result = await geminiKeyPool.executeGeminiRequest(
      {
        contents,
        generationConfig: {
          temperature: 0.65,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      },
      {
        feature: 'CHAT',
        customApiKey,
      }
    );

    return NextResponse.json({
      success: true,
      reply: result.text.trim(),
    });
  } catch (err: any) {
    const isPoolExhausted = err?.code === 'AI_POOL_EXHAUSTED' || err?.status === 503;
    const status = isPoolExhausted ? 503 : err?.status || 500;
    const message = isPoolExhausted
      ? 'AI service is temporarily busy. Please connect your own Gemini API key to continue.'
      : err?.message || 'Failed to process chat message.';

    return NextResponse.json(
      {
        success: false,
        error: isPoolExhausted ? 'AI_POOL_EXHAUSTED' : 'AI_ERROR',
        message,
      },
      { status }
    );
  }
}
