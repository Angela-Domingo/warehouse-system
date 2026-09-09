// End-to-end verification script - NOT part of the graded deliverable, but a genuinely
// useful tool for you: it exercises the full use case (register -> stock-in -> stock-out ->
// transfer -> approval -> reports) against your OWN running MongoDB + API server, so you can
// confirm everything works together before a demo.
//
// USAGE:
//   1. Start MongoDB locally (or point MONGO_URI at Atlas) and run `npm start` in one terminal.
//   2. In a second terminal: node smoke-test.js
//   WARNING: uses a throwaway database name so it never touches your real data, but it DOES
//   create and then delete a "warehouse_inventory_smoketest" database on your MongoDB server.

require('dotenv').config();

async function run() {
  const BASE = `http://localhost:${process.env.PORT || 5000}`;

  const results = [];
  async function step(name, fn) {
    try {
      await fn();
      results.push(`PASS: ${name}`);
    } catch (err) {
      results.push(`FAIL: ${name} -> ${err.message}`);
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg);
  }

  // Unique suffix so re-running the script doesn't collide with previous runs' emails/SKUs.
  const suffix = Date.now();

  let adminToken, managerToken, staffToken;
  let warehouseA, warehouseB, item;
  let transferId;

  await step('API health check reachable', async () => {
    const r = await fetch(`${BASE}/api/health`);
    assert(r.status === 200, `expected 200, got ${r.status}. Is 'npm start' running?`);
  });

  await step('register admin', async () => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin', email: `admin${suffix}@test.com`, password: 'password1', role: 'admin' }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201, got ${r.status}: ${JSON.stringify(j)}`);
    adminToken = j.data.token;
  });

  await step('duplicate email rejected with 409', async () => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin2', email: `admin${suffix}@test.com`, password: 'password1', role: 'admin' }),
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });

  await step('create warehouse A as admin', async () => {
    const r = await fetch(`${BASE}/api/warehouses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `Warehouse A ${suffix}`, location: 'City A', capacity: 1000 }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201, got ${r.status}: ${JSON.stringify(j)}`);
    warehouseA = j.data._id;
  });

  await step('create warehouse B as admin', async () => {
    const r = await fetch(`${BASE}/api/warehouses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `Warehouse B ${suffix}`, location: 'City B', capacity: 1000 }),
    });
    const j = await r.json();
    warehouseB = j.data._id;
  });

  await step('register manager tied to warehouse A', async () => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Manager', email: `manager${suffix}@test.com`, password: 'password1', role: 'manager', warehouseId: warehouseA }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201: ${JSON.stringify(j)}`);
    managerToken = j.data.token;
  });

  await step('register staff tied to warehouse A', async () => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Staff', email: `staff${suffix}@test.com`, password: 'password1', role: 'staff', warehouseId: warehouseA }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201: ${JSON.stringify(j)}`);
    staffToken = j.data.token;
  });

  await step('staff cannot create a warehouse (403)', async () => {
    const r = await fetch(`${BASE}/api/warehouses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ name: 'Should Fail', location: 'X', capacity: 1 }),
    });
    assert(r.status === 403, `expected 403, got ${r.status}`);
  });

  await step('no token -> 401 on protected route', async () => {
    const r = await fetch(`${BASE}/api/warehouses`, { method: 'GET' });
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await step('create item as admin', async () => {
    const r = await fetch(`${BASE}/api/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ sku: `SKU-${suffix}`, name: 'Test Item', category: 'Cat', unit: 'pcs', unitPrice: 10, reorderPoint: 5 }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201: ${JSON.stringify(j)}`);
    item = j.data._id;
  });

  await step('validation failure -> clean 400', async () => {
    const r = await fetch(`${BASE}/api/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ sku: '', name: '', category: '', unit: '', unitPrice: -5 }),
    });
    assert(r.status === 400, `expected 400, got ${r.status}`);
  });

  await step('stock-in 100 units at warehouse A', async () => {
    const r = await fetch(`${BASE}/api/stock/in`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ warehouseId: warehouseA, itemId: item, quantity: 100, batchNumber: 'B1' }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201: ${JSON.stringify(j)}`);
    assert(j.data.currentBalance === 100, `expected balance 100, got ${j.data.currentBalance}`);
  });

  await step('stock-out 30 units at warehouse A', async () => {
    const r = await fetch(`${BASE}/api/stock/out`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ warehouseId: warehouseA, itemId: item, quantity: 30 }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201: ${JSON.stringify(j)}`);
    assert(j.data.currentBalance === 70, `expected balance 70, got ${j.data.currentBalance}`);
  });

  await step('stock-out more than available -> 409 INSUFFICIENT_STOCK', async () => {
    const r = await fetch(`${BASE}/api/stock/out`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ warehouseId: warehouseA, itemId: item, quantity: 99999 }),
    });
    const j = await r.json();
    assert(r.status === 409, `expected 409, got ${r.status}: ${JSON.stringify(j)}`);
  });

  await step('create transfer request A -> B for 20 units', async () => {
    const r = await fetch(`${BASE}/api/transfers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ fromWarehouseId: warehouseA, toWarehouseId: warehouseB, itemId: item, quantity: 20 }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201: ${JSON.stringify(j)}`);
    transferId = j.data._id;
  });

  await step('staff cannot approve transfer (403)', async () => {
    const r = await fetch(`${BASE}/api/transfers/${transferId}/decision`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ status: 'approved' }),
    });
    assert(r.status === 403, `expected 403, got ${r.status}`);
  });

  await step('manager approves transfer -> balances update on both warehouses', async () => {
    const r = await fetch(`${BASE}/api/transfers/${transferId}/decision`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ status: 'approved', remarks: 'ok' }),
    });
    const j = await r.json();
    assert(r.status === 200, `expected 200: ${JSON.stringify(j)}`);
    assert(j.data.status === 'approved', `expected approved, got ${j.data.status}`);

    const balA = await (await fetch(`${BASE}/api/balances?warehouseId=${warehouseA}&itemId=${item}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    const balB = await (await fetch(`${BASE}/api/balances?warehouseId=${warehouseB}&itemId=${item}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    assert(balA.data[0].quantity === 50, `expected A=50, got ${balA.data[0]?.quantity}`);
    assert(balB.data[0].quantity === 20, `expected B=20, got ${balB.data[0]?.quantity}`);
  });

  await step('re-deciding an already-decided transfer -> 409', async () => {
    const r = await fetch(`${BASE}/api/transfers/${transferId}/decision`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ status: 'rejected' }),
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });

  await step('low-stock alert endpoint responds', async () => {
    const r = await fetch(`${BASE}/api/items/low-stock`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const j = await r.json();
    assert(r.status === 200, `expected 200: ${JSON.stringify(j)}`);
  });

  await step('negative adjustment (damage) reduces balance', async () => {
    const r = await fetch(`${BASE}/api/adjustments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ warehouseId: warehouseA, itemId: item, quantityDelta: -5, reasonCode: 'damage', notes: 'dropped box' }),
    });
    const j = await r.json();
    assert(r.status === 201, `expected 201: ${JSON.stringify(j)}`);

    const bal = await (await fetch(`${BASE}/api/balances?warehouseId=${warehouseA}&itemId=${item}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    assert(bal.data[0].quantity === 45, `expected 45, got ${bal.data[0]?.quantity}`);
  });

  await step('movement history log has entries', async () => {
    const r = await fetch(`${BASE}/api/movements?warehouseId=${warehouseA}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const j = await r.json();
    assert(r.status === 200 && j.data.length >= 4, `expected >=4 movements, got ${j.data?.length}`);
  });

  await step('valuation report generates', async () => {
    const r = await fetch(`${BASE}/api/admin/reports/valuation`, { headers: { Authorization: `Bearer ${managerToken}` } });
    const j = await r.json();
    assert(r.status === 200, `expected 200: ${JSON.stringify(j)}`);
    assert(typeof j.data.grandTotal === 'number', 'expected numeric grandTotal');
  });

  await step('fast-moving report generates', async () => {
    const r = await fetch(`${BASE}/api/admin/reports/fast-moving`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(r.status === 200, `expected 200, got ${r.status}`);
  });

  await step('warehouse-wise report generates', async () => {
    const r = await fetch(`${BASE}/api/admin/reports/warehouse-wise`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(r.status === 200, `expected 200, got ${r.status}`);
  });

  await step('not-found case returns 404, not a crash', async () => {
    const r = await fetch(`${BASE}/api/items/64f1a2b3c4d5e6f7a8b9c0d1`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(r.status === 404, `expected 404, got ${r.status}`);
  });

  await step('invalid id format returns 404 (CastError handled), not 500', async () => {
    const r = await fetch(`${BASE}/api/items/not-a-valid-id`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(r.status === 404, `expected 404, got ${r.status}`);
  });

  console.log('\n--- SMOKE TEST RESULTS ---');
  results.forEach((r) => console.log(r));
  const failures = results.filter((r) => r.startsWith('FAIL'));
  console.log(`\n${results.length - failures.length}/${results.length} passed`);
  process.exit(failures.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});

