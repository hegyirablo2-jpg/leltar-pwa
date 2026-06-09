# Dátum Csoportosítás, Lista Szűrés és Maximális Szkennelő Keret

A leltározási tételek kezelésének javítására bevezetjük a rögzítés pontos dátuma (helyi idő szerinti `YYYY-MM-DD`) alapú csoportosítást az IndexedDB-ben. A leltár listában alapértelmezetten a mai nap tételei jelennek meg, de a felhasználó tetszőleges dátumot kiválaszthat a tételek megtekintéséhez. A szkennelő keret méretét a maximális értékre (95%) emeljük.

## Proposed Changes

### 1. Adatmodell és Mentés Módosítása (Dátum szerinti mentés)
- **[app.js](file:///d:/!dev/BC/Leltar2/app.js)**:
  - Bevezetjük a `getLocalDateString(timestamp)` segédfüggvényt, amely a helyi időzónának megfelelő `YYYY-MM-DD` formátumú dátumot generál.
  - A tételek mentésekor az IndexedDB rekordba beírjuk a `date` mezőt is (pl. `date: '2026-06-09'`).

### 2. Lista Nézet Dátumszűrővel
- **[index.html](file:///d:/!dev/BC/Leltar2/index.html)**:
  - A lista nézet fejlécébe egy nagy méretű, könnyen kezelhető dátumválasztó mezőt (`<input type="date" id="list-date-filter">`) helyezünk el.
- **[app.js](file:///d:/!dev/BC/Leltar2/app.js)**:
  - A lista nézet megnyitásakor a dátumválasztó mezőt alapértelmezetten a mai napra állítjuk.
  - Csak azokat a tételeket jelenítjük meg a listában, amelyek rögzítési dátuma (`date` mezője) megegyezik a kiválasztott dátummal.
  - A dátumválasztó módosításakor (`change` esemény) a lista azonnal frissül a szűrt adatokkal.
  - A tételek törlése vagy szerkesztése után a lista automatikusan a jelenleg kiválasztott dátumra szűrve renderelődik újra.

### 3. Szkennelő Keret Maximálisra Növelése
- **[app.js](file:///d:/!dev/BC/Leltar2/app.js)**:
  - A `html5-qrcode` konfigurációjában a `qrbox` méretét a maximálisra növeljük (a videó szélességének `95%`-ára), hogy a vonalkód-olvasás területe a lehető legnagyobb legyen a képernyőn.

### 4. Dokumentációk Frissítése
- **[walkthrough.md](file:///d:/!dev/BC/Leltar2/walkthrough.md)**: Frissítjük a dátumszűrés, a csoportosítás és a maximális szkennelő keret leírását.
- **[task.md](file:///d:/!dev/BC/Leltar2/task.md)**: Frissítjük a teendők listáját.

## Verification Plan

### Manuális Tesztelés
1. **Szkennelő ablak:** Ellenőrizzük, hogy a zöld/szürke szkennelési célzókeret majdnem a teljes kamera előnézetet elfoglalja-e (95%).
2. **Mentés teszt:** Rögzítsünk néhány tételt a mai napon.
3. **Lista megnyitása:** Kattintsunk a "Lista" menüpontra.
   - Ellenőrizzük, hogy a dátumválasztó automatikusan a mai dátumot mutatja-e.
   - Ellenőrizzük, hogy a ma rögzített tételek listázódnak-e.
4. **Dátumválasztás:**
   - Módosítsuk a dátumválasztó mezőt egy másik napra (pl. tegnapra). A listának ki kell ürülnie ("Még nincs rögzített tétel ezen a napon").
   - Váltsunk vissza a mai napra: a tételeknek újra meg kell jelenniük.
5. **Összegzések:** Ellenőrizzük, hogy az "Össz darabszám" és a "Tételek száma" a listában csak a kiválasztott napra vonatkozik-e, míg az alsó státuszsáv továbbra is a teljes adatbázis összesített tételszámát mutatja-e.
