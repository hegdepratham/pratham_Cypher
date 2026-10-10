const test = require('node:test');
const assert = require('node:assert/strict');

const {
  numbersIn,
  numbersAreGrounded,
} = require('./grounding');

test('extracts numbers with commas and decimals', () => {
  assert.deepEqual(
    numbersIn('Stock is 27,840 and demand is 4.1'),
    [27840, 4.1]
  );
});

test('accepts numbers present in the source', () => {
  assert.equal(
    numbersAreGrounded('Stock is 27,840', 'Stock: 27840'),
    true
  );
});

test('rejects an invented number', () => {
  assert.equal(
    numbersAreGrounded('Total is 100', 'Stock: 20; demand: 5'),
    false
  );
});

test('accepts an answer containing no numbers', () => {
  assert.equal(
    numbersAreGrounded('The part needs attention.', 'Stock: 20'),
    true
  );
});

test('rejects an unsupported percentage', () => {
  assert.equal(
    numbersAreGrounded('Demand increased by 25%', 'Demand increased'),
    false
  );
});