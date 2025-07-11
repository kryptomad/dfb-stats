async function loadNextMatchdays(spieltagNummer = 5) {
    loadDump('next_matchdays.json')
        .then(value => value.find(e => e.matchday === spieltagNummer))
        .then(value => {
            document.getElementById("matchday-title").textContent = value.matchday;

            const tbody = document.querySelector("#oskar-tabelle tbody");
            tbody.innerHTML = "";

            value.games.forEach(game => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
              <td class="center writer-gray">${game.writer}</td>
              <td class="center">${game.player1}</td>
              <td class="center">${game.player2}</td>
            `;
                tbody.appendChild(tr);
            });
        })
}

async function loadLastStats() {
    loadDump('last_stats.json')
        .then(data => {
            const tbody = document.querySelector("#lastStatsTable tbody");

            data.forEach(entry => {
                const tr = document.createElement("tr");

                const tdKategorie = document.createElement("td");
                tdKategorie.textContent = entry.kategorie;
                tdKategorie.className = "center";

                const tdWert = document.createElement("td");
                tdWert.textContent = entry.wert;
                tdWert.className = "center";

                const tdSpieler = document.createElement("td");
                tdSpieler.textContent = Array.isArray(entry.spieler)
                    ? entry.spieler.join(", ")
                    : entry.spieler;
                tdSpieler.className = "center";

                tr.appendChild(tdKategorie);
                tr.appendChild(tdWert);
                tr.appendChild(tdSpieler);

                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Fehler beim Laden der last_stats.json:", err);
        });
}
