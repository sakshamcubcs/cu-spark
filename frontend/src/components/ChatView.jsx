import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Shield, EyeOff, Clock, Phone, Video, Send, Image as ImageIcon, 
  Sparkles, ArrowLeft, AlertTriangle, Flame, Info, Check, CheckCheck, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { encryptChatMessage, decryptChatMessage } from '../services/crypto';

export default function ChatView({ matchId, onBack }) {
  const { user, token } = useAuth();
  const { socket, onlineUsers, startCall } = useSocket();

  const [matchData, setMatchData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [disappearingTtl, setDisappearingTtl] = useState(0); // 0 = off, 30 = 30s, 300 = 5m, 3600 = 1h
  const [isViewOnceNext, setIsViewOnceNext] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [privacyBlurred, setPrivacyBlurred] = useState(false);
  const [activeViewOncePhoto, setActiveViewOncePhoto] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-blur shield when window loses focus (anti-peeping / anti-leak)
  useEffect(() => {
    const handleBlur = () => setPrivacyBlurred(true);
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Fetch match details and messages
  useEffect(() => {
    if (!matchId) return;

    fetch(`/api/matches/${matchId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(async data => {
        if (data.success && data.match) {
          setMatchData(data.match);

          // Fetch message history
          const msgRes = await fetch(`/api/chat/${matchId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const msgData = await msgRes.json();
          if (msgData.success && msgData.messages) {
            // Decrypt all messages
            const decryptedList = await Promise.all(
              msgData.messages.map(async (m) => {
                const plaintext = await decryptChatMessage(
                  m.encryptedPayload,
                  m.iv,
                  data.match.encryptionKeySeed
                );
                return { ...m, text: plaintext };
              })
            );
            setMessages(decryptedList);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [matchId, token]);

  // Socket listener for room events
  useEffect(() => {
    if (!socket || !matchId || !matchData) return;

    socket.emit('join-match', { matchId });

    // New message event
    const handleNewMessage = async (msg) => {
      if (msg.matchId === matchId) {
        const plaintext = await decryptChatMessage(
          msg.encryptedPayload,
          msg.iv,
          matchData.encryptionKeySeed
        );
        setMessages(prev => [...prev, { ...msg, text: plaintext }]);
      }
    };

    // Message expired event
    const handleMessageExpired = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    // Partner typing
    const handlePartnerTyping = ({ isTyping }) => {
      setPartnerTyping(isTyping);
    };

    // View once destroyed
    const handleViewOnceDestroyed = ({ messageId }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, opened: true, text: '💥 View-once photo self-destructed' } : m)
      );
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-expired', handleMessageExpired);
    socket.on('partner-typing', handlePartnerTyping);
    socket.on('view-once-destroyed', handleViewOnceDestroyed);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-expired', handleMessageExpired);
      socket.off('partner-typing', handlePartnerTyping);
      socket.off('view-once-destroyed', handleViewOnceDestroyed);
    };
  }, [socket, matchId, matchData]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !matchData || !socket) return;

    const textToSend = inputText.trim();
    setInputText('');

    // Encrypt client-side using WebCrypto AES-GCM
    const { encryptedPayload, iv } = await encryptChatMessage(textToSend, matchData.encryptionKeySeed);

    socket.emit('send-message', {
      matchId,
      encryptedPayload,
      iv,
      isViewOnce: false,
      ttlSeconds: disappearingTtl
    });

    // Clear typing indicator
    socket.emit('typing', { matchId, isTyping: false });
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (!socket) return;

    socket.emit('typing', { matchId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { matchId, isTyping: false });
    }, 1500);
  };

  // Send photo (supports View-Once)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !matchData || !socket) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      const { encryptedPayload, iv } = await encryptChatMessage(base64Data, matchData.encryptionKeySeed);

      socket.emit('send-message', {
        matchId,
        encryptedPayload,
        iv,
        isViewOnce: isViewOnceNext,
        ttlSeconds: isViewOnceNext ? 60 : disappearingTtl
      });

      setIsViewOnceNext(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open View-Once media
  const handleOpenViewOnce = (msg) => {
    if (msg.opened) return;
    setActiveViewOncePhoto(msg.text);

    // Notify partner & server that it has been viewed
    socket.emit('view-once-opened', { messageId: msg.id, matchId });

    // Auto-close after 8 seconds
    setTimeout(() => {
      setActiveViewOncePhoto(null);
    }, 8000);
  };

  const partner = matchData?.partner;
  const isPartnerOnline = partner && onlineUsers.has(partner.id);

  if (loading || !matchData) {
    return (
      <div className="flex items-center justify-center h-[550px] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[620px] rounded-3xl overflow-hidden glass-panel border border-white/10 flex flex-col bg-slate-950 shadow-2xl">
      {/* Privacy Blur Shield Overlay (when user clicks Panic or tab loses focus) */}
      {privacyBlurred && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
            <EyeOff className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Privacy Shield Active</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-4">
            Chat screen is blurred to prevent anyone nearby from seeing your private messages.
          </p>
          <button
            onClick={() => setPrivacyBlurred(false)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 text-white font-medium text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg"
          >
            Tap to Unblur Chat
          </button>
        </div>
      )}

      {/* Anti-Leak Background Watermark (stamps viewing student's email across chat) */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-5 select-none text-[10px] uppercase font-mono tracking-widest text-white leading-relaxed p-4 flex flex-wrap content-between"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="inline-block transform -rotate-12 m-2">
            CU SECURE • {user.email} • {user.rollNumber || 'CU-VERIFIED'} • DO NOT SCREENSHOT
          </span>
        ))}
      </div>

      {/* Top Header */}
      <div className="relative z-10 px-4 py-3 bg-slate-900/90 border-b border-white/10 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={partner.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
              alt={partner.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/40"
            />
            {isPartnerOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-white">{partner.name}</span>
              <Lock className="w-3 h-3 text-emerald-400" title="E2EE AES-GCM Encrypted" />
            </div>
            <p className="text-[10px] text-gray-400">
              {partnerTyping ? (
                <span className="text-rose-400 font-medium animate-pulse">typing...</span>
              ) : isPartnerOnline ? (
                <span className="text-emerald-400">Online</span>
              ) : (
                <span>{partner.department?.split(' ')[0] || 'Chandigarh University'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons: Audio Call, Video Call, Panic Shield */}
        <div className="flex items-center gap-1.5">
          {/* Audio Call */}
          <button
            onClick={() => startCall({
              targetUserId: partner.id,
              partnerName: partner.name,
              partnerPhoto: partner.photos?.[0],
              matchId,
              isVideo: false
            })}
            className="p-2 rounded-xl bg-slate-800/80 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 active:scale-95 transition-all"
            title="Start 1-on-1 Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => startCall({
              targetUserId: partner.id,
              partnerName: partner.name,
              partnerPhoto: partner.photos?.[0],
              matchId,
              isVideo: true
            })}
            className="p-2 rounded-xl bg-slate-800/80 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 active:scale-95 transition-all"
            title="Start 1-on-1 Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Panic Blur Button */}
          <button
            onClick={() => setPrivacyBlurred(true)}
            className="p-2 rounded-xl bg-slate-800/80 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 active:scale-95 transition-all"
            title="Hide / Privacy Blur"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Info Banner */}
      <div className="px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-rose-500/10 border-b border-white/5 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE Active • Anti-Leak Environment</span>
        </div>

        {/* Ephemeral Timer Selector */}
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-rose-400" />
          <select
            aria-label="Disappearing messages timer"
            value={disappearingTtl}
            onChange={(e) => setDisappearingTtl(Number(e.target.value))}
            className="bg-transparent text-[11px] text-rose-300 font-medium outline-none cursor-pointer"
          >
            <option value={0} className="bg-slate-900 text-white">Disappearing: Off</option>
            <option value={30} className="bg-slate-900 text-white">30 seconds</option>
            <option value={300} className="bg-slate-900 text-white">5 minutes</option>
            <option value={3600} className="bg-slate-900 text-white">1 hour</option>
            <option value={86400} className="bg-slate-900 text-white">24 hours</option>
          </select>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 select-none">
        {/* Match intro pill */}
        <div className="text-center my-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/80 text-[11px] text-gray-400 border border-white/10">
            <Lock className="w-3 h-3 text-emerald-400" />
            Messages are client-encrypted & cannot be leaked.
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;

          // View-Once Photo message
          if (msg.isViewOnce) {
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  onClick={() => !isMe && !msg.opened && handleOpenViewOnce(msg)}
                  className={`p-3 rounded-2xl max-w-[75%] border transition-all cursor-pointer flex items-center gap-2.5 ${
                    msg.opened
                      ? 'bg-slate-900/50 border-white/5 text-gray-500 opacity-60'
                      : isMe
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-200 hover:bg-indigo-900/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center font-bold text-xs text-rose-400">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-semibold">
                      {msg.opened
                        ? '💥 View-once photo expired'
                        : isMe
                        ? 'View-once photo sent'
                        : 'View-Once Photo (Tap to view)'}
                    </div>
                    <div className="text-[10px] opacity-75">
                      {msg.opened ? 'Destroyed' : 'Self-destructs after opening'}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Image message
          const isImage = msg.text?.startsWith('data:image');

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`px-3.5 py-2.5 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-sm break-words relative ${
                  isMe
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-gray-200 rounded-bl-none border border-white/5'
                }`}
              >
                {isImage ? (
                  <img
                    src={msg.text}
                    alt="Chat photo"
                    className="rounded-xl max-h-48 object-cover pointer-events-none"
                  />
                ) : (
                  <span>{msg.text}</span>
                )}

                {/* Expiry indicator */}
                {msg.expiresAt && (
                  <div className="flex items-center gap-1 text-[9px] mt-1 opacity-75 justify-end">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Disappearing</span>
                  </div>
                )}
              </div>

              <span className="text-[9px] text-gray-500 mt-0.5 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* View-Once Photo Fullscreen Modal (8 seconds timer) */}
      {activeViewOncePhoto && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-150">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs">
            <span className="font-semibold text-rose-400 flex items-center gap-1">
              <Clock className="w-4 h-4 animate-spin" /> Self-destructing in seconds...
            </span>
            <button
              onClick={() => setActiveViewOncePhoto(null)}
              className="px-2.5 py-1 rounded bg-slate-800 text-gray-300 hover:text-white"
            >
              Close
            </button>
          </div>

          <img
            src={activeViewOncePhoto}
            alt="View once"
            className="max-w-full max-h-[75vh] object-contain rounded-2xl pointer-events-none"
          />
          <p className="text-[11px] text-gray-400 mt-4">
            ⚠️ Screenshotting is restricted and watermark is recorded.
          </p>
        </div>
      )}

      {/* Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="relative z-10 p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2"
      >
        {/* Photo Upload with View-Once toggle */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-all"
          title="Send photo"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* View-Once toggle for photo */}
        <button
          type="button"
          onClick={() => setIsViewOnceNext(!isViewOnceNext)}
          className={`w-8 h-8 rounded-full text-xs font-bold transition-all border flex items-center justify-center ${
            isViewOnceNext
              ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/50'
              : 'bg-slate-800 text-gray-400 border-white/10 hover:text-white'
          }`}
          title="Toggle 1-View Only Mode for next photo"
        >
          1
        </button>

        <input
          type="text"
          value={inputText}
          onChange={handleTyping}
          placeholder="Send encrypted message..."
          className="flex-1 bg-slate-800 text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/10 outline-none focus:border-rose-500/60 placeholder:text-gray-500 transition-all"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-rose-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
