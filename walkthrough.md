# Fejlesztési Walkthrough - Leltározás (Módosított Fázis 1 - v1.04)

Az alkalmazás neve **Leltározás**, a jelenlegi verzió: **v1.04**. Ebben a frissítésben optimalizáltuk a kamera szkennelési keretének méretezését.

---

## Főbb Változtatások a v1.04-es Verzióban

1. **Valódi Maximális Szkennelő Keret:**
   - **Probléma:** Korábban a leolvasó keret (qrbox) a `Math.min(width, height)` képletet használta, ami a beolvasó ablak magasságára (ami kisebb, mint a szélessége) korlátozta a keret szélességét is. Emiatt a keret a széleken nagy sötét sávot hagyott és kicsinek tűnt.
   - **Megoldás:** A `html5-qrcode` konfigurációjában a `qrbox` méretét közvetlenül a videókeret valós szélességére (width * 0.98) és magasságára (height * 0.95) méreteztük át. 
   - **Eredmény:** A fehéren világító célzó sarkok és a beolvasási zóna most már valóban kitágult a kamera ablak széleihez (a szélesség **98%**-át, és a magasság **95%**-át elfoglalva), így a szkennelés maximális méretűvé vált.

2. **Verziókezelés szinkronizálása:**
   - A `v1.04` verzió bekerült az `app.js` konstansba, a `manifest.json`-be és a `service-worker.js`-be (`leltarozas-cache-v1.04` gyorsítótár névvel).

---

## Útmutató: Alkalmazás Frissítése GitHub Pages Segítségével

Futtasd a parancsokat a helyi mappában a `v1.04`-es kódok feltöltéséhez:
```bash
git add .
git commit -m "Upgrade to Leltározás v1.04 with maximized camera frame"
git push origin main
```
A feltolás után a GitHub Pages háttérben frissül (~1 perc), majd a megnyitott alkalmazás a háttérben azonnal észleli a `v1.04` verziót és **magától újratölti az oldalt**, így a megnövelt méretű új keret azonnal aktívvá válik!
