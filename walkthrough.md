# Fejlesztési Walkthrough - Vonalkódos Leltározó App (Fázis 1)

Sikeresen elkészült a vonalkódos leltározó alkalmazás 1. fázisa, és a fájlokat felkészítettük az ingyenes **GitHub Pages** alapú telepítésre és telefonos tesztelésre.

Mivel az alkalmazásban minden hivatkozás és a Service Worker is **relatív útvonalakat** használ, az app zökkenőmentesen fog futni GitHub Pages alatt is (alkönyvtáras eléréssel, pl. `https://felhasznalonev.github.io/projektnev/`).

---

## Útmutató: Kód Feltöltése GitHub-ra és Telepítés Telefonra

Kövesd az alábbi lépéseket a PWA élesítéséhez és a telefonos teszteléshez:

### 1. lépés: Helyi Git tárhely inicializálása
Nyiss egy terminált a projekt mappájában (`d:\!dev\BC\Leltar2`), és futtasd az alábbi parancsokat a fájlok hozzáadásához:

```bash
# Git inicializálása
git init

# Fájlok hozzáadása a stage-re (.gitignore automatikusan kiszűri a felesleget)
git add .

# Első commit létrehozása
git commit -m "Initial commit - Leltar2 PWA Phase 1"
```

### 2. lépés: Új GitHub tárhely (Repository) létrehozása
1. Nyisd meg a [github.com](https://github.com) oldalt és jelentkezz be.
2. Hozz létre egy új tárhelyet (**New Repository**).
   - **Repository name:** `leltar2` (vagy tetszőleges név)
   - **Public/Private:** Lehet Public (Nyilvános) vagy Private (Magán) is, a GitHub Pages mindkettőt támogatja (a Private-hoz GitHub Pro szükséges a Pages-hez, ezért a legegyszerűbb a **Public** választása).
   - Ne jelöld be a README, .gitignore vagy License létrehozását (mivel ezeket már elkészítettük).
3. Kattints a **Create repository** gombra.

### 3. lépés: Kód feltolása GitHub-ra
Másold ki a GitHub által adott parancsokat, vagy futtasd az alábbiakat a helyi terminálodban (helyettesítsd be a saját felhasználónevedet):

```bash
# Cél távoli szerver hozzáadása (cseréld le a felhasználónevedre)
git remote add origin https://github.com/<a-te-felhasznaloneved>/leltar2.git

# Fő ág elnevezése main-re
git branch -M main

# Kód feltolása a szerverre
git push -u origin main
```

### 4. lépés: GitHub Pages aktiválása
Miután a kód feltöltődött, kapcsold be a webes hosztolást:
1. Nyisd meg a tárhelyedet GitHubon, és kattints a **Settings** (Beállítások) fülre.
2. A bal oldali menüben válaszd a **Pages** menüpontot.
3. A **Build and deployment** szekciónál a **Source** legördülő menüben hagyd a **Deploy from a branch** opción.
4. A **Branch** beállításnál válaszd ki a **main** ágat, a mappa maradjon a gyökér (**/(root)**), majd kattints a **Save** gombra.
5. Várj 1-2 percet. Frissítsd az oldalt, és a lap tetején meg fog jelenni a publikus, biztonságos HTTPS címed, például:
   `Your site is live at https://<a-te-felhasznaloneved>.github.io/leltar2/`

---

## Az alkalmazás tesztelése és telepítése telefonon

Miután élesedett a GitHub Pages link, nyisd meg azt a telefonodon:

### Android (Google Chrome)
1. Nyisd meg a generált HTTPS linket a Chrome böngészőben.
2. **Kamera engedélyezése:** Kattints a *Kamera indítása* gombra, és engedélyezd a kamera használatát a felugró ablakban. A kamera képén azonnal beolvashatod a vonalkódokat.
3. **Telepítés natív appként:** A Chrome automatikusan felajánlhatja az alkalmazás hozzáadását a kezdőképernyőhöz. Ha nem, kattints a jobb felső sarokban lévő 3 pont menüre, majd válaszd a **Telepítés** (vagy *Alkalmazás telepítése* / *Hozzáadás a kezdőképernyőhöz*) lehetőséget.
4. Az app ikonja bekerül a telefonod alkalmazásai közé, és különálló ablakban, teljes képernyőn (keretek nélkül) fog futni.

### iOS / iPhone (Safari)
1. Nyisd meg a linket a Safari böngészőben.
2. **Kamera engedélyezése:** A *Kamera indítása* gombra kattintva engedélyezd a kamera hozzáférést.
3. **Telepítés natív appként:** Koppints a Safari alján található **Megosztás** gombra (négyzetből felfelé mutató nyíl).
4. Görgess le, és válaszd a **Hozzáadás a főképernyőhöz** (Add to Home Screen) lehetőséget.
5. Nyisd meg az appot a főképernyődről. Így teljes natív PWA élményt kapsz, és az alkalmazás offline módban is működőképes marad.
