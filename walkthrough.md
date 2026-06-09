# Fejlesztési Walkthrough - Leltározás (Módosított Fázis 1)

Az alkalmazást átneveztük **Leltározás**-ra, bevezettük a kódból állítható verziókezelést (jelenlegi verzió: **v1.02**), és átterveztük a grafikus felületet (GUI) nagyobb betűméretekkel és tapadási felületekkel a kis mobilképernyőkön való kényelmes használathoz.

---

## Főbb Változtatások a v1.02-es Verzióban

1. **Alkalmazás Átnevezése és Verziókezelése:**
   - A projekt neve hivatalosan **Leltározás** lett.
   - Az `app.js` elején található `const APP_VERSION = '1.02';` konstans segítségével a verziószám egyetlen helyen állítható a kódban.
   - A verziószám automatikusan beillesztésre kerül a fejlécbe és a böngésző fül címébe indításkor.
   - A `manifest.json` és a `service-worker.js` cache-elési azonosítója is frissült a `v1.02` verziónak megfelelően.

2. **Mobilbarát GUI (Nagyobb betűméretek és gombok):**
   - **Taller Inputs & Buttons:** A gombok és beviteli mezők magasságát fixen **54px**-re növeltük. Ez megkönnyíti a gyors érintést (tap target) a telefonokon, kiküszöbölve a félrenyomásokat.
   - **Scaled Typography:** Az összes szöveges elem betűméretét megemeltük:
     - Input mezők betűmérete: `1.15rem` (~18px).
     - Gombok betűmérete: `1.1rem` (~17px).
     - Megerősítendő kódok kiemelése a modálokban: `1.6rem` bold (~25px).
     - Kamera alatti utasítások: `1.05rem` (~16px), félkövér, kontrasztos fehér színben.
   - **Expanded Bottom Bars:** Az alsó navigációs sáv magasságát **80px**-re növeltük, így az ikonok (`1.5rem`) and a feliratok is nagyobbak lettek. Az alsó státuszsáv magasságát és betűméretét szintén megemeltük.
   - **Optimized Aspect Ratio:** A kamera detektáló keretének mérete (`85%` szélesség, `55%` magasság) továbbra is ideális a lineáris vonalkódok beolvasásához.

3. **Megbízható Frissülés és Fejlesztés:**
   - A [start-server.bat](file:///d:/!dev/BC/Leltar2/start-server.bat) segítségével indított helyi szerver teljesen kikapcsolja a gyorsítótárazást, így azonnal láthatóak a kódváltoztatások.
   - A **Network-First** Service Worker és az **Auto-Update** modulnak köszönhetően a telefon és az asztali böngésző azonnal észleli, ha új verziót (pl. egy újabb push-t) töltesz fel a GitHub Pages-re, letölti a fájlokat, és **automatikusan újratölti az oldalt**, így azonnal a frissített felület jelenik meg.

---

## Útmutató: Alkalmazás Frissítése GitHub Pages Segítségével

Amikor új verziót push-olsz, az alábbi folyamat játszódik le:

1. **Push Git-be:**
   Futtasd a parancsokat a helyi mappában a `v1.02`-es kódok feltöltéséhez:
   ```bash
   git add .
   git commit -m "Upgrade to Leltározás v1.02 with larger GUI"
   git push origin main
   ```
2. **Szerveroldali frissülés:** A GitHub Pages 30-60 másodpercen belül frissíti a tárhelyet a háttérben.
3. **Automatikus kliens frissülés:** A telefonodon vagy böngészőben megnyitott alkalmazás a háttérben azonnal észleli a `v1.02` verzióváltozást a Service Workeren keresztül, letölti a megváltozott stíluslapot és szkripteket, majd **magától újratölti az oldalt**, aktiválva a megnövelt méretű új felületet.
