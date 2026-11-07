import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'club-db.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const SLOT_MAX_MB = {
  background: 100,
  audio: 10,
  avatar: 5,
  banner: 10,
  cursor: 5,
  font: 5,
  cover: 10,
  metadata: 10,
  badge: 10,
};

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.cur': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.aac': 'audio/aac',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeDb(state) {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function collectBodyBuffer(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error(`Payload exceeds limit of ${Math.round(maxBytes / (1024 * 1024))}MB`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const buf = await collectBodyBuffer(req, 15 * 1024 * 1024);
  if (!buf.length) return {};
  return JSON.parse(buf.toString('utf8'));
}

export function createClubApiMiddleware() {
  return async function clubApiMiddleware(req, res, next) {
    const rawUrl = req.url || '/';
    const parsedUrl = new URL(rawUrl, 'http://localhost');
    const pathname = parsedUrl.pathname;

    // Serve uploaded assets from /uploads/*
    if (pathname.startsWith('/uploads/') && req.method === 'GET') {
      const safeName = path.basename(pathname.slice('/uploads/'.length));
      const target = path.join(UPLOADS_DIR, safeName);
      if (!fs.existsSync(target)) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const ext = path.extname(safeName).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME_BY_EXT[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      fs.createReadStream(target).pipe(res);
      return;
    }

    if (!pathname.startsWith('/api/')) {
      next();
      return;
    }

    try {
      // GET /api/state -> returns persisted DB or { initialized: false }
      if (pathname === '/api/state' && req.method === 'GET') {
        const db = readDb();
        if (!db) {
          sendJson(res, 200, { initialized: false });
          return;
        }
        sendJson(res, 200, { initialized: true, ...db });
        return;
      }

      // POST /api/seed -> initializes DB on first boot if empty
      if (pathname === '/api/seed' && req.method === 'POST') {
        const existing = readDb();
        if (existing && Array.isArray(existing.members) && existing.members.length > 0) {
          sendJson(res, 200, { initialized: true, ...existing });
          return;
        }
        const body = await readJsonBody(req);
        const initialState = {
          club: body.club,
          members: body.members || [],
          templates: body.templates || [],
        };
        writeDb(initialState);
        sendJson(res, 200, { initialized: true, ...initialState });
        return;
      }

      // PUT /api/club -> update club header/manifesto
      if (pathname === '/api/club' && req.method === 'PUT') {
        const db = readDb() || { club: {}, members: [], templates: [] };
        const body = await readJsonBody(req);
        db.club = { ...db.club, ...body };
        writeDb(db);
        sendJson(res, 200, { club: db.club });
        return;
      }

      // POST /api/members -> create or upsert member profile
      if (pathname === '/api/members' && req.method === 'POST') {
        const db = readDb() || { club: {}, members: [], templates: [] };
        const profile = await readJsonBody(req);
        if (!profile || !profile.handle) {
          sendJson(res, 400, { error: 'Member handle is required.' });
          return;
        }
        const cleanHandle = String(profile.handle).toLowerCase().trim();
        profile.handle = cleanHandle;

        const existingIdx = db.members.findIndex((m) => m.handle === cleanHandle);
        if (existingIdx >= 0) {
          const existing = db.members[existingIdx];
          if (existing.editPin && existing.editPin !== (profile.editPin || '')) {
            sendJson(res, 403, {
              error: 'Incorrect Member Edit PIN for this profile.',
            });
            return;
          }
          db.members[existingIdx] = profile;
        } else {
          db.members.push(profile);
        }
        writeDb(db);
        sendJson(res, 200, { member: profile, members: db.members });
        return;
      }

      // DELETE /api/members/:handle
      if (pathname.startsWith('/api/members/') && req.method === 'DELETE') {
        const handle = decodeURIComponent(pathname.slice('/api/members/'.length)).toLowerCase();
        const db = readDb();
        if (!db) {
          sendJson(res, 404, { error: 'Database not initialized' });
          return;
        }
        db.members = db.members.filter((m) => m.handle !== handle);
        writeDb(db);
        sendJson(res, 200, { members: db.members });
        return;
      }

      // POST /api/telemetry/view -> record profile visit
      if (pathname === '/api/telemetry/view' && req.method === 'POST') {
        const { handle, device = 'desktop', referrer = 'Direct' } = await readJsonBody(req);
        const db = readDb();
        if (!db) {
          sendJson(res, 200, { ok: false });
          return;
        }
        const member = db.members.find(
          (m) => m.handle === handle || (Array.isArray(m.aliases) && m.aliases.includes(handle))
        );
        if (member && member.analytics) {
          member.analytics.totalViews = (member.analytics.totalViews || 0) + 1;
          member.analytics.uniqueViews = (member.analytics.uniqueViews || 0) + 1;
          if (Array.isArray(member.analytics.dailyViews) && member.analytics.dailyViews.length > 0) {
            const last = member.analytics.dailyViews[member.analytics.dailyViews.length - 1];
            last.views = (last.views || 0) + 1;
          }
          if (member.analytics.devices && device in member.analytics.devices) {
            // Keep percentage balanced or increment raw counts gently
          }
          if (Array.isArray(member.analytics.referrers) && referrer) {
            const refEntry = member.analytics.referrers.find((r) => r.source === referrer);
            if (refEntry) refEntry.count += 1;
            else member.analytics.referrers.push({ source: referrer, count: 1 });
          }
          writeDb(db);
        }
        sendJson(res, 200, { ok: true, member });
        return;
      }

      // POST /api/telemetry/click -> record social link click
      if (pathname === '/api/telemetry/click' && req.method === 'POST') {
        const { handle, linkId, platform } = await readJsonBody(req);
        const db = readDb();
        if (!db) {
          sendJson(res, 200, { ok: false });
          return;
        }
        const member = db.members.find((m) => m.handle === handle);
        if (member && member.analytics) {
          member.analytics.totalClicks = (member.analytics.totalClicks || 0) + 1;
          if (platform) {
            member.analytics.socialClicks = member.analytics.socialClicks || {};
            member.analytics.socialClicks[platform] =
              (member.analytics.socialClicks[platform] || 0) + 1;
          }
          if (Array.isArray(member.links) && linkId) {
            const lnk = member.links.find((l) => l.id === linkId);
            if (lnk) lnk.clicks = (lnk.clicks || 0) + 1;
          }
          if (Array.isArray(member.analytics.dailyViews) && member.analytics.dailyViews.length > 0) {
            const last = member.analytics.dailyViews[member.analytics.dailyViews.length - 1];
            last.clicks = (last.clicks || 0) + 1;
          }
          writeDb(db);
        }
        sendJson(res, 200, { ok: true, member });
        return;
      }

      // POST /api/templates -> publish new template
      if (pathname === '/api/templates' && req.method === 'POST') {
        const db = readDb() || { club: {}, members: [], templates: [] };
        const tpl = await readJsonBody(req);
        db.templates = [tpl, ...(db.templates || [])];
        writeDb(db);
        sendJson(res, 200, { templates: db.templates });
        return;
      }

      // POST /api/templates/use -> increment usesCount
      if (pathname === '/api/templates/use' && req.method === 'POST') {
        const { templateId } = await readJsonBody(req);
        const db = readDb();
        if (db && Array.isArray(db.templates)) {
          const found = db.templates.find((t) => t.id === templateId);
          if (found) found.usesCount = (found.usesCount || 0) + 1;
          writeDb(db);
        }
        sendJson(res, 200, { templates: db ? db.templates : [] });
        return;
      }

      // POST /api/upload?slot=avatar&filename=portrait.png (raw binary stream upload!)
      if (pathname === '/api/upload' && req.method === 'POST') {
        const slot = parsedUrl.searchParams.get('slot') || 'avatar';
        const origName = parsedUrl.searchParams.get('filename') || 'asset.bin';
        const maxMb = SLOT_MAX_MB[slot] || 10;
        const ext = path.extname(origName).toLowerCase();
        if (!MIME_BY_EXT[ext]) {
          sendJson(res, 400, {
            error: `Unsupported file extension "${ext}" for slot "${slot}".`,
          });
          return;
        }
        const buf = await collectBodyBuffer(req, maxMb * 1024 * 1024);
        const safeBase = path
          .basename(origName, ext)
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .slice(0, 32);
        const savedName = `${slot}-${Date.now()}-${safeBase || 'file'}${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, savedName), buf);
        sendJson(res, 200, {
          url: `/uploads/${savedName}`,
          slot,
          sizeBytes: buf.length,
          mediaType: MIME_BY_EXT[ext].startsWith('video/')
            ? 'video'
            : MIME_BY_EXT[ext].startsWith('audio/')
            ? 'audio'
            : 'image',
        });
        return;
      }

      sendJson(res, 404, { error: `Unknown endpoint ${pathname}` });
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
    }
  };
}
