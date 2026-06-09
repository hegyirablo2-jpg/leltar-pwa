# Fejlesztési Walkthrough - Vonalkódos Leltározó App (Módosított Fázis 1)

Az alkalmazás munkafolyamatát és PWA frissítési rendszerét átalakítottuk a megbízhatóbb működés érdekében.

---

## 1. Megbízható Helyi Fejlesztői Szerver (`start-server.bat`)

Létrehoztunk egy [start-server.bat](file:///d:/!dev/BC/Leltar2/start-server.bat) Windows indítófájlt a projekt gyökérkönyvtárában. 
- **Működése:** A parancsfájl elindít egy helyi webszervert a háttérben az `npx http-server` segítségével a **8080**-as porton.
- **Cache letiltása:** A szervert a `-c-1` kapcsolóval indítjuk el, ami **teljesen letiltja a HTTP gyorsítótárazást** (Cache-Control: no-cache). Ez garantálja, hogy ha módosítasz egy helyi fájlt (HTML, CSS vagy JS), a böngésző a lap frissítésekor (F5) azonnal az új verziót fogja betölteni.
- **Használata:** Egyszerűen kattints duplán a `start-server.bat` fájlra a szerver elindításához.

---

## 2. Megbízható Frissülés GitHub Pages-en és Helyben (PWA Auto-Update)

A PWA Service Worker korábbi "Cache-First" működése miatt a böngészők makacsul a régi, elmentett változatot jelenítették meg. Ennek elhárítására két szintű védelmet építettünk be:

### A. Network-First (Hálózat-Első) gyorsítótárazás
A [service-worker.js](file:///d:/!dev/BC/Leltar2/service-worker.js) fájlt átírtuk **Network-First** működésűre.
- Ha van internetkapcsolatod, a böngésző **mindig lekéri a legfrissebb kódokat a szerverről** (akár a helyi szerverről, akár a GitHub Pagesről), és a háttérben felülírja a korábbi mentéseket.
- Ha nincs hálózat (offline vagy gyenge a térerő), az alkalmazás azonnal a helyben tárolt cache-ből tölt be, így az offline működés továbbra is 100%-os.

### B. Automatikus Frissítés-Érzékelés és Oldalújratöltés
Az [app.js](file:///d:/!dev/BC/Leltar2/app.js) mostantól automatikusan figyeli, ha új verzió jelenik meg a szerveren:
1. Ha új Service Worker verziót észlel (mert módosítottad a kódot és feltoltad GitHub-ra), az alkalmazás a háttérben letölti az új fájlokat.
2. Amint a letöltés befejeződött, a kód kényszeríti az új verzió aktiválását (`skipWaiting`).
3. Az új verzió aktívvá válásakor az alkalmazás **automatikusan újratölti az oldalt** a háttérben (`window.location.reload()`).
4. **Eredmény:** Felhasználóként nem kell semmit sem tenned; ha új verziót feltöltesz, a böngésző/telefon magától frissül a legújabb változatra a háttérben!

---

## 3. Beolvasási Munkafolyamat és Állapotgép

Az alkalmazás az alábbi iteratív beolvasást követi:

1. **Raktár kód beolvasása:** Első belépéskor a raktárkód beolvasása kötelező. Sikeres megerősítés után fixen kikerül a képernyő tetejére, és a `sessionStorage`-ben tárolódik (lap bezárásakor/újraindításakor törlődik).
2. **Raktárhely beolvasása:** Megerősítő ablak kíséri. Elfogadás esetén továbbfejlődik a cikkszám beolvasásra.
3. **Cikkszám beolvasása:** Megerősítő ablak kíséri. Elfogadás esetén megnyitja a mennyiség modal-t.
4. **Mennyiség megadása:** A modalban látható a megerősített raktárhely és cikkszám. OK gombra ment az IndexedDB-be, majd a státusz-kártya törlődik és visszaugrik a Raktárhely beolvasására (új iteráció).
5. **Alsó Státuszsáv:** Mutatja az adatbázisban tárolt összes rögzített tétel darabszámát.
