import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone } from 'lucide-react';
import { supabase } from './supabaseClient';
import { createTracker, frameFeature, resample, classify, thresholds } from './signRecognizer';

export default function CallRoom({ contact, myId, role, call, messages, liveCaption, sendCaption, translateGloss }: any) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<any>(null);
  const recRef = useRef<any>(null);
  const pend = useRef<string[]>([]);
  const [cam, setCam] = useState(true);
  const [mic, setMic] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [handsOn, setHandsOn] = useState(false);
  const [trackerReady, setTrackerReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState('');

  const thr = useMemo(() => thresholds(templates), [templates]);
  const R = useRef<any>({});
  R.current = { templates, thr, armedLabel: armed ? label.trim() : '', translateGloss, sendCaption };

  useEffect(() => { if (localRef.current) localRef.current.srcObject = call.localStream; }, [call.localStream]);
  useEffect(() => { if (remoteRef.current) remoteRef.current.srcObject = call.remoteStream; }, [call.remoteStream]);

  useEffect(() => {
    supabase.from('sign_templates').select('id,label,frames').eq('user_id', myId)
      .then(({ data }) => setTemplates(data || []));
  }, [myId]);

  const saveTemplate = async (lb: string, frames: number[][]) => {
    const { data, error } = await supabase.from('sign_templates').insert({ user_id: myId, label: lb, frames }).select('id,label,frames').single();
    if (error) setErr(error.message); else setTemplates(t => [...t, data]);
    setArmed(false);
  };
  const removeLabel = async (lb: string) => {
    await supabase.from('sign_templates').delete().eq('user_id', myId).eq('label', lb);
    setTemplates(t => t.filter(x => x.label !== lb));
  };

  // حلقة تتبع اليدين من الكاميرا → تقطيع الإشارات → تصنيف → جملة → إرسال للطرف الآخر
  useEffect(() => {
    if (role !== 'deaf' || !call.localStream) return;
    let stop = false, raf = 0, lastT = -1, lastSeen = 0, lastSign = 0;
    let buf: number[][] = [];
    const v = localRef.current!;

    const finish = () => {
      const seq = buf; buf = []; setHandsOn(false);
      if (seq.length < 8) return;
      const frames = resample(seq).map(fr => fr.map(x => Math.round(x * 1000) / 1000));
      if (R.current.armedLabel) { saveTemplate(R.current.armedLabel, frames); return; }
      const r = classify(frames, R.current.templates, R.current.thr);
      if (r) { pend.current.push(r.label); setPending([...pend.current]); lastSign = performance.now(); }
    };

    const iv = setInterval(async () => {
      if (!pend.current.length || performance.now() - lastSign < 1600) return;
      const words = pend.current; pend.current = []; setPending([]);
      const gloss = words.join(' - ');
      const text = ((await R.current.translateGloss(gloss)) || '').trim() || words.join(' ');
      R.current.sendCaption(text, gloss, 'sign');
    }, 400);

    (async () => {
      if (!trackerRef.current) {
        try { trackerRef.current = await createTracker(); setTrackerReady(true); }
        catch { setErr('تعذر تحميل نموذج تتبع اليدين (تأكد من الإنترنت).'); return; }
      }
      const loop = () => {
        if (stop) return;
        raf = requestAnimationFrame(loop);
        if (v.readyState < 2 || v.currentTime === lastT) return;
        lastT = v.currentTime;
        const now = performance.now();
        const f = frameFeature(trackerRef.current.detectForVideo(v, now));
        if (f) { buf.push(f); lastSeen = now; setHandsOn(true); }
        else if (buf.length && now - lastSeen > 500) finish();
      };
      loop();
    })();
    return () => { stop = true; cancelAnimationFrame(raf); clearInterval(iv); };
  }, [role, call.localStream]);

  const toggleSpeech = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErr('المتصفح لا يدعم التعرف على الكلام. استخدم Chrome.'); return; }
    if (listening) { recRef.current.onend = null; recRef.current.stop(); setListening(false); return; }
    const r = new SR(); r.lang = 'ar-EG'; r.continuous = true; r.interimResults = false;
    r.onresult = (e: any) => { const t = e.results[e.results.length - 1][0].transcript.trim(); if (t) R.current.sendCaption(t, '', 'speech'); };
    r.onend = () => { try { r.start(); } catch {} };
    r.start(); recRef.current = r; setListening(true);
  };
  useEffect(() => () => { if (recRef.current) { recRef.current.onend = null; recRef.current.stop(); } }, []);

  const labels = Object.entries(templates.reduce((a: any, t) => ((a[t.label] = (a[t.label] || 0) + 1), a), {}));
  const inCall = ['calling', 'connecting', 'connected'].includes(call.status);
  const btn = 'px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-slate-800">
          <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!call.remoteStream && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            {call.status === 'calling' ? `جاري الاتصال بـ ${contact.name}...` : call.status === 'ringing' ? `${call.peer?.name} يتصل بك` : 'لا توجد مكالمة نشطة'}
          </div>}
          <video ref={localRef} autoPlay playsInline muted className="absolute bottom-3 left-3 w-36 rounded-xl border border-slate-700 bg-slate-900 -scale-x-100" />
          {liveCaption && <div className="absolute bottom-3 right-3 left-44 bg-black/70 rounded-xl px-3 py-2 text-sm text-white">{liveCaption.text}</div>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {call.status === 'idle' && <button onClick={() => call.call(contact)} className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white`}><Phone className="w-4 h-4" />اتصل بـ {contact.name}</button>}
          {call.status === 'ringing' && <>
            <button onClick={call.accept} className={`${btn} bg-emerald-600 text-white`}><Phone className="w-4 h-4" />رد</button>
            <button onClick={call.hangup} className={`${btn} bg-rose-600 text-white`}><PhoneOff className="w-4 h-4" />رفض</button></>}
          {inCall && <>
            <button onClick={() => { call.setMic(!mic); setMic(!mic); }} className={`${btn} bg-slate-800 text-white`}>{mic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}</button>
            <button onClick={() => { call.setCam(!cam); setCam(!cam); }} className={`${btn} bg-slate-800 text-white`}>{cam ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}</button>
            <button onClick={call.hangup} className={`${btn} bg-rose-600 text-white`}><PhoneOff className="w-4 h-4" />إنهاء</button></>}
          {!call.localStream && <button onClick={() => call.ensureLocal().catch(() => setErr('تعذر الوصول للكاميرا'))} className={`${btn} bg-indigo-600 text-white`}>تشغيل الكاميرا</button>}
        </div>
        {err && <p className="text-xs text-amber-400">{err}</p>}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2">
          {messages.length === 0 && <p className="text-xs text-slate-500">سجل المحادثة فاضي.</p>}
          {messages.map((m: any) => (
            <div key={m.id} className="text-sm"><span className="text-indigo-300 font-bold">{m.sender}: </span>{m.text}
              {m.signGloss && <span className="text-[11px] text-slate-500"> ({m.signGloss})</span>}</div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 h-fit">
        {role === 'deaf' ? (<>
          <h3 className="font-bold text-sm">🤟 ترجمة إشارتك</h3>
          <p className="text-[11px] text-slate-400">
            {!call.localStream ? 'شغّل الكاميرا أولاً.' : !trackerReady ? 'جاري تحميل نموذج تتبع اليدين...' : handsOn ? 'تم رصد اليد... أكمل الإشارة' : 'أظهر يدك أمام الكاميرا وأنت تشير'}
          </p>
          {pending.length > 0 && <p className="text-sm text-emerald-300">{pending.join(' - ')}</p>}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-300">تعليم الإشارات (مرة واحدة)</h4>
            <p className="text-[11px] text-slate-500">اكتب معنى الإشارة، اضغط تسجيل، ثم أدِّ الإشارة. كرر 4-5 مرات.</p>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="معنى الإشارة، مثلاً: مرحبا"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none" />
            <button disabled={!label.trim() || !trackerReady} onClick={() => setArmed(!armed)}
              className={`${btn} w-full justify-center ${armed ? 'bg-amber-600' : 'bg-indigo-600'} text-white disabled:opacity-40`}>
              {armed ? 'جاهز... أدِّ الإشارة الآن (اضغط للإلغاء)' : 'تسجيل عينة'}</button>
            {labels.map(([l, n]: any) => (
              <div key={l} className="flex items-center justify-between text-xs bg-slate-950 rounded-lg px-3 py-1.5">
                <span>{l} <span className={n < 3 ? 'text-amber-400' : 'text-emerald-400'}>({n} عينات)</span></span>
                <button onClick={() => removeLabel(l)} className="text-rose-400">حذف</button>
              </div>))}
          </div>
        </>) : (<>
          <h3 className="font-bold text-sm">🎤 كلامك → نص للطرف الأصم</h3>
          <button onClick={toggleSpeech} className={`${btn} w-full justify-center ${listening ? 'bg-rose-600' : 'bg-indigo-600'} text-white`}>
            {listening ? 'إيقاف الاستماع' : 'ابدأ الاستماع'}</button>
          <p className="text-[11px] text-slate-500">كلامك بيتحول لنص ويظهر فوراً على شاشة الطرف الأصم.</p>
        </>)}
      </div>
    </div>
  );
}
