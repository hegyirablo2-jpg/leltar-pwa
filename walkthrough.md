# Fejlesztési Walkthrough - Leltározás (v1.06)

Az alkalmazás neve **Leltározás**, a jelenlegi verzió: **v1.06**. Ebben a frissítésben közvetlenné és kényelmessé tettük a kézi bevitelt és egyszerűsítettük a kezelőfelületet.

---

## Főbb Változtatások a v1.06-os Verzióban

1. **Közvetlen kézi kódbeírás ( progress inputok):**
   - **Működés:** A Raktárhely és Cikkszám mezők most már nem statikus szövegek, hanem `<input type="text">` elemek.
   - **Normál mód (Kamera aktív):** A mezők `readonly` (csak olvasható) állapotban vannak, és pontosan úgy jelennek meg, mint a korábbi statikus span elemek (nincs keret, monospace, kék/accent színű).
   - **Kézi mód (Kézi kódbeírás bekapcsolva):** Az inputokról lekerül a `readonly` állapot. Ekkor szürke hátterű, fókuszálható beviteli mezőkké alakulnak át.
   - **Fókusz és Navigáció:**
     - A "Kézi kódbeírás" bekapcsolásakor a fókusz automatikusan az első üres mezőre ugrik (általában a Raktárhely).
     - A **Raktárhely** mezőben megnyomott Enter billentyű elmenti a helykódot, és automatikusan átviszi a fókuszt a **Cikkszám** mezőre (kijelölve az esetleges régi értéket).
     - A **Cikkszám** mezőben megnyomott Enter billentyű elmenti a cikkszámot és azonnal megnyitja a mennyiség megadása ablakot.
     - A mennyiség megadása (OK gomb) után a mennyiség ablak bezárul, és (rögzített raktárhely esetén) a fókusz automatikusan visszakerül az üres Cikkszám mezőre, így a felhasználó azonnal gépelheti a következő cikket.

2. **Különálló beviteli mező eltávolítása:**
   - Mivel a beolvasási állapot mezők közvetlenül szerkeszthetővé váltak, a lap alján lévő korábbi különálló szövegdobozra (`#manual-scan-container`) és OK gombjára már nincs szükség. Ezt a blokkot teljesen eltávolítottuk, jelentősen egyszerűsítve a felületet.

3. **Kapcsolók egymás melletti (soros) elrendezése:**
   - A különálló beviteli doboz eltávolításával felszabadult a hely, így a két kapcsolót ("Kézi kódbeírás" és "Raktárhely rögzítése") egymás mellé rendeztük el a `.control-actions-row` flexbox stílus segítségével.
   - Mobil képernyőkön a kapcsolók automatikusan egymás alá törnek, ha a szélesség nem elegendő, megőrizve a reszponzivitást.

4. **Automatikus PWA frissítés és verzióléptetés:**
   - A verzió `v1.06`-ra lett módosítva a fájlokban:
     - `app.js` (`APP_VERSION = '1.06'`)
     - `index.html` (fejléc verzió kijelzés)
     - `manifest.json` (`"version": "1.06"`)
     - `service-worker.js` (frissített cache név: `'leltarozas-cache-v1.06'`)

---

## Verifikációs és Tesztelési Eredmények

1. **Kézi mód közvetlen teszt:**
   - Kapcsoljuk be a **Kézi kódbeírás**-t. A kamera leáll, a Raktárhely és Cikkszám mezők beviteli mező stílust kapnak, a fókusz a Raktárhelyre kerül.
   - Írjuk be: `R-101` + Enter. A fókusz átugrik a Cikkszámra.
   - Írjuk be: `C-202` + Enter. Megnyílik a mennyiség ablak.
   - Írjuk be a mennyiséget (pl. `12`) és nyomjunk Entert/OK-t. A tétel elmentődik az IndexedDB-be.
   - Ellenőrizzük, hogy ha a **Raktárhely rögzítése** be van kapcsolva, akkor a Raktárhely megmarad-e (`R-101`), a Cikkszám kiürül-e, és a fókusz visszakerül-e a Cikkszám mezőbe.
2. **Kikapcsolt Kézi mód teszt:**
   - Kapcsoljuk ki a **Kézi kódbeírás**-t. A Raktárhely és Cikkszám mezők azonnal visszaváltanak csak olvasható (`readonly`) stílusra, és a kamera elindul. A leolvasott vonalkódok a korábbi megerősítő ablakos módon kerülnek be a mezőkbe.
3. **Elrendezés ellenőrzése:**
   - A két kapcsoló egymás mellett szépen elfér a kártyában az "Újraindítás" gombbal egy sorban.
