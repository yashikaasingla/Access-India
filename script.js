/* ==========================================================
   AccessIndia — script.js   (vanilla JavaScript, no libraries)

   Contents
   1. Data          — places, facilities, categories, access needs
   2. Helpers       — small utilities used everywhere
   3. Scoring       — turns facility data into an accessibility score
   4. Navigation    — switching between the four views
   5. Rendering     — category cards, filter chips, place cards, map pins
   6. Search & filters
   7. Place detail modal
   8. AI assistant  — simulated, rule-based replies
   9. Voice input   — Web Speech API (speech to text)
  10. Read aloud    — speechSynthesis (text to speech)
  11. Accessibility settings
  12. Start-up
   ========================================================== */

/* ---------------------------------------------------------
   1. DATA
   --------------------------------------------------------- */

/* The seven facility checks every place is measured against.
   Keeping one shared list means every card, filter and answer
   uses exactly the same vocabulary. */
var FACILITIES = [
  { key: "wheelchair", label: "Wheelchair access",   short: "Wheelchair", icon: "\u267F" },
  { key: "ramp",       label: "Ramp at entrance",    short: "Ramp",       icon: "\u2197" },
  { key: "elevator",   label: "Elevator / lift",     short: "Elevator",   icon: "\u2B0D" },
  { key: "washroom",   label: "Accessible washroom", short: "Washroom",   icon: "\u{1F6BB}" },
  { key: "parking",    label: "Wheelchair parking",  short: "Parking",    icon: "\u{1F17F}" },
  { key: "visual",     label: "Visual assistance",   short: "Visual help",icon: "\u{1F441}" },
  { key: "hearing",    label: "Hearing assistance",  short: "Hearing help", icon: "\u{1F442}" }
];

var CATEGORIES = [
  { key: "hospital",  name: "Hospitals",    emoji: "\u{1F3E5}" },
  { key: "school",    name: "Schools",      emoji: "\u{1F392}" },
  { key: "college",   name: "Colleges",     emoji: "\u{1F393}" },
  { key: "restaurant",name: "Restaurants",  emoji: "\u{1F37D}" },
  { key: "hotel",     name: "Hotels",       emoji: "\u{1F3E8}" },
  { key: "transport", name: "Transport",    emoji: "\u{1F687}" },
  { key: "public",    name: "Public places",emoji: "\u{1F3DB}" },
  { key: "toilet",    name: "Public toilets", emoji: "\u{1F6BB}" }
];

/* Access needs used by the filter chips.
   all  = every listed facility must be available
   any  = at least one of these must be available
   show = which facilities to surface first on the card */
var NEEDS = [
  {
    key: "wheelchair", name: "Wheelchair user", emoji: "\u267F",
    all: ["wheelchair", "ramp"], any: [],
    show: ["wheelchair", "ramp", "elevator", "washroom", "parking"],
    line: "Step-free entry, ramps and accessible washrooms shown first."
  },
  {
    key: "visual", name: "Visual impairment", emoji: "\u{1F9AF}",
    all: ["visual"], any: [],
    show: ["visual", "hearing", "elevator"],
    line: "Tactile paving, braille signage, audio guidance and voice support."
  },
  {
    key: "hearing", name: "Hearing impairment", emoji: "\u{1F9CF}",
    all: ["hearing"], any: [],
    show: ["hearing", "visual"],
    line: "Visual alerts, display boards and sign-language or written support."
  },
  {
    key: "elderly", name: "Elderly friendly", emoji: "\u{1F9D3}",
    all: ["washroom"], any: ["elevator", "ramp"],
    show: ["elevator", "ramp", "washroom", "parking"],
    line: "Lifts, gentle entrances, seating areas and nearby parking."
  }
];

/* Sample places. x / y are percentage positions on the CSS map. */
var PLACES = [
  {
    id: "city-care-hospital",
    name: "City Care Hospital",
    category: "hospital",
    address: "Model Town Road, Sector 14, Sonipat",
    hours: "Open 24 hours",
    phone: "0130-244 1100",
    emergency: "Ambulance 108 · Hospital emergency desk 0130-244 1111",
    x: 20, y: 16,
    verified: "March 2026, by the AccessIndia volunteer team",
    facilities: { wheelchair: true, ramp: true, elevator: true, washroom: true, parking: true, visual: true, hearing: false },
    notes: {
      ramp: "Ramp at the main and emergency entrances, gradient 1:12.",
      elevator: "Three lifts with braille buttons and voice floor announcements.",
      washroom: "Accessible washrooms on the ground and second floors.",
      visual: "Tactile path from the gate to reception; staff assistance on request.",
      hearing: "No sign-language interpreter on site. Written communication available at the desk."
    }
  },
  {
    id: "government-college",
    name: "Government College",
    category: "college",
    address: "College Road, Civil Lines, Sonipat",
    hours: "Mon–Sat, 8:00 am – 5:00 pm",
    phone: "0130-223 7788",
    emergency: "Campus security 0130-223 7700",
    x: 44, y: 30,
    verified: "February 2026, by student volunteers",
    facilities: { wheelchair: true, ramp: true, elevator: false, washroom: true, parking: true, visual: false, hearing: false },
    notes: {
      elevator: "No lift. Classes for students with mobility needs are scheduled on the ground floor.",
      ramp: "Ramps at the administrative block and the library entrance.",
      washroom: "One accessible washroom near the main block.",
      visual: "No tactile paving or braille signage yet. Reported as a pending request."
    }
  },
  {
    id: "central-library",
    name: "Central Library",
    category: "public",
    address: "Nehru Park Road, Sonipat",
    hours: "Daily, 9:00 am – 8:00 pm",
    phone: "0130-221 4455",
    emergency: "Front desk 0130-221 4455",
    x: 66, y: 62,
    verified: "January 2026, by the district administration",
    facilities: { wheelchair: true, ramp: true, elevator: true, washroom: true, parking: false, visual: true, hearing: false },
    notes: {
      visual: "Braille section, screen-reader terminals and large-print books on the first floor.",
      elevator: "One lift with audio announcements serving all three floors.",
      parking: "No reserved wheelchair parking. Street parking is 60 m away."
    }
  },
  {
    id: "civic-metro",
    name: "Civic Centre Metro Station",
    category: "transport",
    address: "GT Road, near Civic Centre, Sonipat",
    hours: "Daily, 5:30 am – 11:30 pm",
    phone: "155370 (metro helpline)",
    emergency: "Station controller 0130-220 9000 · Emergency 112",
    x: 78, y: 22,
    verified: "April 2026, by the metro accessibility audit",
    facilities: { wheelchair: true, ramp: true, elevator: true, washroom: true, parking: true, visual: true, hearing: true },
    notes: {
      elevator: "Two lifts from street level to the concourse and platform.",
      visual: "Tactile paving throughout, braille on lift panels, audio announcements.",
      hearing: "Visual display boards on every platform and flashing emergency alerts.",
      washroom: "Accessible washroom on the concourse level."
    }
  },
  {
    id: "spice-route",
    name: "Spice Route Restaurant",
    category: "restaurant",
    address: "Sector 15 Market, Sonipat",
    hours: "Daily, 11:00 am – 11:00 pm",
    phone: "098765 43210",
    emergency: "Emergency 112",
    x: 32, y: 66,
    verified: "March 2026, reported by three visitors",
    facilities: { wheelchair: true, ramp: true, elevator: false, washroom: false, parking: false, visual: false, hearing: false },
    notes: {
      ramp: "Portable ramp at the entrance. Staff set it up on request.",
      washroom: "Washroom doorway is 58 cm wide and not wheelchair accessible.",
      elevator: "Single-floor restaurant, so no lift is needed."
    }
  },
  {
    id: "ganga-residency",
    name: "Hotel Ganga Residency",
    category: "hotel",
    address: "Delhi Road, opposite bus stand, Sonipat",
    hours: "Reception open 24 hours",
    phone: "0130-225 6600",
    emergency: "Reception 0130-225 6600 · Emergency 112",
    x: 58, y: 42,
    verified: "February 2026, by the hotel management",
    facilities: { wheelchair: true, ramp: true, elevator: true, washroom: true, parking: true, visual: false, hearing: true },
    notes: {
      washroom: "Two accessible rooms with roll-in showers and grab bars.",
      hearing: "Vibrating alarm clocks and flashing fire alerts in accessible rooms.",
      visual: "No braille room numbers yet."
    }
  },
  {
    id: "sector12-toilet",
    name: "Public Toilet, Sector 12",
    category: "toilet",
    address: "Sector 12 main market, Sonipat",
    hours: "Daily, 6:00 am – 10:00 pm",
    phone: "Municipal helpline 0130-223 0000",
    emergency: "Municipal helpline 0130-223 0000",
    x: 14, y: 46,
    verified: "January 2026, by the municipal corporation",
    facilities: { wheelchair: true, ramp: true, elevator: false, washroom: true, parking: false, visual: false, hearing: false },
    notes: {
      washroom: "One accessible cubicle with grab bars and an emergency cord.",
      elevator: "Single-level facility, no lift required."
    }
  },
  {
    id: "nehru-park",
    name: "Nehru City Park",
    category: "public",
    address: "Nehru Park Road, Sonipat",
    hours: "Daily, 5:00 am – 9:00 pm",
    phone: "Park office 0130-224 1200",
    emergency: "Park office 0130-224 1200 · Emergency 112",
    x: 62, y: 74,
    verified: "March 2026, by the horticulture department",
    facilities: { wheelchair: true, ramp: true, elevator: false, washroom: true, parking: true, visual: false, hearing: false },
    notes: {
      wheelchair: "Paved loop path, 1.8 m wide, suitable for wheelchairs and walkers.",
      washroom: "Accessible washroom near gate 2.",
      elevator: "Open ground-level park, no lift needed.",
      visual: "No tactile guidance path. A sensory garden is planned."
    }
  },
  {
    id: "sunrise-school",
    name: "Sunrise Public School",
    category: "school",
    address: "Sector 23, Sonipat",
    hours: "Mon–Fri, 7:30 am – 2:30 pm",
    phone: "0130-226 3344",
    emergency: "School office 0130-226 3344",
    x: 36, y: 12,
    verified: "February 2026, by the school administration",
    facilities: { wheelchair: true, ramp: true, elevator: false, washroom: true, parking: true, visual: false, hearing: true },
    notes: {
      hearing: "Two teachers trained in Indian Sign Language; classrooms use visual bells.",
      elevator: "Two-storey building without a lift. Accessible classrooms are on the ground floor."
    }
  },
  {
    id: "bus-terminal",
    name: "District Bus Terminal",
    category: "transport",
    address: "Delhi Road, Sonipat",
    hours: "Daily, 4:00 am – 12:00 am",
    phone: "0130-222 5050",
    emergency: "Terminal control 0130-222 5050 · Emergency 112",
    x: 50, y: 86,
    verified: "April 2026, by the transport department",
    facilities: { wheelchair: true, ramp: true, elevator: false, washroom: true, parking: true, visual: false, hearing: true },
    notes: {
      ramp: "Ramps to all three boarding bays.",
      hearing: "Digital departure boards at every bay.",
      visual: "Announcements are audio only; tactile paving is not installed yet.",
      elevator: "Single-level terminal, no lift required."
    }
  }
];

/* ---------------------------------------------------------
   2. HELPERS
   --------------------------------------------------------- */
function $(id) { return document.getElementById(id); }

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) { node.className = className; }
  if (text !== undefined) { node.textContent = text; }
  return node;
}

function facilityByKey(key) {
  for (var i = 0; i < FACILITIES.length; i++) {
    if (FACILITIES[i].key === key) { return FACILITIES[i]; }
  }
  return null;
}

function categoryName(key) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) { return CATEGORIES[i].name; }
  }
  return key;
}

function categoryEmoji(key) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) { return CATEGORIES[i].emoji; }
  }
  return "\u{1F4CD}";
}

function placeById(id) {
  for (var i = 0; i < PLACES.length; i++) {
    if (PLACES[i].id === id) { return PLACES[i]; }
  }
  return null;
}

/* Announce something to screen readers, and show a short on-screen toast. */
var toastTimer = null;
function announce(message, showToast) {
  var live = $("live-region");
  if (live) { live.textContent = message; }
  if (showToast) {
    var toast = $("toast");
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 3200);
  }
}

/* ---------------------------------------------------------
   3. SCORING
   --------------------------------------------------------- */
function scoreOf(place) {
  var available = 0;
  for (var i = 0; i < FACILITIES.length; i++) {
    if (place.facilities[FACILITIES[i].key]) { available++; }
  }
  return Math.round((available / FACILITIES.length) * 100);
}

function scoreLabel(score) {
  if (score >= 85) { return "Fully accessible"; }
  if (score >= 60) { return "Mostly accessible"; }
  if (score >= 35) { return "Partly accessible"; }
  return "Limited access";
}

function scoreClass(score) {
  if (score >= 70) { return "score-high"; }
  if (score >= 40) { return "score-mid"; }
  return "score-low";
}

/* Does a place satisfy the selected access needs? */
function matchesNeed(place, need) {
  var i;
  for (i = 0; i < need.all.length; i++) {
    if (!place.facilities[need.all[i]]) { return false; }
  }
  if (need.any.length > 0) {
    var oneFound = false;
    for (i = 0; i < need.any.length; i++) {
      if (place.facilities[need.any[i]]) { oneFound = true; }
    }
    if (!oneFound) { return false; }
  }
  return true;
}

/* ---------------------------------------------------------
   APPLICATION STATE
   --------------------------------------------------------- */
var state = {
  view: "home",
  query: "",
  needs: [],          // selected access-need keys
  category: "all",    // Explore view category filter
  selectedId: null
};

/* ---------------------------------------------------------
   4. NAVIGATION
   --------------------------------------------------------- */
var VIEWS = ["home", "map", "explore", "assistant"];

function showView(name) {
  if (VIEWS.indexOf(name) === -1) { name = "home"; }
  state.view = name;

  VIEWS.forEach(function (v) {
    var section = $("view-" + v);
    if (section) { section.hidden = (v !== name); }
  });

  var navButtons = document.querySelectorAll(".nav-btn");
  for (var i = 0; i < navButtons.length; i++) {
    var isActive = navButtons[i].getAttribute("data-view") === name;
    navButtons[i].classList.toggle("is-active", isActive);
    if (isActive) {
      navButtons[i].setAttribute("aria-current", "page");
    } else {
      navButtons[i].removeAttribute("aria-current");
    }
  }

  // Close the mobile menu after navigating
  $("site-nav").classList.remove("is-open");
  $("menu-toggle").setAttribute("aria-expanded", "false");

  window.scrollTo({ top: 0, behavior: "auto" });

  // Move focus to the new view's heading so screen readers follow along
  var heading = $("view-" + name).querySelector("h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
  announce(heading ? heading.textContent + " page opened" : name + " opened", false);
}

function wireNavigation() {
  // Any element with data-view acts as a link to that view
  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-view]");
    if (trigger) { showView(trigger.getAttribute("data-view")); }
  });

  $("menu-toggle").addEventListener("click", function () {
    var nav = $("site-nav");
    var open = nav.classList.toggle("is-open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/* ---------------------------------------------------------
   5. RENDERING
   --------------------------------------------------------- */

/* --- facility pills shown on a card --- */
function buildFacilityRow(place, keys) {
  var row = el("div", "facility-row");
  keys.forEach(function (key) {
    var facility = facilityByKey(key);
    if (!facility) { return; }
    var has = !!place.facilities[key];
    var pill = el("span", "fac " + (has ? "fac-yes" : "fac-no"));
    var mark = el("span", "fac-mark", has ? "\u2713" : "\u2715");
    mark.setAttribute("aria-hidden", "true");
    pill.appendChild(mark);
    pill.appendChild(document.createTextNode(facility.short));
    // Screen readers get the full sentence, not just a symbol
    pill.setAttribute("aria-label", facility.label + ": " + (has ? "available" : "not available"));
    row.appendChild(pill);
  });
  return row;
}

/* --- one place card (used on Home, Explore and the map results list) --- */
function buildPlaceCard(place) {
  var score = scoreOf(place);

  var card = el("button", "place-card");
  card.type = "button";
  card.setAttribute("data-place", place.id);
  card.setAttribute("aria-label",
    place.name + ", " + categoryName(place.category) +
    ", accessibility score " + score + " out of 100, " + scoreLabel(score) +
    ". Open full details.");

  var top = el("div", "place-top");
  var left = el("div");
  left.appendChild(el("div", "place-name", place.name));
  left.appendChild(el("div", "place-meta", categoryEmoji(place.category) + " " + categoryName(place.category) + " · " + place.address));
  top.appendChild(left);

  var badge = el("div", "score " + scoreClass(score));
  badge.setAttribute("aria-hidden", "true");
  badge.appendChild(el("span", "score-num", String(score)));
  badge.appendChild(el("span", "score-word", scoreLabel(score)));
  top.appendChild(badge);

  card.appendChild(top);

  // Which facilities to show depends on the selected access needs
  var keys = [];
  if (state.needs.length > 0) {
    state.needs.forEach(function (needKey) {
      var need = needByKey(needKey);
      need.show.forEach(function (k) { if (keys.indexOf(k) === -1) { keys.push(k); } });
    });
  } else {
    keys = ["wheelchair", "ramp", "elevator", "washroom"];
  }
  card.appendChild(buildFacilityRow(place, keys));

  if (state.needs.length > 0) {
    var needNames = state.needs.map(function (k) { return needByKey(k).name.toLowerCase(); });
    card.appendChild(el("p", "match-note", "Matches: " + needNames.join(" + ")));
  }

  return card;
}

function needByKey(key) {
  for (var i = 0; i < NEEDS.length; i++) {
    if (NEEDS[i].key === key) { return NEEDS[i]; }
  }
  return null;
}

/* --- home: categories --- */
function renderHomeCategories() {
  var wrap = $("home-categories");
  wrap.innerHTML = "";
  CATEGORIES.forEach(function (cat) {
    var count = PLACES.filter(function (p) { return p.category === cat.key; }).length;
    var card = el("button", "category-card");
    card.type = "button";
    card.setAttribute("data-category", cat.key);
    card.setAttribute("aria-label", cat.name + ", " + count + " places listed. Show on the map.");

    var emoji = el("span", "cat-emoji", cat.emoji);
    emoji.setAttribute("aria-hidden", "true");
    card.appendChild(emoji);
    card.appendChild(el("span", "cat-name", cat.name));
    card.appendChild(el("span", "cat-count", count === 1 ? "1 place" : count + " places"));

    card.addEventListener("click", function () {
      state.query = cat.name.replace(/s$/, "");
      $("search-input").value = state.query;
      showView("map");
      renderMapView();
    });
    wrap.appendChild(card);
  });
}

/* --- filter chips (shared by Home and Map) --- */
function renderNeedChips(container) {
  container.innerHTML = "";
  NEEDS.forEach(function (need) {
    var chip = el("button", "chip");
    chip.type = "button";
    chip.setAttribute("data-need", need.key);
    chip.setAttribute("aria-pressed", state.needs.indexOf(need.key) !== -1 ? "true" : "false");

    var emoji = el("span", "chip-emoji", need.emoji);
    emoji.setAttribute("aria-hidden", "true");
    chip.appendChild(emoji);
    chip.appendChild(document.createTextNode(need.name));

    chip.addEventListener("click", function () {
      toggleNeed(need.key);
      if (state.view !== "map") { showView("map"); }
    });
    container.appendChild(chip);
  });
}

function toggleNeed(key) {
  var index = state.needs.indexOf(key);
  if (index === -1) { state.needs.push(key); } else { state.needs.splice(index, 1); }

  renderNeedChips($("filter-bar"));
  renderNeedChips($("home-filters"));
  renderMapView();

  var need = needByKey(key);
  if (index === -1) {
    announce(need.name + " filter on. " + need.line, true);
  } else {
    announce(need.name + " filter off.", true);
  }
}

/* --- which places currently pass search + filters --- */
function visiblePlaces() {
  var query = state.query.trim().toLowerCase();

  return PLACES.filter(function (place) {
    // text search across name, category and address
    if (query) {
      var haystack = (place.name + " " + categoryName(place.category) + " " +
                      place.category + " " + place.address).toLowerCase();
      if (haystack.indexOf(query) === -1) { return false; }
    }
    // every selected access need must be satisfied
    for (var i = 0; i < state.needs.length; i++) {
      if (!matchesNeed(place, needByKey(state.needs[i]))) { return false; }
    }
    return true;
  });
}

/* --- map view: pins + results list --- */
function renderMapView() {
  var results = visiblePlaces();
  var visibleIds = results.map(function (p) { return p.id; });

  /* pins */
  var pinLayer = $("map-pins");
  pinLayer.innerHTML = "";
  PLACES.forEach(function (place) {
    var pin = el("button", "pin");
    pin.type = "button";
    pin.style.left = place.x + "%";
    pin.style.top = place.y + "%";
    pin.setAttribute("data-place", place.id);

    var isVisible = visibleIds.indexOf(place.id) !== -1;
    if (!isVisible) { pin.classList.add("is-dimmed"); }
    if (place.id === state.selectedId) { pin.classList.add("is-selected"); }

    var dot = el("span", "pin-dot");
    var glyph = el("span", "", categoryEmoji(place.category));
    glyph.setAttribute("aria-hidden", "true");
    dot.appendChild(glyph);
    pin.appendChild(dot);
    pin.appendChild(el("span", "pin-name", place.name));

    pin.setAttribute("aria-label",
      place.name + ", " + categoryName(place.category) +
      (isVisible ? "" : ", does not match the current filters") +
      ". Open details.");

    pin.addEventListener("click", function () { openPlace(place.id); });
    pinLayer.appendChild(pin);
  });

  /* results list */
  var list = $("results-list");
  var head = $("results-count");
  list.innerHTML = "";

  if (results.length === 0) {
    head.textContent = "No matching places";
    var empty = el("div", "empty-state");
    empty.appendChild(el("h3", "", "Nothing matches yet"));
    empty.appendChild(el("p", "", "No listed place meets all of the selected needs. Try removing a filter or searching for a different category."));
    var reset = el("button", "btn btn-primary", "Clear search and filters");
    reset.type = "button";
    reset.addEventListener("click", clearAll);
    empty.appendChild(reset);
    list.appendChild(empty);
  } else {
    head.textContent = results.length === 1
      ? "1 place matches"
      : results.length + " places match";
    results.forEach(function (place) {
      var card = buildPlaceCard(place);
      if (place.id === state.selectedId) { card.classList.add("is-selected"); }
      card.addEventListener("click", function () { openPlace(place.id); });
      list.appendChild(card);
    });
  }
}

/* --- home: nearby places (top four by score) --- */
function renderHomePlaces() {
  var wrap = $("home-places");
  wrap.innerHTML = "";
  var sorted = PLACES.slice().sort(function (a, b) { return scoreOf(b) - scoreOf(a); });
  sorted.slice(0, 4).forEach(function (place) {
    var card = buildPlaceCard(place);
    card.addEventListener("click", function () { openPlace(place.id); });
    wrap.appendChild(card);
  });
}

/* --- explore view --- */
function renderExplore() {
  var chipWrap = $("explore-categories");
  chipWrap.innerHTML = "";

  var options = [{ key: "all", name: "All places", emoji: "\u{1F4CD}" }].concat(CATEGORIES);
  options.forEach(function (cat) {
    var chip = el("button", "chip");
    chip.type = "button";
    chip.setAttribute("aria-pressed", state.category === cat.key ? "true" : "false");
    var emoji = el("span", "chip-emoji", cat.emoji);
    emoji.setAttribute("aria-hidden", "true");
    chip.appendChild(emoji);
    chip.appendChild(document.createTextNode(cat.name));
    chip.addEventListener("click", function () {
      state.category = cat.key;
      renderExplore();
      announce(cat.name + " selected", false);
    });
    chipWrap.appendChild(chip);
  });

  var list = $("explore-list");
  list.innerHTML = "";
  var places = PLACES.filter(function (p) {
    return state.category === "all" || p.category === state.category;
  });

  $("explore-count").textContent = places.length === 1
    ? "1 place" : places.length + " places";

  places.forEach(function (place) {
    var card = buildPlaceCard(place);
    card.addEventListener("click", function () { openPlace(place.id); });
    list.appendChild(card);
  });
}

/* --- home statistics --- */
function renderStats() {
  var full = PLACES.filter(function (p) { return scoreOf(p) >= 85; }).length;
  $("stat-places").textContent = PLACES.length;
  $("stat-full").textContent = full;
  $("stat-checks").textContent = PLACES.length * FACILITIES.length;
}

/* ---------------------------------------------------------
   6. SEARCH & FILTERS
   --------------------------------------------------------- */
function runSearch() {
  state.query = $("search-input").value;
  state.selectedId = null;
  renderMapView();
  var count = visiblePlaces().length;
  announce(count === 0
    ? "No places found for " + (state.query || "your search")
    : count + " places found", true);
}

function clearAll() {
  state.query = "";
  state.needs = [];
  state.selectedId = null;
  $("search-input").value = "";
  renderNeedChips($("filter-bar"));
  renderNeedChips($("home-filters"));
  renderMapView();
  announce("Search and filters cleared", true);
}

function wireSearch() {
  $("search-btn").addEventListener("click", runSearch);
  $("search-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter") { event.preventDefault(); runSearch(); }
  });
  // live filtering as the user types
  $("search-input").addEventListener("input", function () {
    state.query = this.value;
    renderMapView();
  });
  $("clear-filters").addEventListener("click", clearAll);
}

/* ---------------------------------------------------------
   7. PLACE DETAIL MODAL
   --------------------------------------------------------- */
var lastFocused = null;

function openPlace(id) {
  var place = placeById(id);
  if (!place) { return; }

  state.selectedId = id;
  lastFocused = document.activeElement;

  $("dialog-title").textContent = place.name;
  $("dialog-body").innerHTML = "";
  $("dialog-body").appendChild(buildPlaceDetail(place));

  $("overlay").hidden = false;
  $("place-dialog").hidden = false;
  $("dialog-close").focus();

  if (state.view === "map") { renderMapView(); }
  announce(place.name + " details opened", false);
}

function closePlace() {
  stopReading();
  $("place-dialog").hidden = true;
  $("overlay").hidden = true;
  if (lastFocused && lastFocused.focus) { lastFocused.focus(); }
}

function buildPlaceDetail(place) {
  var frag = document.createDocumentFragment();
  var score = scoreOf(place);

  var head = el("div", "detail-head");
  var headLeft = el("div");
  headLeft.appendChild(el("p", "place-meta", categoryEmoji(place.category) + " " + categoryName(place.category)));
  headLeft.appendChild(el("p", "detail-address", place.address));
  head.appendChild(headLeft);

  var badge = el("div", "score " + scoreClass(score));
  badge.appendChild(el("span", "score-num", String(score)));
  badge.appendChild(el("span", "score-word", scoreLabel(score)));
  badge.setAttribute("aria-label", "Accessibility score " + score + " out of 100. " + scoreLabel(score) + ".");
  head.appendChild(badge);
  frag.appendChild(head);

  /* full facility list */
  var facSection = el("div", "detail-section");
  facSection.appendChild(el("h3", "", "Accessibility facilities"));
  var list = el("ul", "fac-list");

  FACILITIES.forEach(function (facility) {
    var has = !!place.facilities[facility.key];
    var item = el("li", has ? "yes" : "no");

    var icon = el("span", "fac-icon", has ? "\u2713" : "\u2715");
    icon.setAttribute("aria-hidden", "true");
    item.appendChild(icon);

    var textWrap = el("div", "fac-text");
    textWrap.appendChild(el("strong", "", facility.label));
    if (place.notes && place.notes[facility.key]) {
      textWrap.appendChild(el("span", "fac-note", place.notes[facility.key]));
    }
    item.appendChild(textWrap);

    item.appendChild(el("span", "fac-state", has ? "Available" : "Not available"));
    list.appendChild(item);
  });

  facSection.appendChild(list);
  frag.appendChild(facSection);

  /* practical information */
  var infoSection = el("div", "detail-section");
  infoSection.appendChild(el("h3", "", "Visiting information"));
  var grid = el("dl", "info-grid");

  [["Opening hours", place.hours],
   ["Contact", place.phone],
   ["Emergency", place.emergency]].forEach(function (pair) {
    var item = el("div", "info-item");
    item.appendChild(el("dt", "", pair[0]));
    item.appendChild(el("dd", "", pair[1]));
    grid.appendChild(item);
  });

  infoSection.appendChild(grid);
  frag.appendChild(infoSection);

  var strip = el("p", "verified-strip", "\u2713 Last checked " + place.verified);
  frag.appendChild(strip);

  return frag;
}

/* Plain-text version of a place, used by the read-aloud button. */
function placeToSpeech(place) {
  var score = scoreOf(place);
  var lines = [
    place.name + ". " + categoryName(place.category) + ".",
    "Address: " + place.address + ".",
    "Accessibility score: " + score + " out of 100. " + scoreLabel(score) + "."
  ];

  var available = [];
  var missing = [];
  FACILITIES.forEach(function (facility) {
    if (place.facilities[facility.key]) { available.push(facility.label); }
    else { missing.push(facility.label); }
  });

  if (available.length) { lines.push("Available: " + available.join(", ") + "."); }
  if (missing.length) { lines.push("Not available: " + missing.join(", ") + "."); }

  lines.push("Opening hours: " + place.hours + ".");
  lines.push("Contact: " + place.phone + ".");
  return lines.join(" ");
}

function wireModal() {
  $("dialog-close").addEventListener("click", closePlace);
  $("overlay").addEventListener("click", function () {
    closePlace();
    closeSettings();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (!$("place-dialog").hidden) { closePlace(); }
      else if (!$("a11y-panel").hidden) { closeSettings(); }
    }
    if (event.key === "Tab" && !$("place-dialog").hidden) {
      trapFocus(event, $("place-dialog"));
    }
  });
}

/* Keep Tab inside the open dialog. */
function trapFocus(event, container) {
  var focusable = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) { return; }
  var first = focusable[0];
  var last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
}

/* ---------------------------------------------------------
   8. AI ASSISTANT (simulated, rule-based)
   --------------------------------------------------------- */
var SUGGESTED_QUESTIONS = [
  "Does City Care Hospital have a wheelchair ramp?",
  "Where is the nearest accessible hospital?",
  "Is there an accessible washroom at the metro station?",
  "Does Government College have an elevator?",
  "How can a visually impaired person navigate the library?",
  "Which places are good for elderly visitors?"
];

/* Words that point at a facility. */
var FACILITY_WORDS = {
  ramp:       ["ramp", "slope", "step-free", "step free"],
  elevator:   ["elevator", "lift", "escalator"],
  washroom:   ["washroom", "toilet", "restroom", "bathroom"],
  wheelchair: ["wheelchair", "wheel chair", "mobility"],
  parking:    ["parking", "park my car", "car park"],
  visual:     ["blind", "visually", "vision", "braille", "tactile", "low vision", "see"],
  hearing:    ["deaf", "hearing", "sign language", "hard of hearing"]
};

function detectPlace(text) {
  var lower = text.toLowerCase();
  var best = null;

  // An exact name match always wins
  PLACES.forEach(function (place) {
    if (lower.indexOf(place.name.toLowerCase()) !== -1) { best = place; }
  });
  if (best) { return best; }

  // Otherwise match on a distinctive word from the name ("metro", "library")
  PLACES.forEach(function (place) {
    if (best) { return; }
    var words = place.name.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 4; });
    for (var i = 0; i < words.length; i++) {
      if (lower.indexOf(words[i]) !== -1) { best = place; return; }
    }
  });
  return best;
}

function detectFacility(text) {
  var lower = text.toLowerCase();
  var keys = Object.keys(FACILITY_WORDS);
  for (var i = 0; i < keys.length; i++) {
    var words = FACILITY_WORDS[keys[i]];
    for (var j = 0; j < words.length; j++) {
      if (lower.indexOf(words[j]) !== -1) { return keys[i]; }
    }
  }
  return null;
}

function detectCategory(text) {
  var lower = text.toLowerCase();
  var map = {
    hospital: ["hospital", "clinic", "doctor", "medical"],
    school: ["school"],
    college: ["college", "university"],
    restaurant: ["restaurant", "food", "eat", "cafe"],
    hotel: ["hotel", "stay", "room"],
    transport: ["metro", "station", "bus", "transport", "train"],
    public: ["library", "park", "public place", "museum"],
    toilet: ["public toilet", "sulabh"]
  };
  var keys = Object.keys(map);
  for (var i = 0; i < keys.length; i++) {
    for (var j = 0; j < map[keys[i]].length; j++) {
      if (lower.indexOf(map[keys[i]][j]) !== -1) { return keys[i]; }
    }
  }
  return null;
}

function bestInCategory(categoryKey) {
  var list = PLACES.filter(function (p) { return p.category === categoryKey; });
  list.sort(function (a, b) { return scoreOf(b) - scoreOf(a); });
  return list;
}

/* Builds the assistant's reply. Returns { text, placeId } */
function buildAnswer(question) {
  var lower = question.toLowerCase();
  var place = detectPlace(question);
  var facility = detectFacility(question);
  var category = detectCategory(question);

  /* "nearest accessible X" — recommend the best-scoring place in a category */
  var wantsNearest = /(nearest|closest|near me|where is|find|suggest|recommend|which place)/.test(lower);

  if (!place && wantsNearest && category) {
    var options = bestInCategory(category);
    if (options.length === 0) {
      return { text: "I don't have any " + categoryName(category).toLowerCase() + " listed yet in this prototype.", placeId: null };
    }
    var top = options[0];
    var answer = "The most accessible " + categoryName(category).toLowerCase().replace(/s$/, "") +
      " I have is " + top.name + " on " + top.address + ". Accessibility score " + scoreOf(top) +
      " out of 100 — " + scoreLabel(scoreOf(top)).toLowerCase() + ". " +
      availableSentence(top);
    if (options.length > 1) {
      answer += " Also listed: " + options.slice(1).map(function (p) { return p.name; }).join(", ") + ".";
    }
    return { text: answer, placeId: top.id };
  }

  /* "does <place> have <facility>?" */
  if (place && facility) {
    var has = !!place.facilities[facility];
    var facilityInfo = facilityByKey(facility);
    var reply = (has ? "Yes. " : "No. ") + place.name + " " +
      (has ? "has " : "does not have ") + facilityInfo.label.toLowerCase() + ".";
    if (place.notes && place.notes[facility]) { reply += " " + place.notes[facility]; }
    if (!has) {
      var alternative = findAlternative(place.category, facility, place.id);
      if (alternative) {
        reply += " Nearby alternative with this facility: " + alternative.name + ".";
      }
    }
    return { text: reply, placeId: place.id };
  }

  /* "tell me about <place>" */
  if (place) {
    return {
      text: place.name + " has an accessibility score of " + scoreOf(place) + " out of 100 — " +
        scoreLabel(scoreOf(place)).toLowerCase() + ". " + availableSentence(place) +
        " " + missingSentence(place) + " Open hours: " + place.hours + ".",
      placeId: place.id
    };
  }

  /* "which places suit elderly / wheelchair / deaf / blind visitors?" */
  if (facility || /elderly|senior|old age|wheelchair user/.test(lower)) {
    var needKey = facility === "visual" ? "visual"
      : facility === "hearing" ? "hearing"
      : /elderly|senior|old age/.test(lower) ? "elderly" : "wheelchair";
    var need = needByKey(needKey);
    var matches = PLACES.filter(function (p) { return matchesNeed(p, need); });
    matches.sort(function (a, b) { return scoreOf(b) - scoreOf(a); });
    if (matches.length === 0) {
      return { text: "No listed place currently meets every check for " + need.name.toLowerCase() + ".", placeId: null };
    }
    return {
      text: need.name + ": " + need.line + " " + matches.length + " listed places match — " +
        matches.slice(0, 4).map(function (p) { return p.name + " (" + scoreOf(p) + "/100)"; }).join(", ") +
        ". Open any of them for the full facility list.",
      placeId: matches[0].id
    };
  }

  /* greetings and thanks */
  if (/^(hi|hello|hey|namaste|good morning|good evening)/.test(lower)) {
    return { text: "Namaste. Ask me about ramps, lifts, accessible washrooms or how to reach a place, and I'll answer from the facility data we hold.", placeId: null };
  }
  if (/thank/.test(lower)) {
    return { text: "Happy to help. Safe travels.", placeId: null };
  }

  /* fallback */
  return {
    text: "I can answer questions about the " + PLACES.length + " places listed here — ramps, lifts, accessible washrooms, parking, visual and hearing support. Try asking something like “Does City Care Hospital have a lift?” or “Where is the nearest accessible hospital?”",
    placeId: null
  };
}

function availableSentence(place) {
  var available = FACILITIES.filter(function (f) { return place.facilities[f.key]; })
                            .map(function (f) { return f.label.toLowerCase(); });
  if (available.length === 0) { return "No facilities are confirmed yet."; }
  return "Available: " + available.join(", ") + ".";
}

function missingSentence(place) {
  var missing = FACILITIES.filter(function (f) { return !place.facilities[f.key]; })
                          .map(function (f) { return f.label.toLowerCase(); });
  if (missing.length === 0) { return "Every facility check passes here."; }
  return "Not available: " + missing.join(", ") + ".";
}

function findAlternative(categoryKey, facilityKey, excludeId) {
  var list = PLACES.filter(function (p) {
    return p.category === categoryKey && p.id !== excludeId && p.facilities[facilityKey];
  });
  if (list.length === 0) {
    list = PLACES.filter(function (p) { return p.id !== excludeId && p.facilities[facilityKey]; });
  }
  list.sort(function (a, b) { return scoreOf(b) - scoreOf(a); });
  return list[0] || null;
}

/* --- chat UI --- */
function addMessage(text, who) {
  var log = $("chat-log");
  var msg = el("div", "msg msg-" + who);
  msg.appendChild(el("p", "", text));
  log.appendChild(msg);
  log.scrollTop = log.scrollHeight;
  return msg;
}

function askAssistant(question) {
  if (!question || !question.trim()) { return; }
  addMessage(question, "user");
  $("chat-input").value = "";

  // A short "typing" pause makes the demo feel like a real assistant
  var typing = el("div", "msg msg-bot msg-typing");
  typing.textContent = "Checking accessibility data…";
  $("chat-log").appendChild(typing);
  $("chat-log").scrollTop = $("chat-log").scrollHeight;

  window.setTimeout(function () {
    typing.remove();
    var answer = buildAnswer(question);
    var node = addMessage(answer.text, "bot");

    if (answer.placeId) {
      var open = el("button", "suggestion", "Open " + placeById(answer.placeId).name);
      open.type = "button";
      open.style.marginTop = ".6rem";
      open.addEventListener("click", function () { openPlace(answer.placeId); });
      node.appendChild(open);
    }

    var speak = el("button", "suggestion", "Read answer aloud");
    speak.type = "button";
    speak.style.marginTop = ".6rem";
    speak.style.marginLeft = ".4rem";
    speak.addEventListener("click", function () { readAloud(answer.text); });
    node.appendChild(speak);

    $("chat-log").scrollTop = $("chat-log").scrollHeight;
  }, 550);
}

function renderSuggestions() {
  var wrap = $("chat-suggestions");
  wrap.innerHTML = "";
  SUGGESTED_QUESTIONS.forEach(function (question) {
    var btn = el("button", "suggestion", question);
    btn.type = "button";
    btn.addEventListener("click", function () { askAssistant(question); });
    wrap.appendChild(btn);
  });

  // The same quick questions appear in the home page preview
  var preview = $("ai-preview-questions");
  preview.innerHTML = "";
  SUGGESTED_QUESTIONS.slice(0, 3).forEach(function (question) {
    var btn = el("button", "suggestion", question);
    btn.type = "button";
    btn.addEventListener("click", function () {
      showView("assistant");
      askAssistant(question);
    });
    preview.appendChild(btn);
  });
}

function wireAssistant() {
  $("chat-send").addEventListener("click", function () {
    askAssistant($("chat-input").value);
  });
  $("chat-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter") { event.preventDefault(); askAssistant(this.value); }
  });
  addMessage("Namaste. I'm the AccessIndia assistant. Ask me about ramps, lifts, accessible washrooms or how to reach a place.", "bot");
}

/* ---------------------------------------------------------
   9. VOICE INPUT (Web Speech API)
   --------------------------------------------------------- */
var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = null;

function speechSupported() { return !!SpeechRecognitionAPI; }

function startListening(button, onResult) {
  if (!speechSupported()) {
    showVoiceStatus("Voice input is not supported in this browser. Chrome or Edge works best. You can type your search instead.");
    announce("Voice input is not supported in this browser", true);
    return;
  }

  if (recognition) { recognition.abort(); recognition = null; }

  recognition = new SpeechRecognitionAPI();
  recognition.lang = "en-IN";           // Indian English
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  button.classList.add("is-listening");
  button.setAttribute("aria-label", "Listening. Click to stop.");
  showVoiceStatus("Listening… say something like “Find accessible hospitals”.");

  recognition.onresult = function (event) {
    var transcript = event.results[0][0].transcript;
    showVoiceStatus("Heard: “" + transcript + "”");
    onResult(transcript);
  };

  recognition.onerror = function (event) {
    var message = event.error === "not-allowed"
      ? "Microphone permission was blocked. Allow the microphone in your browser, or type your search."
      : "Voice input stopped (" + event.error + "). You can type your search instead.";
    showVoiceStatus(message);
    announce(message, false);
  };

  recognition.onend = function () {
    button.classList.remove("is-listening");
    button.setAttribute("aria-label", "Search by voice");
    recognition = null;
  };

  try {
    recognition.start();
  } catch (error) {
    showVoiceStatus("Could not start voice input. Try again, or type your search.");
  }
}

var voiceStatusTimer = null;
function showVoiceStatus(message) {
  var box = $("voice-status");
  box.textContent = message;
  box.hidden = false;
  window.clearTimeout(voiceStatusTimer);
  voiceStatusTimer = window.setTimeout(function () { box.hidden = true; }, 7000);
}

function wireVoice() {
  $("voice-btn").addEventListener("click", function () {
    var button = this;
    if (button.classList.contains("is-listening") && recognition) {
      recognition.stop();
      return;
    }
    startListening(button, function (transcript) {
      // "Find accessible hospitals" → search for "hospital"
      var cleaned = transcript.toLowerCase()
        .replace(/\b(find|search|show|me|the|a|an|for|nearest|near|accessible|please)\b/g, "")
        .replace(/s\b/g, "")
        .trim();
      $("search-input").value = cleaned || transcript;
      runSearch();
    });
  });

  $("chat-voice").addEventListener("click", function () {
    var button = this;
    if (button.classList.contains("is-listening") && recognition) {
      recognition.stop();
      return;
    }
    startListening(button, function (transcript) {
      askAssistant(transcript);
    });
  });
}

/* ---------------------------------------------------------
   10. READ ALOUD (speechSynthesis)
   --------------------------------------------------------- */
function readAloud(text) {
  if (!("speechSynthesis" in window)) {
    announce("Read aloud is not supported in this browser", true);
    return;
  }
  window.speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  announce("Reading aloud", false);
}

function stopReading() {
  if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); }
}

function wireReadAloud() {
  $("read-aloud-btn").addEventListener("click", function () {
    var place = placeById(state.selectedId);
    if (place) { readAloud(placeToSpeech(place)); }
  });
  $("stop-aloud-btn").addEventListener("click", function () {
    stopReading();
    announce("Stopped reading", false);
  });
}

/* ---------------------------------------------------------
   11. ACCESSIBILITY SETTINGS
   --------------------------------------------------------- */
var FONT_STEPS = [90, 100, 115, 130, 150];
var settings = { fontIndex: 1, contrast: false, motion: false, underline: false, spacing: false };

/* localStorage is wrapped in try/catch so the page still works
   when a browser blocks storage on file:// pages. */
function saveSettings() {
  try { window.localStorage.setItem("accessindia-settings", JSON.stringify(settings)); }
  catch (error) { /* storage unavailable — settings just won't persist */ }
}

function loadSettings() {
  try {
    var saved = window.localStorage.getItem("accessindia-settings");
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        settings.fontIndex = typeof parsed.fontIndex === "number" ? parsed.fontIndex : 1;
        settings.contrast  = !!parsed.contrast;
        settings.motion    = !!parsed.motion;
        settings.underline = !!parsed.underline;
        settings.spacing   = !!parsed.spacing;
      }
    }
  } catch (error) { /* ignore and use defaults */ }
}

function applySettings() {
  var percent = FONT_STEPS[settings.fontIndex];
  document.documentElement.style.fontSize = percent + "%";
  $("font-level").textContent = percent + "%";

  document.body.classList.toggle("contrast", settings.contrast);
  document.body.classList.toggle("reduce-motion", settings.motion);
  document.body.classList.toggle("underline-all", settings.underline);
  document.body.classList.toggle("wide-spacing", settings.spacing);

  $("toggle-contrast").checked = settings.contrast;
  $("toggle-motion").checked = settings.motion;
  $("toggle-links").checked = settings.underline;
  $("toggle-spacing").checked = settings.spacing;

  $("font-dec").disabled = settings.fontIndex === 0;
  $("font-inc").disabled = settings.fontIndex === FONT_STEPS.length - 1;

  saveSettings();
}

function openSettings() {
  $("a11y-panel").hidden = false;
  $("overlay").hidden = false;
  $("a11y-toggle").setAttribute("aria-expanded", "true");
  $("a11y-close").focus();
}

function closeSettings() {
  $("a11y-panel").hidden = true;
  if ($("place-dialog").hidden) { $("overlay").hidden = true; }
  $("a11y-toggle").setAttribute("aria-expanded", "false");
  $("a11y-toggle").focus();
}

function wireSettings() {
  $("a11y-toggle").addEventListener("click", function () {
    if ($("a11y-panel").hidden) { openSettings(); } else { closeSettings(); }
  });
  $("a11y-close").addEventListener("click", closeSettings);

  $("font-inc").addEventListener("click", function () {
    if (settings.fontIndex < FONT_STEPS.length - 1) { settings.fontIndex++; }
    applySettings();
    announce("Text size " + FONT_STEPS[settings.fontIndex] + " percent", true);
  });

  $("font-dec").addEventListener("click", function () {
    if (settings.fontIndex > 0) { settings.fontIndex--; }
    applySettings();
    announce("Text size " + FONT_STEPS[settings.fontIndex] + " percent", true);
  });

  $("toggle-contrast").addEventListener("change", function () {
    settings.contrast = this.checked;
    applySettings();
    announce(this.checked ? "High contrast mode on" : "High contrast mode off", true);
  });

  $("toggle-motion").addEventListener("change", function () {
    settings.motion = this.checked;
    applySettings();
    announce(this.checked ? "Motion reduced" : "Motion restored", true);
  });

  $("toggle-links").addEventListener("change", function () {
    settings.underline = this.checked;
    applySettings();
  });

  $("toggle-spacing").addEventListener("change", function () {
    settings.spacing = this.checked;
    applySettings();
  });

  $("reset-settings").addEventListener("click", function () {
    settings = { fontIndex: 1, contrast: false, motion: false, underline: false, spacing: false };
    applySettings();
    announce("Accessibility settings reset to defaults", true);
  });

  // Respect the operating system's reduced-motion preference on first load
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    settings.motion = true;
  }
}

/* ---------------------------------------------------------
   12. START-UP
   --------------------------------------------------------- */
function init() {
  wireNavigation();
  wireSearch();
  wireModal();
  wireAssistant();
  wireVoice();
  wireReadAloud();
  wireSettings();

  loadSettings();
  applySettings();

  renderStats();
  renderHomeCategories();
  renderNeedChips($("home-filters"));
  renderNeedChips($("filter-bar"));
  renderHomePlaces();
  renderExplore();
  renderMapView();
  renderSuggestions();

  if (!speechSupported()) {
    $("voice-btn").title = "Voice input needs Chrome or Edge";
    $("chat-voice").title = "Voice input needs Chrome or Edge";
  }

  showView("home");
}

document.addEventListener("DOMContentLoaded", init);
