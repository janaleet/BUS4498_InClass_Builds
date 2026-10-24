// Club Event Radar: the website's code.
// It lists published events from the database and sends new announcements to the AI agent.
// Every piece of text from a post is shown with textContent, never innerHTML.

(function () {
  const config = window.EVENT_RADAR_CONFIG;
  const db = window.supabase.createClient(config.supabaseUrl, config.publishableKey);
  const AGENT_URL = config.supabaseUrl + "/functions/v1/submit-event";
  // Flyers are shown only when they come from this project's flyers bucket.
  const FLYER_PREFIX = config.supabaseUrl + "/storage/v1/object/public/flyers/";
  const MAX_FLYER_BYTES = 5 * 1024 * 1024;

  // Only the columns the website is allowed to read.
  const PUBLIC_COLUMNS =
    "id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary, flyer_url";

  const board = document.getElementById("board");
  const form = document.getElementById("post-form");
  const textarea = document.getElementById("announcement");
  const flyerInput = document.getElementById("flyer");
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

    if (event.flyer_url && event.flyer_url.startsWith(FLYER_PREFIX)) {
      const flyer = el("img", "flyer");
      flyer.src = event.flyer_url;
      flyer.alt = "Flyer for " + (event.title || "this event");
      flyer.loading = "lazy";
      item.append(flyer);
    }
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
    const flyer = flyerInput.files[0];
    if (flyer && !["image/jpeg", "image/png"].includes(flyer.type)) {
      showResult("error", "The photo must be a JPG or PNG.");
      return;
    }
    if (flyer && flyer.size > MAX_FLYER_BYTES) {
      showResult("error", "The photo is bigger than 5 MB. Please use a smaller one.");
      return;
    }

    postButton.disabled = true;
    postButton.textContent = "The agent is reading your post…";
    result.hidden = true;

    try {
      const body = new FormData();
      body.append("announcement", announcement);
      if (flyer) body.append("flyer", flyer);
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
        if (answer.status === "published" || answer.status === "waiting") {
          textarea.value = "";
          flyerInput.value = "";
        }
        if (answer.status === "published") loadEvents();
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

  // ---------- moderators ----------
  // Signed-in moderators can read every post and change only its review columns (see the Stage 8 migration).

  const signInForm = document.getElementById("sign-in-form");
  const signInButton = document.getElementById("sign-in-button");
  const signInResult = document.getElementById("sign-in-result");
  const modPanel = document.getElementById("mod-panel");
  const modWho = document.getElementById("mod-who");
  const waitingBoard = document.getElementById("waiting-board");
  const signOutButton = document.getElementById("sign-out");

  let moderator = null;

  function reviewCard(event) {
    const item = eventCard(event);
    const review = el("div", "review");
    review.append(el("p", "why", event.status_reason || "Waiting for a moderator."));
    if (event.note_for_moderator) review.append(el("p", "why", "Note: " + event.note_for_moderator));
    review.append(el("p", "original", event.announcement));

    const actions = el("p", "actions");
    const approve = el("button", null, "Approve");
    approve.type = "button";
    const reject = el("button", "ghost", "Reject");
    reject.type = "button";
    approve.addEventListener("click", () => reviewPost(event.id, "published", [approve, reject]));
    reject.addEventListener("click", () => reviewPost(event.id, "rejected", [approve, reject]));
    actions.append(approve, reject);
    review.append(actions);

    item.querySelector(".event-body").append(review);
    return item;
  }

  async function loadWaiting() {
    const { data, error } = await db
      .from("events")
      .select("*")
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    waitingBoard.replaceChildren();
    if (error) {
      console.error(error);
      waitingBoard.append(el("li", "empty", "Couldn't load waiting posts. Please try again."));
      return;
    }
    if (data.length === 0) {
      waitingBoard.append(el("li", "empty", "Nothing is waiting. Nice work!"));
      return;
    }
    data.forEach((event) => waitingBoard.append(reviewCard(event)));
  }

  async function reviewPost(id, status, buttons) {
    buttons.forEach((button) => (button.disabled = true));
    const { data, error } = await db
      .from("events")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: moderator.email || "" })
      .eq("id", id)
      .select("id");

    if (error || !data || data.length === 0) {
      console.error(error);
      buttons.forEach((button) => (button.disabled = false));
      alert("That didn't save. Please sign in again and retry.");
      return;
    }
    loadWaiting();
    if (status === "published") loadEvents();
  }

  function showSignedIn(user) {
    moderator = user;
    if (user) {
      signInForm.hidden = true;
      modPanel.hidden = false;
      modWho.textContent = "Signed in as " + (user.email || "a moderator");
      loadWaiting();
    } else {
      signInForm.hidden = false;
      modPanel.hidden = true;
      waitingBoard.replaceChildren();
    }
  }

  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    signInButton.disabled = true;
    signInResult.hidden = true;
    const { data, error } = await db.auth.signInWithPassword({
      email: document.getElementById("mod-email").value.trim(),
      password: document.getElementById("mod-password").value,
    });
    signInButton.disabled = false;
    document.getElementById("mod-password").value = "";

    if (error) {
      signInResult.className = "result error";
      signInResult.replaceChildren(
        el("p", "result-label", "Couldn't sign in"),
        el("p", null, "Check the email and password and try again."),
      );
      signInResult.hidden = false;
      return;
    }
    showSignedIn(data.user);
  });

  signOutButton.addEventListener("click", async () => {
    await db.auth.signOut();
    showSignedIn(null);
  });

  // Stay signed in after a page reload.
  db.auth.getSession().then(({ data }) => {
    if (data.session) {
      document.getElementById("mod").open = true;
      showSignedIn(data.session.user);
    }
  });

  loadEvents();
})();
