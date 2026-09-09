import { describe, it, expect } from 'vitest';
import {
    detectAgentIntent,
    detectCrossPersonaIntent,
    sanitizeUploadedFiles,
} from '../lib/intentDetector';

describe('intentDetector', () => {
    it('detects file_analysis when files are uploaded', () => {
        expect(detectAgentIntent('Tolong baca ini', true, 'zannah')).toBe('file_analysis');
        expect(detectAgentIntent('Tolong baca ini', true, 'rajendra')).toBe('file_analysis');
    });

    it('detects live_demo intent for Rajendra persona', () => {
        expect(detectAgentIntent('Bisa gak bikin fitur realtime auction?', false, 'rajendra')).toBe('live_demo');
        expect(detectAgentIntent('Tolong buatin proof of concept sistem ini', false, 'rajendra')).toBe('live_demo');
    });

    it('detects research and estimate intent for Zannah persona', () => {
        expect(detectAgentIntent('Tolong cari riset terbaru kompetitor chatbot', false, 'zannah')).toBe('research');
        expect(detectAgentIntent('Bisa buatkan dokumen RAB proyek website?', false, 'zannah')).toBe('estimate');
    });

    it('detects cross-persona intent when appropriate', () => {
        const cross1 = detectCrossPersonaIntent('Tolong buatkan dokumen RAB anggaran web', 'rajendra');
        expect(cross1).not.toBeNull();
        expect(cross1?.ownerPersona).toBe('zannah');
        expect(cross1?.action).toBe('estimate');

        const cross2 = detectCrossPersonaIntent('Bisa gak bikin prototype app realtime?', 'zannah');
        expect(cross2).not.toBeNull();
        expect(cross2?.ownerPersona).toBe('rajendra');
        expect(cross2?.action).toBe('live_demo');
    });

    it('sanitizes uploaded files and filters invalid formats', () => {
        const validPng = {
            mimeType: 'image/png',
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            name: 'screenshot.png',
        };
        const invalidExe = {
            mimeType: 'application/x-msdownload',
            data: 'dummy',
            name: 'virus.exe',
        };

        const result = sanitizeUploadedFiles([validPng, invalidExe]);
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('screenshot.png');
        expect(result[0].mimeType).toBe('image/png');
    });
});
