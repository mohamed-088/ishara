# إشارة تواصل | Ishara AI

## 1) Supabase
1. أنشئ مشروع على supabase.com
2. SQL Editor ← الصق محتوى `supabase/schema.sql` ← Run
3. Project Settings ← API ← انسخ `Project URL` و `anon public key`
4. (للتجربة السريعة) Authentication ← Providers ← Email ← عطّل "Confirm email"

## 2) تشغيل محلي
cp .env.example .env   # حط القيم
npm install
npm run dev

## 3) GitHub
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/USERNAME/ishara-ai.git
git push -u origin main

## 4) رابط live (Vercel)
vercel.com ← Add New Project ← Import من GitHub ← أضف Environment Variables:
VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY ← Deploy
بعدها كل `git push` بيحدّث الموقع تلقائيا.
ثم في Supabase: Authentication ← URL Configuration ← حط رابط الموقع في Site URL.

## 5) المكالمات وتعرف الإشارة
شغّل `supabase/migration_calls.sql` في SQL Editor (جدول عينات الإشارات).
الأصم: يعلّم الإشارات من لوحة "تعليم الإشارات" (4-5 عينات لكل إشارة) قبل ما يستخدمها في مكالمة.
