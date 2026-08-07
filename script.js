const SPREAD_LABELS = [
  "Cover",
  "Skills",
  "ASUCD",
  "Beyond Art",
  "Omnitrix",
  "Tone",
  "Builds",
  "Campus",
  "Contact",
];

const spreads = [...document.querySelectorAll(".comic-spread")];
const TOTAL_SPREADS = spreads.length;

let currentSpread = 0;
let isScrolling = false;

const comicScroll = document.getElementById("comicScroll");
const spreadTabs = document.getElementById("spreadTabs");
const spreadProgress = document.getElementById("spreadProgress");
const openComicBtn = document.getElementById("openComicBtn");
const chromeBrand = document.getElementById("chromeBrand");

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getPageHeight() {
  return comicScroll?.clientHeight || window.innerHeight;
}

function releaseChromeFocus() {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el.closest(".comic-chrome-top")) {
    el.blur();
  }
}

function initTabs() {
  if (!spreadTabs) return;
  spreadTabs.innerHTML = "";
  SPREAD_LABELS.forEach((label, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "tab";
    tab.textContent = label;
    tab.setAttribute("aria-label", `Go to ${label}`);
    tab.addEventListener("click", () => {
      goToSpread(i);
      releaseChromeFocus();
    });
    spreadTabs.appendChild(tab);
  });
}

function animatePanels(spreadEl) {
  if (!spreadEl || prefersReducedMotion()) return;

  spreadEl.classList.remove("animate-panels");
  const items = spreadEl.querySelectorAll(
    ".panel, .mini-panel, .stat-block"
  );
  items.forEach((el) => {
    el.style.animationDelay = "";
    el.style.animation = "";
  });

  void spreadEl.offsetWidth;

  items.forEach((el, i) => {
    el.style.animationDelay = `${0.08 + i * 0.04}s`;
  });

  spreadEl.classList.add("animate-panels");
}

function updateUI() {
  spreadTabs?.querySelectorAll(".tab").forEach((tab, i) => {
    tab.classList.toggle("active", i === currentSpread);
  });

  if (spreadProgress) {
    spreadProgress.textContent = `Spread ${currentSpread + 1} of ${TOTAL_SPREADS} · ${SPREAD_LABELS[currentSpread]}`;
  }
}

function setCurrentSpread(index) {
  const next = Math.max(0, Math.min(TOTAL_SPREADS - 1, index));
  if (next === currentSpread) return;
  currentSpread = next;
  updateUI();
  animatePanels(spreads[currentSpread]);
}

function syncSpreadFromScroll() {
  if (!comicScroll || isScrolling) return;

  const pageH = getPageHeight();
  if (!pageH) return;

  const index = Math.round(comicScroll.scrollTop / pageH);
  setCurrentSpread(index);
}

function goToSpread(index) {
  const next = Math.max(0, Math.min(TOTAL_SPREADS - 1, index));
  if (!comicScroll) return;

  const pageH = getPageHeight();
  const targetTop = next * pageH;

  if (Math.abs(comicScroll.scrollTop - targetTop) < 2 && next === currentSpread) {
    return;
  }

  isScrolling = true;
  comicScroll.scrollTo({
    top: targetTop,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });

  setCurrentSpread(next);

  const unlock = () => {
    isScrolling = false;
    syncSpreadFromScroll();
  };

  if (prefersReducedMotion()) {
    unlock();
    return;
  }

  clearTimeout(goToSpread.scrollTimer);
  goToSpread.scrollTimer = setTimeout(unlock, 520);
}

function turnPage(delta) {
  goToSpread(currentSpread + delta);
}

function initScrollSnap() {
  if (!comicScroll) return;

  let scrollRaf = null;
  comicScroll.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        syncSpreadFromScroll();
        scrollRaf = null;
      });
    },
    { passive: true }
  );

  const observer = new IntersectionObserver(
    (entries) => {
      if (isScrolling) return;
      let best = null;
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { el: entry.target, ratio: entry.intersectionRatio };
          }
        }
      });
      if (best) {
        const i = spreads.indexOf(best.el);
        if (i !== -1) setCurrentSpread(i);
      }
    },
    { root: comicScroll, threshold: [0.45, 0.55, 0.65, 0.75] }
  );

  spreads.forEach((spread) => observer.observe(spread));

  window.addEventListener("resize", () => {
    goToSpread(currentSpread);
  });
}

document.querySelectorAll("[data-goto]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    goToSpread(parseInt(el.getAttribute("data-goto"), 10));
  });
});

openComicBtn?.addEventListener("click", () => goToSpread(1));
chromeBrand?.addEventListener("click", () => {
  goToSpread(0);
  releaseChromeFocus();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "PageDown") {
    e.preventDefault();
    turnPage(1);
  }
  if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault();
    turnPage(-1);
  }
  if (e.key === "Home") {
    e.preventDefault();
    goToSpread(0);
  }
  if (e.key === "End") {
    e.preventDefault();
    goToSpread(TOTAL_SPREADS - 1);
  }
});

initTabs();
initScrollSnap();
updateUI();
requestAnimationFrame(() => animatePanels(spreads[0]));
