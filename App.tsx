import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import CallRoom from './CallRoom';
import { useCall } from './useCall';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Phone, User, Users,
  MessageSquare, Settings, Sparkles, Volume2, VolumeX, Hand,
  CheckCircle2, AlertCircle, Play, Send, Shield, Globe, Award,
  Camera, RefreshCw, HelpCircle, LogOut, ChevronLeft, Eye, Ear,
  Activity, Zap, Subtitles, Smile, Layers, Cpu
} from 'lucide-react';

// قاموس الحركات الإشارية للمجسم ثلاثي/ثنائي الأبعاد (Avatar Sign Animations)
const SIGN_DICTIONARY = {
  'مرحبا': {
    word: 'مرحباً / السلام عليكم',
    gloss: 'سلام - يد مرفوعة للتحية',
    motion: 'wave',
    description: 'رفع اليد اليمنى بمحاذاة الكتف وتحريكها يميناً ويساراً بابتسامة.',
    color: '#10b981'
  },
  'كيف حالك': {
    word: 'كيف حالك؟',
    gloss: 'كيف - حال - أنت',
    motion: 'chest_out',
    description: 'وضع اليدين أمام الصدر ثم فتحهما للأمام مع الإشارة للشخص المقابل.',
    color: '#3b82f6'
  },
  'بخير': {
    word: 'أنا بخير والحمد لله',
    gloss: 'أنا - جيد - شكر',
    motion: 'thumbs_up',
    description: 'وضع اليد على الصدر ثم رفع الإبهام للأعلى تعبيراً عن الرضا والصحة.',
    color: '#10b981'
  },
  'شكرا': {
    word: 'شكراً جزيلاً لك',
    gloss: 'شكر - تقدير',
    motion: 'chin_forward',
    description: 'ملامسة أطراف الأصابع للذقن ثم تحريك اليد للأمام باتجاه المخاطب مع انحناءة بسيطة.',
    color: '#8b5cf6'
  },
  'مساعدة': {
    word: 'هل تحتاج إلى مساعدة؟',
    gloss: 'سؤال - مساعدة - دعم',
    motion: 'support_lift',
    description: 'قبض اليد اليسرى ورفعها بواسطة كف اليد اليمنى من الأسفل للأعلى.',
    color: '#f59e0b'
  },
  'عمل': {
    word: 'لنتحدث عن مشروع العمل',
    gloss: 'عمل - نقاش - مشروع',
    motion: 'wrist_tap',
    description: 'طرق رسغ اليد اليسرى بقبضة اليد اليمنى مرتين بانتظام.',
    color: '#06b6d4'
  },
  'موافق': {
    word: 'موافق تماماً على كلامك',
    gloss: 'نعم - موافق - صحيح',
    motion: 'nod_hand',
    description: 'تحريك قبضة اليد للأعلى والأسفل مع إيماءة الرأس بالموافقة.',
    color: '#22c55e'
  },
  'وداعا': {
    word: 'إلى اللقاء، سعدت بالتحدث معك',
    gloss: 'سعادة - لقاء - وداع',
    motion: 'wave_both',
    description: 'التلويح باليدين مع تعبير وجه بشوش يظهر الامتنان.',
    color: '#ec4899'
  }
};

// مكون المجسم الذكي (AI Sign Language Avatar) الذي يترجم كلام الشخص السليم إلى لغة إشارة مرئية للأصم
const SignLanguageAvatar = ({ activeSign, isSigning, customGloss }) => {
  const motionType = activeSign?.motion || 'idle';
  const signColor = activeSign?.color || '#6366f1';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-inner p-4">
      {/* خلفية شبكية تقنية */}
      <div className="absolute inset-0 opacity-15 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* شارة حالة المترجم الحركي */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-500/40">
          <span className={`w-2.5 h-2.5 rounded-full ${isSigning ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
          <span className="text-xs font-semibold text-indigo-100">
            {isSigning ? 'جاري تمثيل لغة الإشارة...' : 'المترجم الإشاري الذكي (3D Avatar)'}
          </span>
        </div>
        <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30 font-mono">
          ArSL-AI v2.4
        </span>
      </div>

      {/* الرسم التفاعلي للمجسم وحركات اليدين */}
      <div className="relative w-56 h-56 my-2 flex items-center justify-center">
        {/* هالة ضوئية خلف المجسم عند التحدث بالإشارة */}
        {isSigning && (
          <div
            className="absolute inset-4 rounded-full blur-2xl opacity-30 transition-all duration-500 animate-pulse"
            style={{ backgroundColor: signColor }}
          />
        )}

        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* الجذع والأكتاف */}
          <path
            d="M 60 220 C 60 165, 90 155, 120 155 C 150 155, 180 165, 180 220 Z"
            fill="url(#bodyGrad)"
            stroke="#818cf8"
            strokeWidth="2"
          />

          {/* خطوط تقنية على القميص */}
          <path d="M 100 160 L 120 185 L 140 160" fill="none" stroke="#a5b4fc" strokeWidth="2" opacity="0.6" />

          {/* الرقبة */}
          <rect x="108" y="132" width="24" height="28" rx="8" fill="url(#skinGrad)" />

          {/* الرأس مع تفاعل الإيماءة */}
          <g className={`transition-transform duration-500 origin-center ${isSigning ? 'translate-y-[-3px]' : ''}`}>
            <circle cx="120" cy="95" r="38" fill="url(#skinGrad)" stroke="#fbbf24" strokeWidth="1.5" />
            {/* الشعر */}
            <path d="M 82 90 C 80 50, 160 50, 158 90 C 152 68, 88 68, 82 90 Z" fill="#1e293b" />
            {/* العينين (تعبير الوجه مهم جداً في لغة الإشارة) */}
            <circle cx="106" cy="92" r="4" fill="#0f172a" />
            <circle cx="134" cy="92" r="4" fill="#0f172a" />
            {/* الحواجب المتفاعلة */}
            <path
              d={isSigning ? "M 98 80 Q 106 75 114 80" : "M 98 83 Q 106 80 114 83"}
              fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"
            />
            <path
              d={isSigning ? "M 126 80 Q 134 75 142 80" : "M 126 83 Q 134 80 142 83"}
              fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"
            />
            {/* الفم المبتسم / المتفاعل */}
            <path
              d={isSigning ? "M 106 110 Q 120 124 134 110 Z" : "M 108 112 Q 120 120 132 112"}
              fill={isSigning ? "#ef4444" : "none"}
              stroke="#78350f"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* الذراع واليد اليسرى (تتحرك حسب نوع الإشارة) */}
          <g
            style={{
              transformOrigin: '75px 170px',
              transform: isSigning
                ? motionType === 'wave_both' || motionType === 'chest_out'
                  ? 'rotate(-45deg) translate(-10px, -25px)'
                  : motionType === 'support_lift' || motionType === 'wrist_tap'
                  ? 'rotate(-20deg) translate(15px, -20px)'
                  : 'rotate(-15deg) translate(5px, -10px)'
                : 'rotate(0deg)'
            }}
            className="transition-all duration-500 ease-in-out"
          >
            {/* الذراع اليسرى */}
            <path d="M 75 170 Q 55 190 65 145" fill="none" stroke="#4f46e5" strokeWidth="16" strokeLinecap="round" />
            {/* كف اليد اليسرى */}
            <circle cx="65" cy="140" r="13" fill="url(#skinGrad)" stroke="#fff" strokeWidth="1.5" />
            {/* أصابع اليد اليسرى */}
            <path d="M 56 132 L 54 120 M 61 130 L 61 116 M 67 130 L 68 117 M 73 133 L 76 122" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
          </g>

          {/* الذراع واليد اليمنى (اليد الأساسية في تمثيل الإشارة) */}
          <g
            style={{
              transformOrigin: '165px 170px',
              transform: isSigning
                ? motionType === 'wave' || motionType === 'wave_both'
                  ? 'rotate(48deg) translate(8px, -42px)'
                  : motionType === 'chin_forward'
                  ? 'rotate(15deg) translate(-32px, -35px)'
                  : motionType === 'thumbs_up'
                  ? 'rotate(25deg) translate(-15px, -30px)'
                  : motionType === 'wrist_tap'
                  ? 'rotate(-10deg) translate(-45px, -25px)'
                  : 'rotate(30deg) translate(-20px, -28px)'
                : 'rotate(0deg)'
            }}
            className="transition-all duration-300 ease-in-out"
          >
            {/* الذراع اليمنى */}
            <path d="M 165 170 Q 185 190 175 140" fill="none" stroke="#6366f1" strokeWidth="16" strokeLinecap="round" />
            {/* كف اليد اليمنى */}
            <circle cx="175" cy="135" r="14" fill="url(#skinGrad)" stroke="#ffffff" strokeWidth="2" />
            {/* أصابع اليد اليمنى المميزة بنقاط تتبع الذكاء الاصطناعي */}
            <path d="M 166 127 L 163 113 M 172 124 L 172 109 M 178 124 L 180 110 M 184 128 L 188 116" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            {/* نقاط المفاصل المضيئة لتوضيح حركة الأصابع للأصم */}
            {isSigning && (
              <>
                <circle cx="163" cy="113" r="2.5" fill="#10b981" />
                <circle cx="172" cy="109" r="2.5" fill="#10b981" />
                <circle cx="180" cy="110" r="2.5" fill="#10b981" />
                <circle cx="188" cy="116" r="2.5" fill="#10b981" />
                <circle cx="175" cy="135" r="3" fill="#38bdf8" />
              </>
            )}
          </g>

          {/* أسهم إرشادية لحركة اليد لتسهيل قراءة الإشارة */}
          {isSigning && (
            <g className="animate-pulse">
              <path
                d="M 145 100 Q 165 85 185 100"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <polygon points="185,100 178,95 180,104" fill="#34d399" />
            </g>
          )}
        </svg>
      </div>

      {/* شريط شرح الإشارة الحالية (Sign Gloss & Description) */}
      <div className="w-full bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3 text-center z-10 backdrop-blur-md">
        {activeSign || customGloss ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Hand className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                الترجمة الإشارية المتزامنة (Sign Gloss):
              </span>
            </div>
            <p className="text-base font-extrabold text-white">
              {activeSign ? activeSign.gloss : customGloss.gloss}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeSign ? activeSign.description : customGloss.description}
            </p>
          </div>
        ) : (
          <div className="py-2 text-slate-400 text-xs flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>عندما يتحدث الطرف السليم بالصوت، سيقوم المجسم بترجمة كلامه فوراً إلى لغة الإشارة هنا.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  // حالة الحساب الشخصي (User Profile State)
  const [currentUser, setCurrentUser] = useState({
    name: '', email: '', role: 'deaf',
    signDialect: 'لغة الإشارة المصرية / العربية الموحدة',
    voiceGender: 'male', autoSpeak: true
  });

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts', 'video_call', 'profile', 'how_it_works'
  const [selectedContact, setSelectedContact] = useState(null);

  // حالات مكالمة الفيديو والكاميرا
  const [inCall, setInCall] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // حالات الذكاء الاصطناعي والترجمة المزدوجة (AI Bi-Directional Translation States)
  const [isDetectingSign, setIsDetectingSign] = useState(false);
  const [detectedGloss, setDetectedGloss] = useState('');
  const [translatedSpeechText, setTranslatedSpeechText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // حالات تحويل الكلام إلى إشارة (Speech-to-Sign Avatar States)
  const [activeAvatarSign, setActiveAvatarSign] = useState(SIGN_DICTIONARY['مرحبا']);
  const [customAvatarGloss, setCustomAvatarGloss] = useState(null);
  const [isAvatarSigning, setIsAvatarSigning] = useState(false);
  const [speechInputText, setSpeechInputText] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);

  // سجل المحادثة المترجمة لحظياً (Live Accessible Transcript)
  const [messages, setMessages] = useState([]);

  // ---- Supabase: الجلسة والملف الشخصي وجهات الاتصال والرسائل ----
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);
  const myId = session?.user?.id;

  const mapContact = (p) => ({
    id: p.id, name: p.name || 'مستخدم', role: p.role,
    roleLabel: p.role === 'deaf' ? 'أصم (يستخدم لغة الإشارة)' : 'متحدث (يستخدم الصوت)',
    avatar: p.role === 'deaf' ? '🤟' : '🎤',
    bio: p.bio || '', signDialect: p.sign_dialect || '—',
  });

  const rowToMsg = (r) => ({
    id: r.id,
    sender: r.sender_id === myId ? `${currentUser.name} (أنت)` : (selectedContact?.name || 'مستخدم'),
    senderRole: r.sender_role, originalMode: r.original_mode, text: r.text, signGloss: r.sign_gloss,
    timestamp: new Date(r.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!myId) { setProfileLoaded(false); return; }
    (async () => {
      const { data: me } = await supabase.from('profiles').select('*').eq('id', myId).single();
      if (me) setCurrentUser(u => ({ ...u, name: me.name, email: session.user.email, role: me.role, signDialect: me.sign_dialect || u.signDialect }));
      setProfileLoaded(true);
      const { data: others } = await supabase.from('profiles').select('*').neq('id', myId).order('created_at', { ascending: false });
      setContacts((others || []).map(mapContact));
    })();
  }, [myId]);

  // حفظ تعديلات الحساب الشخصي تلقائياً
  useEffect(() => {
    if (!myId || !profileLoaded) return;
    const t = setTimeout(() => {
      supabase.from('profiles').update({ name: currentUser.name, role: currentUser.role, sign_dialect: currentUser.signDialect }).eq('id', myId);
    }, 800);
    return () => clearTimeout(t);
  }, [currentUser.name, currentUser.role, currentUser.signDialect, myId, profileLoaded]);

  // تحميل المحادثة + استقبال الرسائل لحظياً
  useEffect(() => {
    if (!myId || !selectedContact) { setMessages([]); return; }
    const cid = selectedContact.id;
    let active = true;
    supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${cid}),and(sender_id.eq.${cid},receiver_id.eq.${myId})`)
      .order('created_at')
      .then(({ data }) => { if (active) setMessages((data || []).map(rowToMsg)); });
    const ch = supabase.channel(`chat-${myId}-${cid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` },
        (payload) => { if (payload.new.sender_id === cid) setMessages(prev => [...prev, rowToMsg(payload.new)]); })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [myId, selectedContact?.id]);

  const addMessage = async (m) => {
    setMessages(prev => [...prev, m]);
    if (!myId || !selectedContact) return;
    await supabase.from('messages').insert({
      sender_id: myId, receiver_id: selectedContact.id, sender_role: m.senderRole,
      original_mode: m.originalMode, text: m.text, sign_gloss: m.signGloss,
    });
  };

  // ---- مكالمة WebRTC حقيقية + ترجمة لحظية ----
  const [liveCaption, setLiveCaption] = useState(null);
  const call = useCall(myId, currentUser.name, (d) => {
    if (d.type === 'caption') {
      setLiveCaption(d);
      if (currentUser.role === 'hearing') speakTextOutLoud(d.text);
    }
  });
  const sendCaption = (text, gloss, mode) => {
    addMessage({
      id: Date.now(), sender: `${currentUser.name} (أنت)`, senderRole: currentUser.role,
      originalMode: mode === 'sign' ? 'لغة إشارة 🤟 -> نص وصوت' : 'كلام 🎤 -> نص',
      text, signGloss: gloss || '',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    });
    call.sendData({ type: 'caption', text, gloss, mode });
  };
  useEffect(() => {
    if (call.status === 'ringing' && call.peer) {
      const c = contacts.find(x => x.id === call.peer.id);
      if (c) setSelectedContact(c);
      setActiveTab('video_call');
    }
  }, [call.status]);

  // تشغيل أو إيقاف كاميرا الويب الحقيقية لقراءة لغة الإشارة
  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraEnabled(false);
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
    } catch (err) {
      setCameraError('تعذر الوصول إلى الكاميرا الفعلية، تم تفعيل وضع المحاكاة الذكية للكاميرا.');
      setCameraEnabled(true);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // دالة نطق النص صوتياً للشخص السليم عندما يتحدث الأصم بلغة الإشارة (Text-to-Speech)
  const speakTextOutLoud = (text) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-EG';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  // استدعاء Gemini API لتحويل الكلمات الإشارية المتقطعة (Sign Gloss) إلى جملة عربية طبيعية، أو العكس
  const callGeminiTranslator = async (inputText, mode = 'gloss_to_arabic') => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) return null;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const systemPrompt = mode === 'gloss_to_arabic'
      ? "أنت مترجم فوري خبير في لغة الإشارة العربية. مهمتك تحويل الكلمات الإشارية الأولية المتقطعة (Sign Language Gloss) التي التقطتها الكاميرا من شخص أصم إلى جملة عربية فصيحة أو عامية مهذبة، طبيعية، واضحة وكاملة المعنى ليسمعها ويقرأها الطرف الآخر في مكالمة الفيديو. أرجع الجملة المترجمة فقط بدون أي مقدمات."
      : "أنت خبير في ترجمة الكلام العربي المنطوق إلى تسلسل حركات لغة الإشارة العربية (Sign Language Gloss) مع وصف مختصر لحركة اليدين ليقرأها ويفهمها الشخص الأصم. أرجع الرد بصيغة JSON يحتوي على حقلين: gloss (الكلمات الإشارية مفصولة بشرطة مثل: سلام - كيف - حال - أنت) و description (شرح مبسط لحركة اليدين وتعابير الوجه في سطر واحد).";

    const payload = {
      contents: [{ parts: [{ text: inputText }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      ...(mode === 'arabic_to_gloss' ? {
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              gloss: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["gloss", "description"]
          }
        }
      } : {})
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Error');
      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text;
    } catch (error) {
      return null;
    }
  };

  // 2. الاتجاه الثاني: استماع الكلام من الشخص السليم -> تحويله إلى لغة إشارة على الشاشة للأصم
  const handleTranslateSpeechToSign = async (spokenText, presetKey = null) => {
    const textToProcess = spokenText || speechInputText;
    if (!textToProcess.trim()) return;

    setIsAvatarSigning(true);
    setIsAiProcessing(true);

    let glossText = '';
    let descText = '';

    if (presetKey && SIGN_DICTIONARY[presetKey]) {
      setActiveAvatarSign(SIGN_DICTIONARY[presetKey]);
      setCustomAvatarGloss(null);
      glossText = SIGN_DICTIONARY[presetKey].gloss;
      descText = SIGN_DICTIONARY[presetKey].description;
      setIsAiProcessing(false);
    } else {
      // البحث عن تطابق جزئي في القاموس أو استخدام Gemini AI لتوليد وصف الإشارة
      const matchedKey = Object.keys(SIGN_DICTIONARY).find(k => textToProcess.includes(k));
      if (matchedKey) {
        setActiveAvatarSign(SIGN_DICTIONARY[matchedKey]);
        setCustomAvatarGloss(null);
        glossText = SIGN_DICTIONARY[matchedKey].gloss;
      } else {
        const aiJsonStr = await callGeminiTranslator(textToProcess, 'arabic_to_gloss');
        if (aiJsonStr) {
          try {
            const parsed = JSON.parse(aiJsonStr);
            glossText = parsed.gloss;
            descText = parsed.description;
          } catch (e) {
            glossText = textToProcess.split(' ').join(' - ');
            descText = 'تمثيل حركي متزامن للكلمات المنطوقة بواسطة الذكاء الاصطناعي.';
          }
        } else {
          glossText = textToProcess.split(' ').slice(0, 6).join(' - ');
          descText = 'تمثيل إشاري تفاعلي للجملة المنطوقة مع تعابير وجه متوافقة.';
        }
        setActiveAvatarSign(null);
        setCustomAvatarGloss({ gloss: glossText, description: descText });
      }
      setIsAiProcessing(false);
    }

    const newMsg = {
      id: Date.now(),
      sender: `${currentUser.name} (أنت)`,
      senderRole: 'hearing',
      originalMode: 'كلام منطوق 🎤 -> إشارة مرئية 🤟',
      text: textToProcess,
      signGloss: glossText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    addMessage(newMsg);
    setSpeechInputText('');

    setTimeout(() => {
      setIsAvatarSigning(false);
    }, 3500);
  };

  // تشغيل التعرف الصوتي الحقيقي من الميكروفون (Web Speech Recognition)
  const toggleVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // في حال عدم دعم المتصفح، نقوم بمحاكاة التقاط صوتي فوري
      setIsListeningSpeech(true);
      setTimeout(() => {
        setIsListeningSpeech(false);
        handleTranslateSpeechToSign('مرحباً، أنا أسمعك بوضوح، كيف يمكنني مساعدتك اليوم؟', 'مساعدة');
      }, 1800);
      return;
    }

    if (isListeningSpeech) {
      setIsListeningSpeech(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListeningSpeech(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpeechInputText(transcript);
      handleTranslateSpeechToSign(transcript);
    };
    recognition.onerror = () => {
      setIsListeningSpeech(false);
    };
    recognition.onend = () => {
      setIsListeningSpeech(false);
    };

    recognition.start();
  };

  if (authLoading) return <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">جاري التحميل...</div>;
  if (!session) return <Auth />;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* الشريط العلوي للتطبيق */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* شعار واسم التطبيق */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Hand className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold bg-gradient-to-l from-white via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
                  إشارة تواصل | Ishara AI
                </h1>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  مترجم مزدوج فوري
                </span>
              </div>
              <p className="text-xs text-slate-400">
                منصة مكالمات الفيديو الذكية لدمج الصم والمتحدثين بالذكاء الاصطناعي
              </p>
            </div>
          </div>

          {/* أزرار التنقل بين أقسام التطبيق */}
          <nav className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('video_call')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'video_call'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>غرفة الفيديو الذكية</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>الأصدقاء وجهات الاتصال</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>حسابي الشخصي</span>
            </button>

            <button
              onClick={() => setActiveTab('how_it_works')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'how_it_works'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>المعمارية التقنية</span>
            </button>
          </nav>

          {/* شارة حالة المستخدم الحالي مع زر التبديل السريع للدور */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-white">{currentUser.name}</span>
              <span className={`text-[11px] flex items-center gap-1 ${
                currentUser.role === 'deaf' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {currentUser.role === 'deaf' ? '🤟 وضع الأصم (يتحدث بالإشارة)' : '🎤 وضع السليم (يتحدث بالصوت)'}
              </span>
            </div>
            <button
              onClick={() => setCurrentUser(prev => ({
                ...prev,
                role: prev.role === 'deaf' ? 'hearing' : 'deaf'
              }))}
              title="اضغط للتبديل السريع بين تجربة المستخدم الأصم وتجربة المستخدم السليم"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تبديل دورك ({currentUser.role === 'deaf' ? 'إلى متحدث' : 'إلى أصم'})</span>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="text-xs bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-xl flex items-center gap-1.5 transition">
              <LogOut className="w-3.5 h-3.5" /><span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي حسب التبويب المختار */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {}
        {activeTab === 'video_call' && !selectedContact && (
          <div className="text-center text-slate-400 py-20">اختر جهة اتصال من تبويب «الأصدقاء وجهات الاتصال» لبدء المحادثة.</div>
        )}
        {activeTab === 'video_call' && selectedContact && (
          <CallRoom contact={selectedContact} myId={myId} role={currentUser.role} call={call}
            messages={messages} liveCaption={liveCaption} sendCaption={sendCaption}
            translateGloss={(g) => callGeminiTranslator(g, 'gloss_to_arabic')} />
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">دليل المستخدمين وجهات الاتصال</h2>
                <p className="text-sm text-slate-400 mt-1">
                  تواصل مع أصدقائك أو مع مقدمي الخدمات، وسيقوم التطبيق تلقائياً بتفعيل المترجم الذكي حسب حالة الطرفين.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  🤟 مستخدمو لغة الإشارة
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  🎤 مستخدمو الصوت
                </span>
              </div>
            </div>

            {contacts.length === 0 && <p className="text-center text-slate-400 py-10">لا يوجد مستخدمون آخرون بعد. شارك رابط الموقع مع أصدقائك ليظهروا هنا.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between transition group shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
                        {contact.avatar}
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                        contact.role === 'deaf'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {contact.role === 'deaf' ? '🤟 أصم' : '🎤 متحدث'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-4">{contact.name}</h3>
                    <p className="text-xs text-indigo-300 mt-0.5">{contact.roleLabel}</p>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">{contact.bio}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500">نظام التواصل: </span>
                      <span className="text-slate-200">{contact.signDialect}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setActiveTab('video_call');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>بدء مكالمة فيديو ذكية</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">إعدادات الحساب الشخصي وتفضيلات الإتاحة</h2>
                <p className="text-sm text-slate-400 mt-1">
                  حدد طريقة تواصلك الأساسية ليقوم الذكاء الاصطناعي بتهيئة المترجم الفوري أثناء المكالمات
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">الاسم الكامل في الحساب</label>
                <input
                  type="text"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={currentUser.email}
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* اختيار نوع المستخدم: أصم أو متحدث سليم */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">هوية التواصل الأساسية في المكالمات</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentUser({ ...currentUser, role: 'deaf' })}
                  className={`p-4 rounded-2xl border text-right transition flex items-start gap-3 ${
                    currentUser.role === 'deaf'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Hand className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-sm text-white">أصم / ضعيف سمع (أستخدم لغة الإشارة)</div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      تلتقط الكاميرا إشارات يدك وتحولها لصوت يسمعه الطرف الآخر، وتُترجم أصواتهم إلى حركات إشارة أمامك.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentUser({ ...currentUser, role: 'hearing' })}
                  className={`p-4 rounded-2xl border text-right transition flex items-start gap-3 ${
                    currentUser.role === 'hearing'
                      ? 'bg-indigo-950/40 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Mic className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-sm text-white">متحدث سليم (أستخدم الصوت والكلام)</div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      يستمع التطبيق لصوتك ويحوله إلى لغة إشارة مرئية للطرف الأصم، ويقرأ إشاراتهم لينطقها لك صوتياً.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">لهجة لغة الإشارة المفضلة</label>
                <select
                  value={currentUser.signDialect}
                  onChange={(e) => setCurrentUser({ ...currentUser, signDialect: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option>لغة الإشارة المصرية / العربية الموحدة</option>
                  <option>لغة الإشارة الخليجية / السعودية</option>
                  <option>لغة الإشارة الشامية</option>
                  <option>لغة الإشارة الأمريكية (ASL)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div>
                  <div className="text-sm font-bold text-white">النطق الصوتي التلقائي (Text-to-Speech)</div>
                  <div className="text-xs text-slate-400">قراءة الإشارات المترجمة بصوت مسموع تلقائياً</div>
                </div>
                <input
                  type="checkbox"
                  checked={ttsEnabled}
                  onChange={(e) => setTtsEnabled(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'how_it_works' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-emerald-950 border border-indigo-500/30 rounded-2xl p-6 lg:p-8">
              <h2 className="text-xl lg:text-2xl font-extrabold text-white">
                كيف يعمل التطبيق تقنياً؟ (خارطة طريق لتنفيذ مشروعك بالكامل)
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
                لبناء هذا التطبيق في بيئة إنتاجية (Production) على الموبايل والويب، يعتمد النظام على 4 وحدات ذكاء اصطناعي واتصال مرئي تعمل بالتوازي في الوقت الفعلي (Real-Time):
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-base font-bold text-white">
                  الاتجاه الأول: من لغة الإشارة إلى كلام (Sign-to-Speech Pipeline)
                </h3>
                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                  <li>
                    <strong className="text-emerald-300">استخراج المفاصل (Pose & Hand Landmarks):</strong> استخدام مكتبة <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">MediaPipe Holistic</code> لتتبع 21 نقطة لكل يد + تعابير الوجه مباشرة على جهاز المستخدم (On-Device) لتقليل التأخير.
                  </li>
                  <li>
                    <strong className="text-emerald-300">تصنيف الإشارات (Sequence Model):</strong> تمرير إحداثيات المفاصل المتتابعة إلى نموذج <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">LSTM / Transformer</code> لاستخراج الكلمات الإشارية (Sign Gloss) مثل: (أنا - ذهاب - مستشفى - غداً).
                  </li>
                  <li>
                    <strong className="text-emerald-300">صياغة الجملة والترجمة الصوتية (LLM + TTS):</strong> يقوم نموذج <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">Gemini API</code> بتحويل الكلمات المتقطعة إلى جملة عربية سليمة، ثم ينطقها محرك <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">TTS</code> للطرف السليم.
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-base font-bold text-white">
                  الاتجاه الثاني: من كلام السليم إلى لغة إشارة (Speech-to-Sign Pipeline)
                </h3>
                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                  <li>
                    <strong className="text-indigo-300">التعرف على الكلام (ASR / Speech-to-Text):</strong> تحويل صوت الشخص السليم لحظياً إلى نص عربي عبر <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">Web Speech API</code> أو <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">Whisper</code>.
                  </li>
                  <li>
                    <strong className="text-indigo-300">التحويل إلى قواعد لغة الإشارة (Text-to-Gloss):</strong> استخدام <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">Gemini AI</code> لتبسيط الجملة المنطوقة وتحويلها إلى تتابع قواعد لغة الإشارة العربية (ArSL Gloss).
                  </li>
                  <li>
                    <strong className="text-indigo-300">تحريك المجسم ثلاثي الأبعاد (3D Avatar Animation):</strong> ربط كل كلمة إشارية بملف حركة <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">Three.js / ReadyPlayerMe FBX</code> ليقوم المجسم بتمثيلها أمام الأصم بسلاسة.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}