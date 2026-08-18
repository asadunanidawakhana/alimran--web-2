// ==============================================================================
// AL IMRAN TENSES LEARNER — ULTRA-EASY ENGLISH & SHORT ANSWER OPTIMIZER
// Formatted specifically for Pakistani school and college students.
// Automatically simplifies vocabulary and balances Short Mode for natural 2-mark completeness.
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
      // Preserve uppercase first letter if original had it
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
 * Balances Short Answers for natural 2-mark completeness (Rules 42-45):
 * - Eliminates opening/trailing conversational fluff.
 * - Retains the direct answer + 1 short supporting phrase/clause so it does NOT feel incomplete.
 * - Target: 1 concise sentence or 2 short sentences (approx. 1-2 lines).
 */
export function shortenShortAnswer(questionText: string, answerText: string, isUrdu = false): string {
  if (!answerText || typeof answerText !== 'string') return '';
  if (isUrdu) return answerText.trim();

  let text = answerText.trim();

  // Strip conversational opening filler phrases while preserving definition core
  const openingFillers = [
    /^(it can be defined as|it is defined as|is defined as|it refers to the fact that|it simply refers to|it refers to|basically,|in simple words,|in simple terms,|we can say that|as we know that|according to physics,|according to biology,|according to chemistry,)\s*/i,
    /^(the term\s+["']?[a-z0-9\s]+["']?\s+means\s+that)\s*/i,
  ];

  for (const pattern of openingFillers) {
    text = text.replace(pattern, '');
  }

  // Split into sentences
  const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 0);
  
  // For 2-mark questions, keep 1 or 2 concise sentences with supporting explanation
  if (sentences.length > 2) {
    const qLower = (questionText || '').toLowerCase();
    const isFormulaOrUnit = qLower.includes('formula') || qLower.includes('unit') || qLower.includes('si unit');

    if (isFormulaOrUnit) {
      text = sentences[0];
    } else {
      text = sentences.slice(0, 2).join(' ');
    }
  }

  // Strip excessive unrelated trailing filler while keeping helpful context
  text = text.replace(/\s*(this (process|is|concept) is very important for daily life.*|[.]\s*it plays a crucial role in the universe.*)$/i, '.');

  text = text.trim();
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text) && !text.includes('=')) {
      text += '.';
    }
  }

  return simplifyEnglishForPakistaniStudents(text);
}
