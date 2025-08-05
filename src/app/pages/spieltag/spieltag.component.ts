import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GamesService } from '../../services/games.service';
import { NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-spieltag',
  imports: [Card, NgForOf, NgIf, ChartModule, TableModule, RouterModule],
  providers: [GamesService],
  templateUrl: './spieltag.component.html',
  styleUrl: './spieltag.component.scss',
})
export class SpieltagComponent implements OnInit {
  letzteSpieltage: any[] = [];
  jahrestabelle: any[] = [];
  aktuelleSaison: string = '';

  // Chart Properties nur DEKLARIEREN (nicht befüllen!)
  barChartData: any;
  barChartOptions: any;

  constructor(private gamesService: GamesService) {}

  ngOnInit() {
    this.letzteSpieltage = this.gamesService.getLastNSpieltage(10);
    this.aktuelleSaison = this.gamesService.getCurrentSeason();

    const rootStyle = getComputedStyle(document.documentElement);
    const primaryColor =
      rootStyle.getPropertyValue('--primary-color').trim() || '#2196F3';
    const secondaryColor =
      rootStyle.getPropertyValue('--text-color-secondary').trim() || '#aaa';

    // Helper: HEX nach RGBA konvertieren
    function hexToRgba(hex: string, alpha: number): string {
      // Entferne das '#' falls vorhanden
      hex = hex.replace('#', '');
      // Kurzform (#abc) → #aabbcc
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((x) => x + x)
          .join('');
      }
      const num = parseInt(hex, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }

    const primaryColorRgba = hexToRgba(primaryColor, 0.55);
    const secondaryColorRgba = hexToRgba(secondaryColor, 0.4);

    // 1. Alle Spiele der aktuellen Saison holen
    const aktuelleSpiele = this.gamesService
      .getAllGames()
      .filter((s) => s.season === this.aktuelleSaison);

    // 2. Aktuellster Spieltag bestimmen
    const maxMatchday = Math.max(...aktuelleSpiele.map((s) => s.matchday));

    // 3. Tabellen für jetzt und für den vorigen Spieltag berechnen
    const tabelleJetzt =
      this.gamesService.getJahrestabelleBisSpieltag(maxMatchday);
    const tabelleVorher = this.gamesService.getJahrestabelleBisSpieltag(
      maxMatchday - 1,
    );

    // 4. Trends berechnen und speichern
    this.jahrestabelle = tabelleJetzt.map((eintrag) => {
      const vorher = tabelleVorher.find((e) => e.name === eintrag.name);
      return {
        ...eintrag,
        altePunkte: vorher ? vorher.punkte : 0,
        alterPlatz: vorher ? vorher.platz : eintrag.platz,
        trend: !vorher
          ? 'same'
          : vorher.platz > eintrag.platz
            ? 'up'
            : vorher.platz < eintrag.platz
              ? 'down'
              : 'same',
      };
    });

    const aktuellerSpieltag = maxMatchday; // wie in deiner Logik
    const altLabel = `Vor Spieltag ${aktuellerSpieltag}`;
    const neuLabel = `Punkte hinzu nach Spieltag ${aktuellerSpieltag}`;

    const isDark = document.documentElement.className.includes('dark');
    const axisColor = isDark ? '#e5e7eb' : '#575757ff';

    // **JETZT** Chartdaten befüllen!
    this.barChartData = {
      labels: this.jahrestabelle.map((e) => e.name),
      datasets: [
        {
          label: 'Punkte vorher',
          backgroundColor: secondaryColorRgba,
          data: this.jahrestabelle.map((e) => Number(e.altePunkte)),
        },
        {
          label: neuLabel,
          backgroundColor: primaryColorRgba,
          data: this.jahrestabelle.map(
            (e) => Number(e.punkte) - Number(e.altePunkte),
          ),
        },
      ],
    };

    this.barChartOptions = {
      plugins: {
        legend: {
          display: true,
          labels: {
            color: axisColor, // <--- Legenden-Textfarbe
          },
        },
        datalabels: { display: false }, // Labels im Balken aus!
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: axisColor, // <--- X-Achsen-Beschriftung
          },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: axisColor, // <--- Y-Achsen-Beschriftung
          },
        },
      },
    };
  }
}
