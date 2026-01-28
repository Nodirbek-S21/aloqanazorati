
# NazoratHub - Markaziy Boshqaruv Tizimi

Ushbu tizim O'zbekistonning barcha viloyatlaridagi operatorlarni bitta joydan nazorat qilish uchun.

## 🚀 Bazani "Avtomatik" ulash (3 qadamda):

1. **Supabase-da loyiha oching**: [supabase.com](https://supabase.com) ga kiring va bepul loyiha yarating.
2. **Jadvallarni yarating**: Supabase panelida chap tomonda **"SQL Editor"** ga kiring va loyihamizdagi `setup_database.sql` fayli ichidagi hamma narsani ko'chirib (Copy) o'sha yerga qo'ying (Paste) va **"Run"** bosing.
3. **Kodni ulang**: Supabase-dagi **Project Settings -> API** bo'limidan `URL` va `anon public key` ni ko'chirib oling va loyihamizdagi `services/db.ts` faylidagi `SUPABASE_URL` va `SUPABASE_ANON_KEY` o'rniga qo'ying.

**Tayyor!** Endi siz GitHub-ga yuklab, istalgan joyda (Vercel, Netlify) deploy qilsangiz, hamma ma'lumotlar bitta markaziy bazada saqlanadi.

## Xavfsizlik
- **Admin Paroli**: `HAYOT-YO'LI.1234.` (Buni keyinchalik `App.tsx` dan o'zgartirishingiz mumkin).
- **Rol**: Admin barcha hodimlarni yaratadi, Menejerlar esa o'z viloyati bazasini boshqaradi.
