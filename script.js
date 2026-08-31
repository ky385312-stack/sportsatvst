/**
 * Vedam Sports Club — interactions
 *
 * Shared by index.html and login.html. Every initialiser is guarded, so the
 * module runs safely on a page that lacks a given feature.
 */

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------------------------------- */
/* Sticky navbar shadow state                                                  */
/* -------------------------------------------------------------------------- */
function initNavScrollState() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  const sync = () => nav.classList.toggle("is-stuck", window.scrollY > 12);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

/* -------------------------------------------------------------------------- */
/* Mobile drawer                                                               */
/* -------------------------------------------------------------------------- */
function initDrawer() {
  const toggle = document.querySelector("[data-drawer-toggle]");
  const drawer = document.querySelector("[data-drawer]");
  if (!toggle || !drawer) return;

  const setOpen = (open) => {
    drawer.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-locked", open);
    if (!open) toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener("click", () => {
    setOpen(!drawer.classList.contains("is-open"));
  });

  drawer.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      setOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 900 && drawer.classList.contains("is-open")) {
      setOpen(false);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Scroll-spy: highlight the section currently in view                          */
/* -------------------------------------------------------------------------- */
function initScrollSpy() {
  const links = Array.from(document.querySelectorAll(".nav-link[href^='#']"));
  if (!links.length) return;

  const map = new Map();
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) map.set(section, link);
  });
  if (!map.size) return;

  const activate = (link) => {
    links.forEach((item) => item.removeAttribute("aria-current"));
    if (link) link.setAttribute("aria-current", "true");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activate(map.get(visible.target));
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.6] }
  );

  map.forEach((_, section) => observer.observe(section));
}

/* -------------------------------------------------------------------------- */
/* Reveal on scroll (staggered, capped)                                        */
/* -------------------------------------------------------------------------- */
function initReveal() {
  const items = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!items.length) return;

  if (REDUCED_MOTION || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  // Stagger within a shared parent, hard-capped at 6 steps (<= 480ms).
  const groups = new Map();
  items.forEach((item) => {
    const parent = item.parentElement;
    const index = groups.get(parent) ?? 0;
    item.style.setProperty("--i", String(Math.min(index, 5)));
    groups.set(parent, index + 1);
    observer.observe(item);
  });
}

/* -------------------------------------------------------------------------- */
/* Impact counters                                                             */
/* -------------------------------------------------------------------------- */
function initCounters() {
  const counters = Array.from(document.querySelectorAll("[data-count-to]"));
  if (!counters.length) return;

  const format = (value, decimals) =>
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("en-US");

  const run = (el) => {
    const target = Number(el.dataset.countTo);
    if (Number.isNaN(target)) return;
    const decimals = (el.dataset.countTo.split(".")[1] || "").length;

    if (REDUCED_MOTION) {
      el.textContent = format(target, decimals);
      return;
    }

    const duration = 1300;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = format(target * eased, decimals);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(run);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------------------------------- */
/* Event filtering                                                             */
/* -------------------------------------------------------------------------- */
function initEventFilters() {
  const filterBar = document.querySelector("[data-filters]");
  const list = document.querySelector("[data-events]");
  if (!filterBar || !list) return;

  const chips = Array.from(filterBar.querySelectorAll("[data-filter]"));
  const cards = Array.from(list.querySelectorAll("[data-sport]"));
  const empty = document.querySelector("[data-events-empty]");
  const counter = document.querySelector("[data-events-count]");

  const apply = (filter) => {
    let shown = 0;

    cards.forEach((card) => {
      const match = filter === "all" || card.dataset.sport === filter;
      card.classList.toggle("is-hidden", !match);
      if (match) shown += 1;
    });

    chips.forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.filter === filter));
    });

    if (empty) empty.hidden = shown !== 0;
    if (counter) {
      counter.textContent = `${shown} ${shown === 1 ? "fixture" : "fixtures"}`;
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => apply(chip.dataset.filter));
  });

  apply("all");
}

/* -------------------------------------------------------------------------- */
/* Login form — frontend placeholder only, no authentication                    */
/* -------------------------------------------------------------------------- */
function initLoginForm() {
  const form = document.querySelector("[data-login-form]");
  if (!form) return;

  const username = form.querySelector("#username");
  const password = form.querySelector("#password");
  const note = form.querySelector("[data-login-note]");
  const submit = form.querySelector("[data-login-submit]");
  const reveal = form.querySelector("[data-reveal-password]");

  if (reveal && password) {
    reveal.addEventListener("click", () => {
      const shown = password.type === "text";
      password.type = shown ? "password" : "text";
      reveal.textContent = shown ? "Show" : "Hide";
      reveal.setAttribute("aria-pressed", String(!shown));
      password.focus({ preventScroll: true });
    });
  }

  const setError = (input, message) => {
    const field = input.closest(".field");
    const slot = field ? field.querySelector(".field__error") : null;
    if (field) field.classList.toggle("has-error", Boolean(message));
    if (slot) slot.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const validate = (input) => {
    const value = input.value.trim();

    if (!value) {
      setError(
        input,
        input === password
          ? "Enter your password to continue."
          : "Enter the username from your club membership card."
      );
      return false;
    }

    if (input === username && value.length < 3) {
      setError(input, "Usernames are at least 3 characters long.");
      return false;
    }

    if (input === password && value.length < 6) {
      setError(input, "Passwords are at least 6 characters long.");
      return false;
    }

    setError(input, "");
    return true;
  };

  [username, password].forEach((input) => {
    if (!input) return;
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) {
        validate(input);
      }
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const valid = [username, password].every((input) =>
      input ? validate(input) : true
    );
    if (!valid || !submit) return;

    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = "Checking your locker…";
    if (note) note.hidden = true;

    window.setTimeout(() => {
      submit.disabled = false;
      submit.textContent = label;
      if (note) {
        note.hidden = false;
        note.textContent =
          "This is a design preview — member sign-in is not connected yet. Your details were not sent anywhere.";
      }
    }, 850);
  });
}

/* -------------------------------------------------------------------------- */
/* Footer year                                                                 */
/* -------------------------------------------------------------------------- */
function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                        */
/* -------------------------------------------------------------------------- */
function boot() {
  initNavScrollState();
  initDrawer();
  initScrollSpy();
  initReveal();
  initCounters();
  initEventFilters();
  initLoginForm();
  initYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
