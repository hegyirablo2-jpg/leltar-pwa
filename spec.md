1. Megvalósíthatósági Terv - PWA Leltározó Alkalmazás
Egy stabil, vállalati környezetben is helytálló leltározó alkalmazás legfontosabb kritériuma a robusztus offline működés és az adatvesztés nélküli szinkronizáció. A vázolt funkciók alapján az alkalmazás egy klasszikus "offline-first" architektúrát igényel. A Progresszív Webalkalmazás (PWA) megközelítés lehetővé teszi, hogy az alkalmazás telepítés és app store-ok megkerülésével, közvetlenül a böngészőből fusson teljes értékű, natív élményt nyújtó alkalmazásként, függetlenül az operációs rendszertől.

Az alábbi terv a modern webes fejlesztési irányelvekre és skálázható technológiákra épül.

1. Javasolt Technológiai Stack
A PWA fejlesztés biztosítja a leggyorsabb piacra kerülést és a legegyszerűbb karbantartást, miközben a modern böngészők API-jai révén hozzáférést biztosít az eszköz hardveres funkcióihoz (kamera, lokális tárhely).

Nyelv és Keretrendszer: HTML5, CSS3 és Vanilla JavaScript (vagy egy könnyűsúlyú reaktív keretrendszer, mint a Vue.js vagy a React, de a minimális függőség érdekében a Vanilla JS + Web Components is tökéletes).

Vonalkód-olvasó Motor: Html5-Qrcode. Kliensoldalon futó, nyílt forráskódú JavaScript könyvtár, amely robusztusan kezeli az okostelefonok kameráit és nagy sebességgel olvassa az ipari vonalkódokat internetkapcsolat nélkül is.

Helyi Adatbázis: IndexedDB. A böngészőkbe épített, tranzakcionális NoSQL adatbázis. Garantálja, hogy a rögzített leltár-rekordok böngésző-összeomlás, a lap bezárása vagy hálózatvesztés esetén is biztonságban maradjanak.

Hálózati Kommunikáció és Offline Működés: Service Worker és Fetch API. A Service Worker felel az alkalmazás fájljainak (HTML, JS, CSS) gyorsítótárazásáért, így az app hálózat nélkül is elindul. A szerveres kommunikációt a Fetch API végzi.

Hitelesítés (Autentikáció): OAuth 2.0 / JWT token alapú hitelesítés javasolt (pl. integrálható Microsoft Entra ID / Azure AD rendszerekkel). A kapott tokent a böngésző biztonságos tárolójában (pl. HttpOnly Cookie vagy sessionStorage) kell tárolni.

2. Funkcionális Modulok Megvalósítása
A. Hitelesítés (Login)
A felhasználó bejelentkezik a webes felületen. Sikeres hitelesítés után a session tokent a rendszer eltárolja. Mivel az app PWA-ként fut, a bejelentkezési állapot a műszak során megmarad. Az adatrekordokhoz automatikusan hozzárendelődik az azonosított felhasználó azonosítója.

B. Vonalkód-olvasás és Adatbevitel
A kamera modul aktiválásakor a böngésző engedélyt kér a kamera használatára, majd a Html5-Qrcode folyamatosan elemzi a képet.

Sikeres felismerés (raktárkód vagy raktárhely) esetén az eszköz (ha támogatja) rezgéssel (Vibration API) vagy hangjelzéssel ad visszajelzést.

A fókusz automatikusan a mennyiség beviteli mezőre ugrik, ahol felugrik a numerikus billentyűzet (<input type="number">).

A "Mentés" gomb megnyomásával az adat bekerül az IndexedDB helyi adatbázisba egy időbélyeggel együtt.

C. Lista Megjelenítése és Szerkesztése
A felület az IndexedDB-ből nyeri ki az adatokat és jeleníti meg a rögzített tételeket.

Módosítás: Ha a felhasználó egy elemre koppint, a mennyiség szerkeszthetővé válik egy felugró ablakban (Modal). A mentés azonnal frissíti a rekordot az IndexedDB-ben.

Törlés: Dedikált törlés gombbal a rekord fizikai vagy logikai törlésre kerül a helyi adatbázisból (megerősítés után).

D. Fájl Generálás és Feltöltés (Szinkronizáció)
A "Leltár Lezárása" gomb megnyomásakor a folyamat:

Export: A kliensoldali JavaScript az IndexedDB tartalmából a háttérben összeállít egy szabványos .csv fájlt (Blob objektumként).

Feltöltés: A Fetch API elküldi a generált fájlt a cél szerverre (Multipart form-data formátumban egy REST API végpontra). Ha nincs hálózat, az alkalmazás figyelmezteti a felhasználót, hogy a feltöltés várakozik.

Helyi Megtartás: A sikeres feltöltés után a státusz "Feltöltve" állapotúra vált az IndexedDB-ben. A rekordok lokálisan megmaradnak egy előre meghatározott retenciós ideig (pl. 7 nap) biztonsági okokból.

Kézi Újra-feltöltés / Letöltés: Egy dedikált "Korábbi leltárak" menüpontban a lezárt adatokból újra generálható a CSV. Gombnyomásra újra beküldhető a szerverre, vagy akár a telefon tárhelyére is letölthető.

3. Biztonság és Kockázatkezelés
Adatvesztés: Az IndexedDB perzisztens tárolást biztosít. A legnagyobb kockázat, ha a felhasználó szándékosan törli a böngésző adatait (Clear Site Data). Ennek elkerülésére a dolgozókat oktatni kell, illetve az app ikonját a kezdőképernyőre tűzve a felhasználók különálló alkalmazásként kezelik, csökkentve a véletlen törlés esélyét.

Hálózatkimaradás feltöltéskor: A PWA architektúra miatt a rögzítés hálózatfüggetlen. A feltöltést csak akkor engedi a rendszer, ha a navigator.onLine státusz aktív és a szerver elérhető.

Eszköz kompatibilitás: A megoldás platformfüggetlen, fut Androidon (Chrome), iOS-en (Safari) és asztali böngészőkben is.

2. AI Fejlesztési Specifikáció - Leltározó PWA Alkalmazás (Fázis 1)
1. Projekt Célja és Hatóköre
Célunk egy "offline-first" Progresszív Webalkalmazás (PWA) fejlesztése, amely HTML5 kamerakezelés segítségével támogatja a raktári leltározást. Ez az első fejlesztési fázis (Phase 1) kizárólag a helyi működésre fókuszál: adatok beolvasása, IndexedDB-ben történő tárolása, kilistázása, szerkesztése és törlése.

A hálózati kommunikáció, az autentikáció és a szerverre történő CSV feltöltés a 2. fázis része, ezeket most hagyd figyelmen kívül.

2. Technológiai Stack és Architektúra
Kérlek, az alábbi tiszta, függőségmentes technológiákat használd a kód generálásakor, hogy a projekt azonnal futtatható legyen egy statikus webszerverről vagy Live Serverről:

Nyelv: HTML5, CSS3, Vanilla JavaScript (ES6+). Kerüld a bonyolult build toolokat (pl. Webpack, Vite) ebben a fázisban, kivéve, ha feltétlenül szükséges.

Felhasználói Felület (UI): Reszponzív, "mobile-first" dizájn tiszta CSS-sel vagy egy könnyű micro-frameworkkel (pl. Tailwind CSS CDN-ről vagy Bootstrap 5). Legyen modern, gombközpontú felület.

Kamera és Gépi Látás: html5-qrcode könyvtár (CDN-ről behúzva) az eszközön futó vonalkód-felismeréshez.

Helyi Adatbázis: IndexedDB. (Használhatod a könnyebb Promise-alapú kezeléshez az idb könyvtárat CDN-ről, vagy tiszta Vanilla JS IndexedDB API-t).

PWA Alapok: manifest.json fájl és egy alapvető service-worker.js a lokális fájlok cache-eléséhez.

3. Adatmodell (IndexedDB)
Hozd létre az adatbázist (InventoryDB) és benne egy scans nevű objektumtárolót (Object Store) az alábbi struktúrával:

id (Auto-incrementing Key)

locationCode (String) - A raktárhely vonalkódja.

itemCode (String) - A termék vonalkódja.

quantity (Number) - A megszámolt mennyiség.

timestamp (Number) - A rögzítés UNIX időbélyege (Date.now()).

isSynced (Boolean) - Alapértelmezett értéke false (A 2. fázishoz előkészítve).

Adatbázis műveletek:

Összes rögzített tétel lekérdezése időrendben csökkenően.

Új tétel beszúrása.

Meglévő tétel mennyiségének frissítése ID alapján.

Tétel törlése ID alapján.

4. Képernyők és Felhasználói Felület
Az alkalmazásnak alapvetően egy Single Page Application (SPA) felépítést kell követnie, két fő nézettel (amelyek között DOM manipulációval vagy egyszerű CSS class kapcsolgatással lehet váltani).

Nézet 1: Olvasó és Adatbeviteli Nézet (Scan View)
Funkció: Ez az alkalmazás kezdőképernyője.
UI Elemek és Logika:

Kamera előnézet: Egy <div id="reader"></div> konténer, amelyben a html5-qrcode fut.

Vonalkód felismerés logika:

Üzleti logika: Első sikeres olvasásra a locationCode (Raktárhely) input mező töltődjön ki. Második olvasásra az itemCode (Termék) input mező töltődjön ki.

Biztosíts egy "Új olvasás / Törlés" gombot a rögzített vonalkódok ürítésére, ha a felhasználó rossz kódot olvasott be.

Adatbeviteli Űrlap:

Megjeleníti a beolvasott locationCode-ot és itemCode-ot (readonly input mezők).

Egy beviteli mező <input type="number" step="any"> a mennyiség megadására.

"Mentés" (Save) gomb.

Mentés folyamata: A "Mentés" gomb megnyomásakor ellenőrizd, hogy minden mező ki van-e töltve. Ha igen, mentsd a JavaScript objektumot az IndexedDB-be, majd ürítsd ki az űrlapot (kivéve a locationCode-ot, hogy a felhasználó ugyanazon a raktárhelyen folytathassa a munkát).

Nézet 2: Leltár Lista Nézet (List View)
Funkció: A már rögzített tételek áttekintése és módosítása.
UI Elemek és Logika:

Lista generálás: Kérdezd le az adatokat az IndexedDB-ből és generálj listaelemeket (pl. Bootstrap kártyákat) a DOM-ba.

Lista elem dizájn: Minden elemen látszódjon a Raktárhely, Termékkód, Mennyiség és a rögzítés ideje (formázott dátum).

Szerkesztés: Az elemen lévő "Szerkesztés" gombra kattintva nyíljon meg egy JavaScript prompt vagy egy HTML dialog (Modal), ahol a mennyiség újraírható, majd mentés után frissül az IndexedDB és újra-renderelődik a lista.

Törlés: Dedikált törlés gomb az elemek mellett. Törlés előtt egy confirm() ablakkal kérj megerősítést.

5. Fejlesztési Lépések az AI számára (Implementation Steps)
Kérlek, az alábbi sorrendben haladj a fájlok és a kód generálásával:

Projekt Setup: Hozd létre a könyvtárszerkezetet. Szükség lesz egy index.html-re, egy styles.css-re és egy app.js-re. Húzd be a szükséges CDN linkeket az index.html <head> részébe (Tailwind/Bootstrap és html5-qrcode).

UI Vázlat: Készítsd el az index.html-ben a két fő nézetet (Scan View és List View konténerek) és az alsó vagy felső navigációs sávot a kettő közötti váltáshoz.

Adatbázis Réteg (app.js): Írd meg az IndexedDB inicializálását és a CRUD (Create, Read, Update, Delete) funkciókat kezelő aszinkron JavaScript függvényeket.

Kamera Integráció (app.js): Inicializáld a Html5QrcodeScanner példányt, és írd meg a sikeres olvasást (onScanSuccess) kezelő callback logikát, amely kitölti az input mezőket.

UI Logika összekötése (app.js): Írd meg a gombok eseménykezelőit (Mentés az adatbázisba, Lista megjelenítése, Szerkesztés, Törlés, Nézetek közötti váltás).

6. Hibakezelés (Edge Cases to Handle)
Kezeletlen kivételek elkerülése, ha a böngésző nem kap kamera engedélyt (mutass egyértelmű hibaüzenetet a felületen).

A html5-qrcode gyors olvasásának limitálása, hogy egy kódot ne rögzítsen duplán másodperceken belül.

Érvénytelen bemenet szűrése a mennyiség mezőnél.