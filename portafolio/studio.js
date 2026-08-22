/* Director de estilo — el texto del usuario redefine toda la página */

(() => {
  const form = document.getElementById("style-form");
  const input = document.getElementById("style-input");
  const result = document.getElementById("style-result");
  const applyBtn = document.getElementById("style-apply");
  const resetBtn = document.getElementById("style-reset");
  const chips = document.querySelectorAll(".styler__chip");
  const root = document.documentElement;

  if (!form || !input) return;

  const THEMES = {
    espacio: {
      label: "Espacio profundo",
      vars: {
        "--bg": "#0c0e12",
        "--bg-soft": "#141820",
        "--surface": "rgba(22, 26, 34, 0.88)",
        "--surface-solid": "#171b24",
        "--ink": "#ece8e1",
        "--muted": "#9a958c",
        "--line": "rgba(236, 232, 225, 0.12)",
        "--accent": "#c4b49a",
        "--accent-soft": "rgba(196, 180, 154, 0.14)",
        "--warm": "#b8896a",
        "--warm-soft": "rgba(184, 137, 106, 0.14)",
        "--hero-deep": "#0c0e12",
      },
      space: {
        bg: "#0c0e12",
        hazeA: "rgba(55,62,78,0.28)",
        hazeB: "rgba(70,58,48,0.16)",
        star: "236,232,225",
      },
    },
    oceano: {
      label: "Océano calmado",
      vars: {
        "--bg": "#0d151a",
        "--bg-soft": "#152228",
        "--surface": "rgba(18, 32, 38, 0.9)",
        "--surface-solid": "#15262e",
        "--ink": "#e4eef0",
        "--muted": "#8aa0a6",
        "--line": "rgba(228, 238, 240, 0.12)",
        "--accent": "#7f9e98",
        "--accent-soft": "rgba(127, 158, 152, 0.16)",
        "--warm": "#c4a484",
        "--warm-soft": "rgba(196, 164, 132, 0.14)",
        "--hero-deep": "#0d151a",
      },
      space: {
        bg: "#0d151a",
        hazeA: "rgba(40,70,78,0.3)",
        hazeB: "rgba(60,80,70,0.18)",
        star: "220,236,238",
      },
    },
    bosque: {
      label: "Bosque nocturno",
      vars: {
        "--bg": "#0e1410",
        "--bg-soft": "#17201a",
        "--surface": "rgba(22, 32, 26, 0.9)",
        "--surface-solid": "#1a261e",
        "--ink": "#e8eee6",
        "--muted": "#93a090",
        "--line": "rgba(232, 238, 230, 0.12)",
        "--accent": "#8a9a7a",
        "--accent-soft": "rgba(138, 154, 122, 0.16)",
        "--warm": "#b89a6a",
        "--warm-soft": "rgba(184, 154, 106, 0.14)",
        "--hero-deep": "#0e1410",
      },
      space: {
        bg: "#0e1410",
        hazeA: "rgba(45,65,50,0.32)",
        hazeB: "rgba(70,60,40,0.16)",
        star: "232,238,230",
      },
    },
    desierto: {
      label: "Desierto cálido",
      vars: {
        "--bg": "#16120e",
        "--bg-soft": "#221c16",
        "--surface": "rgba(36, 28, 22, 0.92)",
        "--surface-solid": "#2a221a",
        "--ink": "#f0e6d8",
        "--muted": "#b0a090",
        "--line": "rgba(240, 230, 216, 0.14)",
        "--accent": "#c4a484",
        "--accent-soft": "rgba(196, 164, 132, 0.18)",
        "--warm": "#c48a5a",
        "--warm-soft": "rgba(196, 138, 90, 0.16)",
        "--hero-deep": "#16120e",
      },
      space: {
        bg: "#16120e",
        hazeA: "rgba(80,60,40,0.3)",
        hazeB: "rgba(100,70,40,0.18)",
        star: "240,230,216",
      },
    },
    papel: {
      label: "Papel claro",
      vars: {
        "--bg": "#eef1f4",
        "--bg-soft": "#e4e9ef",
        "--surface": "rgba(255, 255, 255, 0.9)",
        "--surface-solid": "#ffffff",
        "--ink": "#1b1f27",
        "--muted": "#66707c",
        "--line": "rgba(27, 31, 39, 0.12)",
        "--accent": "#3b6d8f",
        "--accent-soft": "rgba(59, 109, 143, 0.12)",
        "--warm": "#b8896a",
        "--warm-soft": "rgba(184, 137, 106, 0.14)",
        "--hero-deep": "#24384a",
      },
      space: {
        bg: "#eef1f4",
        hazeA: "rgba(59,109,143,0.12)",
        hazeB: "rgba(184,137,106,0.1)",
        star: "27,31,39",
      },
    },
    lava: {
      label: "Roca volcánica",
      vars: {
        "--bg": "#120e0e",
        "--bg-soft": "#1c1614",
        "--surface": "rgba(34, 24, 22, 0.92)",
        "--surface-solid": "#261c1a",
        "--ink": "#f0e4dc",
        "--muted": "#a89890",
        "--line": "rgba(240, 228, 220, 0.12)",
        "--accent": "#c49a82",
        "--accent-soft": "rgba(196, 154, 130, 0.16)",
        "--warm": "#c45a3d",
        "--warm-soft": "rgba(196, 90, 61, 0.16)",
        "--hero-deep": "#120e0e",
      },
      space: {
        bg: "#120e0e",
        hazeA: "rgba(80,40,30,0.28)",
        hazeB: "rgba(90,50,30,0.16)",
        star: "240,228,220",
      },
    },
  };

  function applyTheme(theme, customLabel) {
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 700);

    if (result) {
      result.textContent = `Estilo actual: ${customLabel || theme.label}`;
    }

    chips.forEach((chip) => {
      const key = chip.dataset.style;
      chip.classList.toggle("is-active", THEMES[key] === theme);
    });

    window.dispatchEvent(
      new CustomEvent("portfolio:theme", {
        detail: { space: theme.space, label: customLabel || theme.label },
      })
    );
  }

  function matchPrompt(text) {
    const t = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    if (/(ocean|mar|aqua|azul|calm|water|ola)/.test(t)) return THEMES.oceano;
    if (/(bosque|verde|forest|selva|nature|musgo)/.test(t)) return THEMES.bosque;
    if (/(desierto|arena|warm|calid|dorado|sunset|atardecer)/.test(t)) return THEMES.desierto;
    if (/(claro|light|papel|blanco|minimal|dia|day)/.test(t)) return THEMES.papel;
    if (/(lava|volcan|fuego|rojo|magma|ember)/.test(t)) return THEMES.lava;
    if (/(espacio|cosmos|noche|oscuro|space|star|galaxia)/.test(t)) return THEMES.espacio;

    /* fallback: mezcla suave según palabras de temperatura/contraste */
    if (/(suave|soft|elegante|profesional)/.test(t)) return THEMES.oceano;
    return THEMES.espacio;
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const theme = THEMES[chip.dataset.style];
      if (!theme) return;
      input.value = theme.label;
      applyTheme(theme);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    applyBtn.disabled = true;
    applyBtn.textContent = "Aplicando…";
    window.setTimeout(() => {
      const theme = matchPrompt(text);
      applyTheme(theme, text.length > 42 ? `${theme.label} (personalizado)` : text);
      applyBtn.disabled = false;
      applyBtn.textContent = "Aplicar estilo";
    }, 180);
  });

  resetBtn?.addEventListener("click", () => {
    input.value = "";
    applyTheme(THEMES.espacio);
  });

  /* estado inicial */
  applyTheme(THEMES.espacio);
})();
