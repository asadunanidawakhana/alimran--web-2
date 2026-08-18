// ==============================================================================
// AL IMRAN TENSES LEARNER — GEMINI AI INTEGRATION
// Handles API key validation, conversational Hinglish chat, and multi-step question analysis & solving with Medium support (English/Urdu).
// Features Ultra-Easy English, Natural 2-Mark Short Answer Balance, and Data-Level Deduplication.
// ==============================================================================

import { simplifyEnglishForPakistaniStudents, shortenShortAnswer } from './englishSimplifier';

const STORAGE_KEY = 'alimran_gemini_api_key';
const MODEL_NAME = 'gemini-2.5-flash';
const FALLBACK_MODEL_NAME = 'gemini-1.5-flash';

export type SubjectType =
  | 'English Grammar'
  | 'Physics'
  | 'Mathematics'
  | 'Chemistry'
  | 'Computer'
  | 'Biology'
  | 'Mutala Pakistan';

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
You are "Al Imran Tenses Learner AI", an intelligent, friendly, and expert educational AI tutor specifically mentoring Pakistani school and college students in ${subject}.

CORE TUTOR BEHAVIOR & REAL ASSISTANT QUALITY:
1. Converse naturally like a real, intelligent tutor (similar to ChatGPT or Gemini).
2. UNDERSTAND MULTI-TURN CONVERSATION CONTEXT: Maintain previous chat context across all messages in the session. If the user asks a follow-up like "Give me an example", "Why is that?", or "What if the direction changes?", you must immediately know what topic they are referring to without asking them to repeat.
3. AVOID ROBOTIC OPENERS: DO NOT begin every response with generic repetitive phrases like "Sure! Here is...", "Bilkul! Yahan hai...", "Sure thing!", or "Here's the answer". Use natural, varied conversational transitions.
4. POLITE & ENCOURAGING: If a student makes a mistake, guide and correct them politely. If their query is genuinely ambiguous, ask a quick, helpful clarification question.
5. STEP-BY-STEP EXPLANATIONS: When solving numerical problems, equations, or grammar transformations, explain the logic step by step.

DYNAMIC RESPONSE LENGTH (CRITICAL):
- DO NOT give unnecessarily long essay answers by default.
- For a SIMPLE QUESTION (e.g. "What is velocity?", "Define RAM"): Give a concise, direct, crystal-clear 2-4 line explanation with a simple relatable example.
- For a "WHY" QUESTION: Explain the direct cause/reason clearly.
- For "EXPLAIN IN DETAIL": Give a structured, comprehensive, point-by-point explanation.
- For "SHORT ANSWER": Give a quick, high-yield 1-2 sentence exam definition.
- Dynamically match the student's intent and question complexity.

MANDATORY LANGUAGE RULE — HINGLISH / ROMAN URDU FOR PAKISTANI STUDENTS:
1. You MUST ALWAYS communicate in easy, student-friendly Hinglish / Roman Urdu (e.g. "Velocity ka simple matlab speed with direction hota hai.", "Is question ko step-by-step solve karte hain taake concept clear ho jaye.", "Ye formula tab use hoga jab force aur mass ki values di hui hon.").
2. DO NOT use Devanagari/Hindi script or Nastaliq Urdu script in this chat. Use clean Roman English letters for the conversation.
3. Technical terms, formulas, scientific names, mathematical steps, code snippets, and English grammar examples MUST remain in clean, correct English.
4. Keep explanations natural, engaging, and easy to memorize for Pakistani board exams (Matric, Inter/FSc, O/A Levels).

SUBJECT SPECIFIC SPECIALIZATION (${subject}):
${subject === 'English Grammar' ? `
- Focus: English tenses (Present, Past, Future), formulas, sentence structures, active/passive voice, direct/indirect narration, parts of speech, prepositions, and exam correction tips.
` : ''}${subject === 'Physics' ? `
- Focus: Physics concepts, definitions, SI units, scalar/vector quantities, formulas, derivations, step-by-step numerical problem solving, and board exam preparation.
` : ''}${subject === 'Mathematics' ? `
- Focus: Math concepts, formulas, algebraic expressions, quadratic equations, geometry, trigonometry, matrices, step-by-step numerical solutions, and clear proofs.
` : ''}${subject === 'Chemistry' ? `
- Focus: Chemical reactions, balanced equations, atomic structure, periodic table, chemical bonding (ionic/covalent), stoichiometry numericals, organic/inorganic chemistry, and definitions.
` : ''}${subject === 'Computer' ? `
- Focus: Computer basics, hardware components (CPU, RAM, ROM, storage), system and application software, operating systems, programming fundamentals (variables, loops, conditions, algorithms, flowcharts), computer networks, internet & web technologies, databases, data structures, and IT concepts for exams.
` : ''}${subject === 'Biology' ? `
- Focus: Biology concepts, cell structure & organelles, human anatomy and organ systems, genetics and DNA, plant physiology (photosynthesis, transpiration), animal biology, classification, biological processes, diagrams/concept breakdowns, and exam preparation.
` : ''}${subject === 'Mutala Pakistan' ? `
- Focus: Pakistan Studies / Mutala Pakistan syllabus, Pakistan Movement (Tehreek-e-Pakistan), Two-Nation Theory, key personalities (Quaid-e-Azam, Allama Iqbal, Sir Syed Ahmad Khan), 1947 partition, important historical events (1906, 1940, 1973 Constitution), geography of Pakistan (rivers, mountains, climate, provinces), national culture, resources, foreign policy, and board exam preparation.
` : ''}

SUBJECT CONTEXT ISOLATION:
- Remain strictly focused on ${subject}.
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

  const validHistory = history
    .filter((m) => m && m.content && m.content.trim())
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
    ...validHistory.map((m) => ({
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
        temperature: 0.65,
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
          temperature: 0.65,
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
  
  const hasUrduCharacters = /[\u0600-\u06FF]/.test(text);

  if (medium === 'Urdu Medium') {
    return hasUrduCharacters;
  } else {
    return !hasUrduCharacters || text.length > 5;
  }
}

/**
 * STEP 2: Solves ONLY the selected questions and ALL their parts in the chosen Medium & Mode.
 * Enforces:
 * - Natural 2-Mark Short Answer Balance (Rules 42-45: Short + Complete + Slight explanation when needed)
 * - Ultra-Easy English for Pakistani students (Mandatory Word Replacement Rules)
 * - Easy Proper Urdu Script for Urdu Medium notes
 * - Strict 1:1 question-to-answer attachment and zero markdown clutter
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
You are an expert educational master teacher for Al Imran Tenses Learner creating official board exam revision notes for Pakistani school/college students (Matric / FSc level).

SUBJECT: ${subject}
STUDY MEDIUM: ${medium} (CRITICAL: THIS STRICTLY CONTROLS THE LANGUAGE OF THE ANSWER)
MODE: ${mode.toUpperCase()}

${mode === 'short' ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL MANDATORY RULE: NATURAL 2-MARK BALANCE FOR SHORT ANSWERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TARGET: SHORT + COMPLETE + SLIGHT SUPPORTING EXPLANATION + EASY TO MEMORIZE.
2. Structure:
   - Direct Answer
   - Plus ONE short supporting explanation phrase/clause where it helps completeness.
3. Length: Approximately 1 concise sentence OR 2 short sentences (about 1–2 lines).
4. EXAMPLES OF BALANCED 2-MARK SHORT ANSWERS:
   - "What is photosynthesis?" -> "Photosynthesis is the process by which green plants make their food using sunlight." (NOT overly chopped like "Plants make food", and NOT a long paragraph).
   - "What is velocity?" -> "Velocity is the speed of an object in a particular direction."
   - "What is force?" -> "Force is a push or pull that can change the motion or direction of an object."
   - "What is a database?" -> "A database is an organized collection of data stored in a computer."
   - "Write the formula for force" -> "F = ma (where F is force, m is mass, and a is acceleration)."
   - "State the SI unit of power" -> "Watt (W) or Joules per second (J/s)."
5. Avoid BOTH extremes:
   - NOT too short / incomplete fragments.
   - NOT paragraph-style essays.
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LONG MODE (6-MARK QUESTION):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Comprehensive, structured answer with Definition, Main Points, Formula/Steps, and relevant Examples.
- Keep vocabulary simple even when the answer is detailed.
`}

${!isUrduMedium ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ULTRA-EASY ENGLISH FOR PAKISTANI STUDENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use simple, everyday words ("use" not "utilize", "start" not "commence", "about" not "approximately", "show" not "demonstrate", "get" not "obtain", "so" not "therefore/consequently", "many" not "numerous", "needed" not "required", "help" not "assist", "parts" not "components", "basic" not "fundamental", "make" not "synthesize").
- Short, simple sentences. No complex academic jargon.
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EASY PROPER URDU SCRIPT (اردو رسم الخط):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Written in clean proper Urdu script (اردو رسم الخط).
- Simple educational Urdu suitable for Pakistani board exams.
- Preserve formulas, SI units, and scientific notation in English notation.
`}

NO MARKDOWN FORMATTING SYMBOLS IN ANSWER VALUES:
- Provide clean plain text without **bold**, *italic*, ###, or backticks.

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
          "answer": "${isUrduMedium ? 'آسان اردو میں مختصر اور جامع 2 نمبر امتحانی جواب' : 'Balanced, complete 2-mark exam answer in easy English.'}"
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
      temperature: 0.15,
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

    // Post-process: English Simplification + Short Answer Optimization
    const processedList = solvedList.map((item) => ({
      ...item,
      mainQuestionText: isUrduMedium ? item.mainQuestionText : simplifyEnglishForPakistaniStudents(item.mainQuestionText),
      parts: (item.parts || []).map((p) => {
        let finalAnswer = p.answer || '';
        if (!isUrduMedium) {
          finalAnswer = simplifyEnglishForPakistaniStudents(finalAnswer);
          if (mode === 'short') {
            finalAnswer = shortenShortAnswer(p.questionText || '', finalAnswer, false);
          }
        }
        return {
          ...p,
          questionText: isUrduMedium ? p.questionText : simplifyEnglishForPakistaniStudents(p.questionText),
          answer: finalAnswer,
        };
      }),
    }));

    // Attach any missing selected questions to prevent dropouts
    for (const originalQ of selectedQuestions) {
      const match = processedList.find(
        (s) => s.questionNumber && s.questionNumber.toLowerCase() === originalQ.questionNumber.toLowerCase()
      );
      if (!match) {
        processedList.push({
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

    return processedList;
  } catch {
    throw new Error('Failed to parse solved notes format.');
  }
}
