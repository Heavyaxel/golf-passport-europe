# Golf Passport Europe

Mobile-first Web-App für iPhone und Browser. Die App zeigt Golfplätze auf einer Karte, erlaubt Google-Login, GPS-Nähe, Navigation per Google Maps und ein Stickeralbum für bereits besuchte Plätze.

## Datenbasis

Die App enthält im Demo-Modus eine kleine kuratierte Beispielauswahl europäischer Golfplätze, inklusive Hannover-Beispielen. Für eine echte Abdeckung aller Golfplätze in Europa nutzt die App Google Maps JavaScript API und Google Places. Das ist absichtlich dynamisch gelöst, weil eine statische Datei mit "allen" europäischen Golfplätzen schnell unvollständig oder veraltet wäre.

Sobald in `app-config.js` ein Google Maps API Key eingetragen ist, sucht die App beim Bewegen der Karte und über das Suchfeld live nach Golfplätzen über Google Places.

## Starten

Ohne Build-Schritt:

```bash
node -e "const http=require('node:http'),fs=require('node:fs'),path=require('node:path');const root=process.cwd();const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};http.createServer((req,res)=>{let url=decodeURIComponent(req.url.split('?')[0]);if(url==='/')url='/index.html';const file=path.join(root,url);fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));"
```

Dann `http://127.0.0.1:4173` im Browser öffnen.

## Google konfigurieren

In [app-config.js](/Users/axelcohrs/Documents/Codex/Golf%20App/app-config.js) eintragen:

```js
window.GOLF_APP_CONFIG = {
  googleMapsApiKey: "DEIN_GOOGLE_MAPS_API_KEY",
  googleOAuthClientId: "DEINE_GOOGLE_OAUTH_CLIENT_ID"
};
```

Für den produktiven Betrieb braucht das Google Cloud Projekt mindestens Maps JavaScript API, Places API und Google Identity Services. Ohne Keys startet die App mit einer Demo-Karte und Beispiel-Golfplätzen.

## GitHub Upload

1. Auf GitHub das Repository `golf-passport-europe` öffnen.
2. **Add file** und danach **Upload files** wählen.
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
4. Commit-Nachricht setzen, zum Beispiel `Add Golf Passport Europe app`.
5. **Commit changes** klicken.

## GitHub Pages aktivieren

1. Im Repository auf **Settings** gehen.
2. Links **Pages** öffnen.
3. Unter **Build and deployment** bei **Source** die Option **Deploy from a branch** wählen.
4. Branch `main` und Ordner `/ (root)` auswählen.
5. Speichern.

Nach kurzer Zeit ist die App unter einer URL wie `https://heavyaxel.github.io/golf-passport-europe/` erreichbar.
