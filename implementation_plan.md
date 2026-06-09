# Vonalkódos Leltározó Alkalmazás (Módosítási Terv)

Az alkalmazás munkafolyamatát átalakítjuk a felhasználó kérése alapján: a raktár kódját csak egyszer kell megadni indításkor, a beolvasásokat megerősítő ablakok kísérik, a mennyiséget egy külön modal kéri be, a szkennelő keret nagyobb lesz, és a képernyő alján egy státuszsor mutatja a rögzített tételek számát.

## User Review Required

> [!IMPORTANT]
> **Munkafolyamat változások:**
> 1. **Raktár kód:** Indításkor kötelező beolvasni. Sikeres megerősítés után fixen kikerül a képernyő tetejére. Oldal újratöltésekor (újraindításkor) újra be kell olvasni.
> 2. **Iteratív beolvasás:**
>    - **Lépés 1 (Raktárhely):** Szkennelés -> Megerősítő ablak (Oké / Mégse). Ha Oké, jön a Lépés 2.
>    - **Lépés 2 (Cikkszám):** Szkennelés -> Megerősítő ablak (Oké / Mégse). Ha Oké, jön a Lépés 3.
>    - **Lépés 3 (Mennyiség):** Egy felugró modal megmutatja a beolvasott raktárhelyet és cikkszámot, majd bekéri a mennyiséget. "OK" gombra ment IndexedDB-be, majd visszaugrik a Lépés 1-re (új raktárhely beolvasása).
> 3. **Detektáló keret (qrbox):** A kamera ablakban a leolvasó keret méretét megnöveljük (szélesség 80%-a), hogy könnyebb legyen a célzás.

## Proposed Changes

### [MODIFY] [index.html](file:///d:/dev/BC/Leltar2/index.html)
- Tetejére egy fix fejléc sáv beillesztése a Raktár kód megjelenítéséhez (`#warehouse-display-bar`).
- A megerősítő ablakokhoz egy univerzális megerősítő modal (`#confirm-modal`) létrehozása (Oké / Mégse gombokkal).
- A mennyiség bekérő modal (`#quantity-modal`) átalakítása, hogy a megerősített raktárhelyet és cikkszámot is megjelenítse.
- Alsó státuszsáv (`#status-bar`) hozzáadása, amely az IndexedDB-ben rögzített összes tétel darabszámát mutatja.

### [MODIFY] [styles.css](file:///d:/dev/BC/Leltar2/styles.css)
- A fejléc alatti fix raktárkód kijelző stílusának megírása.
- A kamera scanner keretének (`#reader` stílusok) és a detektáló zóna méretének növelése.
- Az új alsó státuszsáv és a modálok vizuális finomítása (glassmorphism és jobb gombelrendezések).

### [MODIFY] [app.js](file:///d:/dev/BC/Leltar2/app.js)
- **Munkafolyamat állapotgép (State Machine) bevezetése:**
  - Állapotok: `SCAN_WAREHOUSE`, `SCAN_LOCATION`, `SCAN_ITEM`, `ENTER_QUANTITY`.
- **Raktár kód:** A beolvasott raktárkódot `sessionStorage`-ben tároljuk, így lapfrissítéskor (újraindításkor) törlődik és újra bekéri, de böngészés közben megmarad.
- **Megerősítő logikák:**
  - Sikeres beolvasáskor rezgés (Vibration API) és sípolás (Web Audio API).
  - Megnyílik az egyedi modal a beolvasott értékkel (Raktár, Raktárhely vagy Cikkszám).
  - "Mégse" gomb esetén a scanner újraindul és várja az új kódot.
  - "Oké" gomb esetén az állapotgép a következő fázisba lép.
- **Tételszám lekérdezés:** Minden mentés és törlés után frissíti a státuszsávban a tételek darabszámát.

### [MODIFY] [walkthrough.md](file:///d:/dev/BC/Leltar2/walkthrough.md)
- Frissítjük a PWA működési leírását.
- Részletesen leírjuk a **GitHub Pages-en futó verzió frissítésének folyamatát**:
  1. Helyi kód módosítása és mentése.
  2. Git push végrehajtása.
  3. GitHub Pages automatikus háttér-frissítésének megvárása (~1 perc).
  4. A telefonon futó PWA frissítése (alkalmazás bezárása a háttérből/task managerből, majd újra megnyitása az új Service Worker aktiválásához).

## Verification Plan

### Manuális Tesztelés
1. **Indítás:** Belépéskor csak a raktárkód beolvasását engedi az app. Más kódokat figyelmen kívül hagy vagy hibát jelez.
2. **Raktár rögzítés:** Raktárkód szkennelése -> rezgés -> megerősítő ablak.
   - Ha *Mégse*: a raktárkód üres marad.
   - Ha *Oké*: a fejlécben megjelenik a raktárkód, és átlépünk raktárhely olvasásra.
3. **Raktárhely olvasás:** Raktárhely szkennelése -> rezgés -> megerősítő ablak.
   - Ha *Mégse*: törli, újra szkennelhetünk.
   - Ha *Oké*: elmenti ideiglenesen, átlépünk cikkszám olvasásra.
4. **Cikkszám olvasás:** Cikkszám szkennelése -> rezgés -> megerősítő ablak.
   - Ha *Mégse*: törli, újra szkennelhetünk.
   - Ha *Oké*: megnyílik a mennyiség bekérő ablak.
5. **Mennyiség:** A modal alján látható a raktárhely és a cikkszám.
   - Mennyiség beírása -> OK -> sikeres mentés jelzés -> visszaáll a kiinduló raktárhely szkennelésre.
   - Alsó státuszsáv frissül (tételek száma +1).
6. **Frissítés teszt:** Git push után a PWA bezárása a telefonon, majd újraindítás után az új verzió és dizájn sikeresen megjelenik-e.
