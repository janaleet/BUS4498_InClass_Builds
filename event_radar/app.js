// Club Event Radar: the website's code.
// It lists published events from the database and sends new announcements to the AI agent.
// Every piece of text from a post is shown with textContent, never innerHTML.

(function () {
  const config = window.EVENT_RADAR_CONFIG;
  const db = window.supabase.createClient(config.supabaseUrl, config.publishableKey);
  const AGENT_URL = config.supabaseUrl + "/functions/v1/submit-event";

  // Only the columns the website is allowed to read.
  const PUBLIC_COLUMNS =
    "id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary";

  const board = document.getElementById("board");
  const form = document.getElementById("post-form");
  const textarea = document.getElementById("announcement");
  const postButton = document.getElementById("post-button");
  const result = document.getElementById("result");
  const refreshButton = document.getElementById("refresh");
  const chips = document.querySelectorAll(".chip");

  let events = [];
  let filter = "all";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Today's date in Pacific time, as YYYY-MM-DD.
  function todayPacific() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
  }

  // Dates from the database have no time zone, so read them as plain calendar dates.
  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function formatDate(iso, options) {
    return new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: "UTC" }, options)).format(parseDate(iso));
  }

  // "19:00:00" becomes "7:00 PM".
  function formatTime(value) {
    if (!value) return "";
    const [h, m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return hour + ":" + String(m).padStart(2, "0") + " " + suffix;
  }

  function whenText(event) {
    const parts = [];
    if (event.event_date) parts.push(formatDate(event.event_date, { weekday: "short", month: "short", day: "numeric" }));
    let time = formatTime(event.start_time);
    if (time && event.end_time) time += " to " + formatTime(event.end_time);
    if (time) parts.push(time);
    return parts.join(" · ") || "Date to be announced";
  }

  function eventCard(event) {
    const item = el("li", "event");

    if (event.event_date) {
      const date = el("div", "date");
      date.append(
        el("span", "mon", formatDate(event.event_date, { month: "short" })),
        el("span", "day", formatDate(event.event_date, { day: "numeric" })),
      );
      item.append(date);
    } else {
      const date = el("div", "date tba");
      date.append(el("span", "day", "TBA"));
      item.append(date);
    }

    const body = el("div", "event-body");
    body.append(el("p", "when", whenText(event)));
    body.append(el("h3", null, event.title || "Club event"));

    const place = [event.place_name, event.place_detail].filter(Boolean).join(", ");
    const meta = [event.club, place].filter(Boolean).join(" · ");
    if (meta) body.append(el("p", "meta", meta));
    if (event.summary) body.append(el("p", "summary", event.summary));

    const tags = el("p", "tags");
    if (event.cost) tags.append(el("span", "tag", event.cost));
    if (event.free_food) tags.append(el("span", "tag food", "🍕 Free food"));
    if (tags.childElementCount > 0) body.append(tags);

    item.append(body);
    return item;
  }

  function renderBoard() {
    const shown = filter === "food" ? events.filter((event) => event.free_food) : events;
    board.replaceChildren();
    if (shown.length === 0) {
      board.append(el("li", "empty", filter === "food"
        ? "No events with free food right now."
        : "No events yet. Post the first one!"));
      return;
    }
    shown.forEach((event) => board.append(eventCard(event)));
  }

  async function loadEvents() {
    refreshButton.disabled = true;
    const { data, error } = await db
      .from("events")
      .select(PUBLIC_COLUMNS)
      .eq("status", "published")
      .gte("event_date", todayPacific())
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });
    refreshButton.disabled = false;

    if (error) {
      board.replaceChildren(el("li", "empty", "Couldn't load events right now. Please try Refresh."));
      console.error(error);
      return;
    }
    events = data || [];
    renderBoard();
  }

  const LABELS = {
    published: "Published",
    waiting: "Waiting for a moderator",
    rejected: "Not posted",
    duplicate: "Already posted",
    error: "Something went wrong",
  };

  function showResult(kind, message, reasons) {
    result.className = "result " + kind;
    result.replaceChildren(el("p", "result-label", LABELS[kind]));
    if (message) result.append(el("p", null, message));
    if (reasons && reasons.length > 0) {
      const list = el("ul", "reasons");
      reasons.forEach((reason) => list.append(el("li", null, reason)));
      result.append(list);
    }
    result.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const announcement = textarea.value.trim();
    if (!announcement) {
      showResult("error", "Please paste an announcement first.");
      return;
    }

    postButton.disabled = true;
    postButton.textContent = "The agent is reading your post…";
    result.hidden = true;

    try {
      const body = new FormData();
      body.append("announcement", announcement);
      const response = await fetch(AGENT_URL, {
        method: "POST",
        headers: { apikey: config.publishableKey },
        body,
      });
      const answer = await response.json().catch(() => ({ ok: false }));

      if (!answer.ok) {
        showResult("error", answer.message || "The agent didn't answer. Please try again in a minute.");
      } else {
        showResult(answer.status, answer.message, answer.reasons);
        if (answer.status === "published") {
          textarea.value = "";
          loadEvents();
        }
      }
    } catch (error) {
      console.error(error);
      showResult("error", "Couldn't reach the agent. Check your internet connection and try again.");
    } finally {
      postButton.disabled = false;
      postButton.textContent = "Send to the agent";
    }
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filter = chip.dataset.filter;
      chips.forEach((other) => other.setAttribute("aria-pressed", String(other === chip)));
      renderBoard();
    });
  });

  refreshButton.addEventListener("click", loadEvents);

  loadEvents();
})();
