import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Card } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { AccordionModule } from 'primeng/accordion';
import { NgClass, NgFor } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import playersData from '../../../assets/players.json';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { FieldsetModule } from 'primeng/fieldset';
import { ProgressBarModule } from 'primeng/progressbar';
// For dynamic progressbar demo
import { ToastModule } from 'primeng/toast';

import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-abzeichen',
  imports: [
    TableModule,
    Card,
    ChipModule,
    AccordionModule,
    NgClass,
    NgFor,
    AvatarModule,
    OverlayBadgeModule,
    FieldsetModule,
    ProgressBarModule,
    ToastModule,
  ],
  templateUrl: './abzeichen.component.html',
  styleUrl: './abzeichen.component.scss',
})
export class AbzeichenComponent {
  players: Player[] = playersData;

  abzeichen: Abzeichen[] = [
    {
      name: 'TON-Machine',
      punkte: 5,
      beschreibung: 'Meisten TONs am Spieltag',
      halterId: 3,
      kategorie: 'Score',
      icon: 'fa-solid fa-square-root-variable',
    },
    {
      name: '140-Bomber',
      punkte: 7,
      beschreibung: 'Meisten 140 am Spieltag',
      halterId: 2,
      kategorie: 'Score',
      icon: 'fa-solid fa-bomb',
    },
    {
      name: '180er-Gott',
      punkte: 10,
      beschreibung: 'Meisten 180 am Spieltag',
      halterId: 1,
      kategorie: 'Score',
      icon: 'fa-solid fa-magnet',
    },
    {
      name: '26-Legende',
      punkte: 3,
      beschreibung: 'Am meisten 26 geworfen',
      halterId: 1,
      kategorie: 'Score',
      icon: 'fa-solid fa-fish',
    },
    {
      name: 'Balanced Player',
      punkte: 3,
      beschreibung: 'Top 5 Scores max. 15% Differenz',
      halterId: 1,
      kategorie: 'Score',
      icon: 'fa-solid fa-balance-scale',
    },
    {
      name: 'Clutch King',
      punkte: 8,
      beschreibung: 'Beste 1-Dart-Checkout-Quote (>35%)',
      halterId: 4,
      kategorie: 'Checkout',
      icon: 'fa-solid fa-crown',
    },
    {
      name: 'Checkout-Monster',
      punkte: 8,
      beschreibung: 'Höchster Einzel-Checkout am Spieltag',
      halterId: 4,
      kategorie: 'Checkout',
      icon: 'fa-solid fa-ghost',
    },
    {
      name: 'Safe Finisher',
      punkte: 7,
      beschreibung: 'Beste 2-Dart-Quote (>40%)',
      halterId: 5,
      kategorie: 'Checkout',
      icon: 'fa-solid fa-lock',
    },
    {
      name: 'Drama King',
      punkte: 6,
      beschreibung: 'Beste 3-Dart-Checkout-Quoute (>45%)',
      halterId: 3,
      kategorie: 'Checkout',
      icon: 'fa-solid fa-mask',
    },
    {
      name: 'Fast & Furious',
      punkte: 8,
      beschreibung: 'Beste Leg des Spieltags',
      halterId: 2,
      kategorie: 'Performance',
      icon: 'fa-solid fa-stopwatch',
    },
    {
      name: 'Average King',
      punkte: 8,
      beschreibung: 'Höchster Match Average am Spieltag',
      halterId: 2,
      kategorie: 'Performance',
      icon: 'fa-solid fa-percent',
    },
    {
      name: 'Power Scorer',
      punkte: 8,
      beschreibung: 'Höchster First 9 Match Average am Spieltag',
      halterId: 2,
      kategorie: 'Performance',
      icon: 'fa-solid fa-robot',
    },
    {
      name: 'Iron Man',
      punkte: 7,
      beschreibung: 'Meiste Legs gespielt',
      halterId: 5,
      kategorie: 'Performance',
      icon: 'fa-solid fa-dumbbell',
    },
    {
      name: 'Streak Shooter',
      punkte: 5,
      beschreibung: '3 Spiele in Folge 3DA >55',
      halterId: 4,
      kategorie: 'Performance',
      icon: 'fa-solid fa-trophy',
    },
    {
      name: 'Comeback Hero',
      punkte: 3,
      beschreibung: 'Spieg nach 2:0 Rückstand',
      halterId: 1,
      kategorie: 'Performance',
      icon: 'fa-solid fa-rotate-left',
    },
    {
      name: 'Bust-King',
      punkte: 3,
      beschreibung: 'Längste Serie an Bust Würfen',
      halterId: 5,
      kategorie: 'Fun',
      icon: 'fa-solid fa-trash',
    },
    {
      name: 'Kleinvieh',
      punkte: 3,
      beschreibung: 'Meisten Würfe unter 26 bei den First 9',
      halterId: 4,
      kategorie: 'Fun',
      icon: 'fa-solid fa-poop',
    },
    {
      name: 'Gastgeber-König',
      punkte: 10,
      beschreibung: 'Meiste Heimspiele der Saison',
      halterId: 1,
      kategorie: 'Fun',
      icon: 'fa-solid fa-beer-mug-empty',
    },
  ];

  kategorieNamen = [
    { name: 'Checkout', titel: 'Checkout' },
    { name: 'Score', titel: 'Score' },
    { name: 'Performance', titel: 'Performance' },
    { name: 'Fun', titel: 'Fun' },
  ];

  kategorieFarbe: Record<string, string> = {
    Checkout: 'bg-green-100 text-green-900',
    Score: 'bg-red-100 text-red-900',
    Performance: 'bg-yellow-100 text-yellow-900',
    Fun: 'bg-black text-white',
  };
  leaderboardData = [
    { name: 'Frank', points: 80, avatar: 'assets/players/frank.png' },
    { name: 'Martin', points: 60, avatar: 'assets/players/martin.png' },
    { name: 'Uwe', points: 40, avatar: 'assets/players/uwe.png' },
    { name: 'Heiner', points: 26, avatar: 'assets/players/heiner.png' },
    { name: 'Franz-Josef', points: 18, avatar: 'assets/players/franz.png' },
  ];
  maxPoints = 100; // Maximaler Punktewert für die Balken-Berechnung

  aggregateLeaderboard(abzeichenList: Abzeichen[]) {
    const map = new Map<
      number,
      {
        name: string;
        points: number;
        avatar: string;
        icon: string;
        color: string;
      }
    >();

    abzeichenList.forEach((abz) => {
      if (!map.has(abz.halterId)) {
        const player = this.players.find((p) => p.player_id === abz.halterId);
        if (player) {
          map.set(abz.halterId, {
            name: player.name,
            points: abz.punkte,
            avatar: 'assets/players/' + player.image,
            icon: abz.icon,
            color:
              this.kategorieFarbe[abz.kategorie] || 'bg-gray-300 text-gray-900',
          });
        }
      } else {
        const entry = map.get(abz.halterId)!;
        entry.points += abz.punkte;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.points - a.points);
  }

  getAbzeichenForKategorie(kategorie: string): Abzeichen[] {
    return this.abzeichen.filter((a) => a.kategorie === kategorie);
  }

  getSpielerName(playerId: number): string {
    const p = this.players.find((sp) => sp.player_id === playerId);
    return p ? p.name : '';
  }

  getSpielerBild(playerId: number): string {
    const p = this.players.find((sp) => sp.player_id === playerId);
    return p ? 'assets/players/' + p.image : 'assets/players/default.png';
  }
}

export interface Abzeichen {
  name: string;
  punkte: number;
  beschreibung: string;
  halterId: number;
  kategorie: string;
  icon: string;
}

export interface Player {
  player_id: number;
  name: string;
  image: string;
}