# Alkalmazás Átnevezése, Verziókezelése és GUI Nagyobbítása

A felhasználó kérése alapján átnevezzük az alkalmazást „Leltározás”-ra, bevezetjük a kódból állítható verziószámot (jelenleg `1.02`), és áttervezzük a grafikus felületet (GUI) nagyobb betűméretekkel és gombokkal, hogy kis mobilképernyőkön is rendkívül könnyen olvasható és kezelhető legyen.

## Proposed Changes

### 1. Alkalmazás Név és Verzió Bevezetése [MODIFY]
- **[index.html](file:///d:/!dev/BC/Leltar2/index.html)**:
  - Cím átírása: `Leltározás`.
  - Fejléc módosítása: `Leltározás` felirat, mellette egy dinamikus `#app-version` verziószámmal.
  - Szöveges említések (pl. üres listák üzenetei) cseréje "Leltározás"-ra.
- **[app.js](file:///d:/!dev/BC/Leltar2/app.js)**:
  - Fájl elején konstansként definiáljuk a verziót: `const APP_VERSION = '1.02';`.
  - Inicializáláskor dinamikusan beillesztjük a verziót a fejlécse és a dokumentum címébe.
- **[manifest.json](file:///d:/!dev/BC/Leltar2/manifest.json)**:
  - Nevét és rövid nevét átírjuk `Leltározás`-ra.
- **[service-worker.js](file:///d:/!dev/BC/Leltar2/service-worker.js)**:
  - Gyorsítótár nevét frissítjük a verzió alapján: `const CACHE_NAME = 'leltarozas-cache-v1.02';` (ez kényszeríti a telefonokat és a böngészőt a frissítésre).

### 2. GUI Áttervezése Nagy Betűméretekhez [MODIFY] [styles.css](file:///d:/!dev/BC/Leltar2/styles.css)
- **Alapméretek növelése**: A globális betűméretet és az elrendezést úgy módosítjuk, hogy kényelmes legyen a kis képernyőkön:
  - Input mezők (beviteli mezők): betűméret növelése `1.15rem`-re (`~18px`), belső margók (padding) növelése `14px 16px`-ra, magasságuk `52px` felett.
  - Gombok: betűméret `1.1rem`-re (`~17px`), magasságuk `52px` felett, hogy nagy ujjakkal is könnyű legyen rányomni.
  - Kamera alatti utasítások betűmérete: `1.05rem`-re (`~16px`) növelve.
  - A megerősítő és mennyiség modálok szövegméreteit megemeljük, a megerősítendő kódok kiemelését (`.highlight-text`) még nagyobbra és kontrasztosabbra vesszük (`1.6rem`).
  - Alsó státuszsáv: magasságát és betűméretét megemeljük a könnyű olvashatóság érdekében.
  - Alsó navigáció: gombok ikonjainak és szövegének méretét megnöveljük, a kényelmes navigációért.

### 3. Dokumentáció Frissítése [MODIFY]
- **[walkthrough.md](file:///d:/!dev/BC/Leltar2/walkthrough.md)**: Frissítjük az alkalmazás nevét és verziószámát, valamint a nagyobb grafikus felülettel és a verzió kezelésével kapcsolatos leírásokat.
- **[task.md](file:///d:/!dev/BC/Leltar2/task.md)**: Hozzáadjuk és nyomon követjük az átnevezés és a GUI áttervezés feladatait.

## Verification Plan

### Grafikus Teszt
1. Megnyitjuk a helyi szervert (`http://localhost:8080`) asztali böngészőben, mobil nézetre váltunk (F12 -> Mobil emulátor, pl. iPhone SE vagy kis kijelzős Android méret).
2. Ellenőrizzük, hogy a beviteli mezők és gombok méretei kényelmesen nagyok-e, nincs-e szöveg-összecsúszás.
3. Megbizonyosodunk róla, hogy a fejlécben és a böngésző fülön helyesen jelenik-e meg a `Leltározás v1.02` felirat.
4. Teszteljük a modálok (megerősítő modal, mennyiség modal) megjelenését, hogy a szövegek jól olvashatóak-e kis kijelzőn is.
