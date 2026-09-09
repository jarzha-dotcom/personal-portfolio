export interface Attachment {
    name: string;
    mimeType: string;
    base64: string;
}

export interface RabFeature {
    name: string;
    description: string;
    estimatedCost: number;
    estimatedDuration: string;
}

export interface RabDocumentData {
    projectName: string;
    features: RabFeature[];
    totalCost: number;
    totalDuration: string;
    notes?: string;
}

export interface ResearchFinding {
    title: string;
    insight: string;
}

export interface ResearchDocumentData {
    topic: string;
    findings: ResearchFinding[];
    recommendations: string[];
}

export function escapeHtml(str: string): string {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function formatRupiah(n: number): string {
    if (typeof n !== 'number' || Number.isNaN(n)) return '-';
    return `Rp${n.toLocaleString('id-ID')}`;
}

export const DOCUMENT_HTML_STYLE = `
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 32px 24px; line-height: 1.55; }
  h1 { font-size: 22px; color: #0f766e; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 14px; }
  th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }
  th { background: #f0fdfa; color: #0f766e; font-weight: 600; }
  tfoot td { font-weight: 700; background: #f8fafc; }
  .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 8px; border-bottom: 2px solid #0f766e; padding-bottom: 4px; }
  ul { margin: 8px 0; padding-left: 20px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  .footer a { color: #0f766e; }
  .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; font-size: 13px; margin-top: 12px; }
`;

export function documentFooterHtml(): string {
    return `
  <div class="footer">
    <strong>K. Arzhaning Jagad (Arzha)</strong> — Indie Developer &amp; Data Specialist, 7+ tahun pengalaman<br/>
    WhatsApp: 0823-1231-2734 &middot; Email: Jarzha@gmail.com &middot; Cibitung, Bekasi<br/>
    <a href="https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20mau%20diskusi%20soal%20dokumen%20ini.">Lanjut diskusi via WhatsApp →</a>
  </div>`;
}

export function renderRabHtml(doc: RabDocumentData): string {
    const rows = doc.features
        .map(
            (f) => `
      <tr>
        <td>${escapeHtml(f.name)}</td>
        <td>${escapeHtml(f.description)}</td>
        <td>${formatRupiah(f.estimatedCost)}</td>
        <td>${escapeHtml(f.estimatedDuration)}</td>
      </tr>`
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>RAB - ${escapeHtml(doc.projectName)}</title>
<style>${DOCUMENT_HTML_STYLE}</style></head>
<body>
  <h1>📊 Rencana Anggaran Biaya (RAB)</h1>
  <div class="subtitle">Proyek: ${escapeHtml(doc.projectName)} &middot; Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

  <div class="section-title">Breakdown Biaya per Fitur</div>
  <table>
    <thead><tr><th>Fitur</th><th>Deskripsi</th><th>Estimasi Biaya</th><th>Estimasi Waktu</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2">TOTAL</td><td>${formatRupiah(doc.totalCost)}</td><td>${escapeHtml(doc.totalDuration)}</td></tr></tfoot>
  </table>

  ${doc.notes ? `<div class="notes"><strong>Catatan/Asumsi:</strong> ${escapeHtml(doc.notes)}</div>` : ''}
  ${documentFooterHtml()}
</body></html>`;
}

export function renderResearchHtml(doc: ResearchDocumentData): string {
    const findings = doc.findings
        .map(
            (f) => `
      <tr><td>${escapeHtml(f.title)}</td><td>${escapeHtml(f.insight)}</td></tr>`
        )
        .join('');
    const recs = doc.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('');

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>Riset - ${escapeHtml(doc.topic)}</title>
<style>${DOCUMENT_HTML_STYLE}</style></head>
<body>
  <h1>🔎 Riset Kompetitor / Pasar</h1>
  <div class="subtitle">Topik: ${escapeHtml(doc.topic)} &middot; Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

  <div class="section-title">Temuan Utama</div>
  <table>
    <thead><tr><th>Poin</th><th>Insight</th></tr></thead>
    <tbody>${findings}</tbody>
  </table>

  <div class="section-title">Rekomendasi</div>
  <ul>${recs}</ul>

  ${documentFooterHtml()}
</body></html>`;
}

export function renderPlainFallbackHtml(title: string, rawText: string): string {
    const paragraphs = rawText
        .split(/\n{2,}/)
        .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br/>')}</p>`)
        .join('');
    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>${DOCUMENT_HTML_STYLE}</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="subtitle">Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  ${paragraphs}
  ${documentFooterHtml()}
</body></html>`;
}

export async function extractStructuredDocument<T>(
    apiKey: string,
    extractionPrompt: string
): Promise<T | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 2048 },
            }),
        });

        clearTimeout(timeoutId);
        if (!response.ok) return null;

        const data = await response.json();
        const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        const cleaned = text.replace(/```json\s*|```/g, '').trim();
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.warn('[documentGenerator][extractStructuredDocument] Gagal:', error instanceof Error ? error.message : error);
        return null;
    }
}

export async function buildAgentDocumentAttachment(
    apiKey: string,
    replyText: string,
    action: 'estimate' | 'research'
): Promise<Attachment> {
    const dateSlug = new Date().toISOString().slice(0, 10);

    if (action === 'estimate') {
        const prompt = `Ekstrak teks RAB (Rencana Anggaran Biaya) di bawah ini menjadi JSON terstruktur. Balas HANYA dengan JSON valid, tanpa markdown/backtick/penjelasan tambahan, PERSIS format ini:
{"projectName": "<jenis/nama proyek singkat>", "features": [{"name": "<nama fitur>", "description": "<deskripsi singkat>", "estimatedCost": <angka rupiah tanpa simbol/titik>, "estimatedDuration": "<mis. '3-5 hari'>"}], "totalCost": <angka total rupiah>, "totalDuration": "<mis. '2-3 minggu'>", "notes": "<catatan/asumsi kalau ada, boleh string kosong>"}

Kalau teks di bawah gak menyebutkan breakdown per fitur secara eksplisit, buat estimasi wajar berdasarkan konteks yang ada & sebutkan itu di "notes".

--- TEKS RAB ---
${replyText.slice(0, 6000)}
--- SELESAI ---`;

        const doc = await extractStructuredDocument<RabDocumentData>(apiKey, prompt);
        if (doc && Array.isArray(doc.features) && doc.features.length > 0) {
            return {
                name: `RAB-Estimasi-${dateSlug}.html`,
                mimeType: 'text/html;charset=utf-8',
                base64: Buffer.from(renderRabHtml(doc), 'utf-8').toString('base64'),
            };
        }
        console.warn('[documentGenerator] Ekstraksi RAB gagal/kosong, fallback ke plain HTML.');
        return {
            name: `RAB-Estimasi-${dateSlug}.html`,
            mimeType: 'text/html;charset=utf-8',
            base64: Buffer.from(renderPlainFallbackHtml('📊 Rencana Anggaran Biaya (RAB)', replyText), 'utf-8').toString('base64'),
        };
    }

    const prompt = `Ekstrak teks hasil riset kompetitor/pasar di bawah ini menjadi JSON terstruktur. Balas HANYA dengan JSON valid, tanpa markdown/backtick/penjelasan tambahan, PERSIS format ini:
{"topic": "<topik riset singkat>", "findings": [{"title": "<judul temuan singkat>", "insight": "<penjelasan 1-2 kalimat>"}], "recommendations": ["<rekomendasi actionable>"]}

--- TEKS RISET ---
${replyText.slice(0, 6000)}
--- SELESAI ---`;

    const doc = await extractStructuredDocument<ResearchDocumentData>(apiKey, prompt);
    if (doc && Array.isArray(doc.findings) && doc.findings.length > 0) {
        return {
            name: `Riset-Kompetitor-Pasar-${dateSlug}.html`,
            mimeType: 'text/html;charset=utf-8',
            base64: Buffer.from(renderResearchHtml(doc), 'utf-8').toString('base64'),
        };
    }
    console.warn('[documentGenerator] Ekstraksi riset gagal/kosong, fallback ke plain HTML.');
    return {
        name: `Riset-Kompetitor-Pasar-${dateSlug}.html`,
        mimeType: 'text/html;charset=utf-8',
        base64: Buffer.from(renderPlainFallbackHtml('🔎 Riset Kompetitor / Pasar', replyText), 'utf-8').toString('base64'),
    };
}

export function generateSummaryAttachment(
    history: Array<{ role: string; parts: { text: string }[] }>,
    userMessage: string,
    botReply: string,
    botName: string
): Attachment {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const lines: string[] = [
        '================================================================',
        '  RANGKUMAN DISKUSI PROYEK - K. ARZHANING JAGAD (ARZHA)',
        '================================================================',
        `Waktu Sesi    : ${dateStr}, ${timeStr} WIB`,
        `Asisten AI    : ${botName} (AI Tech Consultant & Portfolio Assistant)`,
        'Situs Web     : https://byarzhaning.online',
        '',
        '----------------------------------------------------------------',
        '1. RINGKASAN DISKUSI & TRANSKRIP:',
        '----------------------------------------------------------------',
    ];

    if (history && history.length > 0) {
        for (const h of history) {
            const sender = h.role === 'user' ? 'Klien' : botName;
            const text = h.parts?.[0]?.text || '';
            if (text.trim()) {
                lines.push(`[${sender}]:\n${text.trim()}\n`);
            }
        }
    }
    if (userMessage.trim()) {
        lines.push(`[Klien]:\n${userMessage.trim()}\n`);
    }
    if (botReply.trim()) {
        lines.push(`[${botName}]:\n${botReply.trim()}\n`);
    }

    lines.push('----------------------------------------------------------------');
    lines.push('2. INFORMASI KONTAK PENGEMBANG (LANJUTKAN DISKUSI LANGSUNG):');
    lines.push('----------------------------------------------------------------');
    lines.push('Nama Pengembang : K. Arzhaning Jagad (Arzha)');
    lines.push('Spesialisasi    : Web, Mobile Apps, Realtime System & AI Integration');
    lines.push('Pengalaman      : 7+ Tahun Profesional (Audit Korporat + Full-Stack)');
    lines.push('WhatsApp        : 0823-1231-2734 (+6282312312734)');
    lines.push('Email           : Jarzha@gmail.com');
    lines.push('Lokasi          : Cibitung, Bekasi, Jawa Barat');
    lines.push('');
    lines.push('Link WhatsApp Langsung:');
    lines.push('https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20sudah%20konsultasi%20di%20web%20dan%20ingin%20lanjut%20diskusi%20proyek.');
    lines.push('================================================================');

    const content = lines.join('\n');
    const dateSlug = now.toISOString().slice(0, 10);
    return {
        name: `Rangkuman-Diskusi-${botName}-${dateSlug}.txt`,
        mimeType: 'text/plain;charset=utf-8',
        base64: Buffer.from(content, 'utf-8').toString('base64'),
    };
}
