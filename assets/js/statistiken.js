console.log("🧪 Script wurde geladen");

let statsData = [];

async function loadStats() {
  console.log("⏳ Lade JSON...");
  statsData = await loadDump("best_records_alltime.json");
  console.log("✅ JSON geladen:", statsData);
}

function renderStats(mode) {
  console.log("🧪 renderStats aufgerufen mit:", mode);

  const container = document.getElementById("records-output");
  container.innerHTML = ""; // Vorherige Karten entfernen
  container.classList.remove("visible");

  // Accordion automatisch öffnen (nur beim ersten Mal)
  const accordion = document.querySelector("#accordion-records");
  if (accordion && !accordion.open) {
    accordion.open = true;
  }

  const fields = [
    { key: "Best Leg", label: "Best Leg", format: v => `${v.wert} <strong>${v.spieler}</strong>` },
    { key: "Highest Checkout", label: "Highest Checkout" },
    { key: "Best 3 Dart Average", label: "Best 3 Dart Average" },
    { key: "Best First 9 Avg", label: "Best First 9 Avg" },
    { key: "Most TONs", label: "Most TONs" },
    { key: "Most 140s", label: "Most 140s" },
    { key: "Most 180s", label: "Most 180s" },
  ];

  const datensatz = statsData.find(d => d.modus === mode);
  if (!datensatz) {
    console.warn("❌ Kein Modus gefunden:", mode);
    return;
  }

  const cards = fields.map(f => {
    const eintrag = datensatz.einträge.find(e => e.kategorie === f.key);
    if (!eintrag) return "";

    const val = f.format ? f.format(eintrag) : `${eintrag.wert}`;
    const name = f.format ? "" : eintrag.spieler;

    return `
      <div class="record-card">
        <div class="record-label">${f.label}</div>
        <div class="record-value">${val}</div>
        ${name ? `<div class="record-player">${name}</div>` : ""}
      </div>
    `;
  }).join("");

  container.innerHTML = cards;

  requestAnimationFrame(() => {
    container.classList.add("visible");
  });
}

// Init
(async () => {
  await loadStats();
  console.log("📦 best_records_alltime.json geladen:", statsData);

  document.querySelector(".record-toggle-buttons")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".record-btn");
    if (!btn) return;

    document.querySelectorAll(".record-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.dataset.mode;
    console.log("📌 Button geklickt:", mode);
    renderStats(mode);
  });

  // Optional direkt laden:
  // renderStats("overall");
})();
