import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Free public STUN servers for WebRTC NAT traversal
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Call states: 'idle' | 'calling' | 'ringing' | 'connected'
  const [callState, setCallState] = useState('idle');
  const [callSession, setCallSession] = useState(null); // { matchId, partnerId, partnerName, partnerPhoto, isVideo }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Socket connection
  useEffect(() => {
    if (!token || !user) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
    const s = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('[Socket] Connected to CU-Spark server with ID:', s.id);
    });

    s.on('user-status-change', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    // Incoming Call Handler
    s.on('incoming-call', async ({ callerId, callerName, callerPhoto, callerDepartment, matchId, isVideo, offer }) => {
      console.log('[WebRTC] Incoming call from:', callerName);
      setCallSession({
        matchId,
        partnerId: callerId,
        partnerName: callerName,
        partnerPhoto: callerPhoto,
        partnerDepartment: callerDepartment,
        isVideo,
        offer
      });
      setCallState('ringing');
    });

    // Call Accepted Handler
    s.on('call-accepted', async ({ targetUserId, matchId, answer }) => {
      console.log('[WebRTC] Call accepted by remote partner');
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setCallState('connected');
          startCallTimer();
        } catch (err) {
          console.error('[WebRTC] Error setting remote description:', err);
        }
      }
    });

    // Call Rejected Handler
    s.on('call-rejected', ({ reason }) => {
      alert(`Call declined: ${reason || 'Partner was busy'}`);
      cleanupCall();
    });

    // Remote ICE candidate
    s.on('ice-candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    });

    // Call Ended by remote partner
    s.on('call-ended', () => {
      cleanupCall();
    });

    setSocket(s);

    return () => {
      s.disconnect();
      cleanupCall();
    };
  }, [token, user?.id]);

  const startCallTimer = () => {
    setCallDuration(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const createPeerConnection = (targetUserId, matchId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          targetUserId,
          matchId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream track:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pcRef.current = pc;
    return pc;
  };

  // 1. Initiate Outgoing Call
  const startCall = async ({ targetUserId, partnerName, partnerPhoto, matchId, isVideo }) => {
    try {
      setCallState('calling');
      setCallSession({
        matchId,
        partnerId: targetUserId,
        partnerName,
        partnerPhoto,
        isVideo
      });

      // Get user audio/video media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetUserId, matchId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        targetUserId,
        matchId,
        isVideo,
        offer
      });
    } catch (err) {
      console.error('[WebRTC] Failed to access camera/mic or start call:', err);
      alert('Unable to access microphone or camera. Please ensure permissions are granted.');
      cleanupCall();
    }
  };

  // 2. Accept Incoming Call
  const acceptCall = async () => {
    if (!callSession || !callSession.offer) return;
    try {
      setCallState('connected');
      startCallTimer();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callSession.isVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(callSession.partnerId, callSession.matchId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callSession.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('accept-call', {
        callerId: callSession.partnerId,
        matchId: callSession.matchId,
        answer
      });
    } catch (err) {
      console.error('[WebRTC] Failed to accept call:', err);
      alert('Could not start call. Media permission error.');
      rejectCall();
    }
  };

  // 3. Reject Incoming Call
  const rejectCall = () => {
    if (callSession && socket) {
      socket.emit('reject-call', {
        callerId: callSession.partnerId,
        matchId: callSession.matchId
      });
    }
    cleanupCall();
  };

  // 4. End Active Call
  const endCall = () => {
    if (callSession && socket) {
      socket.emit('end-call', {
        targetUserId: callSession.partnerId,
        matchId: callSession.matchId
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallSession(null);
    setCallState('idle');
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        callState,
        callSession,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        callDuration,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
