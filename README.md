# Golf Passport Europe

Mobile-first Web-App fuer iPhone und Browser. Die App zeigt Golfplaetze auf einer OpenStreetMap-Karte, findet Plaetze ueber OpenStreetMap/Overpass, erlaubt GPS-Naehesuche, Navigation und ein Stickeralbum fuer bereits besuchte Plaetze.

## Kostenloser Karten-Stack

Die App nutzt keine kostenpflichtige Google Maps API mehr.

- Karte: Leaflet
- Kartendaten: OpenStreetMap
- Golfplatzsuche: Overpass API mit OpenStreetMap-Tags wie `leisure=golf_course` und `sport=golf`
- Navigation: Links zu Google Maps und Apple Maps ohne API Key
- Profil und Stickeralbum: lokal im Browser per `localStorage`

Die GPS-Funktion zeigt Golfplaetze in einem Umkreis von 30 Kilometern an.

Wichtig: OpenStreetMap ist communitygepflegt. Die App kann sehr viele europaeische Golfplaetze finden, aber nur Plaetze, die in OpenStreetMap korrekt hinterlegt sind. Die oeffentliche Overpass API ist kostenlos, aber nicht fuer sehr hohe Dauerlast gedacht. Fuer eine groessere oeffentliche App waere spaeter ein eigener Overpass-/Tile-Anbieter sinnvoll.

## Starten

Ohne Build-Schritt:

```bash
node -e "const http=require('node:http'),fs=require('node:fs'),path=require('node:path');const root=process.cwd();const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};http.createServer((req,res)=>{let url=decodeURIComponent(req.url.split('?')[0]);if(url==='/')url='/index.html';const file=path.join(root,url);fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));"
```

Dann `http://127.0.0.1:4173` im Browser oeffnen.

## GitHub Upload

1. Auf GitHub das Repository `golf-passport-europe` oeffnen.
2. **Add file** und danach **Upload files** waehlen.
3. Alle Dateien und Ordner aus diesem Projekt hochladen:
   - `.nojekyll`
   - `README.md`
   - `index.html`
   - `styles.css`
   - `app.js`
   - `app-config.js`
   - `manifest.json`
   - `service-worker.js`
   - den kompletten Ordner `assets`
4. Commit-Nachricht setzen, zum Beispiel `Switch to OpenStreetMap app`.
5. **Commit changes** klicken.

## GitHub Pages aktivieren

1. Im Repository auf **Settings** gehen.
2. Links **Pages** oeffnen.
3. Unter **Build and deployment** bei **Source** die Option **Deploy from a branch** waehlen.
4. Branch `main` und Ordner `/ (root)` auswaehlen.
5. Speichern.

Nach kurzer Zeit ist die App unter einer URL wie `https://heavyaxel.github.io/golf-passport-europe/` erreichbar.

## iPhone Nutzung

1. Die GitHub-Pages-URL in Safari oeffnen.
2. Teilen-Symbol antippen.
3. **Zum Home-Bildschirm** waehlen.
4. Die App startet danach wie eine normale Web-App.
