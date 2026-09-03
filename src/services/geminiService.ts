export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export async function sendMessageToGemini(
    history: ChatMessage[],
    newUserMessage: string
): Promise<string> {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            history,
            message: newUserMessage,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.reply) throw new Error('Respons kosong dari server');

    return data.reply;
}