import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Send,
  User,
  Bot,
  UserCheck,
  PauseCircle,
  PlayCircle,
  Loader2,
  Clock,
  ArrowLeft,
  CheckCheck,
} from 'lucide-react';

interface WaInboxContact {
  phone: string;
  name?: string;
  lastMessage: string;
  lastAt: number;
  unread: boolean;
}

interface WaChatTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface WaInboxTabProps {
  pin: string;
}

export const WaInboxTab: React.FC<WaInboxTabProps> = ({ pin }) => {
  const [contacts, setContacts] = useState<WaInboxContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<WaInboxContact | null>(null);

  const [turns, setTurns] = useState<WaChatTurn[]>([]);
  const [paused, setPaused] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!pin) return;
    setLoadingContacts(true);
    setError(null);
    try {
      const res = await fetch('/api/wa-inbox', {
        headers: { 'x-tts-usage-pin': pin },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat daftar pesan');
    } finally {
      setLoadingContacts(false);
    }
  }, [pin]);

  const fetchThread = useCallback(
    async (phone: string) => {
      if (!pin || !phone) return;
      setLoadingThread(true);
      setError(null);
      try {
        const res = await fetch(`/api/wa-inbox?phone=${encodeURIComponent(phone)}`, {
          headers: { 'x-tts-usage-pin': pin },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setTurns(data.turns || []);
        setPaused(Boolean(data.paused));

        // Update status unread lokal
        setContacts((prev) =>
          prev.map((c) => (c.phone === phone ? { ...c, unread: false } : c))
        );
      } catch (e: any) {
        setError(e.message || 'Gagal memuat transkrip percakapan');
      } finally {
        setLoadingThread(false);
      }
    },
    [pin]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (selectedPhone) {
      fetchThread(selectedPhone);
    }
  }, [selectedPhone, fetchThread]);

  const handleSendReply = async () => {
    if (!selectedPhone || !replyText.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/wa-inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tts-usage-pin': pin,
        },
        body: JSON.stringify({
          action: 'reply',
          phone: selectedPhone,
          message: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Gagal mengirim balasan (HTTP ${res.status})`);
      }

      // Optimistic update
      const sentText = replyText.trim();
      setTurns((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: `[Mas Arzha]: ${sentText}` }] },
      ]);
      setPaused(true);
      setReplyText('');
      // Refresh list kontak
      fetchContacts();
    } catch (e: any) {
      setError(e.message || 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePause = async () => {
    if (!selectedPhone || actionBusy) return;
    setActionBusy(true);
    const targetAction = paused ? 'resume' : 'pause';
    try {
      const res = await fetch('/api/wa-inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tts-usage-pin': pin,
        },
        body: JSON.stringify({
          action: targetAction,
          phone: selectedPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal mengubah status bot');
      }
      setPaused(Boolean(data.paused));
    } catch (e: any) {
      setError(e.message || 'Gagal mengubah jeda bot');
    } finally {
      setActionBusy(false);
    }
  };

  const fmtDate = (ms: number) => {
    if (!ms) return '';
    const d = new Date(ms);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedPhone && (
            <button
              type="button"
              onClick={() => {
                setSelectedPhone(null);
                setSelectedContact(null);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Kembali ke daftar pesan"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            {selectedPhone
              ? `${selectedContact?.name || selectedPhone}`
              : 'Inbox Percakapan WhatsApp'}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => (selectedPhone ? fetchThread(selectedPhone) : fetchContacts())}
          disabled={loadingContacts || loadingThread}
          className="text-slate-500 hover:text-white disabled:opacity-50 p-1"
          title="Muat ulang"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loadingContacts || loadingThread ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* VIEW 1: DAFTAR CONTACTS / THREADS */}
      {!selectedPhone && (
        <div className="space-y-2">
          {loadingContacts && contacts.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar pesan...
            </div>
          )}

          {!loadingContacts && contacts.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-slate-400">Belum ada pesan masuk di nomor virtual.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Setiap pesan masuk dari WhatsApp otomatis tercatat di sini secara real-time.
              </p>
            </div>
          )}

          <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
            {contacts.map((c) => (
              <button
                key={c.phone}
                type="button"
                onClick={() => {
                  setSelectedPhone(c.phone);
                  setSelectedContact(c);
                }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                  c.unread
                    ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-emerald-950/30'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200 truncate">
                      {c.name ? `${c.name} (+${c.phone})` : `+${c.phone}`}
                    </span>
                    {c.unread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {c.lastMessage || '(Pesan media)'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {fmtDate(c.lastAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: TRANSKRIP & BALAS MANUAL */}
      {selectedPhone && (
        <div className="space-y-3">
          {/* Status Bot & Takeover Toggle */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Bot
                className={`w-3.5 h-3.5 ${paused ? 'text-amber-400' : 'text-emerald-400'}`}
              />
              <span className="text-slate-300">
                Bot AI:{' '}
                <strong className={paused ? 'text-amber-400' : 'text-emerald-400'}>
                  {paused ? 'Dijeda (Manual Mode)' : 'Aktif Membalas'}
                </strong>
              </span>
            </div>
            <button
              type="button"
              disabled={actionBusy}
              onClick={handleTogglePause}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border transition-colors disabled:opacity-50 ${
                paused
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {paused ? (
                <>
                  <PlayCircle className="w-3 h-3" /> Lanjutkan Bot
                </>
              ) : (
                <>
                  <PauseCircle className="w-3 h-3" /> Jeda Bot
                </>
              )}
            </button>
          </div>

          {/* Area Pesan Chat */}
          <div className="h-[280px] overflow-y-auto space-y-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex flex-col-reverse">
            {loadingThread && turns.length === 0 && (
              <div className="m-auto text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat riwayat chat...
              </div>
            )}

            {!loadingThread && turns.length === 0 && (
              <div className="m-auto text-slate-500 text-center">
                Belum ada rekaman chat tersimpan untuk nomor ini.
              </div>
            )}

            {/* Render turns in chronological order */}
            {[...turns].reverse().map((t, idx) => {
              const isUser = t.role === 'user';
              const text = t.parts?.[0]?.text || '';
              const isArzhaManual = text.startsWith('[Mas Arzha]:');
              const displayBody = isArzhaManual ? text.replace('[Mas Arzha]:', '').trim() : text;

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed text-xs ${
                      isUser
                        ? 'bg-slate-900 border border-slate-700/80 text-slate-200'
                        : isArzhaManual
                        ? 'bg-teal-950/50 border border-teal-500/40 text-teal-100'
                        : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1 font-semibold">
                      {isUser ? (
                        <>
                          <User className="w-2.5 h-2.5" />
                          <span>{selectedContact?.name || `+${selectedPhone}`}</span>
                        </>
                      ) : isArzhaManual ? (
                        <>
                          <UserCheck className="w-2.5 h-2.5 text-teal-300" />
                          <span className="text-teal-300 font-bold">Mas Arzha (Manual)</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Zannah AI</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap select-text">{displayBody}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Balasan Manual */}
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="Tulis balasan manual sebagai Mas Arzha... (Ctrl+Enter kirim)"
                rows={2}
                disabled={sending}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Kirim</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400/80">
                <CheckCheck className="w-3 h-3" /> Balasan dalam 24 jam gratis (Service Window)
              </span>
              <span>Bot dijeda otomatis saat Anda membalas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
