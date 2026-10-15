import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('deaf');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setMsg('');
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { name: name || 'مستخدم', role } } });
    if (error) setMsg(error.message);
    else if (mode === 'signup') setMsg('تم إنشاء الحساب. لو التفعيل بالإيميل مفعّل، افتح الرسالة اللي وصلتك.');
    setBusy(false);
  };

  const input = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500';
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-extrabold text-center">إشارة تواصل | Ishara AI</h1>
        {mode === 'signup' && (
          <>
            <input className={input} placeholder="الاسم" value={name} onChange={e => setName(e.target.value)} />
            <select className={input} value={role} onChange={e => setRole(e.target.value)}>
              <option value="deaf">أصم / ضعيف سمع (أستخدم لغة الإشارة)</option>
              <option value="hearing">متحدث (أستخدم الصوت)</option>
            </select>
          </>
        )}
        <input className={input} type="email" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="كلمة المرور (6 أحرف على الأقل)" value={password} onChange={e => setPassword(e.target.value)} />
        {msg && <p className="text-xs text-amber-400">{msg}</p>}
        <button onClick={submit} disabled={busy} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm">
          {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </button>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-xs text-slate-400 hover:text-white">
          {mode === 'login' ? 'ما عندكش حساب؟ سجّل الآن' : 'عندك حساب؟ سجّل دخول'}
        </button>
      </div>
    </div>
  );
}
