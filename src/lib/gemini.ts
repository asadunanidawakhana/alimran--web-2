// ==============================================================================
// AL IMRAN TENSES LEARNER — GEMINI AI CLIENT ADAPTER
// Routes all Chat, Image Detection, and Notes Solving through the secure Backend Key Pool.
// Personal API key is optional and only used as a fallback if the managed pool is busy.
// ==============================================================================

import { simplifyEnglishForPakistaniStudents, shortenShortAnswer, balanceLongAnswer } from './englishSimplifier';

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
 * Retrieves the stored personal Gemini API key safely from local storage (if any).
 */
export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Stores the user's personal Gemini API key locally.
 */
export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, key.trim());
}

/**
 * Removes the stored personal Gemini API key.
 */
export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks if the user has an active connection (either custom key or managed pool).
 */
export function hasCustomApiKey(): boolean {
  const k = getStoredApiKey();
  return Boolean(k && k.trim().length > 10);
}

/**
 * Validates a given personal Gemini API key by making a lightweight test request.
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
        contents: [{ parts: [{ text: 'OK' }] }],
        generationConfig: { maxOutputTokens: 5 },
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
 * Sends a conversation history to backend Gemini API for Subject-Specific Hinglish AI Chat.
 * Utilizes the server-side Gemini Key Pool with automatic failover.
 */
export async function sendChatMessage(
  history: ChatMessage[],
  newMessage: string,
  subject: SubjectType,
  optionalApiKey?: string | null
): Promise<string> {
  const customKey = optionalApiKey || getStoredApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey) {
    headers['x-custom-gemini-key'] = customKey;
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      history,
      message: newMessage,
      subject,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || 'AI service request failed.');
    error.code = data.error || 'AI_ERROR';
    error.status = response.status;
    throw error;
  }

  return data.reply;
}

/**
 * STEP 1: Detects ALL questions, subparts, and question types from uploaded image(s).
 * Utilizes the server-side Gemini Key Pool with automatic failover.
 */
export async function detectQuestionsFromImage(
  imageBase64: string,
  mimeType: string,
  subject: SubjectType,
  optionalApiKey?: string | null
): Promise<{ isUnclear: boolean; questions: DetectedQuestion[]; unreadableNote?: string }> {
  const customKey = optionalApiKey || getStoredApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey) {
    headers['x-custom-gemini-key'] = customKey;
  }

  const response = await fetch('/api/ai/detect', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      imageBase64,
      mimeType,
      subject,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || 'Failed to detect questions from image.');
    error.code = data.error || 'AI_ERROR';
    error.status = response.status;
    throw error;
  }

  return {
    isUnclear: Boolean(data.isUnclear),
    questions: Array.isArray(data.questions) ? data.questions : [],
    unreadableNote: data.unreadableNote || '',
  };
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
 * STEP 2: Solves selected questions and ALL parts in the chosen Medium & Mode.
 * Enforces strict Short (1-4 sentences) and Long (250-600 words) length control.
 * Utilizes the server-side Gemini Key Pool with automatic failover.
 */
export async function solveSelectedQuestions(
  selectedQuestions: DetectedQuestion[],
  mode: 'short' | 'long',
  subject: SubjectType,
  medium: StudyMedium,
  optionalApiKey?: string | null
): Promise<SolvedQuestionItem[]> {
  const customKey = optionalApiKey || getStoredApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey) {
    headers['x-custom-gemini-key'] = customKey;
  }

  const response = await fetch('/api/ai/solve', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      selectedQuestions,
      mode,
      subject,
      medium,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || 'Failed to generate solved notes.');
    error.code = data.error || 'AI_ERROR';
    error.status = response.status;
    throw error;
  }

  return Array.isArray(data.solvedQuestions) ? data.solvedQuestions : [];
}
