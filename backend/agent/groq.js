const OpenAI = require('openai');

// Read environment variables when called, not when this module loads.
const model = () =>
  process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const isConfigured = () => Boolean(process.env.GROQ_API_KEY);

let client = null;

function getClient() {
  if (!isConfigured()) return null;

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      maxRetries: 0,
    });
  }

  return client;
}

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Limit simultaneous AI calls to protect the free-tier rate limit.
const MAX_PARALLEL = 3;
let running = 0;
const waiting = [];

function limited(task) {
  return new Promise((resolve, reject) => {
    const start = () => {
      running++;

      task()
        .then(resolve, reject)
        .finally(() => {
          running--;

          const next = waiting.shift();
          if (next) next();
        });
    };

    if (running < MAX_PARALLEL) {
      start();
    } else {
      waiting.push(start);
    }
  });
}

async function callOnce({
  system,
  user,
  maxTokens,
  timeoutMs,
  temperature,
}) {
  const c = getClient();

  if (!c) {
    throw Object.assign(
      new Error('GROQ_API_KEY is not set'),
      { code: 'NO_KEY' }
    );
  }

const body = {
  model: model(),
  temperature,
  max_tokens: maxTokens,
  reasoning_effort: 'low',
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ],
};
  // Retry once for rate limits and server-side errors.
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await c.chat.completions.create(body, {
        timeout: timeoutMs,
      });

      return (
        (
          res.choices[0] &&
          res.choices[0].message &&
          res.choices[0].message.content
        ) || ''
      ).trim();
    } catch (err) {
      const retryable =
        err.status === 429 || err.status >= 500;

      if (attempt >= 2 || !retryable) {
        throw err;
      }

      await sleep(1500);
    }
  }
}

function chat({
  system,
  user,
  maxTokens = 220,
  timeoutMs = 8000,
  temperature = 0.2,
}) {
  return limited(() =>
    callOnce({
      system,
      user,
      maxTokens,
      timeoutMs,
      temperature,
    })
  );
}

module.exports = {
  chat,
  isConfigured,
};