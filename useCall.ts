import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';

// STUN فقط. لو الاتصال فشل على شبكات الموبايل/الشركات ضيف TURN server هنا.
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function useCall(myId: string | undefined, myName: string, onData: (d: any) => void) {
  const [status, setStatusState] = useState('idle'); // idle | calling | ringing | connecting | connected
  const [peer, setPeer] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const st = useRef('idle');
  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<RTCDataChannel | null>(null);
  const local = useRef<MediaStream | null>(null);
  const chans = useRef<Record<string, Promise<any>>>({});
  const pendingOffer = useRef<any>(null);
  const pendingIce = useRef<any[]>([]);
  const peerRef = useRef<any>(null);
  const onDataRef = useRef(onData); onDataRef.current = onData;
  const nameRef = useRef(myName); nameRef.current = myName;

  const setSt = (v: string) => { st.current = v; setStatusState(v); };

  const getChan = (id: string) => {
    if (!chans.current[id]) {
      chans.current[id] = new Promise(res => {
        const ch = supabase.channel(`inbox:${id}`);
        ch.subscribe((s: string) => { if (s === 'SUBSCRIBED') res(ch); });
      });
    }
    return chans.current[id];
  };
  const send = async (toId: string, event: string, payload: any = {}) => {
    const ch = await getChan(toId);
    ch.send({ type: 'broadcast', event, payload: { from: myId, name: nameRef.current, ...payload } });
  };

  const cleanup = () => {
    try { dc.current?.close(); pc.current?.close(); } catch {}
    dc.current = null; pc.current = null; pendingOffer.current = null; pendingIce.current = [];
    peerRef.current = null; setPeer(null); setRemoteStream(null); setSt('idle');
  };

  const bindDc = (ch: RTCDataChannel) => {
    dc.current = ch;
    ch.onmessage = e => { try { onDataRef.current(JSON.parse(e.data)); } catch {} };
  };

  const makePc = (toId: string) => {
    const p = new RTCPeerConnection(ICE);
    p.onicecandidate = e => { if (e.candidate) send(toId, 'ice', { candidate: e.candidate.toJSON() }); };
    p.ontrack = e => setRemoteStream(e.streams[0]);
    p.ondatachannel = e => bindDc(e.channel);
    p.onconnectionstatechange = () => {
      if (p.connectionState === 'connected') setSt('connected');
      if (p.connectionState === 'failed' || p.connectionState === 'closed') cleanup();
    };
    pc.current = p;
    return p;
  };

  const ensureLocal = async () => {
    if (local.current) return local.current;
    let s: MediaStream;
    try { s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true }); }
    catch { s = await navigator.mediaDevices.getUserMedia({ video: true }); }
    local.current = s; setLocalStream(s);
    return s;
  };

  const call = async (contact: any) => {
    if (st.current !== 'idle') return;
    peerRef.current = contact; setPeer(contact); setSt('calling');
    const s = await ensureLocal();
    const p = makePc(contact.id);
    s.getTracks().forEach(t => p.addTrack(t, s));
    bindDc(p.createDataChannel('captions'));
    const offer = await p.createOffer();
    await p.setLocalDescription(offer);
    send(contact.id, 'offer', { sdp: offer });
  };

  const accept = async () => {
    const o = pendingOffer.current; if (!o) return;
    setSt('connecting');
    const s = await ensureLocal();
    const p = makePc(o.from);
    s.getTracks().forEach(t => p.addTrack(t, s));
    await p.setRemoteDescription(o.sdp);
    for (const c of pendingIce.current) await p.addIceCandidate(c);
    pendingIce.current = [];
    const ans = await p.createAnswer();
    await p.setLocalDescription(ans);
    send(o.from, 'answer', { sdp: ans });
  };

  const hangup = () => { if (peerRef.current) send(peerRef.current.id, 'hangup'); cleanup(); };
  const sendData = (obj: any) => { if (dc.current?.readyState === 'open') dc.current.send(JSON.stringify(obj)); };
  const setCam = (on: boolean) => local.current?.getVideoTracks().forEach(t => (t.enabled = on));
  const setMic = (on: boolean) => local.current?.getAudioTracks().forEach(t => (t.enabled = on));

  useEffect(() => {
    if (!myId) return;
    const ch = supabase.channel(`inbox:${myId}`);
    ch.on('broadcast', { event: 'offer' }, ({ payload }: any) => {
      if (st.current !== 'idle') { send(payload.from, 'hangup'); return; }
      pendingOffer.current = payload;
      const p = { id: payload.from, name: payload.name };
      peerRef.current = p; setPeer(p); setSt('ringing');
    })
    .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
      if (!pc.current) return;
      await pc.current.setRemoteDescription(payload.sdp);
      for (const c of pendingIce.current) await pc.current.addIceCandidate(c);
      pendingIce.current = [];
      setSt('connecting');
    })
    .on('broadcast', { event: 'ice' }, async ({ payload }: any) => {
      if (pc.current?.remoteDescription) await pc.current.addIceCandidate(payload.candidate);
      else pendingIce.current.push(payload.candidate);
    })
    .on('broadcast', { event: 'hangup' }, () => cleanup())
    .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [myId]);

  return { status, peer, localStream, remoteStream, call, accept, hangup, sendData, ensureLocal, setCam, setMic };
}
