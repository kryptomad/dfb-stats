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
  ],
  templateUrl: './abzeichen.component.html',
  styleUrl: './abzeichen.component.scss',
})
export class AbzeichenComponent {
  players: Player[] = playersData;
  abzeichen: Abzeichen[] = [
    // SCORE
    {
      name: 'TON-Machine',
      punkte: 5,
      beschreibung: 'Meisten TONs am Spieltag',
      halterId: 3,
      kategorie: 'Score',
      icon: 'fa-solid fa-fire',
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

    // CHECKOUT
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

    // PERFORMANCE
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
      icon: 'fa-solid fa-bolt',
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

    // FUN

    {
      name: 'Bust-King',
      punkte: 3,
      beschreibung: 'Längste Serie an Bust Würfen',
      halterId: 1,
      kategorie: 'Fun',
      icon: 'fa-solid fa-trash',
    },
    {
      name: 'Comeback Hero',
      punkte: 3,
      beschreibung: 'Spieg nach 2:0 Rückstand',
      halterId: 1,
      kategorie: 'Fun',
      icon: 'fa-solid fa-rotate-left',
    },
    {
      name: 'Gastgeber-König',
      punkte: 2,
      beschreibung: 'Meiste Heimspiele der Saison',
      halterId: 3,
      kategorie: 'Fun',
      icon: 'fa-solid fa-beer-mug-empty',
    },
  ];

  // Für einfaches Filtern in der HTML:
  kategorieNamen = [
    { name: 'Checkout', titel: 'Checkout-Abzeichen' },
    { name: 'Score', titel: 'Score-Abzeichen' },
    { name: 'Performance', titel: 'Performance-Abzeichen' },
    { name: 'Fun', titel: 'Fun-Abzeichen' },
  ];

  kategorieFarbe: Record<string, string> = {
    Checkout: 'bg-green-100 text-green-900',
    Score: 'bg-red-100 text-red-900',
    Performance: 'bg-yellow-100 text-yellow-900',
    Fun: 'bg-purple-100 text-purple-900',
  };

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