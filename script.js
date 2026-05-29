const SPREAD_LABELS = [
  "Cover",
  "Skills",
  "ASUCD",
  "Omnitrix",
  "Builds",
  "Campus",
  "Contact",
];

const spreads = [...document.querySelectorAll(".comic-spread")];
const TOTAL_SPREADS = spreads.length;

let currentSpread = 0;
let isTurning = false;

const turnPrev = document.getElementById("turnPrev");
const turnNext = document.getElementById("turnNext");
const spreadTabs = document.getElementById("spreadTabs");
const spreadProgress = document.getElementById("spreadProgress");
const openComicBtn = document.getElementById("openComicBtn");
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const turnDuration = () => (prefersReducedMotion() ? 80 : 620);

function initTabs() {
  if (!spreadTabs) return;
  spreadTabs.innerHTML = "";
  SPREAD_LABELS.forEach((label, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "tab";
    tab.textContent = label;
    tab.setAttribute("aria-label", `Go to ${label}`);
    tab.addEventListener("click", () => goToSpread(i));
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
  spreads.forEach((s, i) => {
    const isCurrent = i === currentSpread;
    const isAnimating =
      s.classList.contains("page-in-forward") ||
      s.classList.contains("page-in-back");
    if (!isAnimating) {
      s.classList.toggle("active", isCurrent);
    }
  });

  spreadTabs?.querySelectorAll(".tab").forEach((tab, i) => {
    tab.classList.toggle("active", i === currentSpread);
  });

  if (turnPrev) turnPrev.disabled = currentSpread === 0;
  if (turnNext) turnNext.disabled = currentSpread === TOTAL_SPREADS - 1;

  if (spreadProgress) {
    spreadProgress.textContent = `Spread ${currentSpread + 1} of ${TOTAL_SPREADS} · ${SPREAD_LABELS[currentSpread]}`;
  }

}

function clearPageAnimations(el) {
  el?.classList.remove(
    "page-out-forward",
    "page-out-back",
    "page-in-forward",
    "page-in-back"
  );
}

function goToSpread(index) {
  const next = Math.max(0, Math.min(TOTAL_SPREADS - 1, index));
  if (next === currentSpread || isTurning) return;

  const forward = next > currentSpread;
  isTurning = true;

  const prev = spreads[currentSpread];
  const incoming = spreads[next];

  prev.classList.remove("active", "animate-panels");
  incoming.classList.remove("active", "animate-panels");
  clearPageAnimations(prev);
  clearPageAnimations(incoming);

  if (prefersReducedMotion()) {
    incoming.classList.add("active");
    currentSpread = next;
    updateUI();
    animatePanels(incoming);
    isTurning = false;
    return;
  }

  prev.classList.add(forward ? "page-out-forward" : "page-out-back");
  incoming.classList.add(forward ? "page-in-forward" : "page-in-back");

  animatePanels(incoming);

  setTimeout(() => {
    clearPageAnimations(prev);
    clearPageAnimations(incoming);
    incoming.classList.add("active");
    currentSpread = next;
    updateUI();
    isTurning = false;
  }, turnDuration());
}

function turnPage(delta) {
  goToSpread(currentSpread + delta);
}

document.querySelectorAll("[data-goto]").forEach((el) => {
  el.addEventListener("click", () => {
    goToSpread(parseInt(el.getAttribute("data-goto"), 10));
  });
});

openComicBtn?.addEventListener("click", () => goToSpread(1));

turnPrev?.addEventListener("click", () => turnPage(-1));
turnNext?.addEventListener("click", () => turnPage(1));

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "PageDown") {
    e.preventDefault();
    turnPage(1);
  }
  if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault();
    turnPage(-1);
  }
});

initTabs();
updateUI();
requestAnimationFrame(() => animatePanels(spreads[0]));
