function createTd(data, classes = "center") {
    const td = document.createElement("td");
    td.textContent = Array.isArray(data) ? data.join(", ") : data;
    td.className = classes;

    return td;
}

async function loadNextMatchdays(spieltagNummer = 5) {
    loadDump('next_matchdays.json')
        .then(value => value.find(e => e.matchday === spieltagNummer))
        .then(value => {
            document.getElementById("matchday-title").textContent = value.matchday;

            const tbody = document.querySelector("#oskar-tabelle tbody");

            value.games.forEach(game => {
                const tr = document.createElement("tr");
                tr.appendChild(createTd(game.writer, "center writer-gray"));
                tr.appendChild(createTd(game.player1));
                tr.appendChild(createTd(game.player2));

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

                tr.appendChild(createTd(entry.kategorie));
                tr.appendChild(createTd(entry.wert));
                tr.appendChild(createTd(entry.spieler));

                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Fehler beim Laden der last_stats.json:", err);
        });
}

function loadNextMatchday() {
    loadDump('nextMatchday.json')
        .then(data => {
            document.querySelector(".nextMatchday .gastgeber").innerHTML = data.gastgeber;
            document.querySelector(".nextMatchday .datum").innerHTML = data.datum;
            document.querySelector(".nextMatchday .zeit").innerHTML = data.zeit;
            document.querySelector(".nextMatchday .oskardarten")?.classList.add(data.oskardarten ? 'active' : 'inactive');
            document.querySelector(".nextMatchday .gelddarten")?.classList.add(data.gelddarten ? 'active' : 'inactive');
        })
}