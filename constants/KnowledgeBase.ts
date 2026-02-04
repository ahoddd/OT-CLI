/**
 * OrbTap Knowledge Base — Fun facts + motivational quotes.
 * Curated pool for offline/fallback; AI-ready via KnowledgeService when API key is set.
 */

export type KnowledgeItemType = 'fact' | 'quote';

export interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  /** Main text: fact or quote content */
  text: string;
  /** For quotes: author name */
  author?: string;
  /** Optional fun fact or context (e.g. "Gandhi said this during the Salt March.") */
  funFact?: string;
  /** Source hint for attribution (e.g. "Quotable") */
  source?: string;
}

/** Curated fun facts — high-quality, interesting, shareable */
export const CURATED_FACTS: string[] = [
  "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that's still edible.",
  "Octopuses have three hearts. Two pump blood to the gills, one to the body.",
  "Bananas are berries; strawberries are not. Botanically, berries develop from one flower with one ovary.",
  "A day on Venus is longer than its year. 243 Earth days to rotate, 225 to orbit the Sun.",
  "Wombat poop is cube-shaped — it doesn't roll away and marks territory.",
  "There are more trees on Earth than stars in the Milky Way (~3 trillion vs ~100–400 billion).",
  "The Eiffel Tower grows up to 15 cm taller in summer due to thermal expansion.",
  "A group of flamingos is called a flamboyance.",
  "The shortest war in history lasted 38 minutes: Britain vs Zanzibar, 1896.",
  "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
  "Sloths can hold their breath longer than dolphins by slowing their heart rate to one-third.",
  "The unicorn is the national animal of Scotland.",
  "A single cloud can weigh more than a million pounds.",
  "Nintendo was founded in 1889 as a playing card company.",
  "A species of jellyfish (Turritopsis dohrnii) is biologically immortal.",
  "Blue whales eat roughly half a million calories in one mouthful.",
  "Avocados are toxic to most animals; humans (and some sloths) are exceptions.",
  "The total weight of ants on Earth has been estimated to match the total weight of humans.",
  "You can't hum while holding your nose closed. Try it.",
  "Marie Curie is the only person to win Nobel Prizes in two different sciences (Physics and Chemistry).",
  "A bolt of lightning is about five times hotter than the surface of the Sun.",
  "The first computer mouse was made of wood.",
  "Cows have best friends and get stressed when they're separated.",
  "The inventor of the Pringles can is buried in one.",
  "A single strand of spaghetti is called a spaghetto.",
  "The dot over the letter 'i' is called a tittle.",
  "The longest English word without a vowel is 'rhythms'.",
  "Humans are the only animals that blush.",
  "A 'jiffy' is an actual unit of time: 1/100th of a second.",
  "The first oranges weren't orange — they were green.",
  "Polar bears have black skin under their white fur.",
  "The world's oldest known recipe is for beer.",
  "A day on Mars is about 24 hours and 37 minutes.",
  "The average person will walk the equivalent of three times around the world in a lifetime.",
  "The Hawaiian alphabet has only 12 letters.",
  "A group of crows is called a murder.",
  "The first product to have a barcode was Wrigley's gum.",
  "Lightning strikes the Earth about 8.6 million times per day.",
  "The smell of rain is called petrichor.",
  "A single cloud can hold millions of gallons of water.",
  "The first video ever uploaded to YouTube was 'Me at the zoo' in 2005.",
  "The opposite sides of a dice always add up to seven.",
  "Your brain uses about 20% of your body's total energy.",
  "The shortest commercial flight in the world is under 2 minutes (Scotland).",
  "There are more possible iterations of a game of chess than atoms in the observable universe.",
  "A 'moment' was historically 90 seconds.",
  "The first alarm clock could only ring at 4 a.m.",
  "Penguins can jump up to 6 feet in the air.",
  "The world's quietest room is so quiet you can hear your own organs.",
];

/** Motivational quotes — positive, exciting, attributed. Optional funFact for context. */
export const CURATED_QUOTES: Omit<KnowledgeItem, 'id' | 'type'>[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", funFact: "Jobs said this in his famous Stanford commencement speech in 2005." },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
  { text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett" },
  { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The only way to achieve the impossible is to believe it is possible.", author: "Charles Kingsleigh" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Try not to become a person of success, but rather try to become a person of value.", author: "Albert Einstein" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
  { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's not the load that breaks you down, it's the way you carry it.", author: "Lou Holtz" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
];

function withIds(): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  let i = 0;
  for (const t of CURATED_FACTS) {
    items.push({ id: `curated-fact-${i++}`, type: 'fact', text: t, source: 'OrbTap' });
  }
  for (const q of CURATED_QUOTES) {
    items.push({ id: `curated-quote-${i++}`, type: 'quote', ...q, source: 'OrbTap' });
  }
  return items;
}

export const CURATED_KNOWLEDGE = withIds();
