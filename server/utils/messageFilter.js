const OpenAI = require('openai');

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to filter and possibly rewrite messages
async function filterMessage(message) {
  console.log("Filtering message:", message);
  try {
    // Moderation check (for logging purposes)
    const moderation = await openai.moderations.create({ input: message });
    console.log("Moderation insight:", moderation);

    // Rewrite message if needed
    console.log("Rewriting message...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a communication mediator between a divorced couple.
Evaluate messages for harmful, abusive, or manipulative content.
If harmful, rewrite the message; otherwise, leave it unchanged.
Do not include the words "rewritten" or "rewrite" in the response.
If a message is too harmful, respond exactly with:
"[BLOCKED] This message cannot be sent. Please rewrite and try again."`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const rewritten = completion.choices[0].message.content;
    console.log("Original:", message);
    console.log("Rewritten:", rewritten);

    if (rewritten.startsWith('[BLOCKED]')) {
      return { status: 'blocked', message: rewritten };
    }
    return rewritten;
  } catch (err) {
    console.error('AI Filter Error:', err);
    return "[Message filtered due to error]";
  }
}

module.exports = { filterMessage }; 