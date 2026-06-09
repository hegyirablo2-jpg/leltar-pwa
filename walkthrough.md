# Fejlesztési Walkthrough - Vonalkódos Leltározó App (Módosított Fázis 1)

Az alkalmazás munkafolyamatát és megjelenését sikeresen átalakítottuk a kért specifikációknak megfelelően. 

---

## Új Beolvasási Munkafolyamat és Állapotgép

Az alkalmazás egy belső állapotgépet (State Machine) használ a beolvasások kezelésére:

1. **Raktár kód beolvasása (Egyszeri teendő indításkor):**
   - Az alkalmazás megnyitásakor csak a raktárkód beolvasását engedi.
   - Sikeres beolvasáskor rezgéssel jelez és felugrik egy megerősítő ablak: **Raktár kód megerősítése (Oké / Mégse)**.
   - Az **Oké** megnyomása után a raktárkód elmentődik a `sessionStorage`-ben (így az alkalmazás bezárásáig/újraindításáig megmarad), és fixen megjelenik a fejléc alatt: `Raktár: <kód>`.
   - A raktárkód a fejléc melletti **Módosítás** gombbal bármikor megváltoztatható (ez törli a jelenlegi beolvasási folyamatot is).

2. **Iteratív beolvasás (Raktárhely -> Cikkszám -> Mennyiség):**
   - **Raktárhely beolvasása:** Leolvasás után megerősítő ablak ugrik fel. Ha elfogadod (**Oké**), az érték megjelenik az alsó státusz-kártyán, és átlépünk termékbeolvasásra.
   - **Cikkszám beolvasása:** Leolvasás után megerősítő ablak ugrik fel. Ha elfogadod (**Oké**), az érték bekerül a státusz-kártyára, és automatikusan megnyílik a mennyiségbekérő ablak.
   - **Mennyiség megadása:** A felugró ablakban látható a már megerősített Raktárhely és Cikkszám. A mennyiség beírása és az **OK** megnyomása után a tétel rögzítésre kerül a helyi IndexedDB-ben.
   - **Mentés után:** A raktárhely és a cikkszám adatai törlődnek, és a rendszer automatikusan visszaugrik a *Raktárhely beolvasása* lépésre.
   - **Mégse gombok:** Ha a cikkszám megerősítésekor vagy a mennyiség modalban a *Mégse* gombra kattintasz, a rendszer csak a cikkszámot dobja el (visszaugrik a Cikkszám beolvasására), így nem kell újra beolvasnod a raktárhelyet, ha ugyanott több terméket rögzítesz.

3. **Nagyobb detektáló keret (Scanner):**
   - A kamera ablakban a leolvasó keret méretét megnöveltük (szélesség 85%-a, magasság 55%-a), amely téglalap alakjával kifejezetten az ipari/vonalkódok gyorsabb beolvasását segíti.

4. **Alsó Státuszsáv:**
   - A képernyő legalsó részén, a menüsáv felett elhelyeztünk egy állandó státuszsávot, amely valós időben mutatja az IndexedDB-ben rögzített leltári tételek teljes darabszámát: `Beolvasott tételek száma: X db`.

---

## Útmutató: Alkalmazás Frissítése GitHub Pages Segítségével

Amikor új verzió készül a kódból, azt az alábbi folyamattal tudod frissíteni a telefonodon:

### 1. lépés: Módosítások feltöltése (Push)
A helyi módosítások befejezése után futtasd az alábbi Git parancsokat a gépeden a frissítések feltolásához:

```bash
# Változások hozzáadása a stage-re
git add .

# Frissítési commit létrehozása
git commit -m "Update app: new scanning workflow and modals"

# Feltöltés a GitHub-ra
git push origin main
```

### 2. lépés: Automatikus szerveroldali frissülés megvárása
A `git push` után a GitHub Pages a háttérben automatikusan újraépíti a weboldalt. Ez általában **30-60 másodpercet** vesz igénybe. Ezután az új verzió már elérhető a HTTPS linken.

### 3. lépés: Az alkalmazás frissítése a telefonon (Service Worker frissítés)
Mivel az alkalmazás egy PWA, amely a Service Worker segítségével offline tárolja a fájlokat, a telefon böngészője a háttérben ellenőrzi a frissítést:
1. Ha megnyitod az alkalmazást, a Service Worker a háttérben észleli az új verziót és letölti azt.
2. Az új verzió aktiválásához **be kell zárnod az alkalmazást a telefon futó alkalmazásai közül** (söpörd ki/zárd be a háttérből a task managerben).
3. Nyisd meg újra az alkalmazást a telefon kezdőképernyőjéről.
4. Az alkalmazás ekkor már az új, frissített fájlokkal fog elindulni. (Ha böngészőben teszteled, egy egyszerű lapfrissítés/F5 is elegendő).
