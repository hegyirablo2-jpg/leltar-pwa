# Fejlesztési Walkthrough - Leltározás (v1.05)

Az alkalmazás neve **Leltározás**, a jelenlegi verzió: **v1.05**. Ebben a frissítésben bevezettük a raktárhely rögzítését és átrendeztük a felhasználói felületet.

---

## Főbb Változtatások a v1.05-ös Verzióban

1. **Raktárhely kód rögzítése ("Raktárhely rögzítése" kapcsoló):**
   - **Működés:** A felhasználói felületen elhelyezett kapcsoló segítségével rögzíthető az aktuális raktárhely. Ha be van kapcsolva, a mennyiség megadása és az OK gomb megnyomása után az alkalmazás nem törli a raktárhelyet, hanem megtartja azt, és azonnal a **Cikkszám beolvasása** állapotra vált.
   - **Előny:** Így ugyanazon a raktárhelyen lévő cikkeket lehet folyamatosan, a raktárhely újbóli beolvasása vagy kézi beírása nélkül egymás után leltározni.
   - **Kikapcsolás:** Ha a funkciót kikapcsolják, a következő sikeres mentés vagy újraindítás után a normál ciklus áll vissza (újra kéri a raktárhely kódját).

2. **Felhasználói felület (UI) elrendezés finomítása:**
   - **Változás:** A beolvasott kódokat mutató szürke kártya (`.progress-card`) közvetlenül a kamera viewport/olvasóterület alá került.
   - **Manuális beállítások:** A kézi bevitelt és beállításokat tartalmazó kártya (`.control-card`) pedig az oldal aljára lett áthelyezve, így a szkennelés állapota azonnal láthatóvá vált a beolvasás alatt, a kevésbé használt kézi vezérlők pedig a képernyő alsó részére szorultak.
   - **Támogatás:** A `.view-section` osztályhoz hozzáadtuk a `min-height: 100%` tulajdonságot, biztosítva, hogy a manuális kártya nagyobb felbontású kijelzőkön is megfelelően az oldal aljára tapadjon.

3. **Automatikus PWA frissítés és verzióléptetés:**
   - A verzió `v1.05`-re lett módosítva a fájlokban:
     - `app.js` (`APP_VERSION = '1.05'`)
     - `index.html` (fejléc verzió kijelzés)
     - `manifest.json` (`"version": "1.05"`)
     - `service-worker.js` (frissített cache név: `'leltarozas-cache-v1.05'`)
   - Ez biztosítja, hogy a PWA a háttérben azonnal letöltse az új verziót, és a háttérben elvégzett telepítés után automatikusan frissítse és újratöltse a weboldalt.

---

## Verifikációs és Tesztelési Eredmények

1. **Manuális ellenőrzés (Raktárhely rögzítése bekapcsolva):**
   - Raktárkód megadva (`WH01`).
   - Raktárhely kód megadva (`LOC-99`).
   - Cikkszám megadva (`ITEM-ABC`).
   - Mennyiség megadva (`5`).
   - Mentés után a raktárhely megmaradt (`LOC-99`), a cikkszám visszaállt "Nincs beolvasva" értékre, a célzókeret a cikkszámot várja. A ciklus sikeresen folytatódott a cikkszám szkenneléssel.
2. **Manuális ellenőrzés (Raktárhely rögzítése kikapcsolva):**
   - Mentés után a raktárhely és a cikkszám is törlődött, az alkalmazás visszaugrott a raktárhely beolvasására.
3. **Elrendezés ellenőrzése:**
   - A beolvasási állapot kártya közvetlenül a kamera ablak alatt jelenik meg.
   - A kézi beállítások és a rögzítés kapcsolója a képernyő legalsó részére került.
