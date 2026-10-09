// Finds every number in a piece of text:
// 27,840 -> 27840, 4.1 -> 4.1
const NUMBER = /\d[\d,]*(?:\.\d+)?/g;

function numbersIn(text) {
  return (String(text).match(NUMBER) || [])
    .map((s) => parseFloat(s.replace(/,/g, '')))
    .filter((n) => Number.isFinite(n));
}

/**
 * True only if every number in `answer` also appears in `source`.
 * Normal rounding is allowed: 1.9 may be written as 2, and 4.14 as 4.1.
 */
function numbersAreGrounded(answer, source) {
  const allowed = numbersIn(source);

  const isKnown = (n) =>
    allowed.some(
      (a) =>
        Math.abs(a - n) < 0.051 ||
        (Number.isInteger(n) && Math.round(a) === n)
    );

  return numbersIn(answer).every(isKnown);
}

module.exports = {
  numbersIn,
  numbersAreGrounded,
};