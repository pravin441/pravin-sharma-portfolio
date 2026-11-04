(() => {
  "use strict";

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle (dark / light) ---------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");

  const applyTheme = (theme, save) => {
    root.setAttribute("data-theme", theme);
    if (themeBtn) themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0a0d17" : "#f4f6fc");
    if (save) { try { localStorage.setItem("theme", theme); } catch (e) { /* storage blocked */ } }
  };
  applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark", false);
  if (themeBtn) themeBtn.addEventListener("click", () => {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
  });

  /* ---------- Navbar shadow after scrolling ---------- */
  const navbar = document.querySelector(".navbar");
  const onScroll = () => navbar && navbar.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");

  const setMenu = (open) => {
    if (!toggle || !menu) return;
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); toggle.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (menu.classList.contains("open") && !e.target.closest(".navbar")) setMenu(false);
    });
    // Reset when resizing up to desktop
    window.matchMedia("(min-width: 768px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });
  }

  /* ---------- Active link highlighting ---------- */
  const links = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const sections = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);

  const setActive = (id) => {
    links.forEach((l) => {
      const on = l.getAttribute("href") === "#" + id;
      l.classList.toggle("active", on);
      if (on) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Scroll reveal ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const targets = document.querySelectorAll(".section .section-title, .section .tile");
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        ro.unobserve(el);
        el.classList.add("in");
        // Remove helper classes afterwards so normal hover transitions return
        setTimeout(() => el.classList.remove("reveal", "in"), 700);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach((el) => {
      const index = [...el.parentElement.children].indexOf(el);
      el.style.transitionDelay = Math.min(index, 4) * 60 + "ms";
      el.classList.add("reveal");
      ro.observe(el);
    });
  }

  /* ---------- Contact form: validation + Web3Forms ---------- */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (form && status) {
    const fields = {
      name: form.elements["name"],
      email: form.elements["email"],
      message: form.elements["message"],
    };
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const errorFor = (key) => document.getElementById(key + "-error");

    const validators = {
      name: (v) => !v ? "Please enter your name." : v.length < 2 ? "Name must be at least 2 characters." : "",
      email: (v) => !v ? "Please enter your email." : !EMAIL.test(v) ? "Enter a valid email, like name@example.com." : "",
      message: (v) => !v ? "Please write a message." : v.length < 10 ? "Message must be at least 10 characters (" + v.length + " so far)." : "",
    };

    const check = (key) => {
      const msg = validators[key](fields[key].value.trim());
      errorFor(key).textContent = msg;
      fields[key].setAttribute("aria-invalid", String(Boolean(msg)));
      return !msg;
    };

    const say = (msg, cls) => { status.textContent = msg; status.className = "form-status " + (cls || ""); };

    // Validate on leaving a field, then live while fixing it
    Object.keys(fields).forEach((key) => {
      fields[key].addEventListener("blur", () => check(key));
      fields[key].addEventListener("input", () => {
        if (fields[key].getAttribute("aria-invalid") === "true") check(key);
      });
    });

    const counter = document.getElementById("message-count");
    fields.message.addEventListener("input", () => {
      counter.textContent = fields.message.value.length + " / 500";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const results = Object.keys(fields).map(check);
      const firstBad = Object.keys(fields).find((_, i) => !results[i]);
      if (firstBad) { say("Please fix the highlighted fields.", "err"); fields[firstBad].focus(); return; }

      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      say("Sending...");
      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          say("Message sent. Thank you, I'll reply soon.", "ok");
          form.reset();
          counter.textContent = "0 / 500";
          Object.keys(fields).forEach((k) => fields[k].removeAttribute("aria-invalid"));
        } else {
          say("Could not send the message. Please email me directly.", "err");
        }
      } catch (err) {
        say("Network error. Please try again or email me directly.", "err");
      } finally {
        btn.disabled = false;
      }
    });
  }
})();