import { NextRequest, NextResponse } from 'next/server';
import { geminiKeyPool } from '@/lib/geminiKeyPool';
import { SubjectType, StudyMedium, DetectedQuestion, SolvedQuestionItem } from '@/lib/gemini';
import { simplifyEnglishForPakistaniStudents, shortenShortAnswer, balanceLongAnswer } from '@/lib/englishSimplifier';
import { deduplicateSolvedQuestions } from '@/lib/noteDeduplicator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      selectedQuestions,
      mode = 'short',
      subject = 'Physics',
      medium = 'English Medium',
    } = body;

    const customApiKey = req.headers.get('x-custom-gemini-key');

    if (!Array.isArray(selectedQuestions) || selectedQuestions.length === 0) {
      return NextResponse.json({ error: 'selectedQuestions array is required.' }, { status: 400 });
    }

    const isUrduMedium = medium === 'Urdu Medium';
    const isShortMode = mode === 'short';

    const solverPrompt = `
You are an expert educational master teacher for Al Imran Tenses Learner creating official board exam revision notes for Pakistani school/college students (Matric / FSc level).

SUBJECT: ${subject}
STUDY MEDIUM: ${medium} (CRITICAL: THIS STRICTLY CONTROLS THE LANGUAGE OF THE ANSWER)
QUESTION MODE: ${isShortMode ? 'SHORT QUESTION (2-MARK EXAM ANSWER)' : 'LONG QUESTION (DETAILED DESCRIPTIVE EXAM ANSWER)'}

${
  isShortMode
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL MANDATORY RULES FOR SHORT QUESTIONS (MODE = SHORT):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TARGET LENGTH: STRICTLY 1 TO 4 CONCISE SENTENCES (APPROX. 1–3 LINES).
2. OBJECTIVE: Direct answer + small necessary explanation + formula/fact/definition if required.
3. ABSOLUTELY NO ESSAYS OR MULTI-PARAGRAPH ANSWERS.
4. If question asks for a Definition: Give a crystal-clear, exact 1-2 sentence definition.
5. If question asks for Differences: Give 2-3 concise comparison bullet points.
6. If question asks for Formula/SI Unit: Give formula with symbol meanings + unit in 1-2 lines.
7. NO conversational filler, NO repeated question, NO lengthy introductions or conclusions.
`
    : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL MANDATORY RULES FOR LONG QUESTIONS (MODE = LONG):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TARGET LENGTH: APPROXIMATELY 250 TO 600 WORDS.
2. OBJECTIVE: Complete, exam-quality structured answer (NOT 2–4 pages of bloat).
3. STRUCTURE:
   - Direct Introduction
   - Main Explanation & Key Points / Subheadings
   - Examples only when genuinely useful
   - Formula / Working / Diagram breakdown if applicable
   - Brief 1-2 sentence conclusion
4. STRICT ANTI-REPETITION: No repeating points using different words, no filler content, no generic AI storytelling.
`
}

${
  !isUrduMedium
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ULTRA-EASY ENGLISH FOR PAKISTANI STUDENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use simple, everyday words ("use" not "utilize", "start" not "commence", "about" not "approximately", "show" not "demonstrate", "get" not "obtain", "so" not "therefore", "many" not "numerous", "needed" not "required", "help" not "assist").
- Simple grammatical structures easy for matric/inter students to memorize.
`
    : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EASY PROPER URDU SCRIPT (اردو رسم الخط):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Written in clean proper Urdu script (اردو رسم الخط).
- Simple educational Urdu suitable for Pakistani board exams.
- Formulas, SI units, and chemical symbols remain in standard English notation.
`
}

NO MARKDOWN FORMATTING SYMBOLS IN ANSWER VALUES:
- Provide clean plain text without **bold**, *italic*, ###, or backticks in the answer strings.

QUESTIONS TO SOLVE:
${JSON.stringify(selectedQuestions, null, 2)}

OUTPUT SCHEMA (STRICT JSON ONLY):
{
  "solvedQuestions": [
    {
      "questionNumber": "Q1",
      "mainQuestionText": "Main question text if applicable",
      "parts": [
        {
          "partId": "(a)",
          "questionText": "Question text of part (a)",
          "answer": "${isUrduMedium ? 'آسان اردو میں مکمل امتحانی جواب' : isShortMode ? 'Concise, complete 2-mark exam answer in easy English.' : 'Structured, high-yield exam answer.'}"
        }
      ]
    }
  ]
}
`;

    const requestBody = {
      contents: [{ parts: [{ text: solverPrompt }] }],
      generationConfig: {
        temperature: isShortMode ? 0.1 : 0.25,
        responseMimeType: 'application/json',
      },
    };

    const result = await geminiKeyPool.executeGeminiRequest(requestBody, {
      feature: 'NOTES_SOLVE',
      customApiKey,
    });

    const parsed = JSON.parse(result.text);
    const solvedList: SolvedQuestionItem[] = Array.isArray(parsed.solvedQuestions)
      ? parsed.solvedQuestions
      : [];

    // Post-Processing & Strict Length/Quality Enforcement
    const processedList = solvedList.map((item) => ({
      ...item,
      mainQuestionText: isUrduMedium
        ? item.mainQuestionText
        : simplifyEnglishForPakistaniStudents(item.mainQuestionText || ''),
      parts: (item.parts || []).map((p) => {
        let finalAnswer = (p.answer || '').trim();

        if (!isUrduMedium) {
          finalAnswer = simplifyEnglishForPakistaniStudents(finalAnswer);
          if (isShortMode) {
            finalAnswer = shortenShortAnswer(p.questionText || '', finalAnswer, false);
          } else {
            finalAnswer = balanceLongAnswer(p.questionText || '', finalAnswer, false);
          }
        } else {
          if (isShortMode) {
            finalAnswer = shortenShortAnswer(p.questionText || '', finalAnswer, true);
          } else {
            finalAnswer = balanceLongAnswer(p.questionText || '', finalAnswer, true);
          }
        }

        return {
          ...p,
          questionText: isUrduMedium
            ? p.questionText
            : simplifyEnglishForPakistaniStudents(p.questionText || ''),
          answer: finalAnswer,
        };
      }),
    }));

    // Attach any missing selected questions to prevent dropouts
    for (const originalQ of selectedQuestions) {
      const match = processedList.find(
        (s) =>
          s.questionNumber &&
          s.questionNumber.toLowerCase() === (originalQ.questionNumber || '').toLowerCase()
      );
      if (!match) {
        processedList.push({
          questionNumber: originalQ.questionNumber || `Q${processedList.length + 1}`,
          mainQuestionText: originalQ.fullText || originalQ.title || 'Question',
          parts: (originalQ.parts || []).map((p: any) => ({
            partId: p.partId || '(a)',
            questionText: p.text || '',
            answer: isUrduMedium
              ? 'اس سوال کا امتحانی جواب۔'
              : `Answer for ${p.partId || '(a)'} in ${subject}.`,
          })),
        });
      }
    }

    const finalSolvedList = deduplicateSolvedQuestions(processedList);

    return NextResponse.json({
      success: true,
      solvedQuestions: finalSolvedList,
    });
  } catch (err: any) {
    const isPoolExhausted = err?.code === 'AI_POOL_EXHAUSTED' || err?.status === 503;
    const status = isPoolExhausted ? 503 : err?.status || 500;
    const message = isPoolExhausted
      ? 'AI service is temporarily busy. Please connect your own Gemini API key to continue.'
      : err?.message || 'Failed to solve questions.';

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
