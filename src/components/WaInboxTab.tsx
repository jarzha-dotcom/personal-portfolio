import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Search,
  Sparkles,
  Phone,
  Paperclip,
  X,
  FileText,
} from 'lucide-react';
import {
  prepareAttachment,
  blobToBase64,
  uploadToDriveSession,
  formatBytes,
  WA_SEND_ACCEPT,
  type PreparedAttachment,
} from '../lib/waAttachment';
import { WaMediaBubble, stripMediaPlaceholder, type WaMediaAttachment } from './WaMediaBubble';

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
  media?: WaMediaAttachment[];
}

interface WaInboxTabProps {
  pin: string;
  isExpanded?: boolean;
}

export const WaInboxTab: React.FC<WaInboxTabProps> = ({ pin, isExpanded = false }) => {
  const [contacts, setContacts] = useState<WaInboxContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<WaInboxContact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [turns, setTurns] = useState<WaChatTurn[]>([]);
  const [paused, setPaused] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachment, setAttachment] = useState<PreparedAttachment | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!attachment || !attachment.isImage) {
      setAttachmentPreview(null);
      return;
    }
    const url = URL.createObjectURL(attachment.blob);
    setAttachmentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  // Ganti thread → buang lampiran yang belum terkirim
  useEffect(() => {
    setAttachment(null);
  }, [selectedPhone]);

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPreparing(true);
    setError(null);
    try {
      setAttachment(await prepareAttachment(file));
    } catch (err: any) {
      setAttachment(null);
      setError(err.message || 'Gagal menyiapkan lampiran');
    } finally {
      setPreparing(false);
    }
  };

  const handleSendAttachment = async () => {
    if (!selectedPhone || !attachment || sending) return;
    const caption = replyText.trim();
    if (caption && attachment.isAudio) {
      setError('Pesan audio tidak mendukung caption. Hapus teks, atau kirim teks terpisah.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const authHeaders = { 'Content-Type': 'application/json', 'x-tts-usage-pin': pin };
      const common = {
        phone: selectedPhone,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        caption: caption || undefined,
      };
      let payload: Record<string, unknown>;

      if (attachment.viaDrive) {
        // Berkas besar: minta sesi upload → unggah langsung ke Drive → server meneruskan ke WhatsApp
        const prep = await fetch('/api/wa-inbox', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ action: 'prepare_upload', ...common, sizeBytes: attachment.blob.size }),
        });
        const prepData = await prep.json().catch(() => ({}));
        if (!prep.ok || !prepData.ok) {
          throw new Error(prepData.error || `Gagal menyiapkan upload (HTTP ${prep.status})`);
        }
        setUploadProgress(0);
        const driveFileId = await uploadToDriveSession(
          prepData.sessionUrl,
          attachment.blob,
          attachment.mimeType,
          setUploadProgress
        );
        setUploadProgress(1);
        payload = { action: 'reply_media', ...common, driveFileId };
      } else {
        payload = { action: 'reply_media', ...common, dataBase64: await blobToBase64(attachment.blob) };
      }

      const res = await fetch('/api/wa-inbox', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Gagal mengirim lampiran (HTTP ${res.status})`);
      }
      const label = `[Lampiran: ${attachment.fileName}]`;
      setTurns((prev) => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: `[Mas Arzha]: ${data.attachment ? '' : label}${caption ? `\n${caption}` : ''}`.trimEnd() }],
          media: data.attachment ? [data.attachment] : undefined,
        },
      ]);
      if (!data.archived) {
        setError('Lampiran terkirim ke klien, tetapi salinan Drive gagal disimpan' + (data.driveError ? `: ${data.driveError}` : '.'));
      }
      setPaused(true);
      setAttachment(null);
      setReplyText('');
      fetchContacts();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim lampiran');
    } finally {
      setSending(false);
      setUploadProgress(null);
    }
  };

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
    if (attachment) return handleSendAttachment();
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

  // Filter kontak berdasarkan search input
  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      c.phone.toLowerCase().includes(q) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  });

  /* ----------------- SUB-KOMPONEN: DAFTAR KONTAK ----------------- */
  const renderContactList = () => (
    <div className="flex flex-col h-full min-h-0 bg-slate-900/40">
      {/* Search & Actions */}
      <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            Percakapan ({filteredContacts.length})
          </span>
          <button
            type="button"
            onClick={fetchContacts}
            disabled={loadingContacts}
            className="text-slate-400 hover:text-white disabled:opacity-50 p-1 rounded hover:bg-slate-800 transition-colors"
            title="Muat ulang kontak"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingContacts ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor, nama, atau isi chat..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* List Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {loadingContacts && contacts.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Memuat pesan...
          </div>
        )}

        {!loadingContacts && filteredContacts.length === 0 && (
          <div className="py-8 px-4 text-center text-xs text-slate-500">
            {searchQuery ? (
              <p>Tidak ada pesan yang cocok dengan &quot;{searchQuery}&quot;</p>
            ) : (
              <div className="space-y-1.5">
                <MessageSquare className="w-7 h-7 text-slate-600 mx-auto opacity-50" />
                <p className="font-medium text-slate-400">Belum ada chat masuk</p>
                <p className="text-[11px] text-slate-500">
                  Setiap pesan WhatsApp ke nomor bot akan muncul di sini.
                </p>
              </div>
            )}
          </div>
        )}

        {filteredContacts.map((c) => {
          const isSelected = selectedPhone === c.phone;
          const isOwner = c.phone === '6282312312734' || (c.name && c.name.includes('Pemilik'));

          return (
            <button
              key={c.phone}
              type="button"
              onClick={() => {
                setSelectedPhone(c.phone);
                setSelectedContact(c);
              }}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm'
                  : c.unread
                  ? 'bg-slate-950/80 border-emerald-500/30 hover:bg-slate-800/80'
                  : 'bg-slate-950/40 border-slate-800/70 hover:bg-slate-800/50'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  isOwner
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isOwner ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Detail Kontak */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-semibold text-xs truncate ${
                      isSelected ? 'text-emerald-300' : 'text-slate-200'
                    }`}
                  >
                    {c.name ? c.name : `+${c.phone}`}
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0">{fmtDate(c.lastAt)}</span>
                </div>

                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <p className="text-[11px] text-slate-400 truncate">
                    {c.lastMessage || '(Pesan media)'}
                  </p>
                  {c.unread && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </div>

                {isOwner && (
                  <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-medium">
                    Owner
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ----------------- SUB-KOMPONEN: CHAT THREAD & COMPOSER ----------------- */
  const renderChatThread = () => {
    if (!selectedPhone) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
            <MessageSquare className="w-8 h-8 opacity-80" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200 mb-1">WhatsApp Web Inbox</h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Pilih salah satu percakapan di sebelah kiri untuk membaca transkrip lengkap dan membalas pesan klien secara langsung.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zannah AI aktif melayani pertanyaan 24/7</span>
          </div>
        </div>
      );
    }

    const isOwner =
      selectedPhone === '6282312312734' || (selectedContact?.name && selectedContact.name.includes('Pemilik'));

    return (
      <div className="flex flex-col h-full min-h-0 bg-slate-950/60">
        {/* Thread Header */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Tombol Back di mobile */}
            <button
              type="button"
              onClick={() => {
                setSelectedPhone(null);
                setSelectedContact(null);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white md:hidden"
              title="Kembali ke kontak"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                isOwner
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {isOwner ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-100 truncate">
                  {selectedContact?.name || `+${selectedPhone}`}
                </span>
                {isOwner ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Mas Arzha (Pemilik)
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700">
                    Tamu / Klien
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Phone className="w-2.5 h-2.5" />
                <span>+{selectedPhone}</span>
              </div>
            </div>
          </div>

          {/* Controls: Bot pause toggle & refresh thread */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={actionBusy}
              onClick={handleTogglePause}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border transition-colors disabled:opacity-50 ${
                paused
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
              }`}
              title={paused ? 'Aktifkan kembali bot AI untuk nomor ini' : 'Jeda bot agar bisa chat manual'}
            >
              {paused ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lanjutkan Bot</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Jeda Bot</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fetchThread(selectedPhone)}
              disabled={loadingThread}
              className="text-slate-400 hover:text-white disabled:opacity-50 p-1.5 rounded hover:bg-slate-800 transition-colors"
              title="Perbarui transkrip chat"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingThread ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div
          ref={chatScrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 flex flex-col-reverse text-xs"
        >
          {loadingThread && turns.length === 0 && (
            <div className="m-auto text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Memuat riwayat chat...
            </div>
          )}

          {!loadingThread && turns.length === 0 && (
            <div className="m-auto text-slate-500 text-center py-6">
              Belum ada percakapan tersimpan untuk nomor ini.
            </div>
          )}

          {[...turns].reverse().map((t, idx) => {
            const isUser = t.role === 'user';
            const text = t.parts?.[0]?.text || '';
            const isArzhaManual = text.startsWith('[Mas Arzha]:');
            const rawBody = isArzhaManual ? text.replace('[Mas Arzha]:', '').trim() : text;
            const mediaList = t.media ?? [];
            // Bila ada lampiran, sembunyikan teks placeholder otomatis ("[Pengirim mengirimkan sebuah foto]", dst.)
            const displayBody = mediaList.length > 0 ? stripMediaPlaceholder(rawBody) : rawBody;

            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-xl p-3 leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-slate-900 border border-slate-700/80 text-slate-200'
                      : isArzhaManual
                      ? 'bg-teal-950/70 border border-teal-500/50 text-teal-100'
                      : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] opacity-75 mb-1.5 font-semibold">
                    {isUser ? (
                      <>
                        <User className="w-3 h-3 text-slate-300" />
                        <span>{selectedContact?.name || `+${selectedPhone}`}</span>
                      </>
                    ) : isArzhaManual ? (
                      <>
                        <UserCheck className="w-3 h-3 text-teal-300" />
                        <span className="text-teal-300 font-bold">Mas Arzha (Manual)</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Zannah AI</span>
                      </>
                    )}
                  </div>
                  {mediaList.length > 0 && (
                    <div className={`flex flex-col gap-2 ${displayBody ? 'mb-2' : ''}`}>
                      {mediaList.map((m) => (
                        <WaMediaBubble key={m.driveFileId} media={m} pin={pin} />
                      ))}
                    </div>
                  )}
                  {displayBody && (
                    <p className="whitespace-pre-wrap select-text text-xs">{displayBody}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Composer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-2 shrink-0">
          {attachment && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-lg p-2 text-[11px] text-slate-300">
              {attachmentPreview ? (
                <img src={attachmentPreview} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
              ) : (
                <FileText className="w-6 h-6 text-slate-400 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{attachment.fileName}</p>
                <p className="text-slate-500">
                  {formatBytes(attachment.blob.size)}
                  {attachment.viaDrive && ' · lewat Drive'}
                  {uploadProgress !== null && ` · ${Math.round(uploadProgress * 100)}%`}
                </p>
                {uploadProgress !== null && (
                  <div className="mt-1 h-1 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(uploadProgress * 100)}%` }} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                disabled={sending}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50"
                title="Batalkan lampiran"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept={WA_SEND_ACCEPT}
              onChange={handlePickFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || preparing}
              className="p-2.5 rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
              title="Lampirkan berkas (maks 15 MB)"
            >
              {preparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder={attachment ? 'Caption (opsional)... (Ctrl+Enter untuk kirim)' : 'Tulis balasan manual sebagai Mas Arzha... (Ctrl+Enter untuk kirim)'}
              rows={2}
              disabled={sending}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSendReply}
              disabled={sending || preparing || (!replyText.trim() && !attachment)}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shrink-0 shadow-md"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Kirim</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Balasan dalam 24 jam gratis (Service Window)
            </span>
            <span>Bot otomatis dijeda saat Anda membalas</span>
          </div>
        </div>
      </div>
    );
  };

  /* ----------------- RENDER UTAMA ----------------- */
  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">
      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400 shrink-0">
          {error}
        </div>
      )}

      {/* JIKA MODE EXPANDED (FULLSCREEN / SPLIT 2-KOLOM ALA WA WEB) */}
      {isExpanded ? (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row rounded-lg border border-slate-800 overflow-hidden bg-slate-950/40">
          {/* Kolom Kiri: Daftar Kontak */}
          <div
            className={`w-full md:w-80 md:border-r border-slate-800 flex flex-col min-h-0 shrink-0 ${
              selectedPhone ? 'hidden md:flex' : 'flex'
            }`}
          >
            {renderContactList()}
          </div>

          {/* Kolom Kanan: Percakapan Aktif */}
          <div
            className={`flex-1 flex flex-col min-h-0 ${
              !selectedPhone ? 'hidden md:flex' : 'flex'
            }`}
          >
            {renderChatThread()}
          </div>
        </div>
      ) : (
        /* JIKA MODE STANDAR / COMPACT POPUP */
        <div className="min-h-0">
          {!selectedPhone ? renderContactList() : renderChatThread()}
        </div>
      )}
    </div>
  );
};
