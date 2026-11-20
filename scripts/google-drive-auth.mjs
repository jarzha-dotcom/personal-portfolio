#!/usr/bin/env node
/**
 * scripts/google-drive-auth.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Sekali jalan: mendapatkan GDRIVE_REFRESH_TOKEN untuk akun Gmail KHUSUS arsip WhatsApp.
 *
 * Prasyarat:
 *   1. Google Cloud Console → aktifkan "Google Drive API".
 *   2. OAuth consent screen → atur ke "In production" (jika tetap "Testing", refresh
 *      token kedaluwarsa tiap 7 hari). Scope drive.file tidak butuh verifikasi Google.
 *   3. Credentials → Create OAuth client ID → tipe "Desktop app".
 *   4. Isi GDRIVE_CLIENT_ID & GDRIVE_CLIENT_SECRET di .env.local.
 *
 * Jalankan:  npm run google:auth
 * Lalu login dengan akun Gmail KHUSUS (bukan akun pribadi) dan salin refresh token
 * yang dicetak ke Vercel env / .env.local.
 */

import http from 'node:http';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.GDRIVE_AUTH_PORT || 53682);
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const TIMEOUT_MS = 5 * 60 * 1000;

const clientId = (process.env.GDRIVE_CLIENT_ID || '').trim();
const clientSecret = (process.env.GDRIVE_CLIENT_SECRET || '').trim();

if (!clientId || !clientSecret) {
    console.error('✗ GDRIVE_CLIENT_ID dan GDRIVE_CLIENT_SECRET wajib diisi di .env.local terlebih dahulu.');
    process.exit(1);
}

const state = randomBytes(16).toString('hex');
const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline',
        prompt: 'consent',
        state,
    }).toString();

function page(title, body) {
    return `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
        `<body style="font-family:system-ui;max-width:520px;margin:12vh auto;padding:0 16px"><h2>${title}</h2><p>${body}</p></body>`;
}

async function exchangeCode(code) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        }).toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${data.error || res.status}: ${data.error_description || ''}`);
    return data;
}

async function describeAccount(accessToken) {
    const res = await fetch(
        'https://www.googleapis.com/drive/v3/about?fields=' + encodeURIComponent('user(emailAddress),storageQuota'),
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    return res.json();
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
    }

    const fail = (msg) => {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' }).end(page('Gagal', 'Lihat terminal untuk detailnya.'));
        console.error(`✗ ${msg}`);
        server.close();
        process.exit(1);
    };

    if (url.searchParams.get('state') !== state) return fail('Parameter state tidak cocok (kemungkinan permintaan palsu).');
    if (url.searchParams.get('error')) return fail(`Google menolak otorisasi: ${url.searchParams.get('error')}`);
    const code = url.searchParams.get('code');
    if (!code) return fail('Kode otorisasi tidak ditemukan.');

    try {
        const tokens = await exchangeCode(code);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(
            page('Berhasil ✓', 'Refresh token sudah dicetak di terminal. Tab ini boleh ditutup.')
        );

        const about = tokens.access_token ? await describeAccount(tokens.access_token) : null;
        console.log('\n✓ Otorisasi berhasil.');
        if (about?.user?.emailAddress) {
            const q = about.storageQuota || {};
            const gb = (n) => (n ? (Number(n) / 1024 ** 3).toFixed(2) + ' GB' : '?');
            console.log(`  Akun   : ${about.user.emailAddress}`);
            console.log(`  Kuota  : terpakai ${gb(q.usage)} dari ${gb(q.limit)}`);
            console.log('  (Pastikan ini akun Gmail KHUSUS, bukan akun pribadi.)');
        }

        if (!tokens.refresh_token) {
            console.error(
                '\n✗ Google tidak mengembalikan refresh_token. Cabut akses aplikasi ini di ' +
                'https://myaccount.google.com/permissions lalu jalankan ulang script ini.'
            );
            process.exitCode = 1;
        } else {
            console.log('\nSalin baris berikut ke Vercel Environment Variables / .env.local:\n');
            console.log(`GDRIVE_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
        }
    } catch (err) {
        console.error('✗ Gagal menukar kode otorisasi:', err instanceof Error ? err.message : err);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('Buka URL berikut di browser, lalu login dengan akun Gmail KHUSUS arsip WhatsApp:\n');
    console.log(authUrl + '\n');
    console.log(`Menunggu otorisasi di ${REDIRECT_URI} (batas ${TIMEOUT_MS / 60000} menit)...`);
});

setTimeout(() => {
    console.error('✗ Waktu habis tanpa otorisasi.');
    server.close();
    process.exit(1);
}, TIMEOUT_MS).unref();
