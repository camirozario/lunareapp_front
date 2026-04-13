const API_BASE = window.API_BASE || "http://127.0.0.1:5000";
const CYCLE_LENGTH = 28;
const PASTEL_COLORS = [
  "#f2c6c2", "#f6d7b0", "#f4e1a1", "#d9e8b7", "#bfe3d0", "#b9d8f3",
  "#cfc7f8", "#e4c7ef", "#f3d1dc", "#d8a9c7", "#dbbc94", "#d8c5ac",
];

const currentDateEl = document.getElementById("current-date");
const trackedDateEl = document.getElementById("tracked-date");
const cycleDayEl = document.getElementById("cycle-day");
const cyclePhaseEl = document.getElementById("cycle-phase");
const symptomsListEl = document.getElementById("symptoms-list");
const topicSelectEl = document.getElementById("topic-select");
const symptomInputEl = document.getElementById("symptom-input");
const addSymptomBtnEl = document.getElementById("add-symptom-btn");
const newTopicBtnEl = document.getElementById("new-topic-btn");
const editTopicBtnEl = document.getElementById("edit-topic-btn");
const helperMessageEl = document.getElementById("helper-message");
const cycleRingWrapEl = document.getElementById("cycle-ring-wrap");
const cycleKnobEl = document.getElementById("cycle-knob");
const ringMarkersEl = document.getElementById("ring-markers");
const suggestionsPanelEl = document.getElementById("suggestions-panel");
const editSidebarEl = document.getElementById("edit-sidebar");
const editOverlayEl = document.getElementById("edit-overlay");
const editCloseBtnEl = document.getElementById("edit-close-btn");
const sidebarModeLabelEl = document.getElementById("sidebar-mode-label");
const editSymptomNameEl = document.getElementById("edit-symptom-name");
const editTopicNameEl = document.getElementById("edit-topic-name");
const editSymptomTopicSelectEl = document.getElementById("edit-symptom-topic-select");
const editIntensityBarEl = document.getElementById("edit-intensity-bar");
const editIntensityValueEl = document.getElementById("edit-intensity-value");
const editNoteEl = document.getElementById("edit-note");
const editSaveBtnEl = document.getElementById("edit-save-btn");
const symptomEditSectionEl = document.getElementById("symptom-edit-section");
const topicCreateSectionEl = document.getElementById("topic-create-section");
const topicNameInputEl = document.getElementById("topic-name-input");
const topicColorInputEl = document.getElementById("topic-color-input");
const topicColorPreviewEl = document.getElementById("topic-color-preview");
const topicPaletteEl = document.getElementById("topic-palette");
const topicSaveBtnEl = document.getElementById("topic-save-btn");
const topicSelectWrapEl = document.querySelector(".topic-select-wrap");

let topicsCache = [];
let symptomsCache = [];
let viewedLogCache = null;
let todayReferenceDate = null;
let todayReferenceCycleDay = 1;
let selectedLogDate = null;
let selectedCycleDay = 1;
let previewedCycleDay = null;
let dragAnchorDate = null;
let dragAnchorCycleDay = null;
let isDraggingCycle = false;
let latestCycleLoadToken = 0;
let currentLoadController = null;
let cycleOverviewCache = {};
let activeEditItem = null;
let editIntensityValue = 3;
let activeSidebarMode = "symptom";
let activeTopicEditId = null;

function setHelperMessage(message, type = "") {
  helperMessageEl.textContent = message;
  helperMessageEl.className = "helper-message";
  if (type) helperMessageEl.classList.add(type);
}

function formatDate(dateString) {
  if (!dateString) return "NO DATE";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "INVALID DATE";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).toUpperCase();
}

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function addDays(dateString, offset) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function getCyclePhaseLabel(cycleDay) {
  if (!cycleDay) return "NO PHASE";
  if (cycleDay >= 1 && cycleDay <= 5) return "MENSTRUAL";
  if (cycleDay >= 6 && cycleDay <= 13) return "FOLLICULAR";
  if (cycleDay >= 14 && cycleDay <= 16) return "OVULATORY";
  return "LUTEAL";
}

function getTopicClass(topicName) {
  const key = normalizeText(topicName);
  if (key === "energy") return "topic-energy";
  if (key === "bowel") return "topic-bowel";
  if (key === "pain") return "topic-pain";
  return "topic-default";
}

function getTopicById(topicId) {
  return topicsCache.find((topic) => String(topic.id) === String(topicId));
}

function getRingGeometry() {
  const rect = cycleRingWrapEl.getBoundingClientRect();
  return {
    rect,
    centerX: rect.width / 2,
    centerY: rect.height / 2,
    radius: Math.min(rect.width, rect.height) / 2 - 13,
  };
}

function getRingCoordinates(cycleDay, radiusOffset = 0) {
  const { centerX, centerY, radius } = getRingGeometry();
  const angle = ((cycleDay - 1) / CYCLE_LENGTH) * Math.PI * 2 - Math.PI / 2;
  return {
    angle,
    x: centerX + Math.cos(angle) * (radius + radiusOffset),
    y: centerY + Math.sin(angle) * (radius + radiusOffset),
  };
}

function updateCycleKnobPosition(cycleDay) {
  const { x, y } = getRingCoordinates(cycleDay);
  cycleKnobEl.style.left = `${x}px`;
  cycleKnobEl.style.top = `${y}px`;
}

function renderCycleMarkers() {
  ringMarkersEl.innerHTML = "";
  for (let cycleDay = 1; cycleDay <= CYCLE_LENGTH; cycleDay += 1) {
    const colors = cycleOverviewCache[cycleDay] || cycleOverviewCache[String(cycleDay)] || [];
    if (!colors.length) continue;

    colors.slice(0, 3).forEach((color, index) => {
      const dot = document.createElement("span");
      dot.className = "day-marker-dot";
      const inwardOffset = -28 - index * 12;
      const { x, y } = getRingCoordinates(cycleDay, inwardOffset);
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.background = color || "#c8bba9";
      ringMarkersEl.appendChild(dot);
    });
  }
}

function applySelectTopicColor(selectEl, topic, options = {}) {
  if (!selectEl) return;
  const neutralBg = options.neutralBg || "#fffaf6";
  const color = topic?.color || neutralBg;
  selectEl.style.backgroundColor = color;
  selectEl.style.borderColor = topic?.color || "rgba(78,67,56,0.12)";
}

function updateEditTopicPreviewFromSelect() {
  if (!editSymptomTopicSelectEl) return;
  const selectedTopic = getTopicById(editSymptomTopicSelectEl.value);
  applySelectTopicColor(editSymptomTopicSelectEl, selectedTopic);
  editTopicNameEl.textContent = selectedTopic?.name || "No topic";
  editTopicNameEl.className = `edit-topic-name ${getTopicClass(selectedTopic?.name)}`;
  if (selectedTopic?.color) {
    editTopicNameEl.style.backgroundColor = selectedTopic.color;
  } else {
    editTopicNameEl.style.backgroundColor = "";
  }
}

function updateTopicControlColor() {
  const selectedTopic = getTopicById(topicSelectEl.value);
  const topicColor = selectedTopic?.color || "#ece1d3";
  topicSelectWrapEl?.style.setProperty("--topic-control-bg", topicColor);
  topicSelectWrapEl?.style.setProperty("--topic-select-bg", selectedTopic?.color || "rgba(255,255,255,0.38)");
  applySelectTopicColor(topicSelectEl, selectedTopic, { neutralBg: "rgba(255,255,255,0.38)" });
}

function populateTopicSelect(topics) {
  const currentValue = topicSelectEl.value;
  const editCurrentValue = editSymptomTopicSelectEl?.value;
  topicSelectEl.innerHTML = `<option value="">topic</option>`;
  if (editSymptomTopicSelectEl) {
    editSymptomTopicSelectEl.innerHTML = `<option value="">Choose topic</option>`;
  }
  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic.id;
    option.textContent = topic.name;
    topicSelectEl.appendChild(option);
    if (editSymptomTopicSelectEl) {
      const editOption = document.createElement("option");
      editOption.value = topic.id;
      editOption.textContent = topic.name;
      editSymptomTopicSelectEl.appendChild(editOption);
    }
  });
  if ([...topicSelectEl.options].some((opt) => opt.value === currentValue)) {
    topicSelectEl.value = currentValue;
  }
  if (editSymptomTopicSelectEl && [...editSymptomTopicSelectEl.options].some((opt) => opt.value === editCurrentValue)) {
    editSymptomTopicSelectEl.value = editCurrentValue;
  }
  updateTopicControlColor();
  updateEditTopicPreviewFromSelect();
}

function renderIntensityBar(intensity = 3) {
  const safeIntensity = Math.max(1, Math.min(5, Number(intensity) || 1));
  const segments = Array.from({ length: 5 }, (_, index) => {
    const filled = index < safeIntensity ? "filled" : "";
    return `<span class="intensity-segment ${filled}"></span>`;
  }).join("");

  return `
    <div class="intensity-wrap" aria-label="Intensity ${safeIntensity} out of 5">
      <div class="intensity-bar">${segments}</div>
      <span class="intensity-text">${safeIntensity}/5</span>
    </div>
  `;
}

function renderEditIntensityBar(intensity = 3) {
  editIntensityBarEl.innerHTML = "";
  editIntensityValue = Math.max(1, Math.min(5, Number(intensity) || 3));

  for (let i = 1; i <= 5; i += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `edit-intensity-segment ${i <= editIntensityValue ? "filled" : ""}`;
    button.setAttribute("aria-label", `Set intensity to ${i}`);
    button.addEventListener("click", () => renderEditIntensityBar(i));
    editIntensityBarEl.appendChild(button);
  }

  editIntensityValueEl.textContent = `${editIntensityValue}/5`;
}

function renderSymptoms(symptoms) {
  symptomsListEl.innerHTML = "";
  if (!symptoms?.length) {
    symptomsListEl.innerHTML = `<div class="empty-state">No symptoms tracked for this day yet.</div>`;
    return;
  }

  symptoms.forEach((item) => {
    const row = document.createElement("div");
    row.className = "symptom-row";
    const topicClass = getTopicClass(item.topic);
    const noteText = item.note ? item.note : "No note";

    row.innerHTML = `
      <div class="symptom-main">
        <div class="symptom-name">${item.symptom_name || "Unnamed symptom"}</div>
        <div class="symptom-meta">${renderIntensityBar(item.intensity || 3)} · ${noteText}</div>
      </div>
      <div class="symptom-right">
        <div class="topic-badge-wrap">
          <div class="topic-badge ${topicClass}">${item.topic || "No topic"}</div>
        </div>
        <div class="row-actions">
          <button class="action-btn edit-btn" type="button" title="Edit" aria-label="Edit symptom"><i class="fi fi-rr-pencil"></i></button>
          <button class="action-btn delete-btn" type="button" title="Delete" aria-label="Delete symptom"><i class="fi fi-rr-trash"></i></button>
        </div>
      </div>
    `;

    row.querySelector(".edit-btn").addEventListener("click", () => openEditSidebar(item));
    row.querySelector(".delete-btn").addEventListener("click", () => deleteTrackedSymptom(item.id));
    symptomsListEl.appendChild(row);
  });
}

function renderLog(log, renderDay = selectedCycleDay) {
  viewedLogCache = log;
  selectedLogDate = log.log_date;
  selectedCycleDay = Number(log.cycle_day || renderDay || 1);
  previewedCycleDay = selectedCycleDay;
  trackedDateEl.textContent = `${formatDate(log.log_date)}`;
  cycleDayEl.textContent = String(selectedCycleDay).padStart(2, "0");
  cyclePhaseEl.textContent = (log.cycle_phase || getCyclePhaseLabel(selectedCycleDay)).toUpperCase();

  const symptomsForRenderedDay = (log.symptoms || []).filter((item) => {
    if (item.daily_log_id && log.id) return Number(item.daily_log_id) === Number(log.id);
    if (item.log_date && log.log_date) return item.log_date === log.log_date;
    return true;
  });

  renderSymptoms(symptomsForRenderedDay);
  updateCycleKnobPosition(selectedCycleDay);
}


async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(payload?.message || `Request failed: ${response.status}`);
  return payload;
}

async function loadTopics() {
  const data = await fetchJson(`${API_BASE}/topics`);
  topicsCache = data?.topics || [];
  populateTopicSelect(topicsCache);
}

async function loadSymptomsCatalog() {
  const data = await fetchJson(`${API_BASE}/symptoms`);
  symptomsCache = data?.symptoms || [];
}

function findSymptomByNameAndTopic(name, topicId) {
  const normalizedName = normalizeText(name);
  return symptomsCache.find((symptom) => normalizeText(symptom.name) === normalizedName && String(symptom.topic_id) === String(topicId));
}

function getSuggestions(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];
  return symptomsCache
    .filter((symptom) => normalizeText(symptom.name).includes(normalizedQuery))
    .slice(0, 6)
    .map((symptom) => ({ ...symptom, topic: getTopicById(symptom.topic_id) }));
}

function hideSuggestions() {
  suggestionsPanelEl.hidden = true;
  suggestionsPanelEl.innerHTML = "";
}

function selectSuggestion(symptom) {
  symptomInputEl.value = symptom.name;
  topicSelectEl.value = String(symptom.topic_id);
  updateTopicControlColor();
  hideSuggestions();
}

function renderSuggestions(query) {
  const suggestions = getSuggestions(query);
  if (!suggestions.length) return hideSuggestions();

  suggestionsPanelEl.innerHTML = "";
  suggestions.forEach((symptom) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.innerHTML = `
      <span>${symptom.name}</span>
      <span class="suggestion-topic ${getTopicClass(symptom.topic?.name)}">${symptom.topic?.name || "Topic"}</span>
    `;
    button.addEventListener("click", () => selectSuggestion(symptom));
    suggestionsPanelEl.appendChild(button);
  });
  suggestionsPanelEl.hidden = false;
}

function suggestTopicForSymptom(symptomName) {
  const match = symptomsCache.find((symptom) => normalizeText(symptom.name) === normalizeText(symptomName));
  if (match) {
    topicSelectEl.value = String(match.topic_id);
    updateTopicControlColor();
  }
}

async function refreshCycleOverview() {
  if (!selectedLogDate || !selectedCycleDay) return;
  const data = await fetchJson(`${API_BASE}/cycle-overview?reference_date=${selectedLogDate}&reference_cycle_day=${selectedCycleDay}`);
  cycleOverviewCache = data?.markers || {};
  renderCycleMarkers();
}

function getSelectedCycleContext() {
  return {
    logDate: selectedLogDate || viewedLogCache?.log_date || todayReferenceDate,
    cycleDay: Number(selectedCycleDay || viewedLogCache?.cycle_day || todayReferenceCycleDay || 1),
  };
}

async function loadLogByExactSelection(logDate, cycleDay, options = {}) {
  if (!logDate) return;

  const { silent = false } = options;
  const token = ++latestCycleLoadToken;
  previewedCycleDay = cycleDay;

  if (currentLoadController) currentLoadController.abort();
  currentLoadController = new AbortController();

  symptomsListEl.innerHTML = `<div class="empty-state">Loading symptoms for this day...</div>`;
  if (!silent) setHelperMessage("Loading cycle day...");

  try {
    const data = await fetchJson(`${API_BASE}/daily-log?log_date=${logDate}&cycle_day=${cycleDay}`, {
      signal: currentLoadController.signal,
    });
    if (token !== latestCycleLoadToken) return;
    renderLog(data, cycleDay);
    await refreshCycleOverview();
    if (!silent) setHelperMessage("");
  } catch (error) {
    if (error.name === "AbortError") return;
    throw error;
  }
}

async function loadLogForCycleDay(cycleDay, options = {}) {
  const { logDate: baseDate, cycleDay: baseCycleDay } = getSelectedCycleContext();
  if (!baseDate) return;

  const offset = cycleDay - baseCycleDay;
  const targetDate = addDays(baseDate, offset);
  await loadLogByExactSelection(targetDate, cycleDay, options);
}

async function loadTodayLog() {
  const data = await fetchJson(`${API_BASE}/daily-log/today?cycle_day=1`);
  todayReferenceDate = data.log_date;
  todayReferenceCycleDay = Number(data.cycle_day || 1);
  renderLog(data, todayReferenceCycleDay);
  await refreshCycleOverview();
}

async function handleAddSymptom() {
  const symptomName = symptomInputEl.value.trim();
  const topicId = topicSelectEl.value;
  if (!symptomName) return setHelperMessage("Type a symptom name first.", "error");
  if (!topicId) return setHelperMessage("Select a topic first.", "error");
  if (!viewedLogCache?.id) return setHelperMessage("The selected day is not loaded yet.", "error");

  addSymptomBtnEl.disabled = true;
  try {
    setHelperMessage("Adding symptom...");
    let matchedSymptom = findSymptomByNameAndTopic(symptomName, topicId);

    if (!matchedSymptom) {
      const created = await fetchJson(`${API_BASE}/symptoms`, {
        method: "POST",
        body: JSON.stringify({ name: symptomName, topic_id: Number(topicId) }),
      });
      matchedSymptom = created.symptom;
      await loadSymptomsCatalog();
    }

    await fetchJson(`${API_BASE}/daily-log-symptoms`, {
      method: "POST",
      body: JSON.stringify({
        daily_log_id: viewedLogCache.id,
        symptom_id: matchedSymptom.id,
        intensity: 3,
        note: null,
      }),
    });

    symptomInputEl.value = "";
    topicSelectEl.value = "";
    updateTopicControlColor();
    hideSuggestions();
    const { logDate, cycleDay } = getSelectedCycleContext();
    await loadLogByExactSelection(logDate, cycleDay, { silent: true });
    setHelperMessage("Symptom added.", "success");
  } catch (error) {
    setHelperMessage(error.message || "Could not add symptom.", "error");
  } finally {
    addSymptomBtnEl.disabled = false;
  }
}

async function deleteTrackedSymptom(trackedSymptomId) {
  try {
    setHelperMessage("Deleting symptom...");
    await fetchJson(`${API_BASE}/daily-log-symptoms/${trackedSymptomId}/delete`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    closeEditSidebar();
    const { logDate, cycleDay } = getSelectedCycleContext();
    await loadLogByExactSelection(logDate, cycleDay, { silent: true });
    setHelperMessage("Symptom removed.", "success");
  } catch (error) {
    setHelperMessage(error.message || "Could not delete symptom.", "error");
  }
}

function openSidebar(mode = "symptom") {
  activeSidebarMode = mode;
  const isTopicMode = mode === "topic";
  sidebarModeLabelEl.textContent = isTopicMode ? (activeTopicEditId ? "editing topic" : "creating topic") : "editing symptom";
  symptomEditSectionEl.hidden = isTopicMode;
  topicCreateSectionEl.hidden = !isTopicMode;
  topicSaveBtnEl.textContent = activeTopicEditId ? "  save  " : "  create  ";
  editSidebarEl.classList.add("open");
  editOverlayEl.hidden = false;
}

function closeEditSidebar() {
  activeEditItem = null;
  activeTopicEditId = null;
  editSidebarEl.classList.remove("open");
  editOverlayEl.hidden = true;
  topicNameInputEl.value = "";
  editTopicNameEl.style.backgroundColor = "";
  applySelectTopicColor(editSymptomTopicSelectEl, null);
  setSelectedPaletteColor(PASTEL_COLORS[0]);
}

function openEditSidebar(item) {
  activeEditItem = item;
  activeTopicEditId = null;
  editSymptomNameEl.textContent = item.symptom_name || "Unnamed symptom";
  editTopicNameEl.textContent = item.topic || "No topic";
  editTopicNameEl.className = `edit-topic-name ${getTopicClass(item.topic)}`;
  editNoteEl.value = item.note || "";
  const matchingTopic = topicsCache.find((topic) => normalizeText(topic.name) === normalizeText(item.topic));
  if (editSymptomTopicSelectEl) {
    editSymptomTopicSelectEl.value = matchingTopic ? String(matchingTopic.id) : "";
    updateEditTopicPreviewFromSelect();
  }
  renderEditIntensityBar(item.intensity || 3);
  openSidebar("symptom");
}

async function saveEditSidebar() {
  if (!activeEditItem?.id) return;
  editSaveBtnEl.disabled = true;
  try {
    setHelperMessage("Saving symptom changes...");
    await fetchJson(`${API_BASE}/daily-log-symptoms/${activeEditItem.id}/update`, {
      method: "POST",
      body: JSON.stringify({
        intensity: editIntensityValue,
        note: editNoteEl.value.trim(),
        topic_id: editSymptomTopicSelectEl?.value ? Number(editSymptomTopicSelectEl.value) : null,
      }),
    });
    closeEditSidebar();
    const { logDate, cycleDay } = getSelectedCycleContext();
    await loadLogByExactSelection(logDate, cycleDay, { silent: true });
    setHelperMessage("Symptom updated.", "success");
  } catch (error) {
    setHelperMessage(error.message || "Could not update symptom.", "error");
  } finally {
    editSaveBtnEl.disabled = false;
  }
}

function renderTopicPalette() {
  topicPaletteEl.innerHTML = "";
  PASTEL_COLORS.forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "topic-palette-swatch";
    btn.dataset.color = color;
    btn.style.background = color;
    btn.setAttribute("aria-label", `Choose color ${color}`);
    btn.addEventListener("click", () => setSelectedPaletteColor(color));
    topicPaletteEl.appendChild(btn);
  });
  setSelectedPaletteColor(topicColorInputEl.value || PASTEL_COLORS[0]);
}

function setSelectedPaletteColor(color) {
  const finalColor = PASTEL_COLORS.includes(color) ? color : PASTEL_COLORS[0];
  topicColorInputEl.value = finalColor;
  topicColorPreviewEl.style.background = finalColor;
  topicColorPreviewEl.title = finalColor;
  topicPaletteEl.querySelectorAll(".topic-palette-swatch").forEach((swatch) => {
    swatch.classList.toggle("selected", swatch.dataset.color === finalColor);
  });
}

function openNewTopicSidebar() {
  activeTopicEditId = null;
  editSymptomNameEl.textContent = "New topic";
  editTopicNameEl.textContent = "Choose a pastel color";
  editTopicNameEl.className = "edit-topic-name topic-default";
  topicNameInputEl.value = "";
  setSelectedPaletteColor(PASTEL_COLORS[0]);
  openSidebar("topic");
}

function openTopicEditSidebar() {
  const selectedTopic = getTopicById(topicSelectEl.value);
  if (!selectedTopic) {
    setHelperMessage("Choose a topic to edit first.", "error");
    return;
  }
  activeTopicEditId = selectedTopic.id;
  editSymptomNameEl.textContent = selectedTopic.name;
  editTopicNameEl.textContent = `Preview color ${selectedTopic.color || PASTEL_COLORS[0]}`;
  editTopicNameEl.className = "edit-topic-name topic-default";
  topicNameInputEl.value = selectedTopic.name;
  setSelectedPaletteColor(selectedTopic.color || PASTEL_COLORS[0]);
  openSidebar("topic");
}

async function saveTopicSidebar() {
  const name = topicNameInputEl.value.trim();
  const color = topicColorInputEl.value;
  if (!name) return setHelperMessage("Type a topic name first.", "error");
  if (!PASTEL_COLORS.includes(color)) return setHelperMessage("Choose one of the pastel colors.", "error");

  topicSaveBtnEl.disabled = true;
  try {
    const endpoint = activeTopicEditId
      ? `${API_BASE}/topics/${activeTopicEditId}/update`
      : `${API_BASE}/topics`;
    const message = activeTopicEditId ? "Saving topic..." : "Creating topic...";
    setHelperMessage(message);

    const data = await fetchJson(endpoint, {
      method: "POST",
      body: JSON.stringify({ name, color }),
    });

    await loadTopics();
    if (data?.topic?.id) topicSelectEl.value = String(data.topic.id);
    updateTopicControlColor();
    closeEditSidebar();
    setHelperMessage(activeTopicEditId ? "Topic updated." : "Topic created.", "Success");
  } catch (error) {
    setHelperMessage(error.message || "Could not save topic.", "error");
  } finally {
    topicSaveBtnEl.disabled = false;
  }
}

function getCycleDayFromPointer(clientX, clientY) {
  const rect = cycleRingWrapEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angle = Math.atan2(clientY - centerY, clientX - centerX) + Math.PI / 2;
  const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
  const rawDay = Math.round((normalized / (Math.PI * 2)) * CYCLE_LENGTH) + 1;
  return Math.min(CYCLE_LENGTH, Math.max(1, rawDay));
}

function previewCycleDay(cycleDay) {
  previewedCycleDay = cycleDay;
  cycleDayEl.textContent = String(cycleDay).padStart(2, "0");
  cyclePhaseEl.textContent = getCyclePhaseLabel(cycleDay);
  updateCycleKnobPosition(cycleDay);
}

function startCycleDrag(event) {
  latestCycleLoadToken += 1;
  if (currentLoadController) currentLoadController.abort();
  isDraggingCycle = true;
  dragAnchorDate = selectedLogDate || viewedLogCache?.log_date || todayReferenceDate;
  dragAnchorCycleDay = Number(selectedCycleDay || viewedLogCache?.cycle_day || todayReferenceCycleDay || 1);
  cycleKnobEl.classList.add("dragging");
  cycleKnobEl.setPointerCapture?.(event.pointerId);
  previewCycleDay(getCycleDayFromPointer(event.clientX, event.clientY));
}

async function commitSelectedCycleDay() {
  const cycleDayToLoad = previewedCycleDay || selectedCycleDay || todayReferenceCycleDay;
  const baseDate = dragAnchorDate || selectedLogDate || viewedLogCache?.log_date || todayReferenceDate;
  const baseCycleDay = Number(dragAnchorCycleDay || selectedCycleDay || viewedLogCache?.cycle_day || todayReferenceCycleDay || 1);
  const targetDate = addDays(baseDate, cycleDayToLoad - baseCycleDay);
  await loadLogByExactSelection(targetDate, cycleDayToLoad, { silent: true });
}

function stopCycleDrag() {
  if (!isDraggingCycle) return;
  isDraggingCycle = false;
  cycleKnobEl.classList.remove("dragging");
  commitSelectedCycleDay().catch((error) => {
    setHelperMessage(error.message || "Could not load the selected cycle day.", "error");
  }).finally(() => {
    dragAnchorDate = null;
    dragAnchorCycleDay = null;
  });
}

function handleCyclePointerMove(event) {
  if (!isDraggingCycle) return;
  previewCycleDay(getCycleDayFromPointer(event.clientX, event.clientY));
}

async function initializePage() {
  try {
    setHelperMessage("Connecting to API...");
    await fetchJson(`${API_BASE}/health`);
    renderTopicPalette();
    await loadTopics();
    await loadSymptomsCatalog();
    await loadTodayLog();
    setHelperMessage("");
  } catch (error) {
    cycleDayEl.textContent = "--";
    cyclePhaseEl.textContent = "ERROR";
    symptomsListEl.innerHTML = `<div class="empty-state">Could not load data.</div>`;
    setHelperMessage(
      `${error.message || "Could not connect to API."} Check if backend is running on ${API_BASE}.`,
      "error"
    );
  }
}

addSymptomBtnEl.addEventListener("click", handleAddSymptom);
editCloseBtnEl.addEventListener("click", closeEditSidebar);
editOverlayEl.addEventListener("click", closeEditSidebar);
editSaveBtnEl.addEventListener("click", saveEditSidebar);
newTopicBtnEl.addEventListener("click", openNewTopicSidebar);
editTopicBtnEl?.addEventListener("click", openTopicEditSidebar);
topicSaveBtnEl.addEventListener("click", saveTopicSidebar);
topicSelectEl.addEventListener("change", updateTopicControlColor);
editSymptomTopicSelectEl?.addEventListener("change", updateEditTopicPreviewFromSelect);

symptomInputEl.addEventListener("input", () => {
  const value = symptomInputEl.value;
  suggestTopicForSymptom(value);
  renderSuggestions(value);
});

symptomInputEl.addEventListener("focus", () => {
  if (symptomInputEl.value.trim()) renderSuggestions(symptomInputEl.value);
});

symptomInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleAddSymptom();
  }
});

window.addEventListener("click", (event) => {
  if (!event.target.closest(".tracker-input-wrap")) hideSuggestions();
});

cycleKnobEl.addEventListener("pointerdown", startCycleDrag);
cycleRingWrapEl.addEventListener("pointerdown", (event) => {
  if (event.target === cycleKnobEl) return;
  startCycleDrag(event);
});
window.addEventListener("pointermove", handleCyclePointerMove);
window.addEventListener("pointerup", stopCycleDrag);
window.addEventListener("pointercancel", stopCycleDrag);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeEditSidebar();
});
window.addEventListener("resize", () => {
  updateCycleKnobPosition(previewedCycleDay || selectedCycleDay || todayReferenceCycleDay);
  renderCycleMarkers();
});

initializePage();
