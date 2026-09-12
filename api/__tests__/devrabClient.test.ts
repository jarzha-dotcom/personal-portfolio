import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callDevRABEngine, renderDevRABProposalHtml } from '../lib/devrabClient';

describe('devrabClient', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.restoreAllMocks();
        process.env = { ...originalEnv };
    });

    it('fails fast and returns null when DEVRAB_API_URL or DEVRAB_API_KEY are missing', async () => {
        delete process.env.DEVRAB_API_URL;
        delete process.env.DEVRAB_API_KEY;

        const result = await callDevRABEngine({
            clientName: 'Budi Santoso',
            projectType: 'web_app',
            projectTitle: 'E-Commerce B2B',
            projectDescription: 'Deskripsi proyek',
            features: ['Auth', 'Checkout'],
        });

        expect(result).toBeNull();
    });

    it('renders valid DevRAB proposal HTML with sanitization', () => {
        const proposal = {
            status: 'success' as const,
            proposalId: 'PRP-2026-001',
            projectTitle: 'Aplikasi Kasir POS <script>alert(1)</script>',
            totalEstimate: 12500000,
            timelineEstimate: '3-4 Minggu',
            scopeOfWork: ['Manajemen Stok', 'Integrasi QRIS'],
            previewUrl: 'https://devrab.byarzhaning.online/preview/123',
            pdfDownloadUrl: 'https://devrab.byarzhaning.online/pdf/123',
        };

        const html = renderDevRABProposalHtml(proposal);
        expect(html).toContain('PRP-2026-001');
        expect(html).toContain('Rp12.500.000');
        expect(html).toContain('Manajemen Stok');
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).toContain('https://devrab.byarzhaning.online/preview/123');
    });
});
