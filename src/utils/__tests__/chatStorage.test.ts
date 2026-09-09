import { describe, it, expect } from 'vitest';
import {
    deriveConversationTitle,
    deriveConversationTitleFromRoleContent,
} from '../chatStorage';

describe('chatStorage Title Extraction', () => {
    it('returns default title when messages are empty', () => {
        expect(deriveConversationTitle([])).toBe('Obrolan Baru');
        expect(deriveConversationTitleFromRoleContent([])).toBe('Obrolan Baru');
    });

    it('returns default title when there are no user messages', () => {
        const botMessages = [{ sender: 'model', text: 'Halo! Ada yang bisa dibantu?' }];
        expect(deriveConversationTitle(botMessages)).toBe('Obrolan Baru');
    });

    it('extracts and trims clean user title', () => {
        const messages = [
            { sender: 'model', text: 'Halo!' },
            { sender: 'user', text: '  Berapa estimasi biaya bikin chatbot?  ' },
        ];
        expect(deriveConversationTitle(messages)).toBe('Berapa estimasi biaya bikin chatbot?');
    });

    it('truncates titles longer than 40 characters with an ellipsis', () => {
        const longText = 'Saya ingin berkonsultasi mengenai pembuatan sistem audit inventaris perusahaan skala besar';
        const messages = [{ sender: 'user', text: longText }];
        const title = deriveConversationTitle(messages);
        expect(title.length).toBeLessThanOrEqual(42); // 40 chars + ellipsis
        expect(title.endsWith('…')).toBe(true);
    });

    it('correctly extracts title from role/content array', () => {
        const messages = [
            { role: 'model', content: 'Halo kak!' },
            { role: 'user', content: 'Tolong buatkan portfolio mirip mas Arzha' },
        ];
        expect(deriveConversationTitleFromRoleContent(messages)).toBe('Tolong buatkan portfolio mirip mas Arzha');
    });
});
