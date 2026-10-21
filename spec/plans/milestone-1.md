# תוכנית – Milestone 1: בסיס פרויקט ומסך ראשי עובד

> מקורות: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `MILESTONES.md`, והתמונות `wireframes.png`, `mockups.png`, `style-guide.png`.
> מצב נוכחי: ב-Repository יש רק מסמכי spec, `CLAUDE.md` ו-`.gitignore`. ה-remote כבר מחובר (`origin` → `github.com/kottuzik/jokes`).

## 1. מטרה והיקף

להקים פרויקט React + TypeScript + Vite שרץ מקומית, עם מסך ראשי יחיד בעברית (RTL) לפי העיצוב המאושר:
כותרת "בדיחה בקליק", אזור "בחר נושא לבדיחה" עם שדה טקסט וכפתור "צור בדיחה", וכותרת "רשימת בדיחות" עם אזור רשימה ריק.

**בתוך ההיקף:**
- שלד פרויקט, פקודות `dev` / `build` / `typecheck` / `test`.
- תיקיית `api/` שמורה ל-Vercel Function (המימוש עצמו ב-Milestone 2).
- עיצוב לפי ה-Style Guide: Heebo, טוקני צבע, טיפוגרפיה, כפתור ראשי, שדה קלט, Responsive.
- נגישות בסיסית: HTML סמנטי, `label` לשדה, סדר Tab טבעי, Focus גלוי.

**מחוץ להיקף (לא לממש):**
- קריאה ל-API, Spinner, הודעות שגיאה/Offline (Milestones 2, 4).
- כרטיסי בדיחות, העתקה/שיתוף/מחיקה, "ניקוי בדיחות", Dialog (Milestone 3).
- PWA / Service Worker / Manifest (Milestone 4).
- תפריט המבורגר, מסכי אודות/עזרה/הגדרות, כוכב מועדפים, אייקון חיפוש פונקציונלי, Router — אינם מאושרים ב-PRD.
- בדיחות דמה — אסור להציג בדיחות לדוגמה כאילו נוצרו.
- `.env` / מפתחות — לא נדרשים ב-Milestone זה.

## 2. מבנה קבצים

```text
/
├── index.html                 # <html lang="he" dir="rtl">, title, theme-color, favicon
├── package.json
├── package-lock.json
├── vite.config.ts             # React plugin + Vitest config (jsdom)
├── tsconfig.json              # project references
├── tsconfig.app.json          # src/
├── tsconfig.node.json         # vite.config.ts
├── eslint.config.js           # from the Vite template (kept as-is)
├── public/
│   └── favicon.svg            # simple smiley in brand colors
├── api/
│   └── .gitkeep               # reserved for /api/jokes (Milestone 2)
└── src/
    ├── main.tsx               # React root + global CSS + font import
    ├── App.tsx                # page layout: Header + main (JokeForm, JokeList)
    ├── App.module.css
    ├── styles/
    │   └── global.css         # design tokens (CSS variables), reset, base typography, focus style
    ├── components/
    │   ├── Header.tsx / Header.module.css           # product title "בדיחה בקליק"
    │   ├── Illustration.tsx / Illustration.module.css # decorative SVG smiley + blobs, aria-hidden
    │   ├── JokeForm.tsx / JokeForm.module.css       # label + input + primary button
    │   └── JokeList.tsx / JokeList.module.css       # "רשימת בדיחות" heading + empty <ul>
    ├── test/
    │   └── setup.ts           # @testing-library/jest-dom
    └── App.test.tsx           # basic UI tests (see §6)
```

## 3. הקמת הפרויקט

1. יצירת שלד עם תבנית `react-ts` של Vite לתוך שורש הפרויקט הקיים (בלי לדרוס את `spec/`, `CLAUDE.md`, `.gitignore`). מחיקת קובצי הדוגמה של התבנית (לוגו, `App.css`, מונה לדוגמה).
2. תלויות נוספות:
   - `@fontsource-variable/heebo` — גופן Heebo מאוחסן מקומית (ראה ADR למטה).
   - פיתוח/בדיקות: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.
   - אין ספריית UI, אין Router, אין ספריית State.
3. סקריפטים ב-`package.json`:
   - `dev`: `vite`
   - `typecheck`: `tsc -b`
   - `build`: `tsc -b && vite build`
   - `preview`: `vite preview`
   - `test`: `vitest run`
   - `lint`: `eslint .` (מהתבנית)
4. `.gitignore` כבר מכסה `node_modules/`, `dist/`, `*.tsbuildinfo`, `coverage/` — אין צורך בשינוי. לא לגעת בשורת `.env`.
5. עדכון `CLAUDE.md` → "פקודות הרצה": dev = `npm run dev`, test = `npm test`.

## 4. המסך הראשי – מבנה ותוכן

מבנה סמנטי (מלמעלה למטה, טור אחד):

```html
<header>  <h1>בדיחה בקליק</h1>  </header>
<main>
  <Illustration aria-hidden />                 <!-- decorative only -->
  <section aria-labelledby="form-title">       <!-- white rounded card -->
    <h2 id="form-title"><label for="topic">בחר נושא לבדיחה</label></h2>
    <form>
      <input id="topic" type="text" placeholder="לדוגמה: חיות, עבודה, בית ספר..." dir="auto" autocomplete="off" />
      <button type="submit">✦ צור בדיחה</button>
    </form>
  </section>
  <section aria-labelledby="list-title">
    <h2 id="list-title">רשימת בדיחות</h2>
    <ul> (empty) </ul>
  </section>
</main>
```

פרטים:
- **טקסטים** — רק הנוסחים מה-Wireframes: "בדיחה בקליק", "בחר נושא לבדיחה", "לדוגמה: חיות, עבודה, בית ספר...", "צור בדיחה", "רשימת בדיחות".
- **השדה** — Controlled input ב-`useState` (הטקסט נשמר בזמן הקלדה, לא מתאפס). לא שדה חובה (בלי `required`). `dir="auto"` כדי שטקסט באנגלית יוצג נכון בתוך השדה, בעוד שה-placeholder מיושר לימין.
- **הכפתור** — `type="submit"`; ה-`onSubmit` עושה `preventDefault()` בלבד ולא שולח דבר (החיבור ל-API ב-Milestone 2). הכפתור **לא** מושבת, כדי שיהיה נגיש במקלדת לפי ה-DoD. אייקון הניצוץ (✦) הוא SVG דקורטיבי עם `aria-hidden`.
- **אזור הרשימה** — כותרת + `<ul>` ריק. לא מוצג טקסט "אין בדיחות" (הנוסח לא הוגדר ב-spec; ראה §9).
- **לא מוצגים:** אייקון המבורגר, זכוכית מגדלת בשדה, כוכבים, כפתור "ניקוי בדיחות".

## 5. עיצוב (לפי DESIGN.md וה-Style Guide)

**טוקנים ב-`global.css`** (CSS custom properties על `:root`):
- צבעים: `--color-primary #7C3AED`, `--color-primary-light #A78BFA`, `--color-primary-dark #5B21B6`, `--color-accent #FACC15`, `--color-accent-light #FEF08A`, `--color-accent-dark #F97316`, `--color-text #111827`, `--color-text-secondary #6B7280`, `--color-border #E5E7EB`, `--color-bg #F9FAFB`, `--color-success #10B981`, `--color-error #EF4444`, `--color-info #3B82F6`, `--color-surface #FFFFFF`.
- טיפוגרפיה: `--font-family: 'Heebo Variable', 'Heebo', system-ui, sans-serif`; H1 32/40 Bold, H2 24/32 Bold, H3 18/28 Bold, Body 16/24, Small 14/20.
- רדיוס: `--radius-md 12px`, `--radius-lg 16px`; צל רך: `--shadow-card`.

**רכיבים:**
- **כותרת המוצר (H1):** Bold, בצבע Primary Dark, עם "ניצוצות" צהובים קטנים דקורטיביים (כמו ב-Mockup).
- **איור:** SVG פשוט של פרצוף צוחק צהוב + כתמי סגול/לילך/צהוב ברקע העליון. `aria-hidden="true"`, גובה מוגבל כדי שלא ידחוק את הטופס.
- **כרטיס הטופס:** רקע לבן, פינות 16px, צל רך, ריווח פנימי נדיב.
- **שדה קלט:** רקע לבן, מסגרת 1px `--color-border`, פינות 12px, גובה ~48px, placeholder ב-`--color-text-secondary` (ניגודיות ~4.8:1 על לבן).
- **כפתור ראשי:** רקע Primary, טקסט לבן Bold, פינות 12px, רוחב מלא, גובה ~52px; Hover → Primary Dark. ניגודיות לבן על `#7C3AED` ≈ 5.7:1 (עובר AA).
- **H2:** "בחר נושא לבדיחה" ו"רשימת בדיחות" – 24/32 Bold; במסכים צרים מותר להקטין ל-H3 (18/28) אם הכותרת נשברת לא יפה, כפי שנראה ב-Mockup.

**Focus גלוי:** כלל אחיד `:focus-visible { outline: 3px solid var(--color-primary-dark); outline-offset: 2px; }` לשדה ולכפתור (בכפתור הסגול – outline בצבע Primary Dark עם offset כדי שיובחן מהרקע). לא להסיר outline בלי תחליף.

**Responsive (Mobile-first):**
- טור יחיד, `padding-inline: 16px`.
- `max-width: 560px` לתוכן, ממורכז במחשב.
- `box-sizing: border-box`, `min-width: 0`, ובלי רוחבים קבועים → ללא גלילה אופקית ב-320–430px.
- האיור והכתמים חתוכים עם `overflow: hidden` על המיכל שלהם (לא על `body`) כדי שלא ייצרו גלילה אופקית.

## 6. בדיקות

**אוטומטיות (`npm test`, Vitest + Testing Library):**
1. הכותרת "בדיחה בקליק" מוצגת כ-H1.
2. קיים שדה עם השם הנגיש "בחר נושא לבדיחה", והוא אינו `required`.
3. הקלדה בעברית ("חתולים") ובאנגלית ("cats") – הערך נשמר במלואו; ניקוי השדה משאיר אותו ריק בלי שגיאה.
4. כפתור "צור בדיחה" קיים ואינו מושבת; לחיצה עליו לא מוסיפה פריטים לרשימה ולא מנקה את השדה.
5. כותרת "רשימת בדיחות" קיימת והרשימה ריקה.
6. סדר Tab: מהמסמך → השדה → הכפתור.
7. `document.documentElement` עם `lang="he"` ו-`dir="rtl"` (בדיקה על `index.html` / או בדיקת קובץ פשוטה).

**בנייה:** `npm run typecheck` ו-`npm run build` עוברים ללא שגיאות.

**בדיקה ידנית שלי (בדפדפן המובנה) לפני סימון 🟡:**
- פתיחת `npm run dev`, צילום מסך ברוחב מחשב וברוחב מובייל (375px) והשוואה ל-Mockup.
- בדיקה ש-`document.documentElement.scrollWidth <= window.innerWidth` ב-320px ו-375px (אין גלילה אופקית).
- ניווט Tab לשדה ולכפתור – Focus נראה בבירור.
- הקלדת עברית ואנגלית בשדה.
- וידוא שאין קישורים/כפתורים מעבר לשדה ולכפתור, ואין Routes.
- סגירת שרת הפיתוח בסיום.

## 7. מיפוי ל-Definition of Done

| תנאי DoD | איך מתקיים |
|---|---|
| הפרויקט ב-GitHub; התקנה, `dev`, `vite build` ו-TypeScript עוברים | `npm install`, `npm run dev`, `npm run build` (כולל `tsc -b`). ה-remote כבר מחובר; ההעלאה עצמה תתבצע רק כשתבקשי "דחוף שינויים לגיטהאב" (לפי CLAUDE.md אין commit/push לפני כן). |
| השדה מקבל עברית ואנגלית, גם ריק, ולא מתאפס בהקלדה | Controlled input + בדיקות 2–4. |
| RTL, ללא גלילה אופקית במובייל, Tab ו-Focus גלוי | `dir="rtl"`, CSS Mobile-first, `:focus-visible`, בדיקות 6–7 + בדיקה ידנית. |
| אין Routes, מסכי הגדרות/אודות או פעולות לא מאושרות | אין Router, אין תפריט/כוכבים/חיפוש; רק שדה וכפתור. |

## 8. החלטות לתיעוד כ-ADR ב-ARCHITECTURE.md (בזמן הבנייה)

- **ADR-1: אחסון מקומי של גופן Heebo** — **הקשר:** נדרש Heebo, ובהמשך (Milestone 4) הממשק צריך לעבוד Offline. **החלטה:** שימוש בחבילת `@fontsource-variable/heebo` במקום קישור ל-Google Fonts. **השלכות:** הגופן נכלל ב-Build ויישמר ב-Precache של ה-PWA; אין תלות בשרת חיצוני ואין שליחת בקשות לגוגל.
- **ADR-2: Vitest + Testing Library לבדיקות** — **הקשר:** ה-Milestone דורש "פקודות בדיקות בסיסיות". **החלטה:** Vitest (משתלב עם Vite) עם jsdom ו-Testing Library. **השלכות:** `npm test` מריץ בדיקות UI מהירות; בדיקות דפדפן מלאות (E2E) נדחות ל-Milestones מאוחרים יותר לפי הצורך.

## 9. שאלות פתוחות / הערות למשתמשת

1. **טקסט לרשימה ריקה** — ה-spec לא מגדיר הודעה כשאין עדיין בדיחות. ברירת המחדל בתוכנית: רק הכותרת "רשימת בדיחות" ללא טקסט. אם תרצי הודעה (למשל "עוד אין בדיחות — צרו את הראשונה!"), צריך לאשר נוסח.
2. **אייקון זכוכית מגדלת בשדה** — מופיע ב-Mockup אך DESIGN.md מציין שאינו פונקציית חיפוש. התוכנית משמיטה אותו כדי לא לבלבל משתמשים; אפשר להוסיף כקישוט בלבד אם תרצי.
3. **הערה ל-Milestone 2:** ARCHITECTURE.md מזכיר `.env.local` לשמירת המפתח, ואילו CLAUDE.md קובע `.env.example` → `.env`. אין לכך השפעה על Milestone 1; נצטרך להחליט לפני Milestone 2.
