// ============================================================
// Al Imran — Adaptive Question Engine
// Dynamically adjusts difficulty based on user performance
// ============================================================

export interface Question {
  category: string;
  text: string;
  options: string[];
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const ALL_QUESTIONS: Question[] = [
  // ─── GRAMMAR — Easy ───────────────────────────────────────
  { category: 'Grammar', difficulty: 'easy', text: 'He ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes' },
  { category: 'Grammar', difficulty: 'easy', text: 'They ___ playing football now.', options: ['is', 'are', 'was', 'am'], answer: 'are' },
  { category: 'Grammar', difficulty: 'easy', text: 'She ___ a doctor.', options: ['am', 'are', 'is', 'be'], answer: 'is' },
  { category: 'Grammar', difficulty: 'easy', text: 'I ___ my homework every night.', options: ['do', 'does', 'did', 'done'], answer: 'do' },
  { category: 'Grammar', difficulty: 'easy', text: 'The police ___ looking for the thief.', options: ['is', 'are', 'was', 'be'], answer: 'are' },

  // ─── GRAMMAR — Medium ─────────────────────────────────────
  { category: 'Grammar', difficulty: 'medium', text: 'I wish I ___ taller.', options: ['am', 'is', 'was', 'were'], answer: 'were' },
  { category: 'Grammar', difficulty: 'medium', text: 'Neither of the boys ___ the answer.', options: ['know', 'knows', 'knowing', 'known'], answer: 'knows' },
  { category: 'Grammar', difficulty: 'medium', text: 'I am looking forward to ___ you.', options: ['see', 'saw', 'seen', 'seeing'], answer: 'seeing' },
  { category: 'Grammar', difficulty: 'medium', text: 'Mathematics ___ my favorite subject.', options: ['is', 'are', 'were', 'be'], answer: 'is' },
  { category: 'Grammar', difficulty: 'medium', text: 'Each of the students ___ a book.', options: ['has', 'have', 'having', 'had'], answer: 'has' },

  // ─── GRAMMAR — Hard ───────────────────────────────────────
  { category: 'Grammar', difficulty: 'hard', text: 'I can\'t help ___ at his jokes.', options: ['laugh', 'laughing', 'laughed', 'to laugh'], answer: 'laughing' },
  { category: 'Grammar', difficulty: 'hard', text: 'They ___ already left when I arrived.', options: ['have', 'has', 'had', 'having'], answer: 'had' },
  { category: 'Grammar', difficulty: 'hard', text: 'The committee ___ divided in their opinions.', options: ['was', 'were', 'is', 'has been'], answer: 'were' },
  { category: 'Grammar', difficulty: 'hard', text: 'It is time we ___ home.', options: ['go', 'went', 'have gone', 'will go'], answer: 'went' },
  { category: 'Grammar', difficulty: 'hard', text: 'He speaks as though he ___ everything.', options: ['knows', 'knew', 'has known', 'know'], answer: 'knew' },

  // ─── VOICES — Easy ────────────────────────────────────────
  { category: 'Voices', difficulty: 'easy', text: 'The letter ___ by him yesterday.', options: ['was written', 'wrote', 'is written', 'writing'], answer: 'was written' },
  { category: 'Voices', difficulty: 'easy', text: 'The room ___ every day.', options: ['is cleaned', 'cleans', 'is cleaning', 'cleaned'], answer: 'is cleaned' },
  { category: 'Voices', difficulty: 'easy', text: 'English ___ all over the world.', options: ['is spoken', 'speaks', 'spoken', 'is speaking'], answer: 'is spoken' },

  // ─── VOICES — Medium ──────────────────────────────────────
  { category: 'Voices', difficulty: 'medium', text: 'Rice is ___ in many parts of the world.', options: ['grow', 'grew', 'grown', 'growing'], answer: 'grown' },
  { category: 'Voices', difficulty: 'medium', text: 'The cake ___ by my mother now.', options: ['is being made', 'is made', 'made', 'was making'], answer: 'is being made' },
  { category: 'Voices', difficulty: 'medium', text: 'The work will ___ by tomorrow.', options: ['be finished', 'finish', 'been finished', 'finishing'], answer: 'be finished' },

  // ─── VOICES — Hard ────────────────────────────────────────
  { category: 'Voices', difficulty: 'hard', text: 'Who ___ this window?', options: ['broke', 'was broken', 'broken', 'breaks'], answer: 'broke' },
  { category: 'Voices', difficulty: 'hard', text: 'The problem ___ to be solved by experts.', options: ['needs', 'is needed', 'was needed', 'needed'], answer: 'needs' },
  { category: 'Voices', difficulty: 'hard', text: 'By the time we arrive, the food ___.', options: ['was served', 'will have been served', 'is being served', 'has been served'], answer: 'will have been served' },

  // ─── TENSES — Easy ────────────────────────────────────────
  { category: 'Tenses', difficulty: 'easy', text: 'I ___ my keys. Have you seen them?', options: ['lost', 'have lost', 'lose', 'had lost'], answer: 'have lost' },
  { category: 'Tenses', difficulty: 'easy', text: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], answer: 'will stay' },
  { category: 'Tenses', difficulty: 'easy', text: 'I ___ to the radio when the doorbell rang.', options: ['was listening', 'listened', 'listen', 'had listened'], answer: 'was listening' },

  // ─── TENSES — Medium ──────────────────────────────────────
  { category: 'Tenses', difficulty: 'medium', text: 'I ___ her for ten years.', options: ['have known', 'know', 'had known', 'knew'], answer: 'have known' },
  { category: 'Tenses', difficulty: 'medium', text: 'She ___ for three hours before she stopped.', options: ['has been reading', 'had been reading', 'is reading', 'reads'], answer: 'had been reading' },
  { category: 'Tenses', difficulty: 'medium', text: 'By the time he arrived, we ___ dinner.', options: ['had finished', 'finished', 'have finished', 'will finish'], answer: 'had finished' },

  // ─── TENSES — Hard ────────────────────────────────────────
  { category: 'Tenses', difficulty: 'hard', text: 'By next year, I ___ my degree.', options: ['will finish', 'will have finished', 'finished', 'am finishing'], answer: 'will have finished' },
  { category: 'Tenses', difficulty: 'hard', text: 'He ___ always ___ me! (Present Perfect Continuous)', options: ['has been interrupting', 'is interrupting', 'has interrupted', 'will interrupt'], answer: 'has been interrupting' },
  { category: 'Tenses', difficulty: 'hard', text: 'Had she ___ earlier, she would have caught the train.', options: ['leave', 'left', 'leaving', 'leaves'], answer: 'left' },
  { category: 'Tenses', difficulty: 'hard', text: 'By the end of this year, they ___ the project for two decades.', options: ['will work', 'will be working', 'will have been working', 'have worked'], answer: 'will have been working' },
];

// ────────────────────────────────────────────────────────────
// Score-based difficulty selection
// Score ≥ 80% → Hard, Score 50-79% → Medium, Score < 50% → Easy
// ────────────────────────────────────────────────────────────
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'adaptive';

export function getDifficultyFromScore(score: number, total: number): 'easy' | 'medium' | 'hard' {
  if (total === 0) return 'medium';
  const pct = score / total;
  if (pct >= 0.8) return 'hard';
  if (pct >= 0.5) return 'medium';
  return 'easy';
}

export function getAdaptiveQuestions(
  category: string,
  count: number,
  previousScore: number = 0,
  previousTotal: number = 0
): Question[] {
  const targetDiff = getDifficultyFromScore(previousScore, previousTotal);

  // Pool: 70% target difficulty + 30% adjacent
  const pool = ALL_QUESTIONS.filter(q =>
    category === 'Random' ? true : q.category === category
  );

  // Split by difficulty
  const targetPool = pool.filter(q => q.difficulty === targetDiff);
  const otherPool = pool.filter(q => q.difficulty !== targetDiff);

  // Build mixed pool (prefer target difficulty)
  const targetCount = Math.ceil(count * 0.7);
  const otherCount = count - targetCount;

  const shuffleTarget = [...targetPool].sort(() => Math.random() - 0.5);
  const shuffleOther = [...otherPool].sort(() => Math.random() - 0.5);

  const selected = [
    ...shuffleTarget.slice(0, targetCount),
    ...shuffleOther.slice(0, otherCount),
  ].sort(() => Math.random() - 0.5).slice(0, count);

  // Shuffle options
  return selected.map(q => ({
    ...q,
    options: [...q.options].sort(() => Math.random() - 0.5),
  }));
}

// Legacy-compatible random questions (used by existing code)
export const getRandomQuestions = (category: string, count: number): Question[] => {
  return getAdaptiveQuestions(category, count, 0, 0);
};
