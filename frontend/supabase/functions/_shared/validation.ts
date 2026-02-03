/**
 * Chat Message Validation Module
 * 
 * Provides security validations for chat messages:
 * - HTML/XSS sanitization
 * - URL/link detection
 * - Profanity filter
 * - Spam detection
 */

/**
 * Sanitize message content to prevent XSS
 * Removes/escapes HTML entities and dangerous characters
 */
export function sanitizeMessage(message: string): string {
  return message
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    // Remove zero-width characters (used to bypass filters)
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    // Remove control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace (collapse multiple spaces)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * URL detection regex - catches most common URL patterns
 */
const URL_PATTERNS = [
  // Standard URLs
  /https?:\/\/[^\s]+/gi,
  // URLs without protocol
  /www\.[^\s]+/gi,
  // Domain patterns (e.g., example.com, site.co.uk)
  /\b[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/gi,
  // IP addresses
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(?:\/[^\s]*)?\b/gi,
  // Crypto/wallet addresses (common patterns) - optional, can enable if needed
  // /\b0x[a-fA-F0-9]{40}\b/gi,
];

/**
 * Check if message contains URLs/links
 */
export function containsUrl(message: string): boolean {
  const normalized = message.toLowerCase();
  
  for (const pattern of URL_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
  }
  
  return false;
}

/**
 * Profanity word list - basic list of offensive words
 * Includes common leet-speak variations
 */
const PROFANITY_LIST = [
  // Severe profanity
  'fuck', 'f*ck', 'f**k', 'fck', 'fuk', 'fuq', 'fvck', 'phuck', 'phuk',
  'shit', 'sh*t', 'sh1t', 'sht', 'shyt',
  'cunt', 'c*nt', 'cvnt',
  'nigger', 'n*gger', 'n1gger', 'nigga', 'n*gga',
  'faggot', 'f*ggot', 'fag', 'f*g',
  'retard', 'retarded',
  // Moderate profanity
  'ass', 'a$$', 'a**',
  'bitch', 'b*tch', 'b1tch', 'biatch',
  'dick', 'd*ck', 'd1ck',
  'cock', 'c*ck', 'c0ck',
  'pussy', 'p*ssy',
  'whore', 'wh*re', 'wh0re',
  'slut', 'sl*t',
  // Slurs
  'kike', 'spic', 'chink', 'gook',
  // Threats
  'kill yourself', 'kys',
];

/**
 * Normalize text for profanity matching
 * Handles common leetspeak substitutions
 */
function normalizeLeetspeak(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/\*/g, '')
    .replace(/[_\-\.]/g, ''); // Remove separators
}

/**
 * Check if message contains profanity
 * Returns the matched word if found, null otherwise
 */
export function containsProfanity(message: string): string | null {
  const normalizedMessage = normalizeLeetspeak(message);
  const words = normalizedMessage.split(/\s+/);
  
  // Check each word for exact matches only (no substring matching)
  for (const badWord of PROFANITY_LIST) {
    const normalizedBadWord = normalizeLeetspeak(badWord);
    
    // Check if any word matches exactly
    if (words.includes(normalizedBadWord)) {
      return badWord;
    }
  }
  
  return null;
}

/**
 * Check if message is duplicate/spam
 * Compares with last message from same sender
 */
export function isDuplicateMessage(newMessage: string, lastMessage: string | null): boolean {
  if (!lastMessage) return false;
  
  // Normalize both for comparison
  const normalizedNew = newMessage.toLowerCase().trim();
  const normalizedLast = lastMessage.toLowerCase().trim();
  
  // Exact match
  if (normalizedNew === normalizedLast) {
    return true;
  }
  
  // Very similar (for slight variations)
  // Using simple character difference ratio
  if (normalizedNew.length > 10 && normalizedLast.length > 10) {
    const similarity = calculateSimilarity(normalizedNew, normalizedLast);
    if (similarity > 0.9) {
      return true;
    }
  }
  
  return false;
}

/**
 * Simple similarity calculation (Dice coefficient)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length < 2 || str2.length < 2) return 0;
  
  const bigrams1 = new Set<string>();
  const bigrams2 = new Set<string>();
  
  for (let i = 0; i < str1.length - 1; i++) {
    bigrams1.add(str1.substring(i, i + 2));
  }
  for (let i = 0; i < str2.length - 1; i++) {
    bigrams2.add(str2.substring(i, i + 2));
  }
  
  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) {
      intersection++;
    }
  }
  
  return (2 * intersection) / (bigrams1.size + bigrams2.size);
}

/**
 * Minimum shares required to chat (in wei)
 * 0.001 shares = 0.001 * 10^18 = 10^15 wei
 */
export const MIN_SHARES_TO_CHAT = '1000000000000000'; // 0.001 shares in wei

/**
 * Check if user has enough shares to chat
 */
export function hasEnoughShares(yesShares: string, noShares: string): boolean {
  const yes = BigInt(yesShares || '0');
  const no = BigInt(noShares || '0');
  const total = yes + no;
  const minRequired = BigInt(MIN_SHARES_TO_CHAT);
  
  return total >= minRequired;
}

/**
 * Validate message content
 * Returns error message if invalid, null if valid
 */
export function validateMessage(message: string, lastMessage: string | null): string | null {
  // Check for URLs
  if (containsUrl(message)) {
    return 'Links are not allowed in chat';
  }
  
  // Check for profanity (exact word matches only)
  const profanity = containsProfanity(message);
  if (profanity) {
    return 'Message contains inappropriate content';
  }
  
  // Check for spam (duplicate message)
  if (isDuplicateMessage(message, lastMessage)) {
    return 'Please don\'t repeat the same message';
  }
  
  return null;
}

/**
 * Full validation pipeline
 * Sanitizes and validates message
 */
export function processMessage(
  rawMessage: string, 
  lastMessage: string | null
): { sanitized: string; error: string | null } {
  const sanitized = sanitizeMessage(rawMessage);
  const error = validateMessage(sanitized, lastMessage);
  
  return { sanitized, error };
}
