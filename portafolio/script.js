/* Portafolio espacial 3D — Isaac David Villalba López */

(() => {
  const CONTACT_EMAIL = "YOUR_EMAIL";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const header = document.getElementById("header");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");
  const yearEl = document.getElementById("year");
  const contactForm = document.getElementById("contact-form");

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Fondo estelar — se adapta al estilo elegido */
  const spaceBg = document.getElementById("space-bg");
  const spaceHaze = document.querySelector(".space-haze");
  let spaceTheme = {
    bg: "#0c0e12",
    hazeA: "rgba(55,62,78,0.28)",
    hazeB: "rgba(70,58,48,0.16)",
    star: "236,232,225",
  };

  if (spaceBg) {
    const ctx = spaceBg.getContext("2d");
    let stars = [];

    const resize = () => {
      spaceBg.width = window.innerWidth;
      spaceBg.height = window.innerHeight;
      const count = Math.min(220, Math.floor((spaceBg.width * spaceBg.height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * spaceBg.width,
        y: Math.random() * spaceBg.height,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.7 + 0.25,
        s: Math.random() * 0.02 + 0.005,
        p: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t = 0) => {
      if (!ctx) return;
      ctx.fillStyle = spaceTheme.bg;
      ctx.fillRect(0, 0, spaceBg.width, spaceBg.height);

      const g1 = ctx.createRadialGradient(
        spaceBg.width * 0.2,
        spaceBg.height * 0.25,
        0,
        spaceBg.width * 0.2,
        spaceBg.height * 0.25,
        spaceBg.width * 0.45
      );
      g1.addColorStop(0, spaceTheme.hazeA);
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, spaceBg.width, spaceBg.height);

      const g2 = ctx.createRadialGradient(
        spaceBg.width * 0.85,
        spaceBg.height * 0.15,
        0,
        spaceBg.width * 0.85,
        spaceBg.height * 0.15,
        spaceBg.width * 0.35
      );
      g2.addColorStop(0, spaceTheme.hazeB);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, spaceBg.width, spaceBg.height);

      stars.forEach((star) => {
        const twinkle = reduceMotion
          ? star.a * 0.7
          : star.a * (0.4 + 0.35 * Math.sin(t * star.s + star.p));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${spaceTheme.star},${twinkle * 0.75})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reduceMotion) requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    window.addEventListener("resize", () => {
      resize();
      if (reduceMotion) draw(0);
    });

    window.addEventListener("portfolio:theme", (e) => {
      if (e.detail?.space) {
        spaceTheme = e.detail.space;
        if (spaceHaze) {
          spaceHaze.style.background = `
            radial-gradient(ellipse 50% 35% at 18% 22%, ${spaceTheme.hazeA}, transparent 62%),
            radial-gradient(ellipse 45% 40% at 82% 18%, ${spaceTheme.hazeB}, transparent 58%)
          `;
        }
        if (reduceMotion) draw(0);
      }
    });
  }

  const onScroll = () => {
    header?.classList.toggle("header--scrolled", window.scrollY > 16);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenuOpen = (open) => {
    if (!navMenu || !navToggle) return;
    navMenu.classList.toggle("nav__menu--open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.style.overflow = open ? "hidden" : "";
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      setMenuOpen(navToggle.getAttribute("aria-expanded") !== "true");
    });
    navMenu.querySelectorAll(".nav__link").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("reveal--visible"));
  }

  /* 3D tilt — suave */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const max = Number(el.getAttribute("data-tilt-max") || 8);
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * max;
        const ry = (px - 0.5) * max;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* Galería 3D */
  const ring = document.getElementById("gallery-ring");
  const cards = ring ? Array.from(ring.querySelectorAll(".gallery3d__card")) : [];
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");
  const dotsWrap = document.getElementById("gallery-dots");
  const caption = document.getElementById("gallery-caption");
  const gallery = document.getElementById("gallery3d");

  if (ring && cards.length) {
    let index = 0;
    const angleStep = 360 / cards.length;
    const radius = window.innerWidth < 768 ? 240 : 340;

    cards.forEach((card, i) => {
      card.style.transform = `rotateY(${i * angleStep}deg) translateZ(${radius}px)`;
    });

    if (dotsWrap) {
      cards.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery3d__dot";
        dot.setAttribute("aria-label", `Ir al proyecto ${i + 1}`);
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    const update = () => {
      ring.style.transform = `translateZ(-${radius}px) rotateY(${-index * angleStep}deg)`;
      cards.forEach((card, i) => {
        card.classList.toggle("gallery3d__card--active", i === index);
      });
      dotsWrap?.querySelectorAll(".gallery3d__dot").forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
      if (caption) {
        const title =
          cards[index].getAttribute("data-title") ||
          cards[index].querySelector(".project-card__title")?.textContent ||
          "";
        caption.textContent = `${index + 1} / ${cards.length} · ${title}`;
      }
    };

    const goTo = (i) => {
      index = (i + cards.length) % cards.length;
      update();
    };

    prevBtn?.addEventListener("click", () => goTo(index - 1));
    nextBtn?.addEventListener("click", () => goTo(index + 1));

    if (gallery && finePointer) {
      let dragging = false;
      let startX = 0;
      let startIndex = 0;

      gallery.addEventListener("pointerdown", (e) => {
        if (e.target.closest("a, button")) return;
        dragging = true;
        startX = e.clientX;
        startIndex = index;
        gallery.setPointerCapture?.(e.pointerId);
      });
      gallery.addEventListener("pointerup", () => {
        dragging = false;
      });
      gallery.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 70) {
          goTo(startIndex + (dx < 0 ? 1 : -1));
          startX = e.clientX;
          startIndex = index;
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (!gallery) return;
      const rect = gallery.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    });

    update();
  }

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("contact-name")?.value.trim();
      const email = document.getElementById("contact-email")?.value.trim();
      const message = document.getElementById("contact-message")?.value.trim();
      if (!name || !email || !message) {
        contactForm.reportValidity();
        return;
      }
      const subject = encodeURIComponent(`Portafolio — mensaje de ${name}`);
      const body = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\n${message}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    });
  }
})();
