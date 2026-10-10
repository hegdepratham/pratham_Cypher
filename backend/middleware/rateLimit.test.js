const test = require('node:test');
const assert = require('node:assert/strict');
const { rateLimit } = require('./rateLimit');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,

    set(name, value) {
      this.headers[name] = value;
      return this;
    },

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('allows requests within the configured limit', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2 });

  for (let i = 0; i < 2; i++) {
    const req = { ip: '127.0.0.1' };
    const res = createResponse();
    let nextCalled = false;

    limiter(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  }
});

test('rejects requests exceeding the limit with HTTP 429', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });

  limiter({ ip: '192.0.2.1' }, createResponse(), () => {});

  const res = createResponse();
  let nextCalled = false;

  limiter({ ip: '192.0.2.1' }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.ok(Number(res.headers['Retry-After']) > 0);
  assert.match(res.body.error, /Too many requests/);
});

test('tracks different visitors separately', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });

  limiter({ ip: '192.0.2.10' }, createResponse(), () => {});

  const res = createResponse();
  let nextCalled = false;

  limiter({ ip: '192.0.2.11' }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});