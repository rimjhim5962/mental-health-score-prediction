(() => {
  "use strict";

  const DEFAULT_API_URL = "http://127.0.0.1:8000";
  const HISTORY_KEY = "mindlens.prediction-history.v1";
  const API_KEY = "mindlens.api-url.v1";
  const THEME_KEY = "mindlens.theme.v1";
  const fieldIds = ["age", "gender", "country", "academic_level", "most_used_platform", "purpose_of_use", "avg_daily_usage_hours", "daily_unlocks", "study_hours", "physical_activity_hours", "sleep_hours_per_night", "stress_level"];
  const numericFields = new Set(["age", "avg_daily_usage_hours", "daily_unlocks", "study_hours", "physical_activity_hours", "sleep_hours_per_night"]);
  const form = document.getElementById("predict-form");
  const submitButton = document.getElementById("submit-btn");
  const apiInput = document.getElementById("api-url");
  const apiStatus = document.getElementById("api-status");
  const apiIndicator = document.getElementById("api-indicator");
  const formMessage = document.getElementById("form-message");
  let requestController;
  let resetCancelledController;

  const getApiUrl = () => (localStorage.getItem(API_KEY) || DEFAULT_API_URL).replace(/\/$/, "");
  const readHistory = () => {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(value) ? value.filter((entry) => typeof entry?.score === "number" && typeof entry?.createdAt === "string") : [];
    } catch {
      return [];
    }
  };
  const setText = (id, text) => { document.getElementById(id).textContent = text; };
  const applyTheme = (theme) => {
    const selectedTheme = ["light", "dark"].includes(theme) ? theme : "default";
    document.documentElement.dataset.theme = selectedTheme;
    document.getElementById("theme-select").value = selectedTheme;
  };
  const setApiState = (state) => {
    apiStatus.textContent = state === "online" ? "API connected" : state === "offline" ? "API unavailable" : "API not checked";
    apiIndicator.classList.toggle("is-online", state === "online");
    apiIndicator.classList.toggle("is-offline", state === "offline");
  };
  const categoryFor = (score) => score < 4 ? "Low range" : score < 7 ? "Moderate range" : "Higher range";
  const formatDate = (iso, includeTime = true) => new Intl.DateTimeFormat(undefined, includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(iso));
  const formatValue = (id, value) => {
    if (["avg_daily_usage_hours", "study_hours", "physical_activity_hours", "sleep_hours_per_night"].includes(id)) return `${value} hrs`;
    if (id === "gender") return value.charAt(0).toUpperCase() + value.slice(1);
    return String(value);
  };

  function animateNumber(element, target) {
    const duration = 850;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = (target * eased).toFixed(2);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function renderHistory() {
    const history = readHistory();
    const rows = document.getElementById("history-rows");
    const clearButton = document.getElementById("clear-history-btn");
    clearButton.hidden = history.length === 0;
    if (!history.length) {
      rows.innerHTML = '<tr class="empty-row"><td colspan="3">No predictions yet. Results from successful model calls will appear here.</td></tr>';
      return;
    }
    rows.replaceChildren(...history.slice(0, 8).map((entry) => {
      const row = document.createElement("tr");
      const dateCell = document.createElement("td");
      const scoreCell = document.createElement("td");
      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      dateCell.textContent = formatDate(entry.createdAt);
      scoreCell.className = "history-score";
      scoreCell.textContent = `${entry.score.toFixed(2)} / 10`;
      status.className = `table-status ${entry.score < 4 ? "status-low" : entry.score < 7 ? "status-mid" : "status-high"}`;
      status.textContent = categoryFor(entry.score);
      statusCell.append(status);
      row.append(dateCell, scoreCell, statusCell);
      return row;
    }));
  }

  function collectPayload() {
    const payload = {};
    for (const id of fieldIds) {
      const raw = document.getElementById(id).value.trim();
      payload[id] = numericFields.has(id) ? (raw === "" ? NaN : Number(raw)) : raw;
    }
    payload.age = Number.isInteger(payload.age) ? payload.age : NaN;
    payload.daily_unlocks = Number.isInteger(payload.daily_unlocks) ? payload.daily_unlocks : NaN;
    return payload;
  }

  function validate(payload) {
    const errors = [];
    const bounds = { age: [10, 100], avg_daily_usage_hours: [0, 24], daily_unlocks: [0, Infinity], study_hours: [0, 24], physical_activity_hours: [0, 24], sleep_hours_per_night: [0, 24] };
    for (const [id, [min, max]] of Object.entries(bounds)) {
      if (!Number.isFinite(payload[id])) errors.push([id, "Enter a valid number."]);
      else if (payload[id] < min || payload[id] > max) errors.push([id, `Use a value from ${min} to ${max === Infinity ? "a valid integer" : max}.`]);
    }
    for (const id of fieldIds.filter((field) => !numericFields.has(field))) {
      if (!payload[id]) errors.push([id, "This field is required."]);
    }
    return errors;
  }

  function showValidation(errors) {
    document.querySelectorAll(".field-error").forEach((element) => { element.textContent = ""; });
    document.querySelectorAll(".field-invalid").forEach((element) => element.classList.remove("field-invalid"));
    for (const [id, message] of errors) {
      const field = document.getElementById(id);
      field.classList.add("field-invalid");
      field.parentElement.querySelector(".field-error").textContent = message;
    }
    if (errors.length) {
      document.getElementById(errors[0][0]).focus();
      formMessage.textContent = "Review the highlighted fields before predicting.";
      formMessage.classList.add("message-error");
    }
  }

  function showInputs(payload) {
    document.querySelectorAll("[data-summary]").forEach((element) => {
      element.textContent = formatValue(element.dataset.summary, payload[element.dataset.summary]);
    });
  }

  function updateScore(score, createdAt) {
    const category = categoryFor(score);
    const angle = `${Math.max(0, Math.min(10, score)) * 36}deg`;
    const gauge = document.getElementById("score-gauge");
    const resultGauge = document.getElementById("result-gauge");
    gauge.style.setProperty("--score-angle", angle);
    resultGauge.style.setProperty("--score-angle", angle);
    gauge.setAttribute("aria-label", `Predicted score ${score.toFixed(2)} out of 10`);
    document.getElementById("score-status").textContent = category.toUpperCase();
    document.getElementById("score-category").textContent = category;
    document.getElementById("result-category").textContent = category;
    document.getElementById("score-note").textContent = "Estimate returned by the existing model for the submitted input profile.";
    document.getElementById("result-copy").textContent = `The model returned a predicted score of ${score.toFixed(2)} out of 10 for the submitted signals.`;
    document.getElementById("score-updated").textContent = formatDate(createdAt);
    document.getElementById("result-timestamp").textContent = formatDate(createdAt);
    animateNumber(document.getElementById("score-number"), score);
    animateNumber(document.getElementById("score-display"), score);
    animateNumber(document.getElementById("result-score"), score);
    document.getElementById("response-state").classList.add("response-success");
    document.querySelector("#response-state strong").textContent = "Model response received";
    document.getElementById("prediction-panel").classList.remove("result-enter");
    requestAnimationFrame(() => document.getElementById("prediction-panel").classList.add("result-enter"));
    document.getElementById("notification-dot").classList.add("is-visible");
  }

  function renderAgentResults(insights, recommendations) {
    const lists = [
      ["insight-list", insights, "No notable input patterns were detected."],
      ["recommendation-list", recommendations, "No specific suggestions for these inputs."]
    ];
    for (const [id, messages, emptyMessage] of lists) {
      const list = document.getElementById(id);
      const items = Array.isArray(messages) ? messages : [];
      const content = items.length ? items : [emptyMessage];
      list.replaceChildren(...content.map((message) => {
        const item = document.createElement("li");
        item.textContent = message;
        return item;
      }));
    }
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.classList.toggle("loading", loading);
    document.getElementById("response-state").classList.toggle("is-loading", loading);
    if (loading) document.querySelector("#response-state strong").textContent = "Waiting for model response";
    if (loading) {
      setApiState("unknown");
      formMessage.textContent = "Sending validated inputs to the model...";
      formMessage.classList.remove("message-error");
    }
  }

  function friendlyError(error, response) {
    if (response?.status === 422) return "The API rejected one or more values. Check the input options and try again.";
    if (response && !response.ok) return `Prediction request failed (HTTP ${response.status}). Check the API and try again.`;
    if (error?.name === "AbortError") return "The request timed out. Check the API server and try again.";
    return "Could not reach the FastAPI server. Confirm it is running and that its CORS settings allow this page.";
  }

  async function submitPrediction(event) {
    event.preventDefault();
    showValidation([]);
    const payload = collectPayload();
    const errors = validate(payload);
    if (errors.length) {
      showValidation(errors);
      return;
    }

    if (requestController) requestController.abort();
    const controller = new AbortController();
    requestController = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    setLoading(true);
    let response;
    try {
      response = await fetch(`${getApiUrl()}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Object.assign(new Error("API request failed"), { response });
      const score = data?.score ?? data?.predicted_mental_health_score;
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 10) {
        throw new Error("The API response did not contain a valid score from 0 to 10.");
      }
      const createdAt = new Date().toISOString();
      showInputs(payload);
      updateScore(score, createdAt);
      renderAgentResults(data.insights, data.recommendations);
      setApiState("online");
      formMessage.textContent = "Prediction complete. The displayed score came from the FastAPI model response.";
      formMessage.classList.remove("message-error");
      const history = [{ score, status: categoryFor(score), createdAt }, ...readHistory()].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      renderHistory();
    } catch (error) {
      if (error?.name === "AbortError" && resetCancelledController === controller) {
        resetCancelledController = null;
        return;
      }
      setApiState("offline");
      const message = error.message.includes("valid score") ? error.message : friendlyError(error, error.response);
      formMessage.textContent = message;
      formMessage.classList.add("message-error");
      document.getElementById("response-state").classList.remove("is-loading", "response-success");
      document.querySelector("#response-state strong").textContent = "No prediction returned";
      document.getElementById("notification-dot").classList.remove("is-visible");
    } finally {
      window.clearTimeout(timeout);
      if (requestController === controller) {
        requestController = null;
        setLoading(false);
      }
    }
  }

  form.addEventListener("submit", submitPrediction);
  document.querySelector(".quick-link").addEventListener("click", () => {
    if (requestController) {
      resetCancelledController = requestController;
      requestController.abort();
      setLoading(false);
    }
    form.reset();
    showValidation([]);
    document.querySelectorAll("[data-summary]").forEach((element) => { element.textContent = "--"; });
    formMessage.textContent = "Enter new student signals to request a prediction.";
    formMessage.classList.remove("message-error");
    document.getElementById("age").focus({ preventScroll: true });
  });
  fieldIds.forEach((id) => document.getElementById(id).addEventListener("input", () => {
    const field = document.getElementById(id);
    field.classList.remove("field-invalid");
    field.parentElement.querySelector(".field-error").textContent = "";
  }));
  document.getElementById("clear-history-btn").addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  const settingsDialog = document.getElementById("settings-dialog");
  document.getElementById("settings-btn").addEventListener("click", () => {
    apiInput.value = getApiUrl();
    settingsDialog.showModal();
  });
  document.getElementById("settings-form").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "save") return;
    event.preventDefault();
    const url = apiInput.value.trim().replace(/\/$/, "");
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
      localStorage.setItem(API_KEY, parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, ""));
      setApiState("unknown");
      settingsDialog.close();
      formMessage.textContent = "API endpoint saved. It will be checked when you request a prediction.";
      formMessage.classList.remove("message-error");
    } catch {
      apiInput.setCustomValidity("Enter a valid HTTP or HTTPS URL.");
      apiInput.reportValidity();
    }
  });
  apiInput.addEventListener("input", () => apiInput.setCustomValidity(""));

  const themeSelect = document.getElementById("theme-select");
  applyTheme(localStorage.getItem(THEME_KEY));
  themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value);
    localStorage.setItem(THEME_KEY, themeSelect.value);
  });

  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("mobile-backdrop");
  const menuButton = document.getElementById("menu-btn");
  const closeMenu = () => {
    sidebar.classList.remove("sidebar-open");
    backdrop.classList.remove("backdrop-visible");
    menuButton.setAttribute("aria-expanded", "false");
  };
  menuButton.addEventListener("click", () => {
    const open = sidebar.classList.toggle("sidebar-open");
    backdrop.classList.toggle("backdrop-visible", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });
  backdrop.addEventListener("click", closeMenu);
  document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", (event) => {
    if (link.id === "settings-nav") {
      event.preventDefault();
      apiInput.value = getApiUrl();
      settingsDialog.showModal();
    }
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    closeMenu();
  }));
  document.getElementById("notification-btn").addEventListener("click", () => {
    const history = readHistory();
    formMessage.textContent = history.length ? `Latest model prediction: ${history[0].score.toFixed(2)} / 10 (${categoryFor(history[0].score)}).` : "No model predictions yet.";
    document.getElementById("notification-dot").classList.remove("is-visible");
  });

  document.getElementById("today-date").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  renderHistory();
  if (localStorage.getItem(API_KEY)) setApiState("unknown");
})();
