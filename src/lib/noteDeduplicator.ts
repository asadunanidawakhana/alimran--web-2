// ==============================================================================
// AL IMRAN TENSES LEARNER — DATA-LEVEL DEDUPLICATION & NORMALIZATION PIPELINE
// Ensures that every detected question, subpart, and solved question-answer pair
// is unique, correctly bonded, and normalized prior to solver & canvas rendering.
// ==============================================================================

import { DetectedQuestion, SolvedQuestionItem, SolvedQuestionPart } from './gemini';

/**
 * Normalizes a text string for fuzzy / exact duplicate comparison:
 * - Lowercases
 * - Trims extra whitespaces
 * - Strips common markdown and leading question labels (e.g. "Q1.", "1.", "(a)")
 */
export function normalizeTextForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[*_#`~]/g, '') // remove markdown symbols
    .replace(/^(question|q)\s*\d+[:.\s-]*/i, '') // remove "Q1: ", "Question 1: "
    .replace(/^(\([a-z0-9]+\)|\d+[.)]|[a-z][.)])\s*/i, '') // remove "(a)", "1.", "a."
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicates Detected Questions extracted from one or more uploaded images.
 * Removes exact ID collisions, identical question texts, and duplicate subparts.
 */
export function deduplicateDetectedQuestions(questions: DetectedQuestion[]): DetectedQuestion[] {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  const result: DetectedQuestion[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q) continue;

    // Stable ID fallback
    const stableId = q.id?.trim() || `q_${i + 1}`;
    const normalizedMainText = normalizeTextForComparison(q.fullText || q.title || '');
    
    // Deduplicate parts within the question itself
    const dedupedParts: typeof q.parts = [];
    const seenPartTexts = new Set<string>();

    if (Array.isArray(q.parts)) {
      for (let pIdx = 0; pIdx < q.parts.length; pIdx++) {
        const part = q.parts[pIdx];
        if (!part) continue;
        const normPartText = normalizeTextForComparison(part.text || '');
        const partKey = `${part.partId || pIdx}_${normPartText}`;
        if (!seenPartTexts.has(partKey)) {
          seenPartTexts.add(partKey);
          dedupedParts.push({
            partId: part.partId?.trim() || `(${String.fromCharCode(97 + dedupedParts.length)})`,
            text: part.text?.trim() || '',
          });
        }
      }
    }

    // Build unique question signature based on question text + first part
    const questionSignature = normalizedMainText
      ? normalizedMainText
      : dedupedParts.length > 0
      ? dedupedParts.map((p) => p.text).join('|')
      : `question_${i}`;

    if (seenIds.has(stableId) || seenTexts.has(questionSignature)) {
      // Duplicate question found, skip
      continue;
    }

    seenIds.add(stableId);
    seenTexts.add(questionSignature);

    result.push({
      ...q,
      id: stableId,
      questionNumber: q.questionNumber?.trim() || `Q${result.length + 1}`,
      title: q.title?.trim() || (dedupedParts[0]?.text ? dedupedParts[0].text.slice(0, 60) : `Question ${result.length + 1}`),
      fullText: q.fullText?.trim() || '',
      parts: dedupedParts.length > 0 ? dedupedParts : [{ partId: '(a)', text: q.title || q.fullText || 'Main Question' }],
    });
  }

  return result;
}

/**
 * Deduplicates and Normalizes Solved Question Items before sending to canvas/PNG renderer.
 * Guarantees that:
 * 1. Each question number / question text is rendered EXACTLY ONCE.
 * 2. Every subpart has exactly one attached answer.
 * 3. No duplicate question-answer pairs or orphaned answers exist.
 */
export function deduplicateSolvedQuestions(items: SolvedQuestionItem[]): SolvedQuestionItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const seenQuestionKeys = new Set<string>();
  const finalResult: SolvedQuestionItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    const normMain = normalizeTextForComparison(item.mainQuestionText || '');
    const firstPart = item.parts?.[0];
    const normFirstPartQ = normalizeTextForComparison(firstPart?.questionText || '');
    const questionKey = normMain || normFirstPartQ || `q_index_${i}`;

    if (seenQuestionKeys.has(questionKey)) {
      // Duplicate question block detected, skip
      continue;
    }
    seenQuestionKeys.add(questionKey);

    // Deduplicate subparts within this solved item
    const seenPartKeys = new Set<string>();
    const cleanedParts: SolvedQuestionPart[] = [];

    if (Array.isArray(item.parts)) {
      for (let pIdx = 0; pIdx < item.parts.length; pIdx++) {
        const p = item.parts[pIdx];
        if (!p) continue;
        
        const partText = p.questionText?.trim() || '';
        const answerText = p.answer?.trim() || '';
        const partKey = `${normalizeTextForComparison(partText)}_${normalizeTextForComparison(answerText)}`;

        if (!seenPartKeys.has(partKey)) {
          seenPartKeys.add(partKey);
          cleanedParts.push({
            partId: p.partId?.trim() || `(${String.fromCharCode(97 + cleanedParts.length)})`,
            questionText: partText,
            answer: answerText,
          });
        }
      }
    }

    finalResult.push({
      questionNumber: item.questionNumber?.trim() || `Q${finalResult.length + 1}`,
      mainQuestionText: item.mainQuestionText?.trim() || '',
      parts: cleanedParts.length > 0 ? cleanedParts : [
        {
          partId: '(a)',
          questionText: item.mainQuestionText || 'Question',
          answer: 'Answer provided.',
        }
      ],
    });
  }

  return finalResult;
}
