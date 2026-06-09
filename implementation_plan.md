# Gyorsítótárazás és Helyi Szerver Megbízhatóságának Javítása

A PWA (Progressive Web App) Service Worker cache-first stratégiája miatt a böngészők makacsul tárolták a régi fájlokat (HTML, CSS, JS), így sem a helyi szerver, sem a GitHub Pages módosításai nem jelentek meg azonnal.

A probléma végleges és megbízható megoldására az alábbi változtatásokat vezetjük be.

## Proposed Changes

### 1. Új Helyi Szerver Indító [NEW] [start-server.bat](file:///d:/!dev/BC/Leltar2/start-server.bat)
- Létrehozunk egy egyszerűen kattintható Windows parancsfájlt a projekt gyökerében.
- A szervert az `npx http-server -c-1 -p 8080` paranccsal indítja. A `-c-1` kapcsoló teljesen letiltja a HTTP gyorsítótárazást (Cache-Control: no-cache), így a böngésző minden helyi kódváltoztatást azonnal letölt.

### 2. Caching Stratégia Módosítása [MODIFY] [service-worker.js](file:///d:/!dev/BC/Leltar2/service-worker.js)
- Átállunk **Cache-First** stratégiáról **Network-First** (Hálózat-Első) stratégiára.
- **Működése:** Ha van internet/hálózati kapcsolat, a böngésző mindig a legújabb fájlokat tölti le a szerverről (így a GitHub Pages frissítései azonnal látszódnak), és elmenti őket a cache-be. Ha nincs hálózat (offline), akkor a korábban mentett cache-ből tölt be.
- Hozzáadunk egy `message` eseménykezelőt a `skipWaiting()` kényszerítésére, amikor új verzió érhető el.

### 3. Automatikus Frissítés-Érzékelés [MODIFY] [app.js](file:///d:/!dev/BC/Leltar2/app.js)
- A Service Worker regisztráció során figyeljük az `updatefound` eseményt.
- Ha új Service Worker verziót észlel az alkalmazás, küldünk egy `skipWaiting` üzenetet a háttérnek.
- A `controllerchange` esemény meghívásakor (amikor az új Service Worker átveszi az irányítást) **automatikusan újratöltjük az oldalt** (`window.location.reload()`). Így a felhasználónak nem kell bezárnia az appot, a frissítés azonnal és automatikusan végbemegy a háttérben.

## Verification Plan

### Helyi Szerver Teszt
1. Elindítjuk az alkalmazást a `start-server.bat` fájllal.
2. Megnyitjuk a `http://localhost:8080` oldalt.
3. Végzünk egy apró szöveges módosítást az `index.html`-ben és elmentjük.
4. Lefuttatunk egy sima frissítést (F5) a böngészőben. Ellenőrizzük, hogy a változás azonnal látható-e (a `-c-1` hatása).

### GitHub Pages és Automatikus Frissülés Teszt
1. Feltoljuk a módosításokat GitHubra.
2. Visszalépünk az asztali böngészőbe.
3. Amikor a GitHub Pages elkészül, a böngésző észleli a háttérben az új verziót, letölti azt, és automatikusan újratölti az oldalt az új funkciókkal.
