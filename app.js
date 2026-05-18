const storageKey = "golf-passport-v2";
const overpassEndpoint = "https://overpass-api.de/api/interpreter";
const europeBounds = [[34.5, -11.5], [71.5, 41.5]];

const demoCourses = [
  { id: "demo-golfclub-hannover", name: "Golfclub Hannover", country: "Deutschland", region: "Hannover / Garbsen", lat: 52.433, lng: 9.629, holes: 27, rating: 4.5, note: "Demo-Eintrag fuer die Suche rund um Hannover" },
  { id: "demo-golf-gleidingen", name: "Golf Gleidingen", country: "Deutschland", region: "Hannover / Laatzen", lat: 52.291, lng: 9.828, holes: 27, rating: 4.4, note: "Golfanlage suedlich von Hannover" },
  { id: "demo-st-andrews", name: "St Andrews Links", country: "Schottland", region: "Fife", lat: 56.343, lng: -2.803, holes: 18, rating: 4.9, note: "Historischer Links-Klassiker am Meer" },
  { id: "demo-valderrama", name: "Real Club Valderrama", country: "Spanien", region: "Sotogrande", lat: 36.286, lng: -5.302, holes: 18, rating: 4.8, note: "Ryder-Cup-Geschichte in Andalusien" },
  { id: "demo-le-golf-national", name: "Le Golf National", country: "Frankreich", region: "Paris", lat: 48.752, lng: 2.076, holes: 18, rating: 4.7, note: "Albatros Course mit Stadion-Feeling" },
  { id: "demo-gut-laerchenhof", name: "Gut Laerchenhof", country: "Deutschland", region: "Koeln", lat: 50.944, lng: 6.735, holes: 18, rating: 4.6, note: "Jack-Nicklaus-Platz bei Koeln" },
  { id: "demo-crans-sur-sierre", name: "Crans-sur-Sierre", country: "Schweiz", region: "Wallis", lat: 46.309, lng: 7.463, holes: 18, rating: 4.7, note: "Alpenkulisse der Omega European Masters" },
  { id: "demo-monte-rei", name: "Monte Rei Golf", country: "Portugal", region: "Algarve", lat: 37.201, lng: -7.538, holes: 18, rating: 4.8, note: "Jack-Nicklaus-Design mit weitem Blick" }
];

const state = {
  allCourses: demoCourses,
  courses: demoCourses,
  visited: new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")),
  selectedId: null,
  searchQuery: "",
  nearbyIds: new Set(),
  map: null,
  markers: new Map(),
  fetchTimer: null,
  searchTimer: null,
  user: JSON.parse(localStorage.getItem(`${storageKey}-user`) || "null")
};

const els = {
  map: document.querySelector("#leafletMap"),
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

function boot() {
  initMap();
  setupViews();
  setupAccount();
  els.search.addEventListener("input", (event) => filterCourses(event.target.value));
  els.nearbyButton.addEventListener("click", findNearby);
  renderCourses(demoCourses);
  renderAlbum();
  fetchVisibleGolfCourses();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

function initMap() {
  state.map = L.map(els.map, {
    zoomControl: false,
    maxBounds: europeBounds,
    maxBoundsViscosity: 0.45
  }).setView([50.8, 9.8], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(state.map);

  L.control.zoom({ position: "bottomleft" }).addTo(state.map);
  state.map.on("moveend", scheduleVisibleFetch);
}

function scheduleVisibleFetch() {
  window.clearTimeout(state.fetchTimer);
  state.fetchTimer = window.setTimeout(fetchVisibleGolfCourses, 700);
}

function renderCourses(courses) {
  state.courses = courses;
  state.markers.forEach((marker) => marker.remove());
  state.markers.clear();

  courses.forEach((course) => {
    if (!Number.isFinite(course.lat) || !Number.isFinite(course.lng)) return;
    const marker = L.marker([course.lat, course.lng], {
      icon: makeCourseIcon(course)
    }).addTo(state.map);
    marker.on("click", () => selectCourse(course.id));
    state.markers.set(course.id, marker);
  });
}

function makeCourseIcon(course) {
  const classes = [
    "leaflet-course-marker",
    state.visited.has(course.id) ? "visited" : "",
    state.selectedId === course.id ? "active" : ""
  ].filter(Boolean).join(" ");

  return L.divIcon({
    className: "",
    html: `<button class="${classes}" type="button" aria-label="${escapeHtml(course.name)}"></button>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

function selectCourse(id) {
  const course = findCourse(id);
  if (!course) return;
  state.selectedId = id;
  renderCourses(state.courses);
  renderSheet(course);
}

function findCourse(id) {
  return mergeCourses(state.allCourses, state.courses).find((course) => course.id === id);
}

function renderSheet(course) {
  const visited = state.visited.has(course.id);
  els.sheetContent.innerHTML = `
    <h3>${escapeHtml(course.name)}</h3>
    <p>${escapeHtml(course.note || "Golfplatz aus OpenStreetMap")}</p>
    <div class="course-meta">
      <span>${escapeHtml(course.country || "Europa")}</span>
      <span>${escapeHtml(course.region || "OpenStreetMap")}</span>
      <span>${course.holes || "?"} Loch</span>
      <span>${course.rating ? `${course.rating.toFixed(1)} ★` : "OSM"}</span>
    </div>
    <div class="action-row">
      <button class="primary-action" id="pinCourse" type="button">${visited ? "Sticker loesen" : "Anpinnen"}</button>
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
  renderCourses(state.courses);
}

function toggleVisited(id) {
  if (state.visited.has(id)) {
    state.visited.delete(id);
  } else {
    state.visited.add(id);
  }
  localStorage.setItem(storageKey, JSON.stringify([...state.visited]));
  renderAlbum();
  selectCourse(id);
}

function renderAlbum() {
  const knownCourses = mergeCourses(state.allCourses, state.courses);
  const visibleCourses = state.searchQuery ? state.courses : knownCourses;
  const visitedCourses = knownCourses.filter((course) => state.visited.has(course.id));
  const countries = new Set(visitedCourses.map((course) => course.country).filter(Boolean));
  const completion = knownCourses.length ? Math.round((visitedCourses.length / knownCourses.length) * 100) : 0;

  els.albumTitle.textContent = `${visitedCourses.length} Plaetze angepinnt`;
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
      <h3>${escapeHtml(course.name)}</h3>
      <p>${escapeHtml(course.country || "Europa")} · ${escapeHtml(course.region || "OpenStreetMap")}</p>
    `;
    sticker.addEventListener("click", () => selectCourse(course.id));
    els.stickerGrid.appendChild(sticker);
  });
}

function filterCourses(term) {
  const query = term.trim().toLowerCase();
  state.searchQuery = query;
  window.clearTimeout(state.searchTimer);

  if (!query) {
    const visibleCourses = coursesInCurrentBounds(state.allCourses);
    closeSheet();
    renderCourses(visibleCourses.length ? visibleCourses : demoCourses);
    renderAlbum();
    return;
  }

  const localResults = state.allCourses.filter((course) => courseMatches(course, query));
  closeSheet();
  renderCourses(localResults);
  renderAlbum();

  if (query.length >= 3) {
    state.searchTimer = window.setTimeout(() => searchOverpass(term), 450);
  }
}

function courseMatches(course, query) {
  return `${course.name} ${course.country || ""} ${course.region || ""} ${course.note || ""}`.toLowerCase().includes(query);
}

async function fetchVisibleGolfCourses() {
  if (!state.map || state.searchQuery) return;
  const bounds = state.map.getBounds();
  if (state.map.getZoom() < 7) {
    renderCourses(state.allCourses);
    renderAlbum();
    return;
  }

  try {
    const courses = await fetchOverpassCourses(boundsToBbox(bounds));
    state.allCourses = mergeCourses(state.allCourses, courses);
    renderCourses(courses.length ? courses : coursesInCurrentBounds(state.allCourses));
    renderAlbum();
  } catch {
    showToast("OpenStreetMap-Suche gerade nicht erreichbar. Demo-Daten bleiben sichtbar.");
  }
}

async function searchOverpass(term) {
  try {
    const safeTerm = escapeOverpassRegex(term.trim());
    const bbox = "34.5,-11.5,71.5,41.5";
    const query = `
      [out:json][timeout:25];
      (
        nwr["leisure"="golf_course"]["name"~"${safeTerm}",i](${bbox});
        nwr["sport"="golf"]["name"~"${safeTerm}",i](${bbox});
        nwr["leisure"="golf_course"]["addr:city"~"${safeTerm}",i](${bbox});
        nwr["sport"="golf"]["addr:city"~"${safeTerm}",i](${bbox});
      );
      out center tags 60;
    `;
    const courses = await runOverpass(query);
    const merged = mergeCourses(state.allCourses, courses);
    state.allCourses = merged;
    state.courses = merged.filter((course) => courseMatches(course, state.searchQuery));
    if (state.courses.length === 0) {
      showToast("Keine OpenStreetMap-Treffer gefunden.");
    } else {
      renderCourses(state.courses);
      fitCourses(state.courses);
    }
    renderAlbum();
  } catch {
    showToast("Overpass-Suche ist gerade nicht erreichbar.");
  }
}

async function fetchOverpassCourses(bbox) {
  const query = `
    [out:json][timeout:20];
    (
      nwr["leisure"="golf_course"](${bbox});
      nwr["sport"="golf"](${bbox});
    );
    out center tags 80;
  `;
  return runOverpass(query);
}

async function runOverpass(query) {
  const response = await fetch(overpassEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: query })
  });
  if (!response.ok) throw new Error("Overpass request failed");
  const payload = await response.json();
  return payload.elements.map(osmElementToCourse).filter(Boolean);
}

function osmElementToCourse(element) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !tags.name) return null;

  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    country: tags["addr:country"] || "OpenStreetMap",
    region: tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || tags["addr:suburb"] || "Europa",
    lat,
    lng,
    holes: Number.parseInt(tags.holes || tags["golf:holes"], 10) || undefined,
    rating: undefined,
    note: tags.website ? `Website: ${tags.website}` : "Gefunden in OpenStreetMap"
  };
}

function findNearby() {
  if (!navigator.geolocation) {
    showToast("GPS ist in diesem Browser nicht verfuegbar.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const userPoint = { lat: position.coords.latitude, lng: position.coords.longitude };
    const radiusKm = 75;
    const nearbyBounds = pointToBounds(userPoint, radiusKm);

    try {
      const osmCourses = await fetchOverpassCourses(boundsToBbox(nearbyBounds));
      state.allCourses = mergeCourses(state.allCourses, osmCourses);
    } catch {
      showToast("Live-Suche nicht erreichbar. Ich nutze bekannte Plaetze.");
    }

    const nearest = state.allCourses
      .map((course) => ({ ...course, distance: distanceKm(userPoint, course) }))
      .filter((course) => course.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    state.nearbyIds = new Set(nearest.map((course) => course.id));
    state.searchQuery = "";
    closeSheet();
    renderCourses(nearest);
    renderAlbum();
    fitCourses(nearest);
    showToast(`${nearest.length} Golfplaetze in deiner Naehe gefunden.`);
  }, () => showToast("GPS-Freigabe wurde nicht erteilt."));
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
    state.user = state.user ? null : { name: "Lokales Profil" };
    if (state.user) {
      localStorage.setItem(`${storageKey}-user`, JSON.stringify(state.user));
      showToast("Lokales Profil aktiv. Deine Sticker bleiben in diesem Browser gespeichert.");
    } else {
      localStorage.removeItem(`${storageKey}-user`);
      showToast("Lokales Profil abgemeldet.");
    }
    updateAccountButton();
  });
  updateAccountButton();
}

function updateAccountButton() {
  els.accountButton.classList.toggle("signed-in", Boolean(state.user));
  els.accountButton.setAttribute("aria-label", state.user ? "Lokales Profil aktiv" : "Lokales Profil aktivieren");
}

function navigateTo(course) {
  const destination = encodeURIComponent(`${course.lat},${course.lng}`);
  window.open(`https://www.openstreetmap.org/directions?to=${destination}`, "_blank", "noopener");
}

function fitCourses(courses) {
  if (!courses.length) return;
  const bounds = L.latLngBounds(courses.map((course) => [course.lat, course.lng]));
  state.map.fitBounds(bounds.pad(0.18), { maxZoom: 12 });
}

function coursesInCurrentBounds(courses) {
  if (!state.map) return courses;
  const bounds = state.map.getBounds().pad(0.25);
  return courses.filter((course) => bounds.contains([course.lat, course.lng]));
}

function mergeCourses(...groups) {
  return [...new Map(groups.flat().map((course) => [course.id, course])).values()];
}

function boundsToBbox(bounds) {
  if (Array.isArray(bounds)) {
    return `${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`;
  }
  return `${bounds.getSouth().toFixed(5)},${bounds.getWest().toFixed(5)},${bounds.getNorth().toFixed(5)},${bounds.getEast().toFixed(5)}`;
}

function pointToBounds(point, radiusKm) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(point.lat * Math.PI / 180));
  return [[point.lat - latDelta, point.lng - lngDelta], [point.lat + latDelta, point.lng + lngDelta]];
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

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeOverpassRegex(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/"/g, '\\"');
}

boot();
