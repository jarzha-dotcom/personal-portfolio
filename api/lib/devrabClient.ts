// api/lib/devrabClient.ts
// Service Client untuk menghubungkan Zannah AI dengan DevRAB Engine

export interface DevRABProposalRequest {
  clientName: string;
  projectType: string;
  projectTitle: string;
  projectDescription: string;
  features: string[];
  targetPlatform?: string[];
  estimatedTimeline?: string;
  budgetPreference?: string;
  clientInfo?: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  };
}

export interface DevRABMilestone {
  phase: string;
  percentage: number;
  nominal: number;
}

export interface DevRABProposalResponse {
  status: 'success' | 'error';
  proposalId?: string;
  projectTitle?: string;
  totalEstimate?: number;
  timelineEstimate?: string;
  milestones?: DevRABMilestone[];
  scopeOfWork?: string[];
  previewUrl?: string;
  pdfDownloadUrl?: string;
  message?: string;
}

/**
 * Kirim 'silent ping' ke DevRAB Engine untuk membangunkan instance server (pre-warming cold start).
 * Dipanggil di background saat user mulai membahas proyek/estimasi.
 */
export async function pingDevRABEngine(): Promise<void> {
  const apiUrl = process.env.DEVRAB_API_URL || 'https://devrab.byarzhaning.online/api/v1/generate-proposal';
  try {
    const pingUrl = new URL(apiUrl).origin;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    await fetch(pingUrl, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => { });
    clearTimeout(timeoutId);
    console.log('[devrabClient] Pre-warming ping sent to DevRAB host');
  } catch {
    // Abaikan error ping karena sifatnya hanya background warm-up
  }
}

export async function callDevRABEngine(
  payload: DevRABProposalRequest,
  timeoutMs = 25000,
  maxRetries = 2
): Promise<DevRABProposalResponse | null> {
  const apiUrl = process.env.DEVRAB_API_URL;
  const apiKey = process.env.DEVRAB_API_KEY;

  // Normalisasi payload untuk keamanan skema
  const cleanPayload: DevRABProposalRequest = {
    clientName: payload.clientName || 'Calon Klien Portofolio',
    projectType: payload.projectType || 'web_app',
    projectTitle: payload.projectTitle || 'Pengembangan Aplikasi Web / Mobile',
    projectDescription: payload.projectDescription || 'Sistem aplikasi terintegrasi',
    features: Array.isArray(payload.features) && payload.features.length > 0
      ? payload.features
      : ['Sistem aplikasi terintegrasi'],
    targetPlatform: payload.targetPlatform || ['Web'],
    estimatedTimeline: payload.estimatedTimeline || '4-6 minggu',
    budgetPreference: payload.budgetPreference || 'standard',
    clientInfo: payload.clientInfo,
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 1500;
      console.log(`[devrabClient] Percobaan ulang ke-${attempt} setelah ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(cleanPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[devrabClient][attempt ${attempt + 1}] HTTP ${res.status} dari DevRAB: ${res.statusText}`);
        if (res.status >= 500 && attempt < maxRetries) {
          continue; // Retry on 5xx server errors
        }
        if (attempt === maxRetries) return null;
        continue;
      }

      const data = (await res.json()) as DevRABProposalResponse;
      if (data.status === 'success' && data.proposalId) {
        console.log(`[devrabClient] Berhasil generate proposal DevRAB (attempt ${attempt + 1}): ${data.proposalId}`);
        return data;
      }

      console.warn(`[devrabClient][attempt ${attempt + 1}] DevRAB mengembalikan non-success:`, data);
      if (attempt === maxRetries) return null;
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      console.error(`[devrabClient][attempt ${attempt + 1}] Gagal menghubungi DevRAB:`, isTimeout ? `Timeout ${timeoutMs}ms` : err?.message || err);
      if (attempt === maxRetries) return null;
    }
  }

  return null;
}

function formatRupiah(n: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-';
  return `Rp${n.toLocaleString('id-ID')}`;
}

// Escape nilai dinamis sebelum ditulis ke HTML mentah. Konten proposal (title,
// scopeOfWork, dst.) pada akhirnya berasal dari input pengguna di chat Zannah AI,
// jadi harus dianggap tidak tepercaya -- tanpa ini, tag/script bisa lolos ke HTML
// hasil render (XSS).
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Batasi href hanya ke http(s) yang valid -- mencegah skema seperti javascript:
// dan mencegah nilai lolos keluar dari atribut href="...".
function safeHref(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return escapeHtml(parsed.toString());
    }
  } catch {
    // fallthrough
  }
  return escapeHtml(fallback);
}

export function renderDevRABProposalHtml(proposal: DevRABProposalResponse): string {
  const rawTitle = proposal.projectTitle || 'Penawaran Pengembangan Proyek';
  const rawProposalId = proposal.proposalId || 'RAB-DEV';
  const title = escapeHtml(rawTitle);
  const total = proposal.totalEstimate ? formatRupiah(proposal.totalEstimate) : 'Sesuai Diskusi';
  const timeline = escapeHtml(proposal.timelineEstimate || '4-6 Minggu');
  const previewUrl = safeHref(proposal.previewUrl || 'https://devrab.byarzhaning.online', 'https://devrab.byarzhaning.online');
  const pdfUrl = safeHref(proposal.pdfDownloadUrl || `${previewUrl}/print`, `${previewUrl}/print`);
  const proposalId = escapeHtml(rawProposalId);

  const sowList = (proposal.scopeOfWork || [])
    .map((s) => `<li><strong>${escapeHtml(s)}</strong></li>`)
    .join('');

  const milestonesRows = (proposal.milestones || [])
    .map(
      (m) => `
      <tr>
        <td><strong>${escapeHtml(m.phase)}</strong></td>
        <td style="text-align: center;">${escapeHtml(m.percentage)}%</td>
        <td style="text-align: right; font-weight: 600;">${formatRupiah(m.nominal)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>RAB &amp; Proposal - ${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 32px 24px; line-height: 1.6; background-color: #f8fafc; }
    .card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px; }
    h1 { font-size: 22px; color: #0f172a; margin: 12px 0 4px; font-weight: 800; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .hero-stat { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .stat-box small { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .stat-box strong { font-size: 18px; color: #0f172a; }
    .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 10px; border-bottom: 2px solid #6366f1; padding-bottom: 4px; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 14px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #4f46e5; color: #ffffff; }
    .btn-primary:hover { background: #4338ca; }
    .btn-secondary { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #f1f5f9; }
    .btn-whatsapp { background: #10b981; color: #ffffff; }
    .btn-whatsapp:hover { background: #059669; }
    .footer { margin-top: 28px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">DEVRAB AI &middot; ${proposalId}</span>
    <h1>${title}</h1>
    <div class="subtitle">Disusun otomatis secara transparan untuk calon klien Mas Arzha &middot; ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

    <div class="hero-stat">
      <div class="stat-box">
        <small>Estimasi Nilai Proyek</small>
        <strong style="color: #4f46e5;">${total}</strong>
      </div>
      <div class="stat-box">
        <small>Estimasi Timeline Pengerjaan</small>
        <strong>${timeline}</strong>
      </div>
    </div>

    ${sowList ? `<div class="section-title">Lingkup Pekerjaan Utama (Scope of Work)</div><ul>${sowList}</ul>` : ''}

    ${milestonesRows ? `
    <div class="section-title">Termin Pembayaran (Milestones)</div>
    <table>
      <thead>
        <tr>
          <th>Fase Pengerjaan</th>
          <th style="text-align: center; width: 100px;">Termin</th>
          <th style="text-align: right; width: 160px;">Nominal</th>
        </tr>
      </thead>
      <tbody>${milestonesRows}</tbody>
    </table>` : ''}

    <div class="actions">
      <a href="${previewUrl}" target="_blank" class="btn btn-primary">🌐 Buka Portal Interaktif &amp; Simulasi Fitur</a>
      <a href="${pdfUrl}" target="_blank" class="btn btn-secondary">📄 Cetak / Unduh PDF</a>
      <a href="https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20sudah%20lihat%20proposal%20RAB%20(${encodeURIComponent(rawProposalId)}):%20${encodeURIComponent(rawTitle)}.%20Bisa%20diskusi%20lebih%20lanjut?" target="_blank" class="btn btn-whatsapp">💬 Lanjut Diskusi WhatsApp</a>
    </div>

    <div class="footer">
      <strong>K. Arzhaning Jagad (Arzha)</strong> &mdash; Full-Stack Developer &amp; Data Specialist<br/>
      WhatsApp: 0823-1231-2734 &middot; Email: Jarzha@gmail.com &middot; Cibitung, Bekasi
    </div>
  </div>
</body>
</html>`;
}