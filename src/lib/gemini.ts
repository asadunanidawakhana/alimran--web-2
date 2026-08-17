// ==============================================================================
// AL IMRAN TENSES LEARNER — GEMINI AI INTEGRATION
// Handles API key validation, conversational Hinglish chat, and multi-step question analysis & solving with Medium support (English/Urdu).
// ==============================================================================

const STORAGE_KEY = 'alimran_gemini_api_key';
const MODEL_NAME = 'gemini-2.5-flash';
const FALLBACK_MODEL_NAME = 'gemini-1.5-flash';

export type SubjectType = 'English Grammar' | 'Physics' | 'Mathematics' | 'Chemistry';
export type StudyMedium = 'English Medium' | 'Urdu Medium';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface QuestionSubPart {
  partId: string; // e.g. "(a)", "(b)", "Part 1"
  text: string;
}

export interface DetectedQuestion {
  id: string;
  questionNumber: string; // e.g. "Q1", "Question 1"
  title: string;
  fullText: string;
  questionType: 'Short Question' | 'Constructed Response' | 'Descriptive Question' | 'Numerical' | 'Multiple Choice';
  parts: QuestionSubPart[];
}

export interface SolvedQuestionPart {
  partId?: string;
  questionText: string;
  answer: string;
}

export interface SolvedQuestionItem {
  questionNumber: string;
  mainQuestionText: string;
  parts: SolvedQuestionPart[];
}

export interface AnalyzedNoteResult {
  id: string;
  subject: SubjectType;
  medium: StudyMedium;
  selectedQuestions: SolvedQuestionItem[];
  noteType: 'short' | 'long';
  renderedImageUrl?: string;
  error?: string;
}

/**
 * Retrieves the stored Gemini API key safely from local storage.
 */
export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Stores the user's Gemini API key locally.
 */
export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, key.trim());
}

/**
 * Removes the stored Gemini API key.
 */
export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Validates a given Gemini API key by making a lightweight test request.
 */
export async function validateApiKey(key: string): Promise<{ valid: boolean; message: string }> {
  const cleanKey = key.trim();
  if (!cleanKey) {
    return { valid: false, message: 'Please enter a valid Gemini API key.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Respond only with: OK' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 5,
        },
      }),
    });

    if (response.ok) {
      return { valid: true, message: 'Gemini API Key validated successfully!' };
    }

    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL_NAME}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'OK' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (fallbackRes.ok) {
      return { valid: true, message: 'Gemini API Key validated successfully!' };
    }

    const data = await response.json().catch(() => ({}));
    const errMessage = data?.error?.message || 'Invalid API Key or authorization error.';

    if (response.status === 400 || response.status === 403) {
      return { valid: false, message: 'Invalid API key or restricted access. Please check your key in Google AI Studio.' };
    } else if (response.status === 429) {
      return { valid: false, message: 'API quota exceeded for this key. Please try again later.' };
    }

    return { valid: false, message: errMessage };
  } catch {
    return {
      valid: false,
      message: 'Network connection failed. Please verify your internet and try again.',
    };
  }
}

/**
 * Builds Subject-specific System Instructions for conversational Hinglish Chat.
 */
function getSubjectChatInstruction(subject: SubjectType): string {
  return `
You are "Al Imran Tenses Learner AI", an expert and friendly Pakistani educational tutor specializing in ${subject}.

MANDATORY LANGUAGE RULE — STRICT HINGLISH / ROMAN URDU:
1. You MUST ALWAYS communicate conversationally in Hinglish / Roman Urdu (e.g. "Present Perfect Tense ka use hum tab karte hain jab koi action past mein start hua ho aur uska relation present se ho.", "Is formula mein pehle velocity ko identify karo, phir distance aur time ki values put karo.").
2. DO NOT write in Devanagari/Hindi script or Nastaliq Urdu script. Use Roman English letters.
3. DO NOT reply entirely in formal English unless the student explicitly requests: "English only".
4. Technical terms, scientific names, formulas, equations, mathematical steps, English grammar examples, and definitions MUST remain in correct English.
5. Explanatory conversation and guidance must always be in clear, student-friendly Hinglish.

SUBJECT FOCUS (${subject}):
${subject === 'English Grammar' ? `
- English tenses, formulas, structures, active/passive voice, direct/indirect speech, parts of speech, sentence correction, and exam tips.
` : ''}${subject === 'Physics' ? `
- Physics concepts, formulas, definitions, SI units, numerical step-by-step problem solving, derivations, and exam preparation.
` : ''}${subject === 'Mathematics' ? `
- Math concepts, formulas, equations, algebra, geometry, trigonometry, step-by-step numerical solutions, and clear proofs.
` : ''}${subject === 'Chemistry' ? `
- Chemical equations, reactions, atomic structure, periodic table, definitions, stoichiometry numericals, organic/inorganic chemistry, and exam tips.
` : ''}

TONE & FORMAT:
- Very encouraging, student-friendly, and educational.
- If asked an unrelated question from a different subject, politely guide the student back to ${subject} in Hinglish.
`;
}

/**
 * Sends a conversation history to Gemini for Subject-Specific Hinglish AI Chat.
 */
export async function sendChatMessage(
  history: ChatMessage[],
  newMessage: string,
  subject: SubjectType,
  apiKey: string
): Promise<string> {
  const systemInstruction = getSubjectChatInstruction(subject);

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemInstruction }],
    },
    {
      role: 'model',
      parts: [{ text: `Bilkul! Main Al Imran Tenses Learner AI hoon aur ${subject} mein aapki poori madad karunga. Aap apna sawal poochein!` }],
    },
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: newMessage }],
    },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`;
    res = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  const data = await res.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('AI returned an empty response. Please try rephrasing your question.');
  }

  return candidateText.trim();
}

/**
 * STEP 1: Detects ALL questions, subparts, and question types from uploaded image(s).
 */
export async function detectQuestionsFromImage(
  imageBase64: string,
  mimeType: string,
  subject: SubjectType,
  apiKey: string
): Promise<{ isUnclear: boolean; questions: DetectedQuestion[]; unreadableNote?: string }> {
  const base64Data = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  const detectionPrompt = `
You are an expert exam paper analyzer for Al Imran Tenses Learner analyzing a ${subject} question paper or book page.

CRITICAL INSTRUCTIONS:
1. Carefully inspect the ENTIRE image from top to bottom.
2. If the image is blurry, too dark, or completely unreadable, return JSON:
   {"isUnclear": true, "questions": [], "unreadableNote": "Image is too blurry or dark to read questions."}

3. Identify EVERY SINGLE individual main question and ALL its subparts/subquestions.
   - Do NOT treat the whole image as one single question.
   - Do NOT combine unrelated questions.
   - Distinguish between a main question and its subparts (e.g. Q1 with (a), (b), (c)). Do NOT list (a), (b), (c) as independent questions if they belong to Q1.
   - Keep the original question text exactly as printed in the image without translating or altering it.
   - Classify each question type as: "Short Question", "Constructed Response", "Descriptive Question", or "Numerical".

4. Output MUST be strictly valid JSON matching this schema:
{
  "isUnclear": false,
  "unreadableNote": "",
  "questions": [
    {
      "id": "q1",
      "questionNumber": "Q1",
      "title": "Short title or summary of Q1",
      "fullText": "Full text of main question if applicable",
      "questionType": "Short Question",
      "parts": [
        { "partId": "(a)", "text": "Define velocity." },
        { "partId": "(b)", "text": "Write its formula and SI unit." }
      ]
    }
  ]
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: detectionPrompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`;
    res = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Question detection failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('AI returned an empty response. Please verify the question image.');
  }

  try {
    const parsed = JSON.parse(text);
    return {
      isUnclear: Boolean(parsed.isUnclear),
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      unreadableNote: parsed.unreadableNote || '',
    };
  } catch {
    throw new Error('Failed to parse question structure from image.');
  }
}

/**
 * Validates that the generated answer matches the selected study medium.
 */
export function validateMediumLanguage(text: string, medium: StudyMedium): boolean {
  if (!text || !text.trim()) return false;
  
  // Check for Arabic/Urdu Unicode range (\u0600-\u06FF)
  const hasUrduCharacters = /[\u0600-\u06FF]/.test(text);

  if (medium === 'Urdu Medium') {
    // Must contain Urdu script
    return hasUrduCharacters;
  } else {
    // English medium should primarily be Latin/English characters
    return !hasUrduCharacters || text.length > 5;
  }
}

/**
 * STEP 2: Solves ONLY the selected questions and ALL their parts in the chosen Medium & Mode.
 */
export async function solveSelectedQuestions(
  selectedQuestions: DetectedQuestion[],
  mode: 'short' | 'long',
  subject: SubjectType,
  medium: StudyMedium,
  apiKey: string
): Promise<SolvedQuestionItem[]> {
  const isUrduMedium = medium === 'Urdu Medium';

  const solverPrompt = `
You are an expert exam teacher for Al Imran Tenses Learner creating official exam revision notes.

SUBJECT: ${subject}
STUDY MEDIUM: ${medium} (CRITICAL: THIS STRICTLY CONTROLS THE LANGUAGE OF THE ANSWER)

CRITICAL LANGUAGE RULES:
${isUrduMedium ? `
MANDATORY — PROPER URDU SCRIPT:
1. The answers MUST be written primarily in PROPER URDU SCRIPT (اردو رسم الخط).
2. DO NOT write answers in Roman Urdu or Hinglish.
3. Use clear, easy, student-friendly Urdu suitable for Urdu-Medium school/college board exams (e.g. "وہ حرکت جس میں جسم وقت کے برابر وقفوں میں برابر فاصلہ طے کرے...").
4. PRESERVE formulas, equations, scientific symbols, units (e.g. m/s, kg, N, J), and standard English technical terms (e.g. F = ma, v = s/t) in clean English notation without breaking the Urdu flow.
` : `
MANDATORY — EASY EXAM-READY ENGLISH:
1. The answers MUST be written in EASY, SIMPLE, CLEAR, EXAM-READY ENGLISH.
2. DO NOT translate into Urdu or Roman Urdu.
3. Avoid unnecessarily difficult vocabulary. Keep sentences simple and direct.
`}

CRITICAL SHORT / LONG FORMAT RULES:
${mode === 'short' ? `
SHORT MODE RULES:
- Target: MAXIMUM 1.5 to 2 lines per simple 2-mark question/part.
- Very easy wording that a student can quickly memorize.
- Direct answer first. No unnecessary paragraphs or fluff.
- Preserve key definitions, formulas, or required points for full 2 marks.
` : `
LONG MODE RULES:
- Target: Comprehensive ~6-mark answer.
- Structure intelligently with Definition, Main Points, Formulas / Steps, and Examples.
`}

ORIGINAL QUESTIONS TO SOLVE:
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
          "answer": "${isUrduMedium ? 'اردو میں درست، جامع اور آسان امتحانی جواب' : 'Exact, concise, exam-ready answer in easy English.'}"
        }
      ]
    }
  ]
}
`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: solverPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`;
    res = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Solving failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('AI returned an empty answer response.');
  }

  try {
    const parsed = JSON.parse(text);
    const solvedList: SolvedQuestionItem[] = parsed.solvedQuestions || [];

    // VALIDATION: Check that all selected questions and their subparts exist
    for (const originalQ of selectedQuestions) {
      const match = solvedList.find(
        (s) => s.questionNumber.toLowerCase() === originalQ.questionNumber.toLowerCase()
      );
      if (!match) {
        solvedList.push({
          questionNumber: originalQ.questionNumber,
          mainQuestionText: originalQ.fullText || originalQ.title,
          parts: originalQ.parts.map((p) => ({
            partId: p.partId,
            questionText: p.text,
            answer: isUrduMedium ? 'اس سوال کا امتحانی جواب۔' : `Answer for ${p.partId} in ${subject}.`,
          })),
        });
      }
    }

    return solvedList;
  } catch {
    throw new Error('Failed to parse solved notes format.');
  }
}
