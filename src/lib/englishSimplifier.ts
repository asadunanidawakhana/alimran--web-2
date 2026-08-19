// ==============================================================================
// AL IMRAN TENSES LEARNER — ULTRA-EASY ENGLISH & SHORT/LONG ANSWER BALANCER
// Formatted specifically for Pakistani school and college students (Matric / FSc).
// Strictly controls Short Question length (1-4 sentences) and Long Question length (250-600 words).
// ==============================================================================

// Word replacement map: [RegExp matching whole word/phrase, replacement]
const WORD_REPLACEMENTS: [RegExp, string][] = [
  [/\butilize\b/gi, 'use'],
  [/\butilizes\b/gi, 'uses'],
  [/\butilized\b/gi, 'used'],
  [/\butilizing\b/gi, 'using'],
  [/\butilization\b/gi, 'use'],

  [/\bcommence\b/gi, 'start'],
  [/\bcommences\b/gi, 'starts'],
  [/\bcommenced\b/gi, 'started'],
  [/\bcommencing\b/gi, 'starting'],

  [/\bapproximately\b/gi, 'about'],
  [/\bdemonstrate\b/gi, 'show'],
  [/\bdemonstrates\b/gi, 'shows'],
  [/\bdemonstrated\b/gi, 'showed'],
  [/\bdemonstrating\b/gi, 'showing'],

  [/\bobtain\b/gi, 'get'],
  [/\bobtains\b/gi, 'gets'],
  [/\bobtained\b/gi, 'got'],
  [/\bobtaining\b/gi, 'getting'],

  [/\bpurchase\b/gi, 'buy'],
  [/\bpurchases\b/gi, 'buys'],
  [/\bpurchased\b/gi, 'bought'],

  [/\btherefore\b/gi, 'so'],
  [/\bconsequently\b/gi, 'so'],
  [/\bsubsequently\b/gi, 'later'],
  [/\bprior to\b/gi, 'before'],
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bwith regard to\b/gi, 'about'],

  [/\bnumerous\b/gi, 'many'],
  [/\ba myriad of\b/gi, 'many'],
  [/\ba plethora of\b/gi, 'many'],

  [/\brequired\b/gi, 'needed'],
  [/\brequires\b/gi, 'needs'],
  [/\brequire\b/gi, 'need'],
  [/\brequiring\b/gi, 'needing'],

  [/\bassistance\b/gi, 'help'],
  [/\bassists\b/gi, 'helps'],
  [/\bassist\b/gi, 'help'],
  [/\bassisting\b/gi, 'helping'],

  [/\bcomponents\b/gi, 'parts'],
  [/\bcomponent\b/gi, 'part'],

  [/\bfundamental\b/gi, 'basic'],
  [/\bfundamentals\b/gi, 'basics'],

  [/\bconstruct\b/gi, 'build'],
  [/\bconstructs\b/gi, 'builds'],
  [/\bconstructed\b/gi, 'built'],
  [/\bconstructing\b/gi, 'building'],

  [/\btransmit\b/gi, 'send'],
  [/\btransmits\b/gi, 'sends'],
  [/\btransmitted\b/gi, 'sent'],
  [/\btransmitting\b/gi, 'sending'],

  [/\bcharacteristics\b/gi, 'features'],
  [/\bcharacteristic\b/gi, 'feature'],

  [/\bsynthesize\b/gi, 'make'],
  [/\bsynthesizes\b/gi, 'makes'],
  [/\bsynthesized\b/gi, 'made'],
  [/\bsynthesizing\b/gi, 'making'],

  [/\bfacilitate\b/gi, 'help'],
  [/\bfacilitates\b/gi, 'helps'],
  [/\bfacilitated\b/gi, 'helped'],
  [/\bfacilitating\b/gi, 'helping'],

  [/\beliminate\b/gi, 'remove'],
  [/\beliminates\b/gi, 'removes'],
  [/\beliminated\b/gi, 'removed'],
  [/\beliminating\b/gi, 'removing'],

  [/\bpossess\b/gi, 'have'],
  [/\bpossesses\b/gi, 'has'],
  [/\bpossessed\b/gi, 'had'],

  [/\bcomprises\b/gi, 'has'],
  [/\bcomprise\b/gi, 'have'],
  [/\bcomprised of\b/gi, 'made of'],

  [/\bindicate\b/gi, 'show'],
  [/\bindicates\b/gi, 'shows'],
  [/\bindicated\b/gi, 'showed'],

  [/\binitiate\b/gi, 'start'],
  [/\binitiates\b/gi, 'starts'],
  [/\binitiated\b/gi, 'started'],

  [/\bterminate\b/gi, 'end'],
  [/\bterminates\b/gi, 'ends'],
  [/\bterminated\b/gi, 'ended'],

  [/\bexhibit\b/gi, 'show'],
  [/\bexhibits\b/gi, 'shows'],
  [/\bexhibited\b/gi, 'showed'],

  [/\bsufficient\b/gi, 'enough'],
  [/\binsufficient\b/gi, 'not enough'],
  [/\boptimal\b/gi, 'best'],
  [/\bparamount\b/gi, 'very important'],
  [/\bcrucial\b/gi, 'very important'],
  [/\bvital\b/gi, 'important'],
  [/\bessential\b/gi, 'important'],
  [/\bpertaining to\b/gi, 'about'],
  [/\bconcerning\b/gi, 'about'],
];

/**
 * Simplifies English text for Pakistani students while preserving proper case and scientific technical terms.
 */
export function simplifyEnglishForPakistaniStudents(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let simplified = text;

  for (const [regex, replacement] of WORD_REPLACEMENTS) {
    simplified = simplified.replace(regex, (match) => {
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  // Clean up any double spaces created by phrase replacements
  return simplified.replace(/\s+/g, ' ').trim();
}

/**
 * Balances Short Answers for natural 2-mark exam completeness:
 * - Strictly 1-4 sentences (approx 1-3 lines).
 * - Eliminates opening/trailing conversational fluff.
 * - Retains the direct answer + 1 short supporting phrase/clause so meaning is 100% complete.
 * - Never converts short answers into essays.
 */
export function shortenShortAnswer(questionText: string, answerText: string, isUrdu = false): string {
  if (!answerText || typeof answerText !== 'string') return '';
  if (isUrdu) {
    // For Urdu, clean leading greetings/fillers and ensure crispness
    let urduClean = answerText.trim();
    urduClean = urduClean.replace(/^(اس کا جواب یہ ہے کہ|جواب:\s*|جیسا کہ ہم جانتے ہیں کہ|مختصر الفاظ میں\s*)/u, '');
    return urduClean.trim();
  }

  let text = answerText.trim();

  // Strip conversational opening filler phrases while preserving definition core
  const openingFillers = [
    /^(it can be defined as|it is defined as|is defined as|it refers to the fact that|it simply refers to|it refers to|basically,|in simple words,|in simple terms,|we can say that|as we know that|according to physics,|according to biology,|according to chemistry,)\s*/i,
    /^(the term\s+["']?[a-z0-9\s]+["']?\s+means\s+that)\s*/i,
    /^(sure,|here is the answer:|the answer is:?|to answer this question,)\s*/i,
  ];

  for (const pattern of openingFillers) {
    text = text.replace(pattern, '');
  }

  // Split into sentences
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const qLower = (questionText || '').toLowerCase();
  const isFormulaOrUnit =
    qLower.includes('formula') ||
    qLower.includes('unit') ||
    qLower.includes('si unit') ||
    qLower.includes('symbol');
  const isDifference = qLower.includes('difference') || qLower.includes('distinguish') || qLower.includes('compare');

  if (isFormulaOrUnit && sentences.length > 1) {
    // Keep primary formula/unit sentence
    text = sentences.slice(0, 2).join(' ');
  } else if (isDifference && sentences.length > 4) {
    // Keep max 2-3 comparison points
    text = sentences.slice(0, 3).join(' ');
  } else if (sentences.length > 3) {
    // Normal short question target: 1-3 sentences
    text = sentences.slice(0, 3).join(' ');
  }

  // Strip excessive unrelated trailing filler
  text = text.replace(
    /\s*(this (process|is|concept|formula) is (very )?important for daily life.*|[.]\s*it plays a crucial role in the universe.*)$/i,
    '.'
  );

  text = text.trim();
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text) && !text.includes('=')) {
      text += '.';
    }
  }

  return simplifyEnglishForPakistaniStudents(text);
}

/**
 * Balances Long Answers to ensure comprehensive exam quality (250-600 words)
 * without turning into 2-4 pages of redundant fluff or repeating points.
 */
export function balanceLongAnswer(questionText: string, answerText: string, isUrdu = false): string {
  if (!answerText || typeof answerText !== 'string') return '';
  if (isUrdu) return answerText.trim();

  let text = answerText.trim();

  // Strip robotic AI chat openers
  text = text.replace(/^(sure thing!|here is the detailed explanation:|certainly!)\s*/i, '');

  // Remove redundant repeated conclusion sentences
  text = text.replace(/\n\s*In conclusion,\s*as stated above[^\n]+/gi, '');

  // Count words to ensure it stays within 250-600 word limit
  const words = text.split(/\s+/);
  if (words.length > 650) {
    // Trim back to around 550 words while preserving paragraph completion
    const paragraphs = text.split(/\n\n+/);
    let cumulativeWordCount = 0;
    const keptParagraphs: string[] = [];

    for (const p of paragraphs) {
      const pWords = p.trim().split(/\s+/).length;
      if (cumulativeWordCount + pWords <= 600 || keptParagraphs.length < 2) {
        keptParagraphs.push(p.trim());
        cumulativeWordCount += pWords;
      } else {
        break;
      }
    }

    if (keptParagraphs.length > 0) {
      text = keptParagraphs.join('\n\n');
    }
  }

  return simplifyEnglishForPakistaniStudents(text);
}
