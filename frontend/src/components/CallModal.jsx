import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Shield } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function CallModal() {
  const {
    callState,
    callSession,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  if (callState === 'idle' || !callSession) return null;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 1. Incoming Call Screen
  if (callState === 'ringing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
        <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/30 p-6 text-center shadow-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-500/30">
            <Shield className="w-3.5 h-3.5" />
            Verified CU Student Calling
          </div>

          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
            <img
              src={callSession.partnerPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'}
              alt={callSession.partnerName}
              className="relative w-28 h-28 rounded-full object-cover ring-4 ring-rose-500 shadow-xl"
            />
          </div>

          <h3 className="text-xl font-bold text-white mb-0.5">{callSession.partnerName}</h3>
          <p className="text-xs text-rose-300 mb-1">{callSession.partnerDepartment || 'Chandigarh University'}</p>
          <p className="text-xs text-gray-400 mb-6">
            Incoming {callSession.isVideo ? '1-on-1 Video Call' : '1-on-1 Voice Call'}...
          </p>

          <div className="flex items-center justify-center gap-6">
            {/* Decline */}
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
              title="Decline"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Accept */}
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-pulse active:scale-95 transition-all"
              title="Accept Call"
            >
              <Phone className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Outgoing or Connected Call Screen
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in zoom-in-95 duration-200">
      {/* Top in-call status bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h4 className="font-semibold text-sm leading-tight">{callSession.partnerName}</h4>
            <p className="text-[11px] text-gray-300">
              {callState === 'calling' ? 'Ringing student...' : formatTimer(callDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 text-[11px] text-emerald-300 border border-emerald-500/20">
          <Shield className="w-3.5 h-3.5" />
          Encrypted WebRTC
        </div>
      </div>

      {/* Media Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {callSession.isVideo ? (
          <>
            {/* Remote Partner Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-slate-900"
            />

            {/* If remote video not yet attached */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80">
                <div className="w-24 h-24 rounded-full ring-4 ring-rose-500 overflow-hidden mb-3 animate-pulse">
                  <img
                    src={callSession.partnerPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'}
                    alt={callSession.partnerName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-300 font-medium">
                  {callState === 'calling' ? 'Calling Chandigarh University student...' : 'Connecting video stream...'}
                </p>
              </div>
            )}

            {/* Local Video Stream Picture-in-Picture */}
            <div className="absolute bottom-24 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-gray-400 text-[10px]">
                  Camera Off
                </div>
              )}
            </div>
          </>
        ) : (
          // Audio Call View
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 opacity-30 blur-xl animate-pulse" />
              <img
                src={callSession.partnerPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'}
                alt={callSession.partnerName}
                className="relative w-36 h-36 rounded-full object-cover ring-4 ring-rose-500 shadow-2xl"
              />
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold">{callSession.partnerName}</h3>
              <p className="text-sm text-rose-300 mt-1">{callSession.partnerDepartment || 'Chandigarh University'}</p>
              <p className="text-xs text-gray-400 mt-2 font-mono">{formatTimer(callDuration)}</p>
            </div>

            {/* Audio element for remote voice */}
            <audio ref={remoteVideoRef} autoPlay />
          </div>
        )}
      </div>

      {/* Call Control Buttons Bar */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-6 px-4">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-amber-600 text-white' : 'bg-slate-800/90 text-gray-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End Call */}
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        {/* Video Toggle (if video call) */}
        {callSession.isVideo && (
          <button
            onClick={toggleVideo}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-amber-600 text-white' : 'bg-slate-800/90 text-gray-200 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}
      </div>
    </div>
  );
}
