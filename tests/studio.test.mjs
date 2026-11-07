import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createClubApiMiddleware } from '../server/api.mjs';

function startTestServer() {
  const middleware = createClubApiMiddleware();
  const srv = http.createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end('Unhandled');
    });
  });
  return new Promise((resolve) => {
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      resolve({ srv, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

test('Atelier Club API: seed, multi-member upsert, PIN guard, telemetry, and asset upload', async () => {
  const { srv, baseUrl } = await startTestServer();
  try {
    // 1. Seed initial state
    const seedRes = await fetch(`${baseUrl}/api/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        club: { clubName: 'Atelier Test Club' },
        members: [
          {
            handle: 'samarth',
            aliases: ['founder'],
            displayName: 'Samarth',
            editPin: '4242',
            links: [{ id: 'l1', platform: 'github', clicks: 0 }],
            analytics: {
              totalViews: 10,
              uniqueViews: 10,
              totalClicks: 0,
              dailyViews: [{ date: 'Sun', views: 10, clicks: 0 }],
              referrers: [],
              socialClicks: {},
            },
          },
        ],
        templates: [{ id: 't1', name: 'Darkroom', usesCount: 1 }],
      }),
    });
    assert.equal(seedRes.status, 200);

    // 2. Verify PIN protection blocks unauthorized overwrite
    const blockedRes = await fetch(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'samarth',
        displayName: 'Unauthorized Edit',
        editPin: '0000',
      }),
    });
    assert.equal(blockedRes.status, 403);

    // 3. Onboard a second club member
    const addRes = await fetch(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'maya',
        aliases: ['robotics'],
        displayName: 'Maya Patel',
        analytics: {
          totalViews: 1,
          uniqueViews: 1,
          totalClicks: 0,
          dailyViews: [{ date: 'Sun', views: 1, clicks: 0 }],
          referrers: [],
          socialClicks: {},
        },
      }),
    });
    assert.equal(addRes.status, 200);
    const addJson = await addRes.json();
    assert.ok(addJson.members.some((m) => m.handle === 'maya'));

    // 4. Record view via Page Alias ('founder' -> 'samarth') and social click
    const viewRes = await fetch(`${baseUrl}/api/telemetry/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: 'founder', referrer: 'github.com' }),
    });
    assert.equal(viewRes.status, 200);

    const clickRes = await fetch(`${baseUrl}/api/telemetry/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: 'samarth', linkId: 'l1', platform: 'github' }),
    });
    assert.equal(clickRes.status, 200);
    const clickJson = await clickRes.json();
    assert.ok(clickJson.member.analytics.totalClicks >= 1);

    // 5. Reject unsupported or cross-slot file extension & accept valid SVG badge upload
    const badUpload = await fetch(`${baseUrl}/api/upload?slot=badge&filename=script.exe`, {
      method: 'POST',
      body: Buffer.from('bad'),
    });
    assert.equal(badUpload.status, 400);

    const wrongSlotUpload = await fetch(`${baseUrl}/api/upload?slot=avatar&filename=track.mp3`, {
      method: 'POST',
      body: Buffer.from('audio-bytes'),
    });
    assert.equal(wrongSlotUpload.status, 400);

    const okUpload = await fetch(`${baseUrl}/api/upload?slot=badge&filename=emblem.svg`, {
      method: 'POST',
      body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    });
    assert.equal(okUpload.status, 200);
    const upJson = await okUpload.json();
    assert.ok(upJson.url.startsWith('/uploads/badge-'));
  } finally {
    srv.close();
  }
});
