import { describe, it, expect } from 'vitest';
import {
    escapeHtml,
    formatRupiah,
    renderRabHtml,
    renderResearchHtml,
    generateSummaryAttachment,
} from '../lib/documentGenerator';

describe('documentGenerator', () => {
    it('escapes HTML special characters', () => {
        const raw = '<script>alert("hello & welcome > test")</script>';
        const escaped = escapeHtml(raw);
        expect(escaped).not.toContain('<script>');
        expect(escaped).toContain('&lt;script&gt;');
        expect(escaped).toContain('&amp;');
        expect(escaped).toContain('&quot;');
    });

    it('formats numbers into Indonesian Rupiah format', () => {
        expect(formatRupiah(1500000)).toMatch(/Rp1\.500\.000|Rp1,500,000/);
        expect(formatRupiah(0)).toMatch(/Rp0/);
        expect(formatRupiah(NaN)).toBe('-');
    });

    it('renders valid structured RAB HTML document', () => {
        const rabData = {
            projectName: 'Platform E-Commerce B2B',
            features: [
                {
                    name: 'Auth & Role Management',
                    description: 'Login RBAC superadmin & client',
                    estimatedCost: 2000000,
                    estimatedDuration: '1 minggu',
                },
            ],
            totalCost: 2000000,
            totalDuration: '1 minggu',
            notes: 'Termasuk garansi 1 bulan',
        };

        const html = renderRabHtml(rabData);
        expect(html).toContain('Platform E-Commerce B2B');
        expect(html).toContain('Auth &amp; Role Management');
        expect(html).toContain('Breakdown Biaya per Fitur');
        expect(html).toContain('Termasuk garansi 1 bulan');
        expect(html).toContain('K. Arzhaning Jagad');
    });

    it('renders valid structured research HTML document', () => {
        const researchData = {
            topic: 'Analisis Pasar SaaS di Indonesia',
            findings: [
                {
                    title: 'Tingginya Kebutuhan Otomasi WhatsApp',
                    insight: 'Banyak bisnis butuh integrasi CRM langsung ke WhatsApp.',
                },
            ],
            recommendations: ['Bangun modul Webhook WA gateway.'],
        };

        const html = renderResearchHtml(researchData);
        expect(html).toContain('Analisis Pasar SaaS di Indonesia');
        expect(html).toContain('Tingginya Kebutuhan Otomasi WhatsApp');
        expect(html).toContain('Bangun modul Webhook WA gateway.');
    });

    it('generates non-empty text summary attachment with contact information', () => {
        const attachment = generateSummaryAttachment(
            [{ role: 'user', parts: [{ text: 'Halo Mas Arzha, mau konsultasi' }] }],
            'Bisa buatkan sistem realtime?',
            'Tentu, kami sangat berpengalaman di realtime architecture.',
            'Zannah'
        );

        expect(attachment.name).toContain('Rangkuman-Diskusi-Zannah');
        expect(attachment.mimeType).toBe('text/plain;charset=utf-8');
        expect(attachment.base64).toBeTruthy();

        const decoded = Buffer.from(attachment.base64, 'base64').toString('utf-8');
        expect(decoded).toContain('RANGKUMAN DISKUSI PROYEK');
        expect(decoded).toContain('K. Arzhaning Jagad');
        expect(decoded).toContain('0823-1231-2734');
        expect(decoded).toContain('Bisa buatkan sistem realtime?');
    });
});
