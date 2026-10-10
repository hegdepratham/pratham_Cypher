const { chat, isConfigured } = require('./groq');
const { numbersAreGrounded } = require('./grounding');

const SYSTEM = `You write short explanations for the head of purchasing at an auto-parts and hydraulics distributor in North Karnataka (Kaveri Spares & Hydraulics).
You receive a JSON object with facts about a problem that a stock-checking system found, and the action it drafted for a person to approve.

Rules:
- Write 2 or 3 plain sentences. No bullet points, no markdown, no headings.
- Use ONLY numbers that appear in the JSON. Never calculate new numbers, totals or percentages. Never guess.
- Write money in rupees like ₹27,840. Never use the words lakh or crore.
- Say what is wrong and how soon it matters, which option was chosen, and why it beats the option that was rejected.
- If the facts say there is an unavoidable gap or an extra cost, say so plainly.
- Name the part and the place (for example "Return Line Filter at Gokak").
- Do not say that approval is needed. The screen already shows that.`;

function buildFacts(action) {
  const {
    key,
    score,
    rank,
    top3,
    ...evidence
  } = action.evidence || {};

  return JSON.stringify({
    sku: action.sku,
    action_type: action.type,
    drafted_action: action.details || {},
    evidence,
    plain_summary: action.explanation || '',
  });
}

function clean(text) {
  return String(text)
    .replace(/[*#`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function explainAction(action) {
  if (!isConfigured()) return null;

  try {
    const facts = buildFacts(action);

    const text = clean(
      await chat({
        system: SYSTEM,
        user: `Facts:\n${facts}`,
        maxTokens: 220,
        timeoutMs: 8000,
      })
    );

    if (!text || text.length > 700) {
      console.warn(
        `explain: unusable answer for ${action.sku}, keeping fallback`
      );
      return null;
    }

    if (!numbersAreGrounded(text, facts)) {
      console.warn(
        `explain: answer for ${action.sku} contained a number not in the data, keeping fallback`
      );
      return null;
    }

    return text;
  } catch (err) {
    console.warn(
      `explain: skipped for ${action && action.sku}: ${err.status || ''} ${err.message}`
    );
    return null;
  }
}

module.exports = { explainAction };