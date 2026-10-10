const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { requestLog } = require('./requestLog');

function createResponse() {
  const res = new EventEmitter();
  res.statusCode = 200;
  return res;
}

test('logs completed requests as JSON', async () => {
  const originalLog = console.log;
  const lines = [];

  console.log = (line) => lines.push(line);

  try {
    const req = {
      path: '/api/products',
      method: 'GET',
    };
    const res = createResponse();
    let nextCalled = false;

    requestLog(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);

    res.emit('finish');

    assert.equal(lines.length, 1);

    const entry = JSON.parse(lines[0]);

    assert.equal(entry.method, 'GET');
    assert.equal(entry.path, '/api/products');
    assert.equal(entry.status, 200);
    assert.equal(typeof entry.ms, 'number');
    assert.equal(typeof entry.t, 'string');
  } finally {
    console.log = originalLog;
  }
});

test('skips health-check requests', () => {
  const originalLog = console.log;
  let logged = false;
  let nextCalled = false;

  console.log = () => {
    logged = true;
  };

  try {
    const req = {
      path: '/api/health',
      method: 'GET',
    };
    const res = createResponse();

    requestLog(req, res, () => {
      nextCalled = true;
    });

    res.emit('finish');

    assert.equal(nextCalled, true);
    assert.equal(logged, false);
  } finally {
    console.log = originalLog;
  }
});