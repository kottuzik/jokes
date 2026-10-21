# ARCHITECTURE – בדיחה בקליק

> **בסיס:** `PRD.md` של "בדיחה בקליק". **מועד בדיקת מקורות:** 21.10.2026.  
> **מטרה:** תכנון טכני ממוקד למימוש אפליקציית Web/PWA ציבורית ליצירת בדיחות באמצעות GPT-5, ללא Database או חשבונות משתמשים.

## 1. Technology Stack שנבחר

| רכיב | בחירה | תפקיד |
|---|---|---|
| Frontend | React + TypeScript | UI רספונסיבי, רכיבים וניהול מצב זמני |
| Build ושרת פיתוח | Vite | פיתוח מקומי ויצירת קובצי Production סטטיים |
| עיצוב | CSS רגיל עם CSS Modules לפי הצורך | RTL, Responsive, אנימציות ו-WCAG ללא ספריית UI נוספת |
| PWA | `vite-plugin-pwa` עם Workbox (`generateSW`) | Web App Manifest, Service Worker ו-Precache לממשק Offline |
| Backend | Vercel Functions ב-Node.js + TypeScript | Endpoint מאובטח המקבל נושא ופונה ל-OpenAI |
| AI | OpenAI Responses API, מודל `gpt-5`, באמצעות OpenAI Node SDK | יצירת בדיחה קצרה ובטוחה למשפחה |
| Hosting | Vercel | Hosting של ה-Frontend ושל ה-Backend באותו Origin, HTTPS ו-Deployment |
| קוד ו-CI/CD | Git + GitHub + אינטגרציית Git של Vercel | Repository יחיד ו-Deployments אוטומטיים |
| אחסון נתונים | React in-memory state בלבד | רשימת הבדיחות והנושא בזמן טעינת הדף הנוכחית |
| Authentication / Database / קבצים | **לא נדרשים** | אין חשבונות, היסטוריה קבועה או העלאות קבצים |

### החלטות והנמקות

- **React + Vite במקום Next.js:** מדובר במסך יחיד אינטראקטיבי, ללא SEO דינמי, SSR או Routing מורכב. React נוח לניהול הרשימה, מצבי טעינה ואישור מחיקה; Vite מפיק Frontend סטטי פשוט. Next.js הוא חלופה בשלה, אך מוסיף כאן יכולות שאינן נחוצות. Vue + Vite גם מתאים, אך React נבחר בזכות תיעוד רחב וקהילה גדולה.
- **Vercel Functions במקום Express server או Backend-as-a-Service:** נדרש רק Endpoint אחד. Functions פועלות בצד השרת ומאפשרות שמירת סוד, בלי ניהול שרת קבוע. תיעוד Vercel מאשר שימוש ב-Functions לצד פרויקט Vite באמצעות תיקיית `api/` בשורש הפרויקט.
- **Vercel במקום GitHub Pages:** GitHub Pages מתאים ל-Frontend סטטי בלבד ואינו יכול לשמור ולבצע בעצמו קריאה מאובטחת ל-OpenAI. הפרדה בין GitHub Pages לשרת אחר תוסיף Deployment, Origin ו-CORS; לכן עדיף Hosting משותף ב-Vercel.
- **OpenAI Responses API:** מתאים ליצירת טקסט עם מודל `gpt-5` שנקבע במפורש ב-PRD. אין להחליף למודל זול יותר ללא שינוי דרישת המוצר.
- **CSS מקומי במקום ספריית Components גדולה:** הממשק קטן והעיצוב מותאם אישית; ניתן לממש אותו עם HTML סמנטי ו-CSS בלי להוסיף שכבת תלויות מיותרת.
- **PWA עם Precache:** קובצי הממשק נטענים גם כשאין רשת; Endpoint ה-AI לעולם אינו מוגש מתוך Cache.
- **ללא Database:** הנתונים נמחקים ברענון/פתיחה מחדש; לכן Supabase, Migrations, Storage ו-Authentication אינם חלק מהמערכת.

### סיכונים, מגבלות ועלויות

1. **OpenAI API הוא שירות בתשלום לפי שימוש:** כל בקשת יצירה עשויה לצרוך Tokens; אין מכסה או Rate Limit יזומים באפליקציה לפי ה-PRD. לכן קיימת חשיפה להוצאות, במיוחד באתר ציבורי. ניתן להגדיר התראות ותקציב בחשבון ספק השירות כאמצעי תפעולי, אך אין להציגם כמכסת שימוש מובטחת. תמחור מדויק משתנה; יש לבדוק את המחיר המעודכן של `gpt-5` לפני הפעלה.
2. **Vercel Hobby מוגבל לשימוש אישי ולא מסחרי:** לפרויקט לימודי/אישי עשוי להתאים בכפוף לתנאים ולמכסות; לשימוש מסחרי נדרשת תוכנית מתאימה. מגבלות Functions, זמני הרצה ומכסות משתנות לפי תוכנית והגדרת Fluid Compute. אין להניח שהשירות ללא עלות בכל היקף.
3. **מודל AI אינו דטרמיניסטי:** הוראות Prompt לצמצום חזרות, אורך וסינון תוכן אינן מבטיחות עמידה מלאה. המערכת תבצע בדיקות תקינות ותציג שגיאה כשלא מתקבל טקסט תקין; אין הבטחה למניעת כפילויות או לכללי תוכן מוחלטים.
4. **Web Share API אינו זמין בכל דפדפן:** כפתור השיתוף יופעל רק כאשר `navigator.share` נתמך. העתקה תהיה זמינה בנפרד.
5. **Offline:** פתיחה ללא אינטרנט אפשרית לאחר טעינה/התקנה מוצלחת של נכסי ה-PWA. פתיחה ראשונה לחלוטין במצב Offline אינה מובטחת.
6. **זיהוי שפת הנושא:** השפה מוסקת באמצעות GPT-5 מתוך טקסט חופשי; נושאים קצרים, מעורבים או עמומים עלולים להפיק שפה שונה מהמצופה.

## 2. ארכיטקטורת המערכת

### 2.1 מבנה ואחריות

```text
Browser / Installed PWA
  ├── React UI (RTL + Responsive + WCAG 2.2 AA)
  ├── In-memory State (topic, jokes, loading, error, confirmation)
  ├── Clipboard / Web Share APIs
  └── Service Worker + App Shell Precache
           │ HTTPS, same origin; POST /api/jokes
           ▼
Vercel Function (Node.js / TypeScript)
  ├── Validation + input bounds
  ├── Prompt assembly + short recent-jokes context
  ├── OpenAI SDK (server-side API key)
  └── Response normalization / error mapping
           │ HTTPS
           ▼
OpenAI Responses API — model: gpt-5
```

אין שרת מתמשך, תורים, Background Jobs, Database או שירותי אחסון קבצים.

### 2.2 חלוקה ל-Modules לוגיים

**Frontend**
- **Joke Form:** תיבת נושא אופציונלית וכפתור יצירה; הטקסט נשאר לאחר יצירה. בזמן בקשה הכפתור מושבת ומוצגים Spinner והטקסט `מכינים לך בדיחה...`.
- **Jokes List / Joke Item:** הוספת בדיחות בראש הרשימה (החדשה ראשונה); טקסט הבדיחה וכפתורי `העתקה`, `שיתוף` (אם נתמך) ומחיקה.
- **Joke State:** מצב בזיכרון בלבד. רשימה, טקסט נושא, מצב טעינה, הודעת שגיאה, פרטי הבקשה האחרונה שנכשלה ואישור מחיקה. אין `localStorage`, `sessionStorage`, IndexedDB או Persisted State עבור הבדיחות.
- **Joke API Client:** קריאת `fetch` אל `/api/jokes`, ניהול הצלחה/שגיאה וביטול בקשה בעת Unmount במידת הצורך.
- **Connectivity UI:** זיהוי `navigator.onLine` ואירועי `online/offline` לצורך משוב; שגיאת רשת בפועל היא הסמכות הסופית משום ש-`navigator.onLine` אינו מבטיח גישה לשרת.
- **Share / Clipboard:** שימוש ב-`navigator.clipboard.writeText` וב-`navigator.share` בתגובה לפעולת משתמש; בדיקת תמיכה וטיפול בכישלון או בביטול שיתוף.
- **Confirmation Dialog:** אישור מחיקת פריט או ניקוי הרשימה, עם כפתורי אישור/ביטול ו-Focus מנוהל.
- **PWA Shell:** Manifest, אייקונים ו-Service Worker עם Cache לקובצי ממשק בלבד.

**Backend**
- **HTTP Endpoint:** מקבל בקשת JSON, בודק מבנה וגבולות, ומחזיר JSON מוגדר.
- **Joke Generation Service:** בונה Prompt קבוע עם כללי בטיחות/שפה/אורך, מוסיף נושא ובדיחות קודמות לצמצום חזרות, ושולח ל-OpenAI.
- **OpenAI Adapter:** אחראי על `gpt-5`, זמן המתנה מוגבל, חילוץ טקסט ותיקוף תוצאה.
- **Error Mapper:** מתרגם כשלי ספק/Timeout/תגובה לא תקינה לתשובת שגיאה ללא חשיפת סודות או מידע פנימי.

### 2.3 Data Model ואחסון

**נתוני Client בזיכרון הדף הנוכחי בלבד:**

| ישות | שדות עיקריים | הערות |
|---|---|---|
| `Joke` | `id: string`, `text: string`, `language?: string` | `id` נוצר ב-Client לצורך רשימה ומחיקה; `language` אופציונלי להצגת `lang`/`dir` מדויקים יותר |
| `JokeRequest` | `topic: string`, `previousJokes: string[]` | Payload לבקשת יצירה; בדיחות קודמות משמשות כהקשר בלבד |
| `JokeResponse` | `joke: string`, `language?: string` | טקסט בדיחה חדש, ללא שמירה בשרת |
| `UIState` | `topic`, `jokes`, `isLoading`, `error`, `failedRequest`, `confirmation` | מצב React זמני |

- `previousJokes` נשלח מתוך רשימת הבדיחות הקיימת, בהיקף מוגבל, למשל עד 10 בדיחות אחרונות ועד 2,000 תווים במצטבר. זהו **גבול Payload טכני**, לא מגבלה על מספר הבדיחות שהמשתמש רשאי לייצר או לשמור בזיכרון.
- הגבלת ההקשר מפחיתה Tokens ועלויות אך משמעותה שבבדיחות ישנות יותר אין מנגנון בדיקה מלא למניעת חזרה. בהתאם ל-PRD, מניעת כפילויות היא Best Effort בלבד.
- הרשימה אינה נשמרת ב-Service Worker Cache. גם מידע שנשלח לספק ה-AI עשוי להיות כפוף למדיניות שמירת הנתונים של הספק, בנפרד מהיעדר שמירה באפליקציה.
- בעת רענון הדף, פתיחה חדשה או טעינה מחדש של ה-PWA, ה-State מאותחל מחדש כרשימה ריקה.

### 2.4 API Contract

**`POST /api/jokes`** — אותו Origin, `Content-Type: application/json`.

בקשה לדוגמה:

```json
{
  "topic": "חתולים",
  "previousJokes": ["בדיחה קודמת לדוגמה"]
}
```

בקשת נושא ריק: `"topic": ""` תייצר בדיחה כללית בעברית.

תשובה תקינה (`200`):

```json
{
  "joke": "טקסט הבדיחה שהמודל יצר",
  "language": "he"
}
```

`language` הוא קוד שפה כאשר ניתן לקבוע אותו באופן אמין; אחרת אפשר להשמיטו. אין להציג טקסט הדוגמה כבדיחה אמיתית.

**כללי Backend:**
- לקבל `POST` בלבד (`405` למתודות אחרות); לבדוק `Content-Type`, מבנה JSON, `topic` כמחרוזת ו-`previousJokes` כמערך מחרוזות.
- לקבוע גבולות גודל טכניים סבירים: למשל נושא עד 200 תווים ו-Body עד 16KB; במקרה חריגה להחזיר `400` או `413` לפי העניין. אלו הגנות תקינות/משאבים, לא Rate Limiting או מכסת שימוש.
- לנקות רווחים מהקצוות לצורך קביעת נושא ריק, בלי למחוק או לשנות את הטקסט בשדה ה-UI.
- להעביר למודל הנחיות שרת קבועות: בדיחה מקורית וקצרה של 1–3 משפטים; מתאימה למשפחה ולילדים; ללא תוכן פוגעני; בנושא שהוזן ובשפתו, או בדיחה כללית בעברית כשאין נושא; להימנע ככל האפשר מחזרה על `previousJokes`.
- להתייחס לנושא ולבדיחות הקודמות כאל **נתוני משתמש**, ולא כאל הוראות בעלות קדימות על Prompt השרת; למנוע Prompt Injection בסיסי על ידי הפרדה ברורה בין Instructions לבין Input.
- להחזיר רק טקסט הבדיחה והמטא-נתונים הנחוצים, ולא אובייקט תשובה גולמי של OpenAI.
- אם המודל מחזיר טקסט ריק, כשל תוכן, או תגובה שאינה תקינה, להחזיר שגיאה נשלטת. לא לייצר בדיחת Fallback מקומית שלא אושרה.
- להגדיר Timeout מוגבל לקריאת הספק (לדוגמה 30 שניות), קצר ממגבלת Function בפועל; אין צורך ב-Streaming לבדיחה קצרה.
- לא לבצע Retry אוטומטי של בקשה שעלול לחייב שוב ללא ידיעת המשתמש; Retry ידני מופעל רק מכפתור `נסו שוב`.

**שגיאות:** `400/413` לקלט לא תקין, `405` למתודה לא נתמכת, `502` לכשל ספק, `504` ל-Timeout, `500` לשגיאה פנימית. כל שגיאה תחזיר מבנה קבוע כגון `{"error":"GENERATION_FAILED"}`. ה-UI מציג בשגיאת יצירה את הנוסח המאושר: `לא הצלחנו ליצור בדיחה. נסו שוב.`

### 2.5 Data Flow

**יצירה:**
1. המשתמש מזין נושא או משאיר אותו ריק ולוחץ על כפתור היצירה.
2. ה-Frontend יוצר Snapshot של הנושא וההקשר האחרון; מפעיל Loading ומשבית את הכפתור.
3. `POST /api/jokes` נשלח ל-Backend ב-HTTPS.
4. ה-Backend מאמת את הבקשה, מרכיב Prompt ומבצע קריאת Server-to-Server ל-OpenAI Responses API באמצעות `OPENAI_API_KEY`.
5. תשובת המודל נבדקת ומוחזרת כ-JSON. ה-Frontend מוסיף את הבדיחה **לסוף** הרשימה, ללא ניקוי הנושא.
6. ה-Frontend מסיים Loading ומכריז על התוצאה באופן נגיש, בלי להעביר Focus באופן מפתיע.

**שגיאה וניסיון חוזר:** במקרה כשל, לשמור בזיכרון את Snapshot הבקשה שנכשלה (גם אם המשתמש שינה בינתיים את הנושא), להציג את הודעת השגיאה ואת `נסו שוב`; לחיצה עליו שולחת מחדש את אותו Snapshot, לא את ערך התיבה העדכני. אין למחוק בדיחות קיימות.

**מחיקה:** לפני מחיקת בדיחה יחידה או ניקוי מלא יש להציג Dialog נגיש. אישור משנה את ה-State בלבד; ביטול אינו משנה דבר. לא נשלחת בקשת שרת.

**Offline:** Service Worker מחזיר את ה-App Shell שנשמר מראש. ה-UI מציג `אין חיבור לאינטרנט. כדי ליצור בדיחה יש להתחבר לרשת.`; יצירה אינה זמינה. לאחר חזרת הרשת ניתן ליצור בדיחה, אך אין תור בקשות Offline או Background Sync.

### 2.6 PWA, דפדפנים ונגישות

- Manifest עם שם `בדיחה בקליק`, `display: standalone`, `start_url: /`, `scope: /`, אייקונים מתאימים ו-Theme Color שיוגדר ב-DESIGN.md. ההתקנה מתבצעת דרך הדפדפן בלבד; אין כפתור התקנה.
- `vite-plugin-pwa` עם Workbox `generateSW`: Precache ל-HTML/CSS/JS/אייקונים, App Shell Offline. **אין Cache ל-`/api/*`, לבקשות POST או לתשובות AI**; יש להקפיד שלא יחול עליהן Navigation Fallback.
- גרסאות עדכניות של Chrome, Safari, Firefox ו-Edge במחשב ובמובייל, כולל iOS ו-Android. תכונות התקנה ושיתוף משתנות בין פלטפורמות, ויש להסתמך על Feature Detection.
- `<html lang="he" dir="rtl">`; עבור טקסט בדיחה בשפה אחרת, להגדיר `dir="auto"` ו-`lang` כשידוע. שמירת כיוון ה-UI בעברית.
- HTML סמנטי, תווית לתיבת הנושא, ניווט מקלדת, Focus גלוי, ניגודיות WCAG 2.2 AA, מצב Loading נגיש, `aria-live` מתון להודעות הצלחה/שגיאה ו-Dialog עם Focus Trap והחזרת Focus. יש להימנע מהסתמכות על צבע בלבד.
- `navigator.share` רק כשזמין וב-Secure Context; אחרת לא להציג כפתור שיתוף שאינו פעיל. העתקה באמצעות Clipboard API, עם הודעת הצלחה/כישלון נגישה. ביטול חלונית השיתוף אינו שגיאת יצירה.

### 2.7 Authentication, Security ו-Privacy

- אין Authentication או Authorization עסקיים: האפליקציה ציבורית לפי ה-PRD.
- **`OPENAI_API_KEY` קיים רק ב-Backend:** ב-Vercel Environment Variables ובקובץ `.env.local` מקומי שאינו נכנס ל-Git. אסור להשתמש בקידומת `VITE_` למפתח או לייבא אותו לקוד Frontend.
- התקשורת לדפדפן היא HTTPS באותו Origin; השרת מתקשר ל-OpenAI ב-HTTPS. אין צורך ב-CORS פתוח לכל Origin.
- Validation בשרת, הגבלת גודל Payload, טיפול מסודר בשגיאות, והימנעות מהצגת Stack Traces, Secrets ופרטי OpenAI גולמיים ללקוח.
- הצגת טקסט בדיחה כטקסט בלבד, ללא `dangerouslySetInnerHTML`, כדי למנוע HTML Injection/XSS מתוכן מודל.
- לא לשמור את הנושא, רשימת הבדיחות או תשובות המודל בלוגים יזומים; לוגים תפעוליים צריכים להימנע מתוכן משתמשים ומפתחות. אין Analytics או Tracking יזומים כחלק מהמוצר.
- לא להוסיף CAPTCHA, Rate Limiter, חשבונות או מכסות ללא אישור לשינוי PRD. עם זאת, היעדר הגבלות שימוש ב-Endpoint ציבורי הוא **סיכון כספי ואבטחתי משמעותי**; הגדרות הוצאות והתראות בצד ספקי השירות מומלצות לצורכי תפעול, ולא כיכולת מוצר.

### 2.8 Hosting, סביבות ו-Deployment

**Repository:** GitHub Repository יחיד המכיל React/Vite Frontend, תיקיית `api/` עבור Vercel Function, תצורת PWA, וקובצי תיעוד. אין צורך ב-Monorepo או בפרויקט Backend נפרד.

**Build:** `npm install`/`npm ci` בהתאם ל-Lockfile, בדיקות TypeScript, ו-`vite build`; פלט סטטי ב-`dist/`. Vercel מגישה את ה-Frontend ומפרסת את פונקציית `/api/jokes` באותו Domain. יש לאמת את הגדרת Vite Framework Preset, Output Directory ו-Function Routing בהתאם לתיעוד Vercel.

**CI/CD:** חיבור GitHub ל-Vercel. Push/PR לענף שאינו Production יוצר Preview Deployment; Merge ל-`main` יוצר Production Deployment אוטומטי. Preview מאפשר בדיקות בדפדפן לפני Merge. אין צורך ב-GitHub Actions נפרד רק לצורך פריסה.

**Secrets וסביבות:**

| סביבה | מיקום | `OPENAI_API_KEY` |
|---|---|---|
| Local Development | `.env.local` שאינו נכלל ב-Git | מפתח Development, בצד השרת בלבד |
| Vercel Preview | Environment Variables מסוג Preview | מפתח Development/Testing נפרד מ-Production |
| Vercel Production | Environment Variables מסוג Production | מפתח Production נפרד, לעולם לא נחשף ל-Frontend |

- רצוי להפריד גם OpenAI Projects לצורך נראות של עלויות ויכולת החלפת מפתחות, אך אין צורך בשירות נוסף או ב-Database.
- שינויים ב-Environment Variables דורשים Deployment חדש כדי שיחולו על גרסה פעילה.
- יש לבדוק של-Function יש זמן ריצה שמאפשר תגובת GPT-5 תוך שמירה על Timeout נשלט; הגבלות Vercel תלויות בתוכנית וב-Fluid Compute.
- יש להפעיל את האפליקציה על HTTPS, ולוודא שה-Service Worker ונתיבי ה-API מתנהגים כראוי ב-Preview וב-Production. אין להכניס Secrets ל-Build Output.

## 3. התאמה ל-PRD והחרגות

| דרישת PRD | מענה ארכיטקטוני |
|---|---|
| בדיחה לפי נושא או בדיחה כללית | Prompt שרת + `topic` אופציונלי |
| GPT-5 ו-API Key ב-Backend | OpenAI SDK ב-Vercel Function בלבד |
| שפת הנושא / עברית כשאין נושא | Instructions למודל + `language` כשניתן לזהות |
| בדיחות משפחתיות קצרות | הנחיות Server Prompt ו-Validation לתשובה |
| רשימה מצטברת וזמנית | React State ללא Persistence |
| צמצום חזרות באותו Session | שליחת הקשר מוגבל של בדיחות קודמות; Best Effort |
| Loading, שגיאה ו-Retry | UI State + Snapshot לבקשה שנכשלה |
| העתקה, שיתוף, מחיקה ואישור | Browser APIs + Dialog + State |
| PWA עם Offline UI | Manifest + Precache App Shell, ללא Offline AI |
| RTL, Responsive, WCAG 2.2 AA | HTML סמנטי, CSS וניהול Focus/Status |
| ללא Login, Database או מכסות | אין Auth, Storage, DB או Rate Limiter |

**Out of Scope טכני:** Supabase, Database Migrations, Authentication, File Storage, SSR, WebSockets, Message Queue, Push Notifications, Analytics, Offline Generation, כפתור התקנה, Backend קבוע או הגבלת קצב יזומה. אין לשנות דרישות אלו ללא עדכון ה-PRD.

## 4. מקורות רשמיים שנבדקו

1. [React – Managing State](https://react.dev/learn/managing-state) – ניהול מצב ונתונים זמניים ב-UI.
2. [Vite – Why Vite](https://vite.dev/guide/why) – סביבת פיתוח ו-Build מודרניים.
3. [Vercel – Vite](https://vercel.com/docs/frameworks/frontend/vite) – שילוב Vite עם Functions בתיקיית `api/`.
4. [Vercel – Functions](https://vercel.com/docs/functions) ו-[Function Duration](https://vercel.com/docs/functions/configuring-functions/duration) – Backend Serverless ומגבלות ריצה.
5. [Vercel – Git Deployments](https://vercel.com/docs/git) ו-[Environment Variables](https://vercel.com/docs/environment-variables) – CI/CD וסודות לפי סביבה.
6. [Vercel – Hobby Plan](https://vercel.com/docs/plans/hobby) ו-[Fair Use](https://vercel.com/docs/limits/fair-use-guidelines) – תנאי שימוש ועלויות Hosting.
7. [OpenAI – GPT-5](https://developers.openai.com/api/docs/models/gpt-5), [Responses API](https://developers.openai.com/api/docs/guides/text-generation), [Pricing](https://developers.openai.com/api/docs/pricing) ו-[Production Best Practices](https://developers.openai.com/api/docs/guides/production-best-practices) – מודל, ממשק, אבטחת מפתחות ועלויות.
8. [Vite PWA – Getting Started](https://vite-pwa-org.netlify.app/guide/) – Manifest, Service Worker ו-Offline.
9. [MDN – Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) – תמיכה משתנה בשיתוף.

> המחירים, המכסות ותנאי השירות עשויים להשתנות. לא נקבעה עלות חודשית קבועה משום שלא הוגדרו היקף שימוש או תקציב, והחיוב ב-OpenAI תלוי בכמות Tokens בפועל.

## החלטות מרכזיות (ADRs)

### ADR-1: אחסון מקומי של גופן Heebo
**הקשר:** ה-Style Guide מגדיר את הגופן Heebo, ובהמשך (Milestone 4) הממשק צריך לעבוד גם Offline.
**החלטה:** הגופן נטען מהחבילה `@fontsource-variable/heebo` ונכלל ב-Build, במקום קישור ל-Google Fonts.
**השלכות:** אין תלות בשרת חיצוני ואין בקשות לגוגל בזמן טעינה; קובצי הגופן יוכלו להיכלל ב-Precache של ה-PWA.

### ADR-2: Vitest ו-Testing Library לבדיקות
**הקשר:** Milestone 1 דורש פקודות בדיקה בסיסיות.
**החלטה:** שימוש ב-Vitest (משתלב עם Vite) בסביבת jsdom, יחד עם React Testing Library ו-user-event. הרצה: `npm test`.
**השלכות:** בדיקות ממשק מהירות ללא דפדפן; בדיקות End-to-End בדפדפן אמיתי יתווספו בהמשך לפי הצורך.

### ADR-3: oxlint במקום ESLint
**הקשר:** תבנית `react-ts` העדכנית של Vite מגיעה עם oxlint כ-Linter.
**החלטה:** שמירה על oxlint מהתבנית (`npm run lint`).
**השלכות:** Linter מהיר עם כללי React בסיסיים; אין צורך בתצורת ESLint נפרדת.

### ADR-4: מסגרת שדה הקלט כהה מטוקן Border
**הקשר:** צבע ה-Border שב-Style Guide (`#E5E7EB`) נותן ניגודיות של כ-1.2:1 על לבן, בעוד WCAG 2.2 AA (דרישת PRD) דורש 3:1 לגבולות של רכיבי קלט.
**החלטה:** מסגרת שדה הנושא בצבע `#8C929C` (כ-3.1:1). שאר קווי ההפרדה הדקורטיביים יכולים להמשיך להשתמש בטוקן Border.
**השלכות:** השדה מעט בולט יותר מה-Mockup, אך עומד בתקן הנגישות.

### ADR-5: הרצת `/api/jokes` מקומית דרך Plugin של Vite, וקובץ `.env`
**הקשר:** ב-Production, Vercel מריצה את `api/jokes.ts` אוטומטית, אבל `vite` לבד לא מריץ Functions. `vercel dev` דורש Vercel CLI, התחברות וקישור פרויקט — חלק מ-Milestone 5. בנוסף, §2.7–2.8 מזכירים `.env.local`, בעוד שנוהל העבודה בפרויקט קובע `.env`.
**החלטה:** ה-Function כתובה כ-Handler בתקן Web (`export default { fetch(request) }`). Plugin קטן ב-`vite.config.ts`, שפועל רק ב-`npm run dev`, מעביר בקשות `/api/jokes` לאותו Handler, וטוען את `OPENAI_API_KEY` מ-`.env` (דרך `loadEnv`) לתהליך השרת בלבד, בלי קידומת `VITE_`. המפתח נשמר ב-`.env` (מוחרג ב-`.gitignore`, עם `.env.example` ללא ערכים); `loadEnv` קורא גם `.env.local`, כך שאין הבדל מעשי.
**השלכות:** `npm run dev` מריץ את הממשק וה-API יחד בלי חשבון Vercel. הקוד שרץ מקומית הוא אותו קוד שירוץ ב-Vercel. שינוי ב-`.env` דורש הפעלה מחדש של שרת הפיתוח.

### ADR-6: פלט מובנה ו-`reasoning.effort: minimal` בקריאה ל-`gpt-5`
**הקשר:** נדרשת בדיחה קצרה, תשובה מהירה בתוך Timeout של 30 שניות, וקוד שפה כדי לסמן `lang` לטקסט הבדיחה.
**החלטה:** הקריאה ל-Responses API משתמשת ב-JSON Schema קשיח (`joke`, `language`) וב-`reasoning: { effort: 'minimal' }`. ה-SDK מוגדר עם `maxRetries: 0` — ניסיון חוזר רק מכפתור "נסו שוב".
**השלכות:** תשובות מהירות וזולות יותר, והשרת מקבל קוד שפה בלי ניחוש. קוד שפה לא תקין מושמט, והבדיחה מוצגת עם `dir="auto"` בלבד.

### ADR-7: גוון אדום כהה יותר לכפתור "מחק"
**הקשר:** ה-Style Guide מציג כפתור "מחק" אדום בצבע Error (`#EF4444`) עם טקסט לבן. הניגודיות היא כ-3.8:1, פחות מ-4.5:1 הנדרש ב-WCAG 2.2 AA לטקסט רגיל.
**החלטה:** טוקן חדש `--color-danger: #DC2626` (כ-4.8:1 מול לבן) משמש לכפתור "מחק" ב-Dialog האישור. צבע ה-Error המקורי נשאר להודעות השגיאה ולמסגרות.
**השלכות:** הכפתור מעט כהה מה-Style Guide אך עומד בתקן הנגישות.

### ADR-8: `<dialog>` טבעי לאישור מחיקה
**הקשר:** נדרש Dialog אישור נגיש עם Focus Trap, Esc והחזרת Focus, בלי להוסיף ספריות.
**החלטה:** שימוש באלמנט `<dialog>` של הדפדפן עם `showModal()`, שמספק חסימת שאר הדף, השארת ה-Focus בתוכו ו-Esc כביטול. Focus ראשוני על "ביטול"; אחרי ביטול ה-Focus חוזר לכפתור שפתח, ואחרי מחיקה הוא עובר לכותרת "רשימת בדיחות". ב-jsdom אין `showModal`, ולכן `src/test/setup.ts` מוסיף תחליף מינימלי לבדיקות.
**השלכות:** אין תלות חדשה; ההתנהגות נשענת על תמיכת הדפדפנים העדכניים (Chrome, Safari, Firefox, Edge) ב-`<dialog>`.

### ADR-9: `vite-plugin-pwa` עם אייקונים שנוצרים ב-Build, ו-`/api/jokes` גם ב-`npm run preview`
**הקשר:** Service Worker אמיתי פועל רק על גרסת Build, אבל `npm run preview` הגיש את הממשק בלבד, בלי `/api/jokes` (ADR-5 חל רק על `npm run dev`). בנוסף נדרשים אייקוני התקנה בכמה גדלים, ואין להם עיצוב נפרד ב-spec.
**החלטה:** ה-Plugin המקומי (`localApi` ב-`vite.config.ts`) מחבר את אותו Handler גם ל-`configurePreviewServer`; שם Node מריץ את `api/jokes.ts` ישירות (Type Stripping, Node 24). אייקוני ה-PWA (64/192/512, maskable, apple-touch-icon, favicon.ico) נוצרים בזמן Build מ-`public/favicon.svg` דרך `pwaAssets` (`@vite-pwa/assets-generator`, Preset `minimal-2023`) ולא נשמרים ב-Git. ה-Service Worker (`generateSW`, `autoUpdate`) עושה Precache לקובצי הממשק בלבד, בלי `runtimeCaching`, עם `navigateFallbackDenylist: [/^\/api\//]`. בזמן `npm run dev` ה-SW כבוי.
**השלכות:** `npm run build && npm run preview` (http://localhost:4173) מריץ את האפליקציה המלאה כולל PWA ו-Offline, בלי חשבון Vercel. שינוי בציור ה-favicon משנה גם את אייקון האפליקציה המותקנת. גרסה חדשה נטענת אוטומטית בביקור הבא, בלי הודעה.


### ADR-10: בדיקות End-to-End ב-Playwright (Chromium)
**הקשר:** Milestone 5 דורש בדיקות End-to-End של כל פעולות ה-PRD, כולל Service Worker, Offline, התקנה וניגודיות צבעים — דברים ש-jsdom (ADR-2) לא יכול לבדוק. הבדיקות צריכות לרוץ גם מקומית וגם מול הכתובת שבאוויר.
**החלטה:** `@playwright/test` עם Chromium בשני גדלים (מחשב 1280, אמולציית Pixel 7), בתיקיית `e2e/` ועם `tsconfig.e2e.json` משלה (כולל DOM). בלי `BASE_URL`, Playwright מריץ בעצמו `npm run build && npm run preview` על פורט 4175; עם `BASE_URL` הבדיקות רצות מול Deployment. רוב הבדיקות מדמות את `/api/jokes` (`page.route`, עם Service Worker חסום), בלי עלות. `e2e/real.spec.ts` פונה ל-`gpt-5` אמיתי ורץ רק עם `E2E_REAL=1`. נגישות נבדקת עם `axe-core` שמוזרק לדף (תגיות WCAG 2.0–2.2 A/AA). Vitest מוגבל ל-`src/` ול-`tests/`.
**השלכות:** `npm run test:e2e` דורש Chromium של Playwright (`npx playwright install chromium`, פעם אחת). Safari/iOS וקוראי מסך אמיתיים נבדקים ידנית בלבד.

### ADR-11: הוצאת בדיקות ה-API מ-`api/`, Node 24 וענף Preview
**הקשר:** Vercel הופכת כל קובץ בתיקיית `api/` ל-Function ציבורית, כך ש-`api/jokes.test.ts` היה הופך ל-Endpoint. בנוסף, ה-Plugin המקומי (ADR-9) נשען על Node 24, ו-DoD של Milestone 5 דורש Preview לפני Production.
**החלטה:** בדיקות ה-API עברו ל-`tests/api/jokes.test.ts`; ב-`api/` נמצא רק `jokes.ts`. `package.json` קובע `"engines": { "node": "24.x" }`, כך ש-Vercel משתמשת באותה גרסה כמו מקומית. אין `vercel.json` — Vercel מזהה Vite (`npm run build`, `dist/`) ואת `api/jokes.ts` (`export default { fetch }`) אוטומטית. שינויים נדחפים קודם לענף נפרד (Preview Deployment מוגן ב-Vercel Authentication), ורק אחרי אישור ממוזגים ל-`main` (Production).
**השלכות:** אסור להוסיף ל-`api/` קבצים שאינם Endpoints. `OPENAI_API_KEY` מוגדר ב-Vercel פעמיים, עם ערך שונה ל-Preview ול-Production; שינוי ערך מחייב Redeploy.
