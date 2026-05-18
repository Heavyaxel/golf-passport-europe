const config = window.GOLF_APP_CONFIG || {};
const storageKey = "golf-passport-v1";

const demoCourses = [
  { id: "golfclub-hannover", name: "Golfclub Hannover", country: "Deutschland", region: "Hannover / Garbsen", lat: 52.433, lng: 9.629, holes: 27, rating: 4.5, note: "Demo-Eintrag für die Suche rund um Hannover" },
  { id: "golf-gleidingen", name: "Golf Gleidingen", country: "Deutschland", region: "Hannover / Laatzen", lat: 52.291, lng: 9.828, holes: 27, rating: 4.4, note: "Golfanlage südlich von Hannover" },
  { id: "st-andrews", name: "St Andrews Links", country: "Schottland", region: "Fife", lat: 56.343, lng: -2.803, holes: 18, rating: 4.9, note: "Historischer Links-Klassiker am Meer" },
  { id: "royal-county-down", name: "Royal County Down", country: "Nordirland", region: "Newcastle", lat: 54.209, lng: -5.889, holes: 18, rating: 4.9, note: "Dünen, Wind und Blick auf die Mourne Mountains" },
  { id: "valderrama", name: "Real Club Valderrama", country: "Spanien", region: "Sotogrande", lat: 36.286, lng: -5.302, holes: 18, rating: 4.8, note: "Ryder-Cup-Geschichte in Andalusien" },
  { id: "le-golf-national", name: "Le Golf National", country: "Frankreich", region: "Paris", lat: 48.752, lng: 2.076, holes: 18, rating: 4.7, note: "Albatros Course mit Stadion-Feeling" },
  { id: "pga-catalunya", name: "Camiral Golf & Wellness", country: "Spanien", region: "Girona", lat: 41.841, lng: 2.772, holes: 36, rating: 4.7, note: "Tour Course und Stadium Course" },
  { id: "monte-rei", name: "Monte Rei Golf", country: "Portugal", region: "Algarve", lat: 37.201, lng: -7.538, holes: 18, rating: 4.8, note: "Jack-Nicklaus-Design mit weitem Blick" },
  { id: "adare-manor", name: "Adare Manor", country: "Irland", region: "Limerick", lat: 52.565, lng: -8.782, holes: 18, rating: 4.8, note: "Parkland Course mit luxuriösem Clubhaus" },
  { id: "royal-birkdale", name: "Royal Birkdale", country: "England", region: "Southport", lat: 53.622, lng: -3.032, holes: 18, rating: 4.8, note: "Open-Championship-Links an der Küste" },
  { id: "gut-laerchenhof", name: "Gut Lärchenhof", country: "Deutschland", region: "Köln", lat: 50.944, lng: 6.735, holes: 18, rating: 4.6, note: "Jack-Nicklaus-Platz bei Köln" },
  { id: "fontana", name: "Fontana Golf Club", country: "Österreich", region: "Wien", lat: 47.975, lng: 16.301, holes: 18, rating: 4.6, note: "Championship Golf südlich von Wien" },
  { id: "crans-sur-sierre", name: "Crans-sur-Sierre", country: "Schweiz", region: "Wallis", lat: 46.309, lng: 7.463, holes: 18, rating: 4.7, note: "Alpenkulisse der Omega European Masters" },
  { id: "bro-hof", name: "Bro Hof Slott", country: "Schweden", region: "Stockholm", lat: 59.539, lng: 17.643, holes: 36, rating: 4.7, note: "Lake Course am Mälaren" },
  { id: "royal-hague", name: "The Royal Hague", country: "Niederlande", region: "Wassenaar", lat: 52.147, lng: 4.347, holes: 18, rating: 4.6, note: "Dünenplatz nahe Den Haag" },
  { id: "lighthouse", name: "Lighthouse Golf & Spa", country: "Bulgarien", region: "Balchik", lat: 43.421, lng: 28.224, holes: 18, rating: 4.5, note: "Klippenblick über dem Schwarzen Meer" },
  { id: "costa-navarino", name: "Costa Navarino Dunes", country: "Griechenland", region: "Messinia", lat: 36.994, lng: 21.65, holes: 18, rating: 4.7, note: "Olivenhaine und Ionisches Meer" },
  { id: "k-club", name: "The K Club", country: "Irland", region: "Kildare", lat: 53.309, lng: -6.626, holes: 36, rating: 4.7, note: "Ryder-Cup-Parkland westlich von Dublin" }
];

const state = {
  courses: demoCourses,
  visited: new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")),
  selectedId: null,
  searchQuery: "",
  searchTimer: null,
  nearbyIds: new Set(),
  googleReady: false,
  googleMap: null,
  markers: new Map(),
  user: JSON.parse(localStorage.getItem(`${storageKey}-user`) || "null")
};

const els = {
  demoMap: document.querySelector("#demoMap"),
  googleMap: document.querySelector("#googleMap"),
  courseLayer: document.querySelector("#courseLayer"),
  mapCanvas: document.querySelector("#mapCanvas"),
  search: document.querySelector("#courseSearch"),
  nearbyButton: document.querySelector("#nearbyButton"),
  accountButton: document.querySelector("#accountButton"),
  albumPanel: document.querySelector("#albumPanel"),
  stickerGrid: document.querySelector("#stickerGrid"),
  sheet: document.querySelector("#detailSheet"),
  sheetContent: document.querySelector("#sheetContent"),
  albumTitle: document.querySelector("#albumTitle"),
  visitedCount: document.querySelector("#visitedCount"),
  countryCount: document.querySelector("#countryCount"),
  nearbyCount: document.querySelector("#nearbyCount"),
  completionValue: document.querySelector("#completionValue")
};

function project(lat, lng) {
  const minLng = -12;
  const maxLng = 32;
  const minLat = 35;
  const maxLat = 61;
  return {
    x: ((lng - minLng) / (maxLng - minLng)) * 100,
    y: (1 - (lat - minLat) / (maxLat - minLat)) * 100
  };
}

function persistVisited() {
  localStorage.setItem(storageKey, JSON.stringify([...state.visited]));
}

function renderDemoMarkers() {
  els.courseLayer.innerHTML = "";
  state.courses.forEach((course) => {
    const point = project(course.lat, course.lng);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `course-marker ${state.visited.has(course.id) ? "visited" : ""} ${state.selectedId === course.id ? "active" : ""}`;
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.setAttribute("aria-label", course.name);
    button.addEventListener("click", () => selectCourse(course.id));
    els.courseLayer.appendChild(button);
  });
}

function renderAlbum() {
  const knownCourses = mergeCourses(demoCourses, state.courses);
  const visibleCourses = state.searchQuery ? state.courses : knownCourses;
  const visitedCourses = knownCourses.filter((course) => state.visited.has(course.id));
  const countries = new Set(visitedCourses.map((course) => course.country));
  const completion = Math.round((visitedCourses.length / knownCourses.length) * 100);

  els.albumTitle.textContent = `${visitedCourses.length} Plätze angepinnt`;
  els.visitedCount.textContent = visitedCourses.length;
  els.countryCount.textContent = countries.size;
  els.nearbyCount.textContent = state.nearbyIds.size;
  els.completionValue.textContent = `${completion}%`;
  document.documentElement.style.setProperty("--progress", `${completion}%`);

  els.stickerGrid.innerHTML = "";
  visibleCourses.forEach((course) => {
    const collected = state.visited.has(course.id);
    const sticker = document.createElement("button");
    sticker.type = "button";
    sticker.className = `sticker ${collected ? "collected" : ""}`;
    sticker.innerHTML = `
      <div class="sticker-ball">${collected ? "✓" : ""}</div>
      <h3>${course.name}</h3>
      <p>${course.country} · ${course.region}</p>
    `;
    sticker.addEventListener("click", () => selectCourse(course.id));
    els.stickerGrid.appendChild(sticker);
  });
}

function renderSheet(course) {
  const visited = state.visited.has(course.id);
  els.sheetContent.innerHTML = `
    <h3>${course.name}</h3>
    <p>${course.note}</p>
    <div class="course-meta">
      <span>${course.country}</span>
      <span>${course.region}</span>
      <span>${course.holes || 18} Loch</span>
      <span>${course.rating ? course.rating.toFixed(1) : "Neu"} ★</span>
    </div>
    <div class="action-row">
      <button class="primary-action" id="pinCourse" type="button">${visited ? "Sticker lösen" : "Anpinnen"}</button>
      <button class="secondary-action" id="navigateCourse" type="button">Navigieren</button>
    </div>
  `;
  els.sheet.classList.add("open");
  document.querySelector("#pinCourse").addEventListener("click", () => toggleVisited(course.id));
  document.querySelector("#navigateCourse").addEventListener("click", () => navigateTo(course));
}

function closeSheet() {
  state.selectedId = null;
  els.sheet.classList.remove("open");
  els.sheetContent.innerHTML = "";
  renderDemoMarkers();
  updateGoogleMarkers();
}

function selectCourse(id) {
  state.selectedId = id;
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  renderDemoMarkers();
  updateGoogleMarkers();
  renderSheet(course);
}

function toggleVisited(id) {
  if (state.visited.has(id)) {
    state.visited.delete(id);
  } else {
    state.visited.add(id);
  }
  persistVisited();
  renderDemoMarkers();
  renderAlbum();
  selectCourse(id);
}

function navigateTo(course) {
  const destination = encodeURIComponent(`${course.name}, ${course.region}, ${course.country}`);
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank", "noopener");
}

function filterCourses(term) {
  const query = term.trim().toLowerCase();
  state.searchQuery = query;
  window.clearTimeout(state.searchTimer);
  if (!query) {
    state.courses = demoCourses;
    closeSheet();
    renderAlbum();
    return;
  }
  state.courses = demoCourses.filter((course) => courseMatches(course, query));
  closeSheet();
  renderDemoMarkers();
  renderAlbum();
  if (state.googleReady) {
    state.searchTimer = window.setTimeout(() => searchGolfCoursesByText(term), 350);
  } else if (state.courses.length === 0) {
    showToast("Keine Demo-Treffer. Mit Google Maps API Key sucht die App live über Google Places.");
  }
}

function courseMatches(course, query) {
  return `${course.name} ${course.country} ${course.region} ${course.note}`.toLowerCase().includes(query);
}

function mergeCourses(...groups) {
  return [...new Map(groups.flat().map((course) => [course.id, course])).values()];
}

function distanceKm(a, b) {
  const toRad = (value) => value * Math.PI / 180;
  const earth = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

function findNearby() {
  if (!navigator.geolocation) {
    showToast("GPS ist in diesem Browser nicht verfügbar.");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const userPoint = { lat: position.coords.latitude, lng: position.coords.longitude };
    const nearest = demoCourses
      .map((course) => ({ ...course, distance: distanceKm(userPoint, course) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    state.nearbyIds = new Set(nearest.map((course) => course.id));
    state.courses = nearest;
    state.selectedId = null;
    renderDemoMarkers();
    renderAlbum();
    showToast(`${nearest.length} Golfplätze in deiner Nähe sortiert.`);
  }, () => showToast("GPS-Freigabe wurde nicht erteilt."));
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function setupPanZoom() {
  let pointer = null;
  let offset = { x: 0, y: 0 };
  let zoom = 1;

  els.demoMap.addEventListener("pointerdown", (event) => {
    pointer = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    els.demoMap.setPointerCapture(event.pointerId);
  });

  els.demoMap.addEventListener("pointermove", (event) => {
    if (!pointer) return;
    offset = {
      x: Math.max(-260, Math.min(260, event.clientX - pointer.x)),
      y: Math.max(-260, Math.min(260, event.clientY - pointer.y))
    };
    els.mapCanvas.style.translate = `${offset.x}px ${offset.y}px`;
  });

  els.demoMap.addEventListener("pointerup", () => {
    pointer = null;
  });

  els.demoMap.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoom = Math.max(.8, Math.min(2.1, zoom + (event.deltaY > 0 ? -.08 : .08)));
    els.mapCanvas.style.setProperty("--zoom", zoom);
  }, { passive: false });
}

function setupViews() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode-button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const view = button.dataset.view;
      els.albumPanel.classList.toggle("visible", view === "album" || view === "nearby");
      els.sheet.classList.toggle("open", view === "map" && Boolean(state.selectedId));
      if (view === "nearby") findNearby();
    });
  });
}

function setupAccount() {
  els.accountButton.addEventListener("click", () => {
    if (!config.googleOAuthClientId) {
      state.user = { name: "Demo Golfer" };
      localStorage.setItem(`${storageKey}-user`, JSON.stringify(state.user));
      showToast("Demo-Profil aktiv. Google Client ID in app-config.js eintragen für echten Login.");
      return;
    }
    showToast("Google Login wird geladen.");
    loadGoogleIdentity();
  });
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    initGoogleIdentity();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = initGoogleIdentity;
  document.head.appendChild(script);
}

function initGoogleIdentity() {
  google.accounts.id.initialize({
    client_id: config.googleOAuthClientId,
    callback: (response) => {
      state.user = { credential: response.credential, name: "Google Nutzer" };
      localStorage.setItem(`${storageKey}-user`, JSON.stringify(state.user));
      showToast("Mit Google angemeldet.");
    }
  });
  google.accounts.id.prompt();
}

function loadGoogleMaps() {
  if (!config.googleMapsApiKey) return;
  window.initGolfGoogleMap = initGoogleMap;
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.googleMapsApiKey)}&libraries=places,marker&callback=initGolfGoogleMap&v=weekly`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function initGoogleMap() {
  state.googleReady = true;
  els.demoMap.hidden = true;
  els.googleMap.hidden = false;
  state.googleMap = new google.maps.Map(els.googleMap, {
    center: { lat: 49.8, lng: 9.2 },
    zoom: 5,
    mapId: "GOLF_PASSPORT_MAP",
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false
  });
  updateGoogleMarkers();
  state.googleMap.addListener("idle", searchVisibleGolfCourses);
}

function updateGoogleMarkers() {
  if (!state.googleReady || !google.maps.marker) return;
  state.markers.forEach((marker) => marker.map = null);
  state.markers.clear();
  state.courses.forEach((course) => {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `course-marker ${state.visited.has(course.id) ? "visited" : ""} ${state.selectedId === course.id ? "active" : ""}`;
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: state.googleMap,
      position: { lat: course.lat, lng: course.lng },
      title: course.name,
      content: pin
    });
    marker.addListener("click", () => selectCourse(course.id));
    state.markers.set(course.id, marker);
  });
}

function searchVisibleGolfCourses() {
  if (!state.googleReady || !google.maps.places) return;
  const center = state.googleMap.getCenter();
  const service = new google.maps.places.PlacesService(state.googleMap);
  service.nearbySearch({
    location: center,
    radius: 50000,
    keyword: "golf course"
  }, (results, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK || !results) return;
    const googleCourses = mapGooglePlaces(results);
    state.courses = mergeCourses(demoCourses, googleCourses);
    renderAlbum();
    updateGoogleMarkers();
  });
}

function searchGolfCoursesByText(term) {
  if (!state.googleReady || !google.maps.places) return;
  const service = new google.maps.places.PlacesService(state.googleMap);
  service.textSearch({
    query: `golf course ${term} Europe`
  }, (results, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
      showToast("Google Places hat keine Plätze für diese Suche gefunden.");
      return;
    }
    const googleCourses = mapGooglePlaces(results);
    state.courses = mergeCourses(state.courses, googleCourses);
    if (googleCourses[0]) {
      state.googleMap.panTo({ lat: googleCourses[0].lat, lng: googleCourses[0].lng });
      state.googleMap.setZoom(10);
    }
    closeSheet();
    renderAlbum();
  });
}

function mapGooglePlaces(results) {
  return results.slice(0, 30).map((place) => ({
    id: place.place_id,
    name: place.name,
    country: "Google Places",
    region: place.formatted_address || place.vicinity || "Europa",
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
    holes: 18,
    rating: place.rating,
    note: place.formatted_address || place.vicinity || "Gefunden über Google Places"
  }));
}

function boot() {
  setupPanZoom();
  setupViews();
  setupAccount();
  els.search.addEventListener("input", (event) => filterCourses(event.target.value));
  els.nearbyButton.addEventListener("click", findNearby);
  renderDemoMarkers();
  renderAlbum();
  loadGoogleMaps();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

boot();
