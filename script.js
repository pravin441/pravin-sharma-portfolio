(() => {
  "use strict";

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

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

  /* ---------- Contact form (Web3Forms) ---------- */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (form && status) {
    const say = (msg, cls) => { status.textContent = msg; status.className = "form-status " + (cls || ""); };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = [...form.querySelectorAll("input[required], textarea[required]")];
      let firstBad = null;
      fields.forEach((f) => {
        const bad = !f.checkValidity() || !f.value.trim();
        f.setAttribute("aria-invalid", String(bad));
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) { say("Please fill in your name, a valid email and a message.", "err"); firstBad.focus(); return; }

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
        if (res.ok && data.success) { say("Message sent. Thank you, I'll reply soon.", "ok"); form.reset(); }
        else say("Could not send the message. Please email me directly.", "err");
      } catch {
        say("Network error. Please try again or email me directly.", "err");
      } finally {
        btn.disabled = false;
      }
    });
  }
})();