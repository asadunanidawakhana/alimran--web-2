export interface Formula {
  name: string;
  formula: string;
  example: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Topic {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  formulas: Formula[];
  levels: QuizQuestion[];
}

export const TOPIC_DATA: Record<string, Topic> = {
  'n-1': {
    title: 'Nouns',
    description: 'A noun is a naming word — it names people, places, things, or ideas.',
    difficulty: 'Easy',
    formulas: [
      {
        name: 'What is a Noun?',
        formula: 'A noun is a word that names a PERSON, PLACE, THING, or IDEA.',
        example: '👨 Person: teacher | 🏙️ Place: Karachi | 🎒 Thing: bag | 💡 Idea: freedom'
      },
      {
        name: 'Common Nouns',
        formula: 'Common nouns are general names. They do NOT start with a capital letter.',
        example: 'city, boy, school, car — these are all common nouns.'
      },
      {
        name: 'Proper Nouns',
        formula: 'Proper nouns are the SPECIFIC names of people, places, etc. They ALWAYS start with a capital letter.',
        example: 'Ali, Pakistan, Monday, Lahore — these are proper nouns.'
      }
    ],
    levels: [
      { question: 'Find the NOUN: "The blue car drove fast."', options: ['blue', 'car', 'drove', 'fast'], answer: 'car' },
      { question: 'Which word is a PROPER NOUN?', options: ['boy', 'city', 'Saturday', 'day'], answer: 'Saturday' },
      { question: 'Find the NOUN (person): "My doctor is very kind."', options: ['doctor', 'very', 'kind', 'is'], answer: 'doctor' },
      { question: 'Which is a NOUN?', options: ['run', 'happy', 'book', 'quickly'], answer: 'book' },
      { question: '"Lahore is a big city." — Which word is a PROPER NOUN?', options: ['big', 'city', 'Lahore', 'is'], answer: 'Lahore' },
      { question: 'Which is a COMMON NOUN?', options: ['Ali', 'Monday', 'Pakistan', 'chair'], answer: 'chair' },
      { question: 'Find the NOUN (idea): "Love is beautiful."', options: ['Love', 'is', 'beautiful', 'very'], answer: 'Love' },
      { question: '"The students went to school." — How many NOUNS are there?', options: ['1', '2', '3', '0'], answer: '2' },
    ]
  },
  'p-1': {
    title: 'Pronouns',
    description: 'Pronouns replace nouns so you do not have to repeat the same word.',
    difficulty: 'Easy',
    formulas: [
      {
        name: 'What is a Pronoun?',
        formula: 'A pronoun replaces a noun to avoid repetition. Example: instead of "Ali" again, say "he".',
        example: 'Ali is a doctor. HE works in a hospital. ("He" replaces "Ali")'
      },
      {
        name: 'Subject Pronouns',
        formula: 'Use these when the pronoun is DOING the action: I, you, he, she, it, we, they',
        example: 'SHE is a doctor. THEY are students. WE are happy.'
      },
      {
        name: 'Object Pronouns',
        formula: 'Use these when the pronoun RECEIVES the action: me, you, him, her, it, us, them',
        example: 'Give the book to ME. I saw HIM in the park.'
      }
    ],
    levels: [
      { question: 'Ali is happy. ___ won the race.', options: ['He', 'She', 'It', 'They'], answer: 'He' },
      { question: 'The cat is sleeping. ___ is tired.', options: ['He', 'She', 'It', 'We'], answer: 'It' },
      { question: 'Sara and I went to school. ___ are friends.', options: ['He', 'She', 'We', 'They'], answer: 'We' },
      { question: 'Give the bag to ___ (Fatima).', options: ['she', 'her', 'hers', 'they'], answer: 'her' },
      { question: 'The students are late. ___ missed the bus.', options: ['He', 'She', 'It', 'They'], answer: 'They' },
      { question: 'Which is a SUBJECT pronoun?', options: ['me', 'him', 'her', 'we'], answer: 'we' },
      { question: 'I saw ___ (Omar) at the market.', options: ['he', 'him', 'his', 'they'], answer: 'him' },
      { question: 'The book is old. ___ needs to be replaced.', options: ['He', 'She', 'It', 'They'], answer: 'It' },
    ]
  },
  'v-1': {
    title: 'Verbs',
    description: 'Verbs are action words or words that show a state of being.',
    difficulty: 'Easy',
    formulas: [
      {
        name: 'What is a Verb?',
        formula: 'A verb shows an ACTION or a STATE OF BEING.',
        example: '⚽ Action: run, eat, write, play | 😊 Being: is, are, was, were'
      },
      {
        name: 'Action Verbs',
        formula: 'Action verbs show something physically or mentally happening.',
        example: 'She READS a book. He RUNS every day. They THINK carefully.'
      },
      {
        name: 'Helping Verbs',
        formula: 'Helping verbs support the main verb. Common ones: is, am, are, was, were, has, have, had, do, does, did, will, can',
        example: 'She IS reading. They HAVE finished. He CAN swim.'
      }
    ],
    levels: [
      { question: 'Find the VERB: "Ali eats an apple."', options: ['Ali', 'eats', 'an', 'apple'], answer: 'eats' },
      { question: 'Which is a HELPING VERB?', options: ['Run', 'Is', 'Apple', 'Quickly'], answer: 'Is' },
      { question: 'Find the action: "The birds fly high."', options: ['birds', 'fly', 'high', 'The'], answer: 'fly' },
      { question: 'Which is a VERB?', options: ['beautiful', 'happy', 'jump', 'slowly'], answer: 'jump' },
      { question: '"She can swim very well." — What is the MAIN verb?', options: ['can', 'swim', 'very', 'well'], answer: 'swim' },
      { question: '"They were playing cricket." — What is the HELPING verb?', options: ['playing', 'cricket', 'were', 'they'], answer: 'were' },
      { question: 'Which is an ACTION verb?', options: ['am', 'is', 'are', 'dance'], answer: 'dance' },
      { question: '"The baby is sleeping." — Is "sleeping" a verb?', options: ['Yes, action verb', 'No, it is a noun', 'No, it is an adjective', 'Yes, but only with "is"'], answer: 'Yes, action verb' },
    ]
  },
  'adj-1': {
    title: 'Adjectives',
    description: 'Adjectives are describing words — they describe nouns.',
    difficulty: 'Easy',
    formulas: [
      {
        name: 'What is an Adjective?',
        formula: 'An adjective DESCRIBES or gives more information about a NOUN.',
        example: 'A TALL man. A BEAUTIFUL garden. THREE books. (tall, beautiful, three — all adjectives)'
      },
      {
        name: 'Adjectives of Quality',
        formula: 'These describe what something is like: big, small, hot, cold, beautiful, ugly, smart, lazy',
        example: 'It is a HOT day. She is a SMART student.'
      },
      {
        name: 'Adjectives of Quantity',
        formula: 'These describe how many or how much: few, many, some, all, several, ten',
        example: 'I have FEW friends. She ate SOME rice. TEN students passed.'
      }
    ],
    levels: [
      { question: 'Find the ADJECTIVE: "The tall man is here."', options: ['The', 'tall', 'man', 'is'], answer: 'tall' },
      { question: 'Which word DESCRIBES a noun?', options: ['Run', 'Big', 'Quickly', 'Always'], answer: 'Big' },
      { question: '"She wore a beautiful dress." — Find the adjective.', options: ['She', 'wore', 'beautiful', 'dress'], answer: 'beautiful' },
      { question: 'Which is an ADJECTIVE?', options: ['slowly', 'happy', 'eat', 'they'], answer: 'happy' },
      { question: '"He has three dogs." — What kind of adjective is "three"?', options: ['Quality', 'Quantity', 'Color', 'Size'], answer: 'Quantity' },
      { question: '"The cold water felt great." — Find the adjective.', options: ['cold', 'water', 'felt', 'great'], answer: 'cold' },
      { question: 'How many adjectives: "A tiny, red bird sat on a big tree."', options: ['1', '2', '3', '4'], answer: '3' },
      { question: 'Which sentence has an ADJECTIVE?', options: ['He runs fast.', 'She eats quickly.', 'They have a new car.', 'I went there.'], answer: 'They have a new car.' },
    ]
  },
  'adv-1': {
    title: 'Adverbs',
    description: 'Adverbs describe HOW, WHEN, WHERE, or HOW OFTEN something happens.',
    difficulty: 'Easy',
    formulas: [
      {
        name: 'What is an Adverb?',
        formula: 'An adverb modifies a VERB, an ADJECTIVE, or another ADVERB. It answers: How? When? Where? How often?',
        example: 'She sang BEAUTIFULLY. (How?) He came YESTERDAY. (When?) They live NEARBY. (Where?)'
      },
      {
        name: 'Adverbs of Manner (How?)',
        formula: 'These describe HOW something is done. Many end in "-ly".',
        example: 'slowly, quickly, loudly, carefully, happily, hard, fast'
      },
      {
        name: 'Adverbs of Frequency (How often?)',
        formula: 'These describe HOW OFTEN something happens.',
        example: 'always, usually, often, sometimes, rarely, never — "He always wakes up early."'
      }
    ],
    levels: [
      { question: 'Find the ADVERB: "He walked slowly to the door."', options: ['walked', 'slowly', 'door', 'walk'], answer: 'slowly' },
      { question: 'Which is an adverb of FREQUENCY?', options: ['Often', 'Quickly', 'Here', 'Very'], answer: 'Often' },
      { question: '"She is extremely talented." — What does "extremely" modify?', options: ['a noun', 'a verb', 'an adjective', 'another adverb'], answer: 'an adjective' },
      { question: 'Which word is an ADVERB?', options: ['beautiful', 'quickly', 'flower', 'happy'], answer: 'quickly' },
      { question: '"I sometimes go for a walk." — What kind of adverb is "sometimes"?', options: ['Manner', 'Frequency', 'Place', 'Time'], answer: 'Frequency' },
      { question: '"The children shouted loudly." — Find the adverb.', options: ['children', 'shouted', 'loudly', 'The'], answer: 'loudly' },
      { question: 'Which adverb means "at all times"?', options: ['never', 'sometimes', 'always', 'rarely'], answer: 'always' },
      { question: '"She never eats junk food." — Find the adverb.', options: ['She', 'never', 'eats', 'junk'], answer: 'never' },
    ]
  },
  'prep-1': {
    title: 'Prepositions',
    description: 'Prepositions show the relationship between a noun and other words — they show place, time, or direction.',
    difficulty: 'Easy',
    formulas: [
      {
        name: 'What is a Preposition?',
        formula: 'A preposition comes BEFORE a noun and shows its relationship to another word.',
        example: 'The book is ON the table. She sat BEHIND me. We met AT school.'
      },
      {
        name: 'Prepositions of Place',
        formula: 'Show WHERE something is: in, on, at, under, over, behind, between, next to, above, below',
        example: 'The cat is UNDER the chair. The picture is ON the wall.'
      },
      {
        name: 'Prepositions of Time',
        formula: 'Show WHEN something happens. Use: AT for times, ON for days/dates, IN for months/years.',
        example: 'AT 3 PM | ON Monday | ON 5th January | IN December | IN 2024'
      }
    ],
    levels: [
      { question: 'Find the PREPOSITION: "He walked through the forest."', options: ['walked', 'through', 'forest', 'the'], answer: 'through' },
      { question: '"The keys are ___ the drawer."', options: ['in', 'at', 'on', 'to'], answer: 'in' },
      { question: '"I will see you ___ Monday morning."', options: ['in', 'on', 'at', 'since'], answer: 'on' },
      { question: '"She arrived ___ 8 o\'clock."', options: ['on', 'in', 'at', 'by'], answer: 'at' },
      { question: '"The school was built ___ 1999."', options: ['at', 'on', 'in', 'since'], answer: 'in' },
      { question: '"The dog is sitting ___ the door."', options: ['in', 'at', 'behind', 'on'], answer: 'behind' },
      { question: 'Which is a preposition of DIRECTION?', options: ['in', 'on', 'at', 'towards'], answer: 'towards' },
      { question: '"I was born ___ January."', options: ['at', 'on', 'in', 'since'], answer: 'in' },
    ]
  },
  'conj-1': {
    title: 'Conjunctions',
    description: 'Conjunctions are joining words — they connect words, phrases, or sentences together.',
    difficulty: 'Easy',
    formulas: [
      {
        name: 'What is a Conjunction?',
        formula: 'A conjunction JOINS two words, phrases, or sentences together.',
        example: 'I like tea AND coffee. I am tired BUT I am happy. (AND, BUT are conjunctions)'
      },
      {
        name: 'Coordinating Conjunctions (FANBOYS)',
        formula: 'For, And, Nor, But, Or, Yet, So — these join EQUAL parts of a sentence.',
        example: 'I wanted to play, BUT it rained. She can sing OR dance. He studied hard, SO he passed.'
      },
      {
        name: 'Subordinating Conjunctions',
        formula: 'These connect a main clause with a dependent clause: because, although, if, since, when, while, unless',
        example: 'We stayed inside BECAUSE it rained. ALTHOUGH he was tired, he kept working.'
      }
    ],
    levels: [
      { question: '"I wanted to play soccer, ___ it started to rain."', options: ['and', 'but', 'so', 'because'], answer: 'but' },
      { question: '"___ he studied hard, he failed the exam."', options: ['Because', 'Although', 'Since', 'If'], answer: 'Although' },
      { question: '"Neither my father ___ my mother agreed."', options: ['nor', 'or', 'and', 'but'], answer: 'nor' },
      { question: 'Which is a COORDINATING conjunction?', options: ['because', 'although', 'since', 'and'], answer: 'and' },
      { question: '"I will go to school ___ I am feeling sick."', options: ['although', 'and', 'so', 'or'], answer: 'although' },
      { question: 'Which conjunction shows a RESULT?', options: ['but', 'or', 'so', 'nor'], answer: 'so' },
      { question: '"She sings ___ dances very well."', options: ['but', 'or', 'and', 'yet'], answer: 'and' },
      { question: '"___ you study hard, you will pass." — Fill in the blank.', options: ['Although', 'If', 'But', 'So'], answer: 'If' },
    ]
  },
  't-1': {
    title: 'Present Simple',
    description: 'Use Present Simple for habits, daily routines, and facts that are always true.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + Verb1 (add s/es for He/She/It) + Object',
        example: 'I play. You play. He PLAYS. She EATS. It RUNS.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + do/does + not + Verb1 + Object',
        example: 'I DO NOT like coffee. She DOES NOT eat meat. They DO NOT come here.'
      },
      {
        name: 'Question Form',
        formula: 'Do/Does + Subject + Verb1 + Object?',
        example: 'DO you eat rice? DOES he go to school? DO they like cricket?'
      }
    ],
    levels: [
      { question: 'He ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes' },
      { question: 'We ___ not play cricket.', options: ['do', 'does', 'is', 'are'], answer: 'do' },
      { question: '___ she like coffee?', options: ['Do', 'Does', 'Is', 'Has'], answer: 'Does' },
      { question: 'The sun ___ in the east.', options: ['rise', 'rising', 'rises', 'risen'], answer: 'rises' },
      { question: 'I ___ not understand this lesson.', options: ['do', 'does', 'am', 'have'], answer: 'do' },
      { question: 'They ___ cricket every Sunday.', options: ['plays', 'playing', 'play', 'played'], answer: 'play' },
      { question: 'She ___ (not) eat spicy food.', options: ['do not', 'does not', 'is not', 'are not'], answer: 'does not' },
      { question: 'When do we use Present Simple?', options: ['For things happening right now', 'For daily habits and facts', 'For completed past actions', 'For future plans only'], answer: 'For daily habits and facts' },
    ]
  },
  't-2': {
    title: 'Present Continuous',
    description: 'Use Present Continuous for actions happening RIGHT NOW, or temporary situations.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + am/is/are + Verb-ing + Object',
        example: 'I AM eating. She IS reading. They ARE playing cricket.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + am/is/are + not + Verb-ing + Object',
        example: 'I AM NOT sleeping. He IS NOT studying. We ARE NOT going.'
      },
      {
        name: 'Question Form',
        formula: 'Am/Is/Are + Subject + Verb-ing + Object?',
        example: 'ARE you listening? IS she coming? AM I doing this right?'
      }
    ],
    levels: [
      { question: 'Look! The baby ___.', options: ['sleep', 'sleeps', 'is sleeping', 'sleeping'], answer: 'is sleeping' },
      { question: 'They ___ not studying right now.', options: ['is', 'are', 'am', 'be'], answer: 'are' },
      { question: '___ you working on the project today?', options: ['Do', 'Is', 'Are', 'Have'], answer: 'Are' },
      { question: 'Right now, I ___ (write) a letter.', options: ['write', 'wrote', 'am writing', 'writes'], answer: 'am writing' },
      { question: 'She ___ (not) cook dinner at the moment.', options: ['is not cooking', 'does not cook', 'was not cooking', 'are not cooking'], answer: 'is not cooking' },
      { question: 'The children ___ (play) in the garden now.', options: ['plays', 'play', 'are playing', 'were playing'], answer: 'are playing' },
      { question: 'Key word for Present Continuous?', options: ['yesterday', 'always', 'right now', 'last week'], answer: 'right now' },
      { question: '"He is sleeping." — What is the helping verb?', options: ['sleeping', 'He', 'is', 'all of them'], answer: 'is' },
    ]
  },
  't-3': {
    title: 'Present Perfect',
    description: 'Use Present Perfect when a past action is connected to the present — the result is still relevant now.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + has/have + Verb3 (past participle) + Object',
        example: 'I HAVE finished my homework. She HAS eaten lunch. They HAVE arrived.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + has/have + not + Verb3 + Object',
        example: 'He HAS NOT called me. We HAVE NOT seen this movie.'
      },
      {
        name: 'Question Form',
        formula: 'Has/Have + Subject + Verb3 + Object?',
        example: 'HAVE you eaten? HAS she come? HAVE they finished?'
      }
    ],
    levels: [
      { question: 'She ___ her keys, so she cannot enter.', options: ['lost', 'loses', 'has lost', 'had lost'], answer: 'has lost' },
      { question: 'We have ___ (know) him since childhood.', options: ['know', 'knew', 'known', 'knowing'], answer: 'known' },
      { question: '___ they completed their homework?', options: ['Has', 'Have', 'Did', 'Do'], answer: 'Have' },
      { question: 'He ___ (not) arrived yet.', options: ['has not', 'have not', 'did not', 'does not'], answer: 'has not' },
      { question: 'I ___ (just) eat lunch.', options: ['eat', 'ate', 'have just eaten', 'eating'], answer: 'have just eaten' },
      { question: '"Already, just, yet, ever, never" — what tense are these used with?', options: ['Past Simple', 'Present Continuous', 'Present Perfect', 'Future Simple'], answer: 'Present Perfect' },
      { question: 'They have lived here ___ 10 years.', options: ['since', 'for', 'at', 'in'], answer: 'for' },
      { question: 'She has studied English ___ 2020.', options: ['for', 'since', 'at', 'in'], answer: 'since' },
    ]
  },
  't-4': {
    title: 'Present Perfect Continuous',
    description: 'Use this tense when something started in the past and is STILL continuing now — focus is on HOW LONG.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + has/have + been + Verb-ing + (for/since)',
        example: 'I HAVE BEEN studying for 3 hours. She HAS BEEN working since morning.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + has/have + not + been + Verb-ing',
        example: 'He HAS NOT BEEN feeling well. They HAVE NOT BEEN coming to class.'
      },
      {
        name: 'Question Form',
        formula: 'Has/Have + Subject + been + Verb-ing?',
        example: 'HAVE you been waiting long? HAS she been sleeping?'
      }
    ],
    levels: [
      { question: 'It ___ raining since morning.', options: ['is', 'has been', 'was', 'have been'], answer: 'has been' },
      { question: 'They have been working here ___ five years.', options: ['for', 'since', 'during', 'before'], answer: 'for' },
      { question: 'What ___ you been doing all afternoon?', options: ['has', 'have', 'did', 'were'], answer: 'have' },
      { question: 'I have been learning English ___ 2022.', options: ['for', 'since', 'in', 'at'], answer: 'since' },
      { question: 'She ___ been sleeping for 10 hours!', options: ['have', 'had', 'has', 'is'], answer: 'has' },
      { question: 'Which sentence uses Present Perfect Continuous CORRECTLY?', options: ['I am studying since morning.', 'I study for 2 hours.', 'I have been studying for 2 hours.', 'I studied for 2 hours.'], answer: 'I have been studying for 2 hours.' },
      { question: 'He has been ___ (wait) for an hour.', options: ['wait', 'waited', 'waiting', 'waits'], answer: 'waiting' },
      { question: 'The focus of Present Perfect Continuous is on?', options: ['A completed past action', 'How long something has been happening', 'A future plan', 'A general fact'], answer: 'How long something has been happening' },
    ]
  },
  't-5': {
    title: 'Past Simple',
    description: 'Use Past Simple for actions that STARTED and FINISHED at a specific time in the past.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + Verb2 (past form) + Object',
        example: 'I WATCHED a movie. She WENT to the market. They PLAYED cricket yesterday.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + did + not + Verb1 + Object',
        example: 'He DID NOT come. She DID NOT call me. We DID NOT eat dinner.'
      },
      {
        name: 'Question Form',
        formula: 'Did + Subject + Verb1 + Object?',
        example: 'DID you see the match? DID she pass the exam?'
      }
    ],
    levels: [
      { question: 'I ___ a movie last night.', options: ['watch', 'watched', 'watching', 'was watched'], answer: 'watched' },
      { question: 'She did not ___ to the store yesterday.', options: ['go', 'went', 'goes', 'going'], answer: 'go' },
      { question: 'Did you ___ your homework?', options: ['do', 'did', 'done', 'doing'], answer: 'do' },
      { question: 'They ___ cricket last Sunday.', options: ['play', 'plays', 'played', 'playing'], answer: 'played' },
      { question: 'He ___ (not) come to school yesterday.', options: ['did not', 'does not', 'is not', 'has not'], answer: 'did not' },
      { question: 'Key time words for Past Simple?', options: ['now, today', 'yesterday, last week, ago', 'tomorrow, next week', 'since, for'], answer: 'yesterday, last week, ago' },
      { question: 'She ___ a letter to her friend. (write → past form)', options: ['write', 'written', 'wrote', 'writes'], answer: 'wrote' },
      { question: 'What is the past form of "go"?', options: ['goed', 'goes', 'gone', 'went'], answer: 'went' },
    ]
  },
  't-6': {
    title: 'Past Continuous',
    description: 'Use Past Continuous for an action that was IN PROGRESS at a specific time in the past.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + was/were + Verb-ing + Object',
        example: 'I WAS sleeping when the phone rang. They WERE eating dinner.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + was/were + not + Verb-ing + Object',
        example: 'She WAS NOT listening. We WERE NOT driving fast.'
      },
      {
        name: 'Two Actions Together',
        formula: 'Use Past Continuous + Past Simple to show one action was interrupted by another.',
        example: 'I WAS WATCHING TV when the lights went out. (watching = background, went = interruption)'
      }
    ],
    levels: [
      { question: 'What ___ you doing when the light went out?', options: ['was', 'were', 'did', 'are'], answer: 'were' },
      { question: 'While she ___ (cook) dinner, the phone rang.', options: ['cooked', 'was cooking', 'is cooking', 'cooking'], answer: 'was cooking' },
      { question: 'I ___ sleeping when you texted me.', options: ['was', 'were', 'am', 'did'], answer: 'was' },
      { question: 'At 8 PM yesterday, they ___ (study).', options: ['studied', 'were studying', 'are studying', 'study'], answer: 'were studying' },
      { question: 'She was ___ (read) a book all afternoon.', options: ['read', 'reads', 'reading', 'readed'], answer: 'reading' },
      { question: 'Which sentence is PAST CONTINUOUS?', options: ['I ate rice.', 'She eats rice.', 'He was eating rice.', 'They have eaten rice.'], answer: 'He was eating rice.' },
      { question: 'We ___ (not) sleep when you arrived.', options: ['was not sleeping', 'were not sleeping', 'did not sleep', 'are not sleeping'], answer: 'were not sleeping' },
      { question: '"I / she / he / it" use which word in Past Continuous?', options: ['were', 'was', 'is', 'are'], answer: 'was' },
    ]
  },
  't-7': {
    title: 'Past Perfect',
    description: 'Use Past Perfect when ONE past action happened BEFORE another past action.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + had + Verb3 (past participle) + Object',
        example: 'The train HAD LEFT before we arrived. She HAD eaten before I came.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + had + not + Verb3 + Object',
        example: 'He HAD NOT finished his work. They HAD NOT met before.'
      },
      {
        name: 'Tip: Which action came first?',
        formula: 'The action that happened FIRST uses Past Perfect (had + V3). The second action uses Past Simple.',
        example: 'When I arrived, the movie HAD ALREADY STARTED. (movie started first)'
      }
    ],
    levels: [
      { question: 'When we arrived, the movie already ___.', options: ['started', 'has started', 'had started', 'was starting'], answer: 'had started' },
      { question: 'She told me that she ___ (buy) a new car.', options: ['bought', 'had bought', 'has bought', 'buys'], answer: 'had bought' },
      { question: '___ they eaten lunch before they left?', options: ['Did', 'Had', 'Have', 'Were'], answer: 'Had' },
      { question: 'By the time he arrived, I ___ (finish) my work.', options: ['finished', 'have finished', 'had finished', 'was finishing'], answer: 'had finished' },
      { question: 'She ___ (not) sleep when the storm started.', options: ['has not slept', 'did not sleep', 'had not slept', 'was not sleeping'], answer: 'had not slept' },
      { question: 'Past Perfect uses which form of the verb?', options: ['Verb1', 'Verb2', 'Verb3', 'Verb-ing'], answer: 'Verb3' },
      { question: '"had" + ___?', options: ['Verb1', 'Verb2', 'Verb3', 'Verb-ing'], answer: 'Verb3' },
      { question: 'Which sentence uses Past Perfect correctly?', options: ['She had gone to school.', 'She have gone to school.', 'She has gone to school.', 'She was gone to school.'], answer: 'She had gone to school.' },
    ]
  },
  't-8': {
    title: 'Past Perfect Continuous',
    description: 'Use this for an action that was ONGOING in the past, and ended (or still continued) before another past event.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + had + been + Verb-ing + (for/since)',
        example: 'They HAD BEEN walking for miles before stopping. She HAD BEEN studying since morning.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + had + not + been + Verb-ing',
        example: 'He HAD NOT BEEN sleeping well. I HAD NOT BEEN practicing enough.'
      },
      {
        name: 'Focus on Duration',
        formula: 'Use "for" + time period, or "since" + starting point.',
        example: 'for 2 hours, for a long time, since morning, since 2020'
      }
    ],
    levels: [
      { question: 'She was exhausted because she ___ running for hours.', options: ['is', 'has been', 'had been', 'was'], answer: 'had been' },
      { question: 'They ___ been playing tennis since morning when it started to rain.', options: ['have', 'has', 'had', 'were'], answer: 'had' },
      { question: 'How long had you been ___ (wait) before the train arrived?', options: ['wait', 'waited', 'waiting', 'waits'], answer: 'waiting' },
      { question: 'He was tired because he ___ (work) all day.', options: ['had been working', 'has been working', 'was working', 'worked'], answer: 'had been working' },
      { question: 'Past Perfect Continuous = had + been + ___', options: ['Verb1', 'Verb2', 'Verb3', 'Verb-ing'], answer: 'Verb-ing' },
      { question: 'I ___ (study) for 3 hours when my mother called me.', options: ['studied', 'was studying', 'had been studying', 'have been studying'], answer: 'had been studying' },
      { question: 'Which emphasizes DURATION in the past?', options: ['Past Simple', 'Past Continuous', 'Past Perfect', 'Past Perfect Continuous'], answer: 'Past Perfect Continuous' },
      { question: '"Had been" is used with all subjects. True or False?', options: ['True', 'False', 'Only with He/She/It', 'Only with They/We'], answer: 'True' },
    ]
  },
  't-9': {
    title: 'Future Simple',
    description: 'Use Future Simple for decisions made now, predictions, and promises about the future.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + will + Verb1 + Object',
        example: 'I WILL call you tonight. She WILL come tomorrow. They WILL pass the exam.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + will + not (won\'t) + Verb1 + Object',
        example: 'I WON\'T go there. He WILL NOT come. They WILL NOT agree.'
      },
      {
        name: 'Question Form',
        formula: 'Will + Subject + Verb1 + Object?',
        example: 'WILL you help me? WILL she be there? WILL they come?'
      }
    ],
    levels: [
      { question: 'I think it ___ rain tomorrow.', options: ['will', 'going to', 'is', 'would'], answer: 'will' },
      { question: 'They will ___ (arrive) late tonight.', options: ['arrives', 'arrive', 'arrived', 'arriving'], answer: 'arrive' },
      { question: '___ you help me with this box?', options: ['Do', 'Will', 'Are', 'Shall'], answer: 'Will' },
      { question: 'She ___ (not) come to the party.', options: ['will not', 'does not', 'is not', 'did not'], answer: 'will not' },
      { question: '"Will" is followed by which form of the verb?', options: ['Verb1', 'Verb2', 'Verb3', 'Verb-ing'], answer: 'Verb1' },
      { question: 'The negative short form of "will not" is?', options: ['wouldn\'t', 'won\'t', 'willn\'t', 'don\'t'], answer: 'won\'t' },
      { question: 'I promise I ___ study harder.', options: ['will', 'would', 'am', 'was'], answer: 'will' },
      { question: '"Probably, maybe, perhaps, I think" — these go with?', options: ['Past Simple', 'Future Simple (will)', 'Present Perfect', 'Past Continuous'], answer: 'Future Simple (will)' },
    ]
  },
  't-10': {
    title: 'Future Continuous',
    description: 'Use Future Continuous for an action that WILL BE IN PROGRESS at a specific time in the future.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + will + be + Verb-ing + Object',
        example: 'At 10 PM tonight, I WILL BE SLEEPING. This time tomorrow, she WILL BE FLYING.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + will + not + be + Verb-ing + Object',
        example: 'I WILL NOT BE COMING to the party. She WILL NOT BE WORKING tomorrow.'
      },
      {
        name: 'Question Form',
        formula: 'Will + Subject + be + Verb-ing + Object?',
        example: 'WILL you be using the car tonight? WILL she be studying?'
      }
    ],
    levels: [
      { question: 'At 10 PM tonight, I ___ sleeping.', options: ['will be', 'am', 'will have', 'be'], answer: 'will be' },
      { question: 'They will be ___ (play) cricket tomorrow afternoon.', options: ['play', 'played', 'playing', 'plays'], answer: 'playing' },
      { question: '___ she be hosting the meeting tomorrow?', options: ['Is', 'Will', 'Do', 'Has'], answer: 'Will' },
      { question: '"This time next week" signals which tense?', options: ['Past Simple', 'Present Continuous', 'Future Continuous', 'Future Perfect'], answer: 'Future Continuous' },
      { question: 'Future Continuous = will + be + ___', options: ['Verb1', 'Verb2', 'Verb3', 'Verb-ing'], answer: 'Verb-ing' },
      { question: 'She ___ (not) be joining us for dinner.', options: ['will not be', 'does not', 'is not', 'was not'], answer: 'will not be' },
      { question: 'At 9 AM tomorrow, I ___ (study) for my exam.', options: ['will study', 'will be studying', 'am studying', 'studied'], answer: 'will be studying' },
      { question: 'Which sentence is Future Continuous?', options: ['She will eat.', 'She eats.', 'She will be eating.', 'She was eating.'], answer: 'She will be eating.' },
    ]
  },
  't-11': {
    title: 'Future Perfect',
    description: 'Use Future Perfect for an action that WILL BE COMPLETED before a specific time in the future.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + will + have + Verb3 + Object',
        example: 'By Friday, I WILL HAVE FINISHED the report. By 2030, she WILL HAVE GRADUATED.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + will + not + have + Verb3 + Object',
        example: 'They WILL NOT HAVE ARRIVED by midnight. He WILL NOT HAVE FINISHED.'
      },
      {
        name: 'Key signal words',
        formula: 'by, by the time, before — these signal Future Perfect.',
        example: 'BY tomorrow, BY next year, BEFORE the meeting starts.'
      }
    ],
    levels: [
      { question: 'By next year, they ___ built the new school.', options: ['will', 'will have', 'have', 'would'], answer: 'will have' },
      { question: 'She will have ___ (finish) her degree by June.', options: ['finish', 'finished', 'finishing', 'finishes'], answer: 'finished' },
      { question: 'Will you ___ completed the project before the deadline?', options: ['have', 'be', 'has', 'had'], answer: 'have' },
      { question: 'Future Perfect = will + have + ___', options: ['Verb1', 'Verb2', 'Verb3', 'Verb-ing'], answer: 'Verb3' },
      { question: '"___ the time you arrive, I will have cooked dinner."', options: ['By', 'Since', 'For', 'At'], answer: 'By' },
      { question: 'He ___ (not) have finished by then.', options: ['will not', 'does not', 'had not', 'has not'], answer: 'will not' },
      { question: 'By tomorrow morning, the workers ___ the road.', options: ['will repair', 'will have repaired', 'are repairing', 'repaired'], answer: 'will have repaired' },
      { question: 'Which tense is: "By 5 PM, I will have submitted my assignment."?', options: ['Future Simple', 'Future Continuous', 'Future Perfect', 'Present Perfect'], answer: 'Future Perfect' },
    ]
  },
  't-12': {
    title: 'Future Perfect Continuous',
    description: 'Use this tense to show how long an action WILL HAVE BEEN IN PROGRESS by a future point.',
    difficulty: 'Medium',
    formulas: [
      {
        name: 'Positive Sentence',
        formula: 'Subject + will + have + been + Verb-ing + (for/since)',
        example: 'By next year, I WILL HAVE BEEN WORKING here for 5 years.'
      },
      {
        name: 'Negative Sentence',
        formula: 'Subject + will + not + have + been + Verb-ing',
        example: 'She WILL NOT HAVE BEEN TEACHING long before she retires.'
      },
      {
        name: 'Focus on Duration',
        formula: 'Emphasizes HOW LONG an action will have been going on up to a future moment.',
        example: 'By 2030, they will have been married for 20 years.'
      }
    ],
    levels: [
      { question: 'By 2027, they will have ___ living here for a decade.', options: ['be', 'been', 'being', 'had'], answer: 'been' },
      { question: 'By next year, I will have been ___ (learn) French for 6 months.', options: ['learn', 'learnt', 'learning', 'learns'], answer: 'learning' },
      { question: '___ you have been driving for 10 hours by midnight?', options: ['Will', 'Would', 'Shall', 'Do'], answer: 'Will' },
      { question: 'Formula: will + have + been + ___', options: ['Verb1', 'Verb2', 'Verb3', 'Verb-ing'], answer: 'Verb-ing' },
      { question: 'By the time he retires, he ___ (teach) for 30 years.', options: ['will teach', 'will be teaching', 'will have been teaching', 'has been teaching'], answer: 'will have been teaching' },
      { question: 'This tense focuses on?', options: ['A completed future action', 'The duration of an action up to a future point', 'A past habit', 'A present fact'], answer: 'The duration of an action up to a future point' },
      { question: 'Signal words for this tense?', options: ['yesterday, ago', 'now, right now', 'by, by the time + for/since', 'always, never'], answer: 'by, by the time + for/since' },
      { question: '"Will have been" is used with ALL subjects. True or False?', options: ['True', 'False', 'Only He/She', 'Only I/We'], answer: 'True' },
    ]
  },
  'v-act': {
    title: 'Active Voice',
    description: 'In Active Voice, the SUBJECT performs the action. It is direct, clear, and strong.',
    difficulty: 'Hard',
    formulas: [
      {
        name: 'Active Voice Rule',
        formula: 'Subject (doer) + Action Verb + Object (receiver)',
        example: 'Ali ATE the apple. (Ali is doing the eating) | The dog BIT the man.'
      },
      {
        name: 'Why use Active Voice?',
        formula: 'Active Voice is clearer, shorter, and more natural in everyday speech and writing.',
        example: 'Active: "The chef cooked the meal." — Clear and direct ✓'
      }
    ],
    levels: [
      { question: 'Which sentence is ACTIVE VOICE?', options: ['The cake was eaten by Ali.', 'Ali ate the cake.', 'The cake is eaten.', 'The cake had been eaten.'], answer: 'Ali ate the cake.' },
      { question: '"The teacher teaches the students." — Is this Active or Passive?', options: ['Active', 'Passive', 'Both', 'Neither'], answer: 'Active' },
      { question: 'Convert to Active: "The book was written by Asad."', options: ['Asad writes the book.', 'Asad wrote the book.', 'Asad has written the book.', 'Asad is writing the book.'], answer: 'Asad wrote the book.' },
      { question: 'In Active Voice, who performs the action?', options: ['The object', 'The subject', 'The verb', 'No one'], answer: 'The subject' },
      { question: '"Dogs bite men." — This is?', options: ['Passive Voice', 'Active Voice', 'Direct Speech', 'Indirect Speech'], answer: 'Active Voice' },
      { question: 'Convert to Active: "The car was repaired by the mechanic."', options: ['The mechanic repaired the car.', 'The car repaired the mechanic.', 'The mechanic is repairing the car.', 'The car has been repaired.'], answer: 'The mechanic repaired the car.' },
    ]
  },
  'v-pass': {
    title: 'Passive Voice',
    description: 'In Passive Voice, the OBJECT receives the action and becomes the focus.',
    difficulty: 'Hard',
    formulas: [
      {
        name: 'Active to Passive (Present Simple)',
        formula: 'Object + is/am/are + Verb3 + by + Subject',
        example: 'Active: He writes a letter. → Passive: A letter IS WRITTEN by him.'
      },
      {
        name: 'Active to Passive (Past Simple)',
        formula: 'Object + was/were + Verb3 + by + Subject',
        example: 'Active: She ate the cake. → Passive: The cake WAS EATEN by her.'
      }
    ],
    levels: [
      { question: 'Change to Passive: "He opens the door."', options: ['The door is opened by him.', 'The door opened by him.', 'The door is open by him.', 'He is opening the door.'], answer: 'The door is opened by him.' },
      { question: '"The homework has been done." — This is?', options: ['Active Voice', 'Passive Voice', 'Direct Speech', 'Future Tense'], answer: 'Passive Voice' },
      { question: 'Change to Passive: "Ali broke the window."', options: ['The window broke Ali.', 'The window was broken by Ali.', 'The window is broken by Ali.', 'Ali was breaking the window.'], answer: 'The window was broken by Ali.' },
      { question: 'Passive Voice (Present Simple) = Object + ___ + Verb3', options: ['was/were', 'is/am/are', 'has/have', 'will be'], answer: 'is/am/are' },
      { question: 'Change to Passive: "The teacher will explain the lesson."', options: ['The lesson will be explained by the teacher.', 'The lesson was explained by the teacher.', 'The teacher is explaining the lesson.', 'The lesson is explained.'], answer: 'The lesson will be explained by the teacher.' },
      { question: 'In Passive Voice, "by + agent" can be?', options: ['Always required', 'Sometimes omitted if not important', 'Never used', 'Always at the beginning'], answer: 'Sometimes omitted if not important' },
    ]
  },
  'n-dir': {
    title: 'Direct Speech',
    description: 'Direct Speech uses the EXACT words of the speaker, placed inside quotation marks.',
    difficulty: 'Hard',
    formulas: [
      {
        name: 'Punctuation Rule',
        formula: 'Reporting verb + comma + "Exact words with capital letter."',
        example: 'She said, "I am happy." | He asked, "Where are you going?"'
      },
      {
        name: 'Key Rule',
        formula: 'Always use quotation marks (" "). The first word inside quotes is capitalized. Punctuation stays INSIDE the quotes.',
        example: 'He shouted, "Stop!" ✓ | NOT: He shouted, "stop"! ✗'
      }
    ],
    levels: [
      { question: 'Which sentence is DIRECT SPEECH?', options: ['He said that he was coming.', 'He said, "I am coming."', 'He told me he is coming.', 'He came and talked to me.'], answer: 'He said, "I am coming."' },
      { question: 'Identify the correct punctuation:', options: ['She said "I like books"', 'She said, "I like books."', 'She said, I like books.', 'She said, "i like books."'], answer: 'She said, "I like books."' },
      { question: 'Which is correctly formatted?', options: ['He asked, "Where is Ali"?', 'He asked, "Where is Ali?"', 'He asked "where is Ali"?', 'He asked, "where is Ali."'], answer: 'He asked, "Where is Ali?"' },
      { question: 'She exclaimed, "___ happy I am!"', options: ['how', 'How', 'what', 'What'], answer: 'How' },
      { question: 'Which part is the "reporting clause"?', options: ['The quoted words', 'She said', 'The comma', 'The quotation marks'], answer: 'She said' },
      { question: 'In direct speech, the quoted words are always?', options: ['In brackets', 'In quotation marks', 'In italics', 'In bold'], answer: 'In quotation marks' },
    ]
  },
  'n-ind': {
    title: 'Indirect Speech',
    description: 'Indirect Speech reports what someone said WITHOUT using their exact words. No quotation marks needed.',
    difficulty: 'Hard',
    formulas: [
      {
        name: 'Tense Shift (Backshift)',
        formula: 'When you report speech, the tense usually shifts one step back into the past.',
        example: '"I am tired." → He said that he WAS tired. (am → was)'
      },
      {
        name: 'Pronoun Change',
        formula: 'Pronouns change based on who is speaking/reporting.',
        example: '"I love my job." → She said she loved HER job. (I→she, my→her)'
      }
    ],
    levels: [
      { question: 'He said, "I am tired." → He said that he ___ tired.', options: ['is', 'was', 'has been', 'will be'], answer: 'was' },
      { question: 'She says, "I will go." → She says that she ___ go.', options: ['will', 'would', 'is', 'was'], answer: 'will' },
      { question: '"I am happy." → He said that he ___ happy.', options: ['am', 'is', 'was', 'has been'], answer: 'was' },
      { question: '"We play cricket." → They said that they ___ cricket.', options: ['play', 'played', 'plays', 'playing'], answer: 'played' },
      { question: 'Indirect speech uses quotation marks. True or False?', options: ['True', 'False', 'Sometimes', 'Only in questions'], answer: 'False' },
      { question: '"I will help you." → He said that he ___ help me.', options: ['will', 'would', 'shall', 'can'], answer: 'would' },
    ]
  }
};
