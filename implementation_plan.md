# Telefonos Tesztelés és APK Csomagolás Terve

Mivel egy vonalkódos PWA (Progressive Web App) alkalmazásról van szó, a telefonos teszteléshez és futtatáshoz kulcsfontosságú a **biztonságos HTTPS kapcsolat**. A modern mobilböngészők (Chrome, Safari) a kamera használatát (vonalkód-olvasás) és a PWA telepítést (Service Worker) csak HTTPS vagy localhost felett engedélyezik.

Az alábbiakban bemutatom a négy lehetséges módszert az alkalmazás telefonra történő átvitelére, előnyökkel és hátrányokkal.

---

## Javasolt Megközelítések (Módszer Választás)

### 1. Opció: Helyi HTTPS alagút (ngrok / localtunnel) — *Leggyorsabb helyi tesztelés*
- **Hogyan működik:** A számítógépeden futó helyi fejlesztői szervert (port 8080) egy biztonságos, nyilvános HTTPS linken keresztül elérhetővé tesszük (pl. `https://xyz.localtunnel.me`). Ezt a linket a telefonod böngészőjében megnyitva azonnal elérhető az app, működik a kamera, és telepíthető PWA-ként.
- **Előnyök:** Nem kell buildelni, nem kell kódokat feltölteni sehova, a PC-n végzett módosítások azonnal látszanak a telefonon is.
- **Hátrányok:** A tesztelés ideje alatt a PC-nek és a helyi szervernek futnia kell.

### 2. Opció: Ingyenes PWA hosztolás (GitHub Pages) — *A legstabilabb PWA tesztelés*
- **Hogyan működik:** Mivel az alkalmazás csak statikus fájlokból áll, ingyenesen közzétehetjük GitHub Pages-en (vagy Netlify/Vercel oldalon). A telefonon a kapott címet megnyitva az appot "telepíthetjük" a kezdőképernyőre (PWA-ként), és a Service Workernek köszönhetően a telefonon teljesen offline is működni fog.
- **Előnyök:** Bárhonnan elérhető, nem kell futnia a PC-dnek, a frissítés annyi, hogy feltolod (push) a kódot Git-be, és 1 perc múlva frissül a telefonon.
- **Hátrányok:** Szükséges hozzá egy GitHub fiók.

### 3. Opció: Felhőalapú APK fordítás (GitHub Actions + Capacitor) — *Automatikus APK minden verzióról*
- **Hogyan működik:** A webalkalmazást felkészítjük a **Capacitor**-ra (létrehozzuk a `package.json`-t és a Capacitor konfigurációt). Beállítunk egy GitHub Actions munkafolyamatot. Amikor új verziót pusholsz a GitHubra, a felhőben lévő virtuális gép automatikusan lefordítja az Android projektet, és elkészíti a letölthető `.apk` fájlt.
- **Előnyök:** Nem kell a te gépedre nehéz fejlesztői eszközöket (pl. 3 GB-os Android Studio-t, Java JDK-t) telepíteni. Minden push-ra automatikusan elkészül az új APK.
- **Hátrányok:** GitHub használata szükséges.

### 4. Opció: Helyi APK fordítás (Capacitor + Android Studio) — *Helyi natív build*
- **Hogyan működik:** A Capacitor segítségével létrehozunk egy helyi Android projektet a gépeden. Ehhez telepítened kell a Java JDK-t és az Android Studio-t. A build parancsok lefuttatása után a gépeden generálódik az `.apk` fájl, amit átmásolhatsz a telefonodra (pl. USB kábellel vagy Drive-on keresztül).
- **Előnyök:** Teljesen helyi környezetben működik, nem kell hozzá semmilyen felhős szolgáltatás.
- **Hátrányok:** Körülbelül 3-4 GB eszköztár letöltése és konfigurálása szükséges a számítógépedre.

---

## Open Questions

> [!IMPORTANT]
> Melyik megközelítést szeretnéd megvalósítani az alábbiak közül?
> 1. **(Javasolt) GitHub Pages + ngrok alagút kombináció:** A napi gyors tesztelésre az ngrok-ot használod, a végleges tesztelésre és a telefonra való PWA telepítésre pedig a GitHub Pages-t (nincs szükség APK-ra, mert a PWA natív alkalmazásként viselkedik).
> 2. **Automatikus APK build felhőben (GitHub Actions + Capacitor):** Ha mindenképpen valódi `.apk` fájlt szeretnél, amit kézzel telepíthetsz Androidon. ehhez inicializáljuk a Capacitort és megírjuk a GitHub workflow-t.
> 3. **Helyi APK build:** Ha szeretnéd helyben a saját gépeden buildelni az APK-kat (ebben az esetben leírjuk a lépéseket az Android Studio beállításához).

---

## Proposed Changes (Ha a 2-es vagy 3-as opciót választjuk)

Ha a Capacitor-alapú APK csomagolást választjuk, az alábbi fájlokat kell létrehoznunk/módosítanunk:

### [NEW] [package.json](file:///d:/!dev/BC/Leltar2/package.json)
- Létrehozzuk a Node.js projektet, és hozzáadjuk a `@capacitor/core`, `@capacitor/cli` és `@capacitor/android` függőségeket.

### [NEW] [capacitor.config.json](file:///d:/!dev/BC/Leltar2/capacitor.config.json)
- A Capacitor konfigurációs fájlja, amely meghatározza az alkalmazás nevét, azonosítóját (`hu.leltar2.app`) és a webes erőforrások könyvtárát (ami nálunk a gyökér könyvtár `./`).

### [NEW] [.github/workflows/android.yml](file:///d:/!dev/BC/Leltar2/.github/workflows/android.yml) (Csak a Felhős build esetén)
- GitHub Actions workflow, amely minden push esetén felépíti a projektet és feltölti a lefordított `app-debug.apk` fájlt.

## Verification Plan

### Manuális Ellenőrzés (ngrok alagút)
1. Elindítjuk az `npx localtunnel --port 8080` vagy `npx ngrok http 8080` parancsot a PC-n.
2. Megnyitjuk a generált HTTPS linket a telefon böngészőjében.
3. Ellenőrizzük, hogy a kamera engedélykérés megjelenik-e, és sikeresen működik-e a szkennelés.

### APK Ellenőrzése
1. Lefordítjuk az APK-t (helyben vagy a GitHub Actions segítségével).
2. Átmásoljuk a telefontárhelyre és feltelepítjük (ismeretlen források engedélyezése után).
3. Elindítjuk az alkalmazást natívan a telefonon, ellenőrizzük a helyi adatbázis és a kamera működését.
