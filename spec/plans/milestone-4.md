# תוכנית – Milestone 4: PWA, Offline והתאמה חוצת מכשירים

> מקורות: `PRD.md` (§3ב "פתיחה ללא חיבור לאינטרנט", §3ג, FR-06, Edge Cases, §5 פלטפורמה/דפדפנים/נגישות, Out of Scope), `ARCHITECTURE.md` (§1 סיכון 5, §2.2 Connectivity UI / PWA Shell, §2.5 Offline, §2.6, ADR-1, ADR-5), `DESIGN.md` (§2.1 צבעים, §2.3 Dialogs / Status, §2.4 Layout), `MILESTONES.md`.
> מצב נוכחי (Milestone 3 ✅): אין PWA בכלל — אין Manifest, אין Service Worker ואין אייקוני התקנה. קיים `public/favicon.svg` (פרצוף צוחק צהוב) ו-`<meta name="theme-color" content="#7C3AED">` ב-`index.html`. הגופן Heebo מגיע מקומית (`@fontsource-variable/heebo`, ADR-1). `/api/jokes` מוגש מקומית רק ב-`npm run dev` (Plugin `devApi` עם `apply: 'serve'`, ADR-5).
> ספריות (נבדק מול התיעוד העדכני): `vite-plugin-pwa@2.0.0` תומך ב-Vite 8 (peer `^8.0.0`); `@vite-pwa/assets-generator@2.0.0` מייצר אייקונים מתמונה אחת דרך האפשרות `pwaAssets`; החרגת נתיבים מה-Navigation Fallback נעשית ב-`workbox.navigateFallbackDenylist`.

## 1. מטרה והיקף

האפליקציה ניתנת להתקנה דרך הדפדפן ונפתחת גם בלי רשת (אחרי ביקור Online אחד). בלי רשת מוצגת הודעה ויצירת בדיחות חסומה; כשהרשת חוזרת — הכל עובד כרגיל. בנוסף: סבב בדיקות Responsive ונגישות על כל המסך ותיקון ליקויים.

**בתוך ההיקף:**
- `vite-plugin-pwa` (Workbox, `generateSW`) עם Manifest, אייקונים ו-Service Worker שעושה Precache לקובצי הממשק בלבד.
- זיהוי Offline, הודעת Offline בעברית וחסימת יצירה ללא רשת.
- החרגה מוחלטת של `/api/*` מה-Service Worker.
- הרצת גרסת ה-Build מקומית יחד עם `/api/jokes`, כדי שאפשר יהיה לבדוק PWA ו-Offline אמיתיים.
- בדיקות אוטומטיות + בדיקות בדפדפן: מובייל/מחשב, RTL, מקלדת, עץ נגישות, axe.

**מחוץ להיקף (לא לממש):**
- כפתור "התקן" או באנר התקנה בתוך האפליקציה (PRD Out of Scope).
- יצירת בדיחות Offline, תור בקשות או Background Sync, Push Notifications.
- שמירת בדיחות בכל צורה (`localStorage`, IndexedDB, Cache) — הרשימה מתאפסת ברענון כמו היום.
- הודעת "גרסה חדשה זמינה" / כפתור רענון לעדכון (לא מוגדר ב-spec; העדכון יקרה אוטומטית — ראו §2).
- פריסה ל-Vercel ובדיקת HTTPS אמיתית (Milestone 5).

## 2. החלטות התנהגות

**Offline – זיהוי:** Hook קטן `useOnlineStatus` מבוסס `navigator.onLine` ואירועי `online` / `offline` (ARCHITECTURE §2.2). כש-`navigator.onLine` מדווח "יש רשת" אבל הבקשה בכל זאת נכשלת — מוצגת השגיאה הקיימת "לא הצלחנו ליצור בדיחה. נסו שוב." (השגיאה בפועל היא הסמכות הסופית).

**Offline – מה המשתמש רואה (הצעה לאישורך):**
- באזור ההודעות (מתחת לטופס) מופיעה ההודעה המאושרת: "אין חיבור לאינטרנט. כדי ליצור בדיחה יש להתחבר לרשת." עם אייקון מידע, באותה שפה חזותית של הודעת השגיאה (DESIGN §2.3). ההודעה בתוך אזור ה-`role="status"` הקיים, כך שקורא מסך מכריז עליה.
- כפתור "צור בדיחה" **מושבת** (כמו בזמן טעינה), ולחיצה על Enter בשדה לא שולחת דבר. כך בוודאות לא יוצאת קריאה ל-AI.
- אם הייתה מוצגת הודעת שגיאה עם "נסו שוב" — בזמן Offline היא מוסתרת ובמקומה מוצגת הודעת ה-Offline; כשהרשת חוזרת, השגיאה ו"נסו שוב" חוזרים להופיע.
- השדה נשאר פעיל — אפשר להקליד נושא גם בלי רשת.
- העתקה, מחיקה וניקוי ממשיכים לעבוד (הם לא צריכים רשת). שיתוף תלוי במכשיר, כמו היום.
- בקשה שכבר נשלחה ואז הרשת נפלה — לא מבטלים אותה; אם תיכשל, תוצג השגיאה הרגילה.

**חזרת הרשת:** ההודעה נעלמת, הכפתור חוזר לפעול. אין שליחה אוטומטית של בקשה; המשתמש לוחץ בעצמו.

**עדכון גרסה:** `registerType: 'autoUpdate'` — גרסה חדשה של האפליקציה נטענת אוטומטית בביקור הבא, בלי הודעה. (מתאים לאפליקציה בלי נתונים שמורים: אין מה לאבד ברענון.)

## 3. PWA – תצורה

**Manifest** (נוצר ע"י הפלאגין כ-`manifest.webmanifest`):

| שדה | ערך | מקור |
|---|---|---|
| `name` / `short_name` | "בדיחה בקליק" | PRD, ARCHITECTURE §2.6 |
| `description` | "בדיחה בקליק – כל נושא, בדיחה חדשה!" | הקיים ב-`index.html` |
| `lang` / `dir` | `he` / `rtl` | PRD (ממשק עברי) |
| `display` | `standalone` | ARCHITECTURE §2.6 |
| `start_url` / `scope` | `/` / `/` | ARCHITECTURE §2.6 |
| `theme_color` | `#7C3AED` (Primary) | ה-meta הקיים מאז Milestone 1 |
| `background_color` | `#F9FAFB` (Background) | DESIGN §2.1 |

**אייקונים (הצעה לאישורך):** האייקון של האפליקציה המותקנת = ה-favicon הקיים (פרצוף צוחק צהוב). `@vite-pwa/assets-generator` עם Preset `minimal-2023` מייצר ממנו בזמן Build: 64/192/512 PNG, אייקון `maskable` (עם שוליים ורקע בהיר) ו-`apple-touch-icon` ל-iOS. התמונות נוצרות ב-Build בלבד — אין קובצי PNG ב-Git.
- הפלאגין מוסיף בעצמו את קישורי ה-favicon/apple-touch-icon ל-`<head>`, ולכן הקישור הידני ל-favicon ב-`index.html` יוסר (למנוע כפילות). ה-meta של `theme-color` נשאר כפי שהוא (`injectThemeColor: false`).

**Service Worker (Workbox `generateSW`):**
- `globPatterns`: `**/*.{js,css,html,svg,png,ico,woff2}` — HTML, JS, CSS, אייקונים וגופן Heebo.
- `navigateFallback: 'index.html'` (ברירת המחדל) + `navigateFallbackDenylist: [/^\/api\//]` — כתובות API לעולם לא יקבלו את דף האפליקציה.
- **אין `runtimeCaching` בכלל** → ה-SW לא שומר שום תשובה מהרשת, ובוודאי לא את `/api/jokes` או בקשות POST. מפתח ה-API נמצא רק בשרת, ולכן ממילא אינו יכול להגיע ל-Cache.
- `cleanupOutdatedCaches: true`.
- רישום ה-SW: `injectRegister: 'auto'` (סקריפט קטן שהפלאגין מוסיף) — בלי קוד רישום ב-React.
- בזמן `npm run dev` ה-SW **כבוי** (ברירת המחדל), כדי שהפיתוח לא ייתקע על קבצים ישנים.

**הרצת גרסת Build מקומית עם ה-API (ADR חדש):** Service Worker אמיתי עובד רק על גרסת Build. כיום `npm run preview` מגיש את הממשק בלבד, בלי `/api/jokes`. נרחיב את ה-Plugin `devApi` (`vite.config.ts`) כך שיחבר את אותו Handler גם ל-`configurePreviewServer`. אחרי זה `npm run build && npm run preview` (http://localhost:4173) = האפליקציה המלאה כולל PWA. `localhost` נחשב "Secure Context", כך ש-Service Worker והתקנה עובדים גם בלי HTTPS.
- יתווסף ל-`.claude/launch.json` תצורת `preview` (פורט 4173), ול-`CLAUDE.md` שורת הרצה לבדיקת PWA.

## 4. מבנה קבצים (חדשים / משתנים)

```text
package.json                  ← +vite-plugin-pwa, +@vite-pwa/assets-generator, +axe-core (dev)
vite.config.ts                ← VitePWA(...) + devApi גם ל-preview
index.html                    ← הסרת <link rel="icon"> (הפלאגין מוסיף)
tsconfig.app.json             ← (רק אם צריך טיפוסי vite-plugin-pwa/client)
src/hooks/useOnlineStatus.ts  ← חדש
src/App.tsx                   ← isOffline → JokeForm / JokeStatus, חסימת send
src/components/JokeForm.tsx   ← prop "disabled" (טעינה או Offline)
src/components/JokeStatus.tsx ← מצב Offline
src/components/JokeStatus.module.css ← עיצוב הודעת Offline
src/App.offline.test.tsx      ← חדש
src/App.a11y.test.tsx         ← חדש (axe-core ב-jsdom)
.claude/launch.json           ← תצורת preview
CLAUDE.md                     ← פקודת הרצה לבדיקת PWA
spec/ARCHITECTURE.md          ← ADR-9 (ואולי ADR-10 לפי ממצאי נגישות)
```

## 5. רכיבים

- **`useOnlineStatus()`** — מחזיר `boolean` דרך `useSyncExternalStore` (מנוי ל-`online` / `offline`, ערך התחלתי `navigator.onLine`). בלי ספריות.
- **`App`** — `const isOnline = useOnlineStatus()`. `send()` יוצא מיד אם `!isOnline` (הגנה שנייה מעבר לכפתור המושבת). מעביר `isOffline` ל-`JokeStatus` ו-`disabled={isLoading || !isOnline}` ל-`JokeForm`.
- **`JokeForm`** — `isLoading` מוחלף/מתווסף ב-`disabled`; ה-guard ב-`handleSubmit` בודק אותו.
- **`JokeStatus`** — סדר עדיפות: טעינה → Offline → שגיאה + "נסו שוב" → הכרזה. הודעת ה-Offline בתוך אותו `role="status"` הקיים (הכרזה מנומסת, לא קוטעת).

## 6. בדיקות

**אוטומטיות (Vitest):**
- `App.offline.test.tsx`:
  - פתיחה כש-`navigator.onLine = false` → ההודעה המדויקת מוצגת, הכפתור מושבת, לחיצה/Enter לא קוראים ל-`fetch`.
  - אירוע `offline` בזמן שימוש → ההודעה מופיעה; אירוע `online` → נעלמת, ויצירה עובדת ומוסיפה בדיחה.
  - שגיאה קיימת + מעבר ל-Offline → "נסו שוב" מוסתר; חזרה Online → "נסו שוב" חוזר ושולח את אותה בקשה.
  - בדיחות קיימות נשארות ברשימה כשעוברים Offline/Online (בתוך אותו ביקור).
- `App.a11y.test.tsx` — `axe-core` על מצבים: התחלתי, עם בדיחות, טעינה, שגיאה, Offline, Dialog פתוח. (בדיקת ניגודיות צבעים לא עובדת ב-jsdom — נבדקת בדפדפן.)
- כל הבדיקות הקיימות ממשיכות לעבור; `npm run build` ו-`npm run lint` עוברים.

**בדיקת Build:**
- ב-`dist/` קיימים `manifest.webmanifest`, `sw.js` ואייקוני PNG; ה-Manifest מכיל את השדות מ-§3.
- `sw.js` מכיל את ה-denylist של `/api/` ואינו מכיל `runtimeCaching`; רשימת ה-Precache כוללת רק קובצי ממשק.
- חיפוש ב-`dist/` שאין שם `OPENAI_API_KEY` או ערך שמתחיל ב-`sk-`.

**בדפדפן (על `npm run preview`, דרך Playwright):**
1. ביקור ראשון Online → ה-SW רשום ופעיל; ה-Manifest נטען בלי שגיאות.
2. מצב Offline של הדפדפן + רענון → הממשק נפתח, הודעת Offline מוצגת, אין שום בקשה ל-`/api/jokes` ברשת.
3. חזרה Online → יצירת בדיחה אמיתית מצליחה (דורש `OPENAI_API_KEY` ב-`.env`).
4. רענון → הרשימה ריקה (אין שחזור).
5. `POST /api/jokes` ב-Network מגיע מהשרת ולא מה-Service Worker; ב-Cache Storage אין רשומות של `/api/`.
6. Chrome מזהה את האפליקציה כניתנת להתקנה (אירוע `beforeinstallprompt` / אייקון ההתקנה בשורת הכתובת).
7. רוחבים 320, 375, 768, 1280: אין גלילה אופקית, פריסה RTL תקינה, כרטיסים ו-Dialog לא נחתכים; הגדלת טקסט ל-200%.
8. מקלדת בלבד: Tab דרך שדה → כפתור → כרטיסים → ניקוי → Dialog, Focus גלוי בכל שלב, כולל במצב Offline (כפתור מושבת לא "בולע" Focus).
9. `axe-core` מוזרק לדף בכל המצבים מ-§6 + ניגודיות צבעים אמיתית, במובייל ובמחשב.
10. עץ הנגישות (Accessibility Tree): שמות לכל כפתור, תווית לשדה, ההודעות בתוך אזור ה-status, ה-Dialog עם שם ותיאור.

**מגבלות בדיקה ידועות (ידווחו בסיום):** אין לי מכשירי iPhone/Android אמיתיים, Safari או Firefox — הבדיקות ב-Chromium עם אמולציית מובייל. קורא מסך אמיתי (VoiceOver/NVDA) לא מופעל אוטומטית — נבדק עץ הנגישות במקומו; מומלץ לנסות VoiceOver ידנית. Firefox במחשב אינו תומך בהתקנת PWA, ו-iOS Safari מתקין רק דרך "הוסף למסך הבית" — זו התנהגות הדפדפנים ולא באג.

## 7. נגישות וצבעים

- הודעת Offline: טקסט ב-Text Primary (`#111827`) על רקע בהיר; אייקון ב-Info (`#3B82F6`) — ניגודיות ~3.7:1 מול לבן, מעל 3:1 הנדרש לאלמנט גרפי. לא מסתמכים על צבע בלבד — יש טקסט מלא.
- כפתור מושבת במצב Offline: אותו סגנון "מושבת" שכבר קיים לטעינה; ההסבר מופיע בטקסט גלוי מעליו/מתחתיו.
- WCAG 2.2 שכדאי לוודא במיוחד: 2.5.8 גודל מטרה (≥24px לכפתורי הכרטיס והפח), 1.4.10 Reflow ב-320px, 1.4.4 הגדלת טקסט, 2.4.11 Focus שלא מוסתר ע"י אלמנטים אחרים, 4.1.3 הודעות מצב.
- כל ליקוי שיימצא ויחסום AA — יתוקן בתוך ה-Milestone; תיקון שמשנה צבע/עיצוב מה-Style Guide יתועד כ-ADR (כמו ADR-4, ADR-7).

## 8. שלבי עבודה

1. התקנת `vite-plugin-pwa`, `@vite-pwa/assets-generator`, `axe-core`.
2. תצורת `VitePWA` ב-`vite.config.ts` (Manifest, `pwaAssets`, Workbox) + הסרת קישור ה-favicon מ-`index.html`.
3. הרחבת `devApi` ל-`preview`; תצורת `preview` ב-`launch.json`; ADR-9.
4. `useOnlineStatus` + שינויים ב-`App`, `JokeForm`, `JokeStatus` ועיצוב.
5. בדיקות Offline ו-axe ב-Vitest; `npm test`, `npm run build`, `npm run lint`.
6. בדיקת `dist/` (Manifest, SW, אין סודות).
7. בדיקות דפדפן לפי §6 (PWA, Offline, Responsive, מקלדת, axe, עץ נגישות) ותיקון ממצאים.
8. עדכון `CLAUDE.md` (פקודת הרצה לבדיקת PWA), סגירת השרתים, סימון 🟡 ב-`MILESTONES.md`.

## 9. מיפוי ל-Definition of Done

| תנאי | איך מתקיים / נבדק |
|---|---|
| Manifest תקין, SW נרשם, התקנה דרך הדפדפן בלבד | §3; בדיקות Build ודפדפן 1, 6; אין כפתור התקנה בקוד |
| אחרי ביקור Online, Offline + רענון פותחים את הממשק עם הודעה ובלי קריאה ל-AI | Precache + Navigation Fallback; כפתור מושבת + guard ב-`send`; בדיקות Vitest ודפדפן 2 |
| אחרי חזרת רשת אפשר לייצר; בדיחות לא משוחזרות | Hook מגיב ל-`online`; State בזיכרון בלבד; בדיקות Vitest ודפדפן 3, 4 |
| `/api/jokes` לא מוגש מ-Cache, ומפתח לא ב-Cache | denylist + אין `runtimeCaching`; בדיקת `sw.js`, `dist/` ו-Cache Storage (דפדפן 5) |
| מובייל/מחשב, RTL, מקלדת, קורא מסך, בדיקות אוטומטיות; ליקויי AA תוקנו; מגבלות דווחו | Vitest axe + בדיקות דפדפן 7–10; §7; רשימת מגבלות ב-§6 |

## 10. לאישורך לפני הבנייה

1. **התנהגות Offline:** כפתור "צור בדיחה" מושבת והודעה מוצגת מתחת לטופס (§2). חלופה: להשאיר את הכפתור פעיל ולהציג את ההודעה רק בלחיצה — פחות ברור למשתמש, לכן לא מומלץ.
2. **אייקון האפליקציה המותקנת:** ה-favicon הקיים (פרצוף צוחק צהוב). אם יש לך תמונה אחרת לאייקון — אפשר לשים אותה ב-`spec/` ואשתמש בה.
3. **עדכון גרסה אוטומטי בלי הודעה** (§2).
