require('dotenv').config();

const db = require('../db');
const repo = require('../db/actionsRepo');

const BASE = process.env.API_URL || 'http://localhost:4000';
let failed = 0;

async function call(method, path) {
const res = await fetch(BASE + path, { method });
return {
status: res.status,
body: await res.json(),
};
}

function check(name, condition) {
console.log(`${condition ? '✅' : '❌'} ${name}`);
if (!condition) failed++;
}

async function main() {
let r = await call('GET', '/api/health');
check('health returns ok', r.status === 200 && r.body.status === 'ok');

r = await call('GET', '/api/products');
check('products return data', r.status === 200 && r.body.length === 126);

r = await call('GET', '/api/inventory?sku=BLT-1003');
const gokak = r.body.find((x) => x.location === 'Gokak');
check('BLT-1003 has 9 in Gokak', !!gokak && gokak.stock === 9);

r = await call('GET', '/api/suppliers?sku=BLT-1003');
check('BLT-1003 has suppliers', r.status === 200 && r.body.length >= 1);

r = await call('GET', '/api/purchase-orders?status=Open');
check('open purchase orders exist', r.status === 200 && r.body.length >= 1);

r = await call('GET', '/api/sales?days=abc');
check('invalid days gives 400', r.status === 400);

r = await call('GET', '/api/nope');
check('unknown route gives JSON 404', r.status === 404 && !!r.body.error);

// Create a temporary action and test the approval flow.
const a = repo.createAction({
type: 'alert',
sku: 'F-101',
details: {},
evidence: {},
});

try {
r = await call('POST', '/api/actions/' + a.id + '/approve');
check('approve works', r.status === 200 && r.body.status === 'approved');

r = await call('POST', '/api/actions/' + a.id + '/approve');
check('approving twice gives 409', r.status === 409);

r = await call('POST', '/api/actions/999999/reject');
check('unknown action gives 404', r.status === 404);
} finally {
db.prepare('DELETE FROM actions WHERE id = ?').run(a.id);
}

console.log(
failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed 🎉'
);

process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
console.error(
'Could not complete the smoke test. Is `npm run dev` running?',
error.message
);
process.exitCode = 1;
});
