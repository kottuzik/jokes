# תוכנית – Milestone 5: פריסת Production ואימות מלא

> מקורות: `PRD.md` (FR-01–FR-06, §5, Out of Scope, "לא תיושם מגבלת קצב או מכסה יומית"), `ARCHITECTURE.md` (§1 סיכונים 2 ו-Hobby, §2.7 אבטחה, §2.8 Hosting/סביבות/Deployment, ADR-2, ADR-5, ADR-9), `MILESTONES.md`.
> מצב נוכחי (Milestone 4 ✅): האפליקציה המלאה (יצירה, רשימה, העתקה/שיתוף/מחיקה, PWA ו-Offline) רצה מקומית. ה-Repository מחובר ל-`https://github.com/kottuzik/jokes.git` וכל העבודה עד כה נדחפה ישירות ל-`main`. אין עדיין פרויקט Vercel. בדיקות קיימות: Vitest + Testing Library ב-jsdom (ADR-2), בלי בדיקות בדפדפן אמיתי.
> תיעוד (נבדק מול Vercel Docs העדכני): Vercel מריצה קובץ ב-`api/` שמייצא `export default { fetch(request) }` (בדיוק המבנה של `api/jokes.ts`). גרסת Node נקבעת דרך `engines.node` ב-`package.json` (למשל `24.x`). Preview Deployments מוגנים כברירת מחדל ב-"Vercel Authentication" — רק מי שמחובר לחשבון ה-Vercel של הפרויקט יכול לפתוח אותם.

## 1. מטרה והיקף

כתובת ציבורית פעילה של "בדיחה בקליק" ב-Vercel, שמתעדכנת אוטומטית מ-GitHub: ענף בדיקה ← Preview, `main` ← Production. בנוסף, חבילת בדיקות בדפדפן אמיתי שמכסה את כל פעולות ה-PRD, ושרצה גם מקומית וגם מול הכתובת שבאוויר.

**בתוך ההיקף:**
- התאמות קטנות בקוד כדי שהפריסה ל-Vercel תעבוד נכון (§3).
- הדרכה צעד אחר צעד של המשתמש: חיבור GitHub ל-Vercel, יצירת שני מפתחות OpenAI והכנסתם ל-Vercel (§4). את החשבונות והמפתחות המשתמש מגדיר בעצמו.
- בדיקות End-to-End אוטומטיות ב-Playwright (§5).
- זרימת Preview ← אישור ← Merge ל-`main` ← Production (§6).
- אימות בסביבה שבאוויר: HTTPS, Function, PWA/Offline, היעדר סודות (§7).
- הצגת הסיכון התפעולי (§8).

**מחוץ להיקף (לא לממש):**
- Rate Limiting, מכסה יומית, CAPTCHA או כל הגבלת שימוש באפליקציה (PRD).
- Database, התחברות משתמשים, מועדפים, תפריט, מסכי אודות/הגדרות/עזרה.
- דומיין מותאם אישית (לא מוגדר ב-spec; משתמשים בכתובת `*.vercel.app` שהפרויקט מקבל).
- GitHub Actions או CI נפרד (ARCHITECTURE §2.8: האינטגרציה של Vercel מספיקה).
- כלי ניטור/Analytics חיצוניים.

## 2. החלטות לאישורך

1. **ענף בדיקה לפני `main`.** עד עכשיו כל דחיפה הלכה ישר ל-`main`. כדי לעמוד ב-DoD ("Preview קודם, ואז Merge ל-`main`"), במילסטון הזה הדחיפה הראשונה תהיה לענף נפרד `milestone-5` ← Vercel יוצרת Preview. אחרי שבדקת ואישרת — Merge ל-`main` ודחיפה ← Production. כל דחיפה רק באישורך.
2. **Preview נשאר מוגן (ברירת המחדל של Vercel).** את ה-Preview תפתח בדפדפן שלך כשאתה מחובר ל-Vercel. הבדיקות האוטומטיות שלי ירוצו מול הגרסה המקומית ומול ה-Production (שהוא ציבורי), כך שלא צריך לפתוח את ה-Preview לכולם.
3. **בדיקות אוטומטיות בדפדפן (Playwright)** במקום רשימת בדיקות ידנית בלבד. יתרון: אפשר להריץ אותן שוב בכל שינוי, וגם מול הכתובת שבאוויר. רוב הבדיקות **מדמות** את תשובת ה-AI (בלי עלות); רק בדיקה אחת או שתיים יוצרות בדיחה אמיתית, והן רצות רק כשמבקשים במפורש.
4. **מגבלת תקציב ב-OpenAI — המלצה בלבד, החלטה שלך.** זו לא הגבלה באפליקציה (שה-PRD אוסר), אלא הגדרה בחשבון OpenAI שעוצרת חיוב מעל סכום שתבחר. לא אגדיר אותה בעצמי; רק אסביר איפה זה אם תרצה (§8).

## 3. שינויים בקוד

**א. הוצאת קובץ הבדיקה מתיקיית `api/` (חובה).** Vercel הופכת **כל** קובץ בתיקיית `api/` ל-Endpoint ציבורי. `api/jokes.test.ts` היה הופך ל-`/api/jokes.test` ומנסה לטעון את Vitest בשרת. הקובץ יעבור ל-`tests/api/jokes.test.ts` (תוכן זהה, רק נתיב ה-import יתעדכן), ו-`tsconfig.node.json` יכלול את `tests`.

**ב. גרסת Node קבועה.** `"engines": { "node": "24.x" }` ב-`package.json` — אותה גרסה כמו מקומית (v24), כדי ש-Build ו-Function ב-Vercel יתנהגו כמו אצלנו.

**ג. ללא `vercel.json`, אלא אם יתברר שצריך.** Vercel מזהה Vite אוטומטית: Build `npm run build`, פלט `dist/`, ו-`api/jokes.ts` כ-Function. אין Routes בצד הלקוח, לכן אין צורך ב-Rewrites. אם בבדיקה יתגלה ש-`sw.js` או `manifest.webmanifest` מקבלים Cache ארוך מדי, נוסיף `vercel.json` עם Headers מתאימים בלבד.

**ד. משך ריצת ה-Function.** ה-Timeout מול OpenAI הוא 30 שניות (`OPENAI_TIMEOUT_MS`), וברירת המחדל של Vercel (Fluid Compute) ארוכה מזה בהרבה — לכן אין צורך ב-`maxDuration`. יאומת בפועל ב-Deployment (§7).

**ה. Playwright** (§5): `@playwright/test` כ-devDependency, `playwright.config.ts`, תיקיית `e2e/`, סקריפט `npm run test:e2e`. Vitest יוגבל ל-`src/` ול-`tests/` כדי לא לנסות להריץ קובצי Playwright.

**ו. `.gitignore`** — הוספת `test-results/`, `playwright-report/`, `.vercel/` (בלי לגעת בשורות הקיימות).

**ז. אין שינוי ב-UI או בהתנהגות** — אלא אם בדיקות ה-E2E יחשפו באג; אז אדווח לפני שאתקן משהו שמשנה התנהגות מה-spec.

### מבנה קבצים (חדשים / משתנים)

```text
package.json                 ← engines.node, +@playwright/test, סקריפט test:e2e
vite.config.ts               ← test.include ל-src/ ו-tests/ בלבד
tsconfig.node.json           ← include: tests, e2e, playwright.config.ts
api/jokes.test.ts            → tests/api/jokes.test.ts (העברה)
playwright.config.ts         ← חדש
e2e/helpers.ts               ← חדש (דימוי תשובות API, הזרקת axe)
e2e/app.spec.ts              ← חדש (זרימות ה-PRD עם תשובה מדומה)
e2e/pwa.spec.ts              ← חדש (Service Worker, Offline, התקנה)
e2e/real.spec.ts             ← חדש (יצירה אמיתית, רק עם E2E_REAL=1)
.gitignore                   ← תיקיות פלט של Playwright ו-.vercel
CLAUDE.md                    ← פקודות הרצה: test:e2e + כתובת Production
spec/ARCHITECTURE.md         ← ADR-10 (Playwright), ADR-11 (העברת בדיקת ה-API, ענף Preview)
spec/MILESTONES.md           ← 🟡 בסיום
```

## 4. הגדרת Vercel ו-OpenAI (המשתמש מבצע, אני מדריך)

אני לא נכנס לחשבונות ולא רואה מפתחות. ההדרכה תינתן בשפה פשוטה, צעד אחר צעד, בזמן הבנייה:

1. **שני מפתחות OpenAI** בלוח הבקרה של OpenAI: אחד ל-Preview (אפשר את אותו מפתח של הפיתוח המקומי) ואחד ל-Production, חדש ונפרד. רצוי לתת להם שמות ברורים ("jokes-preview", "jokes-production").
2. **חשבון Vercel** — התחברות עם GitHub (תוכנית Hobby, ARCHITECTURE §1 — שימוש אישי/לא מסחרי).
3. **Import של ה-Repository** `kottuzik/jokes` ל-Vercel. Framework Preset: Vite (מזוהה אוטומטית), בלי לשנות Build/Output.
4. **Environment Variables** — עוד במסך ה-Import, לפני ה-Deploy הראשון: `OPENAI_API_KEY` עם מפתח ה-Production, מסומן **Production בלבד**; אחר כך בהגדרות הפרויקט — `OPENAI_API_KEY` נוסף עם מפתח ה-Preview, מסומן **Preview בלבד**. לא מסמנים "Development" (מקומית משתמשים ב-`.env`).
5. ה-Import יוצר מיד Production Deployment מ-`main` הנוכחי (קוד Milestone 4). זה תקין — הוא יוחלף אוטומטית אחרי ה-Merge.
6. **Deployment Protection** — משאירים את ברירת המחדל (Preview מוגן, Production ציבורי).
7. המשתמש מעביר לי את כתובת ה-Production (`https://<שם>.vercel.app`) — רק את הכתובת.

שינוי מפתח בעתיד מחייב Deployment חדש (Redeploy) כדי לחול (ARCHITECTURE §2.8).

## 5. בדיקות End-to-End (Playwright)

**הגדרה:**
- דפדפן Chromium בשני גדלים: מחשב (1280) ומובייל (אמולציית Pixel). זה מה שאפשר להתקין ולהריץ כאן; Safari/iOS נבדק ידנית (§7).
- `BASE_URL` — ברירת מחדל: הרצה מקומית של `npm run build && npm run preview` (Playwright מפעיל ומכבה אותה בעצמו). אפשר להריץ מול Production: `BASE_URL=https://... npm run test:e2e`.
- בבדיקות עם תשובה מדומה ה-Service Worker חסום (`serviceWorkers: 'block'`), כי Playwright לא תמיד יכול ליירט בקשות שעוברות דרכו. בבדיקות ה-PWA הוא פעיל.
- `axe-core` (כבר מותקן) מוזרק לדף לבדיקות נגישות, כולל ניגודיות צבעים (שלא נבדקת ב-jsdom).

**`e2e/app.spec.ts` — תשובת AI מדומה (`page.route` על `/api/jokes`), בלי עלות:**

| תרחיש | מה נבדק | PRD |
|---|---|---|
| יצירה | נושא בעברית / באנגלית / שדה ריק ← בדיחה מופיעה ברשימה; הנושא נשאר בשדה; גוף הבקשה מכיל את הנושא ואת הבדיחות הקודמות | FR-01 |
| רשימה | שתי יצירות ← שני כרטיסים, החדש למעלה; רענון ← רשימה ריקה | FR-02 |
| טעינה | תשובה מושהית ← Spinner, "מכינים לך בדיחה...", כפתור מושבת | FR-03 |
| שגיאה/Retry | תשובת 500 ← "לא הצלחנו ליצור בדיחה. נסו שוב."; "נסו שוב" שולח בדיוק אותה בקשה ומצליח; בדיחות קודמות נשמרות | FR-03 |
| תוכן כטקסט | בדיחה שמכילה `<b>`/`<img>` מוצגת כטקסט ולא כ-HTML | FR-02 |
| העתקה | הלוח מכיל רק את טקסט הבדיחה שנבחרה (הרשאת Clipboard לדפדפן הבדיקה) | FR-04 |
| שיתוף | עם `navigator.share` מדומה ← נקרא עם טקסט הבדיחה; בלי תמיכה ← אין פעולה שבורה (ההתנהגות הקיימת מ-M3) | FR-04 |
| מחיקה | ביטול ← שום דבר לא נמחק; אישור ← נמחקת רק הבדיחה שנבחרה, הסדר נשמר | FR-05 |
| ניקוי | ביטול ← הכל נשאר; אישור ← רשימה ריקה | FR-05 |
| Dialog במקלדת | Tab/Escape, ה-Focus בתוך ה-Dialog וחוזר לכפתור שפתח אותו | FR-05, §5 |
| נגישות | axe (כולל ניגודיות) ללא ליקויי WCAG 2.2 AA: התחלתי, עם בדיחות, טעינה, שגיאה, Offline, Dialog פתוח | §5 |
| פריסה | ללא גלילה אופקית ב-320/375/1280; `dir="rtl"`; אין קישורי ניווט/תפריט | §5, Out of Scope |

**`e2e/pwa.spec.ts` — Service Worker פעיל:**
- ה-Manifest נטען וה-SW רשום ושולט בדף.
- **התקנה:** דרך Chrome DevTools Protocol (`Page.getInstallabilityErrors`) ← אין שגיאות התקנה. אין כפתור "התקן" בדף.
- **Offline:** ביקור Online ← ניתוק (`context.setOffline(true)`) ← רענון ← הממשק נפתח, מוצגת "אין חיבור לאינטרנט. כדי ליצור בדיחה יש להתחבר לרשת.", הכפתור מושבת, ולא יוצאת שום בקשה ל-`/api/jokes`.
- חזרה Online ← הכפתור פעיל שוב (עם תשובה מדומה).
- **אין Cache ל-AI:** ב-Cache Storage אין אף רשומה של `/api/`.

**`e2e/real.spec.ts` — יצירה אמיתית (`gpt-5`, עולה כסף), רק כש-`E2E_REAL=1`:**
- נושא בעברית ושדה ריק ← מתקבלת בדיחה אמיתית (טקסט לא ריק, עד ~600 תווים), התשובה מ-`/api/jokes` היא 200 ובלי שדות מעבר ל-`joke`/`language`.
- רץ פעם אחת מקומית ופעם אחת מול Production; סה"כ כמה קריאות בודדות.

**בדיקות קיימות:** `npm test`, `npm run build`, `npm run lint` ממשיכים לעבור (כולל בדיקת ה-API בנתיב החדש).

## 6. סדר העבודה

1. **מקומית:** שינויי §3, בדיקות §5 מול `npm run preview`, כולל `E2E_REAL=1` פעם אחת. תיקון מה שנכשל.
2. **הדרכת Vercel/OpenAI** (§4) — המשתמש מבצע. Production הראשון (קוד M4) עולה.
3. **עצירה ובקשת אישור** לבצע commit ו-push לענף `milestone-5` (לא ל-`main`).
4. **Preview:** Vercel בונה אוטומטית ← אני בודק ב-Vercel/GitHub שה-Build הצליח, והמשתמש פותח את ה-Preview בדפדפן שלו (מחובר ל-Vercel) ומייצר בדיחה. רשימה קצרה מה לבדוק תינתן.
5. **עצירה ובקשת אישור** ל-Merge של `milestone-5` ל-`main` ו-push.
6. **Production:** מוודאים שה-Deployment נוצר אוטומטית מה-Merge (בלי העלאה ידנית), ואז מריצים את §5 ואת §7 מול כתובת ה-Production.
7. סימון 🟡 ב-MILESTONES.md, עדכון CLAUDE.md (כתובת Production + פקודת `test:e2e`) ו-ADRs. השינויים האלה ייכנסו ל-commit של שלב הדחיפה הבא, כשהמשתמש יאשר סופית (✅).

## 7. אימות בסביבת Deployment

- **HTTPS:** הכתובת נפתחת ב-`https://`; `http://` מפנה ל-`https://`.
- **Function:** `POST /api/jokes` מחזיר 200 עם בדיחה; `GET /api/jokes` מחזיר 405; גוף שגוי מחזיר 400 — בלי Stack Trace או פרטי OpenAI. יאומת שזמן התגובה בפועל סביר ושאין חיתוך של Vercel לפני ה-Timeout שלנו.
- **אין `/api/jokes.test`** (מחזיר 404).
- **סודות:** חיפוש ב-JS/HTML של ה-Production שאין `OPENAI_API_KEY` או ערך שמתחיל ב-`sk-`; בדיקה שתשובות הרשת (כולל שגיאות) לא מכילות מפתח; `git grep` ב-Repository.
- **מפתחות שונים:** המשתמש מאשר שבהגדרות Vercel יש שני ערכים נפרדים (Preview / Production). אני לא רואה את הערכים עצמם.
- **PWA:** `manifest.webmanifest` ו-`sw.js` נטענים ב-Production; בדיקת ה-Headers של `sw.js` (לא Cache ארוך).
- **התקנה ו-Offline במכשיר אמיתי (המשתמש, ידני, עם הדרכה):** התקנה מ-Chrome במחשב או באנדרואיד, ו/או "הוספה למסך הבית" ב-Safari באייפון; פתיחה במצב טיסה ← הממשק נפתח עם הודעת Offline.
- **Production Deployment אוטומטי:** ב-Vercel מופיע Deployment שמקורו ב-Merge ל-`main`.

## 8. הסיכון התפעולי (יוצג למשתמש לפני האישור הסופי)

- `/api/jokes` הוא כתובת **ציבורית בלי הגבלה**: כל אחד — גם לא דרך האפליקציה, גם סקריפט אוטומטי — יכול לשלוח אליה בקשות ללא הגבלה.
- כל בקשה = קריאה בתשלום ל-`gpt-5` בחשבון ה-OpenAI של המשתמש. שימוש מסיבי או זדוני עלול לייצר חיוב גבוה, או לגרום ל-OpenAI לחסום את המפתח זמנית (ואז האפליקציה תציג שגיאה לכולם).
- גם ל-Vercel Hobby יש מכסות שימוש; חריגה עלולה להשבית את הפרויקט זמנית.
- לפי ה-PRD **לא מוסיפים** הגבלה באפליקציה. אפשרויות שהן הגדרות חשבון בלבד, לבחירת המשתמש: תקציב/התראת שימוש ב-OpenAI, מעקב בלוח השימוש של OpenAI, והחלפת מפתח ה-Production אם יש חשד לשימוש לרעה (ואז Redeploy).

## 9. Definition of Done – איך ייבדק כל תנאי

| תנאי | אימות |
|---|---|
| Preview מצליח; Merge ל-`main` ← Production אוטומטי | §6 שלבים 4–6; Deployments ב-Vercel |
| `/api/jokes` ב-HTTPS עם `gpt-5`; כל פעולות ה-PRD נבדקו | §5 מול Production + `real.spec.ts` + §7 |
| מפתחות שונים, רק ב-Vercel; אין סודות ב-Repo/Bundle/Network | §4, §7 "סודות" |
| התקנה ו-Offline נבדקו; אין Cache ל-AI | `pwa.spec.ts` + בדיקה ידנית במכשיר |
| Build/TypeScript ונגישות עוברים; חריגות מפורטות | `npm run build`, `npm test`, axe ב-E2E; דוח חריגות בסיכום |
| אין Database/Auth/מכסות/Rate Limit/תפריט/מסכים נוספים/מועדפים | בדיקת קוד + בדיקת "פריסה" ב-E2E |

**מגבלות בדיקה צפויות (ידווחו):** Safari/iOS וקורא מסך אמיתי (VoiceOver/TalkBack) נבדקים ידנית בלבד ובהתאם למכשירים שיש למשתמש; ה-Preview מוגן ולכן נבדק ידנית ולא אוטומטית; איכות ההומור ועמידה בהנחיות התוכן נבדקות על מדגם קטן בלבד.
