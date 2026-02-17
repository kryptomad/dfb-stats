import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { OskarstatsOskarsiegerTimelineService } from '../../services/oskarstats-oskarsieger-timeline.service';

export interface Rekord {
  was: string;
  wann: string;
  wer: string;
  count: number;
}

@Component({
  selector: 'app-rekorde',
  templateUrl: './rekorde.component.html',
  styleUrls: ['./rekorde.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    Card,
    FieldsetModule,
    TableModule,
    TimelineModule,
  ],
  providers: [],
})
export class RekordeComponent implements OnInit {
  // Oskarsieger
  oskarsiegerRaw: { jahr: number; player_id: number }[] = [];

  // Vereinsgeschichte: Texteinträge ohne Spieler
  vereinsgeschichte: {
    jahr: number;
    label: string;
    title: string;
    text: string;
  }[] = [
    {
      jahr: 1993,
      label: '1993',
      title: 'Alles beginnt in Nordborchen',
      text: 'Mit viel Leidenschaft für den Dartsport – und einer ebenso großen Begeisterung für ein kühles Bier – gründeten Uwe, Franz-Josef und Frank 1993 in Nordborchen den Verein. Damit legten sie den Grundstein für die heutigen Dartfreunde Borchen n. e. V.',
    },
    {
      jahr: 2023,
      label: '2023/2024',
      title: 'Dartfahrt',
      text: 'Dartfahrt nach Spanien, Calpe. (2024)',
    },
    {
      jahr: 2019,
      label: '2019/2020',
      title: 'Dartfahrt',
      text: 'Dartfahrt nach Spanien, Málaga. (2019)',
    },
    {
      jahr: 2018,
      label: '2018/2019',
      title: 'Einführung Elektronischer Datenerfassung',
      text: 'Mit der Einführung der elektronischen Datenerfassung im Jahr 2018 schlug der Verein ein neues Kapitel auf. Statt Tafel und Kreide wurden die Spiele fortan digital mit dem Tool n01 erfasst. Die erfassten Spieldaten bilden seitdem die Grundlage für eine strukturierte Statistik, aus der nicht nur Auswertungen, sondern auch die heutige Vereins-Website entstanden ist. Ein wichtiger Schritt hin zu mehr Transparenz, Übersicht und nachhaltiger Dokumentation des Vereinslebens.',
    },
  ];

  get oskarsiegerTimeline() {
    // Vereinsgeschichte nach Jahr indexieren
    const geschichteByJahr = new Map<number, { title: string; text: string }>();
    for (const g of this.vereinsgeschichte) {
      geschichteByJahr.set(g.jahr, { title: g.title, text: g.text });
    }

    // Oskarsieger-Einträge (ggf. mit Geschichte-Text anreichern)
    const usedJahre = new Set<number>();
    const oskar = this.oskarsiegerRaw.map((entry) => {
      const extra = geschichteByJahr.get(entry.jahr);
      if (extra) usedJahre.add(entry.jahr);
      return {
        ...entry,
        type: 'oskarsieger' as const,
        player: this.playersService.getPlayer(entry.player_id),
        title: extra?.title || '',
        text: extra?.text || '',
      };
    });

    // Vereinsgeschichte-Einträge die KEIN Oskarsieger-Jahr haben
    const geschichte = this.vereinsgeschichte
      .filter((g) => !usedJahre.has(g.jahr))
      .map((entry) => ({
        ...entry,
        type: 'geschichte' as const,
        player_id: 0,
        player: null,
      }));

    // Zusammenführen und nach Jahr sortieren (neueste oben)
    return [...oskar, ...geschichte].sort((a, b) => b.jahr - a.jahr);
  }

  constructor(
    private statsService: StatsService,
    private oskarstatsOskarsiegerTimelineService: OskarstatsOskarsiegerTimelineService,
    private playersService: PlayersService,
  ) {}

  ngOnInit() {
    this.oskarsiegerRaw =
      this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();

    this.statsService.loadEnrichedStats().subscribe(() => {
      this.oskarsiegerRaw =
        this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();
      this.statsService.getStatsNorm$().subscribe((normRows: any[]) => {
        this.oskarsiegerRaw =
          this.oskarstatsOskarsiegerTimelineService.getAllWinnersMergedFromNormalizedRows(
            normRows,
          );
      });
    });
  }

  gesamtwertungen: Rekord[] = [
    this.createRekord('Jahres-Oscar Gesamt [3]', '2007–2016', 'Nico', 10),
    this.createRekord('Jahres-Oscar Gewinn in Folge', '2007–2016', 'Nico', 10),
    this.createRekord('Monats-Oscar Gesamt', '1996–2023/24', 'Franz-Josef', 81),
    this.createRekord('Monats-Oscar Gewinn in Folge', '2019–2024', 'mad', 8),
  ];

  jahreswertungen: Rekord[] = [
    this.createRekord(
      'Monats-Oscar Gesamt in einem Jahr',
      '2003, 2020/21, 2023/24',
      'Franz-Josef, mad',
      9,
    ),
    this.createRekord(
      'High Check',
      '2003, 2020/21, 2023/24',
      'Franz-Josef, mad',
      9,
    ),
    this.createRekord(
      'High Check geworfen [1] (+100)',
      '2008, 2013 / 2019, 2020/21',
      'Nico, mad',
      3,
    ),
    this.createRekord('Geworfene 180er', '2006, 2013', 'Franz-Josef, Nico', 5),
    this.createRekord('Geworfene 180er, Gesamt', '2008, 2013', 'Team', 8),
    this.createRekord('Geworfene 140er', '2021/2022', 'mad', 30),
    this.createRekord('Geworfene 140er, Gesamt', '2009, 2012', 'Team', 64),
    this.createRekord('Geworfene TONs [8]', '2021/2022', 'mad', 149),
    this.createRekord('Punkte Jahreswertung [7]', '2020/21', 'mad', 120),
    this.createRekord('Spiele gewonnen [5]', '2020/21, 2023/24', 'mad', 40),
    this.createRekord('Spiele in Serie gewonnen', '2023/24', 'mad', 33),
    this.createRekord('Short Games geworfen [2]', '2023/24', 'mad', 17),
    this.createRekord('Short Game, Anzahl Darts [2]', '01.01.2007', 'Nico', 14),
  ];

  spieltagswertungen: Rekord[] = [
    this.createRekord(
      'Geworfene 180er',
      '2006–2024',
      'Franz-Josef, Nico, mad',
      2,
    ),
    this.createRekord('Geworfene 180er, Gesamt [2]', '02.02.2013', 'Team', 3),
    this.createRekord('Geworfene 140er', '13.04.2017', 'Nico', 8),
    this.createRekord('Geworfene 140er, Gesamt [2]', '2009–2017', 'Team', 12),
    this.createRekord('Geworfene TONs [8]', '21.12.2019', 'mad', 22),
    this.createRekord('First 9 Dart Average [6]', '2023/24', 'mad', 71.9),
    this.createRekord('3 Dart Average [6]', '2019', 'mad', 62.8),
    this.createRekord('Average Darts needed [6]', '2019', 'mad', 23.75),
  ];

  matchwertungen: Rekord[] = [
    this.createRekord('First 9 Dart Average', '2019', 'Franz-Josef', 92.7),
    this.createRekord('3 Dart Average', '2019', 'mad', 79.1),
    this.createRekord('Average Darts needed', '2019', 'mad', 19),
  ];

  private createRekord(
    was: string,
    wann: string,
    wer: string,
    count: number,
  ): Rekord {
    return {
      was,
      wann,
      wer,
      count,
    };
  }
}
