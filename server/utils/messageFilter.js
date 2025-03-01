const OpenAI = require('openai');

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Filter and possibly rewrite messages between co-parents
 * @param {string} message - The message to filter
 * @param {string} [conversationContext] - Optional recent conversation history for context
 * @returns {Promise<Object|string>} - Filtered message or status object
 */
async function filterMessage(message, conversationContext = null) {
  console.log("Filtering message:", message);
  
  // Don't process empty messages
  if (!message || message.trim() === '') {
    return { status: 'blocked', message: 'Empty messages cannot be sent.' };
  }
  
  // Skip processing for very short, benign messages
  if (message.length <= 10 && !containsPotentiallyHarmfulContent(message)) {
    console.log("Skipping filter for short, benign message");
    return message;
  }
  
  try {
    // First use OpenAI's moderation API for efficient initial screening
    const moderation = await openai.moderations.create({ input: message });
    const moderationResult = moderation.results[0];
    
    // Log moderation results for monitoring
    console.log("Moderation categories:", moderationResult.categories);
    console.log("Moderation scores:", moderationResult.category_scores);
    
    // If no flags are raised by moderation, return the original message
    if (!moderationResult.flagged) {
      console.log("Message passed moderation check, returning original");
      return message;
    }
    
    // If message is flagged for severe content, block immediately without rewriting
    if (moderationResult.flagged && 
        (moderationResult.categories.hate || 
         moderationResult.categories.hate_threatening || 
         moderationResult.categories.self_harm || 
         moderationResult.categories.sexual || 
         moderationResult.categories.sexual_minors)) {
      return { 
        status: 'blocked', 
        message: "[BLOCKED] This message contains inappropriate content and cannot be sent. Please rewrite and try again." 
      };
    }
    
    // For messages that need more nuanced analysis, use the chat completion API
    console.log("Analyzing message content...");
    
    // Build system prompt with context if available
    let systemPrompt = `You are a communication mediator for a co-parenting application used by divorced or separated parents.

    IMPORTANT: If a message contains no negative/harmful content, return it EXACTLY as written without any changes.

When evaluating messages:
- Allow factual discussions about schedules, expenses, and child-related information
- Filter out personal attacks, threats, or inflammatory language
- Rewrite messages to maintain the core information while removing problematic language
- Preserve the original meaning when possible, but prioritize respectful communication

Examples of problematic messages and their rewrites:
1. Original: "You're always late for pickup and it's ruining our child's routine. You clearly don't care about their wellbeing."
   Rewritten: "I've noticed some delays during pickup times. Consistent timing helps maintain our child's routine. Can we work on this?"

2. Original: "I'm not paying for those dance lessons. You decided that without consulting me, so it's your problem."
   Rewritten: "I'd like to discuss the dance lessons before committing financially. Could we talk about this decision together?"

3. Original: "Tell your mother to stop feeding you junk food. She knows you have dietary restrictions."
   Rewritten: "I'm concerned about maintaining consistent dietary habits. Could we discuss our child's nutrition plan?"

4. Original: "You never follow through with anything we agree on. I'm tired of your lies."
   Rewritten: "I feel we may have different understandings of our agreements. Could we clarify expectations to ensure we're on the same page?"

Examples of messages that should NOT be changed:
1. "Hi"
2. "Good morning"
3. "I'll pick up the kids at 3pm"
4. "Can we discuss the school schedule?"
5. "The doctor's appointment is on Tuesday at 2pm"

If a message requires minor changes, rewrite it to be more neutral and constructive.
If a message is too problematic to rewrite while preserving meaning, respond exactly with:
"[BLOCKED] This message cannot be sent. Please focus on child-related matters and avoid confrontational language."

Do not include phrases like "I've rewritten this" or "here's a better version" in your response.
Simply return either the rewritten message or the blocked message notice.`;

    // Add conversation context if provided
    if (conversationContext) {
      systemPrompt += `\n\nRecent conversation context (for reference only):\n${conversationContext}`;
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7, // Slightly creative to allow for better rewrites
      max_tokens: 500  // Limit response length
    });

    const rewritten = completion.choices[0].message.content.trim();
    console.log("Original:", message);
    console.log("Rewritten:", rewritten);

    // Handle blocked messages
    if (rewritten.startsWith('[BLOCKED]')) {
      return { status: 'blocked', message: rewritten };
    }
    
    // If the message wasn't changed significantly, return the original
    // This prevents unnecessary rewrites for benign messages
    if (rewritten === message || 
        (message.length > 10 && 
         rewritten.length > 10 && 
         calculateSimilarity(message, rewritten) > 0.9)) {
      return message;
    }
    
    return rewritten;
  } catch (err) {
    console.error('AI Filter Error:', err);
    
    // On error, allow the original message through but log the error
    // This prevents message loss due to API failures
    console.warn('Allowing message to pass due to filter error');
    return message;
  }
}

/**
 * Check if a message contains potentially harmful content
 * @param {string} message - The message to check
 * @returns {boolean} - True if potentially harmful content is detected
 */
function containsPotentiallyHarmfulContent(message) {
  // List of words/phrases that might indicate harmful content
  const harmfulPatterns = [
    /\b(hate|stupid|idiot|dumb|fool)\b/i,
    /\b(never|always|every time)\b/i,
    /\b(your fault|blame|irresponsible)\b/i,
    /\b(angry|furious|mad|upset)\b/i,
    /\b(won't|refuse|denied|rejected)\b/i,
    /[!]{2,}/  // Multiple exclamation marks
  ];
  
  return harmfulPatterns.some(pattern => pattern.test(message));
}

/**
 * Calculate similarity between two strings (simple implementation)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  // Simple Jaccard similarity for quick comparison
  const set1 = new Set(str1.toLowerCase().split(' '));
  const set2 = new Set(str2.toLowerCase().split(' '));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

module.exports = { filterMessage }; 