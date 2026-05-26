import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { StatsService } from '../../services/stats.service';
import { StatsQueryService } from '../../services/stats-query.service';
import { PlayersService } from '../../services/players.service';
import { OskarstatsOskarsiegerTimelineService } from '../../services/oskarstats-oskarsieger-timeline.service';
import * as altRekordData from '../../../assets/alt-rekorde.json';

export interface Rekord {
  was: string;
  wann: string;
  wer: string;
  count: number;
}

interface AltRekord {
  was: string;
  wann: string;
  wer: string;
  count: number;
  vergleich?: 'max' | 'min';
  key?: string;
}

export interface VergleichsDetail {
  was: string;
  kategorie: string;
  autoWert: number | null;
  autoWer: string;
  autoWann: string;
  altWert: number;
  altWer: string;
  altWann: string;
  gewinner: 'auto' | 'historisch' | 'kein auto';
  delta: number | null;
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
  oskarsiegerRaw: { jahr: number; player_id: number; seasonLabel?: string }[] =
    [];

  // Vereinsgeschichte: Texteinträge ohne Spieler
  vereinsgeschichte: {
    jahr: number;
    label: string;
    title: string;
    text: string;
    images?: { src: string; alt: string }[];
  }[] = [
    {
      jahr: 1993,
      label: '1993',
      title: 'Alles beginnt in Nordborchen',
      text: 'Mit viel Leidenschaft für den Dartsport – und einer ebenso großen Begeisterung für ein kühles Bier – gründeten Uwe, Franz-Josef und Frank 1993 in Nordborchen den Verein. Damit legten sie den Grundstein für die heutigen Dartfreunde Borchen n. e. V.',
    },
    {
      jahr: 1997,
      label: '1997',
      title: 'Dartfahrt',
      text: 'Dartfahrt an die Nordsee, Norddeich 🇩🇪',
    },
    {
      jahr: 1998,
      label: '19998',
      title: 'Dartfahrt',
      text: 'Dartfahrt an die Nordsee, Norddeich 🇩🇪 #2',
    },
    {
      jahr: 1999,
      label: '1999',
      title: 'Dartfahrt',
      text: 'Dartfahrt an die Nordsee, Norddeich 🇩🇪 #3',
    },
    {
      jahr: 2000,
      label: '2000',
      title: 'Dartfahrt',
      text: 'Dartfahrt nach Matchlos 🇩🇪',
    },
    {
      jahr: 2005,
      label: '2005',
      title: 'Dartfahrt',
      text: 'Dartfahrt nach Cavan 🇮🇪',
    },
    {
      jahr: 2007,
      label: '2007',
      title: 'Dartfahrt',
      text: 'Dartfahrt nach Skärhamn 🇸🇪',
    },
    {
      jahr: 2009,
      label: '2009',
      title: 'Dartfahrt',
      text: 'Dartfahrt ans Mittelmeer, Calpe 🇪🇸',
    },
    {
      jahr: 2011,
      label: '2011',
      title: 'Dartfahrt',
      text: 'Dartfahrt ans Mittelmeer, Calpe 🇪🇸 #2',
    },
    {
      jahr: 2013,
      label: '2013',
      title: 'Dartfahrt',
      text: 'Dartfahrt auf Mallorca 🇪🇸',
    },
    {
      jahr: 2015,
      label: '2015',
      title: 'Dartfahrt',
      text: 'Dartfahrt ans Mittelmeer, Calpe 🇪🇸 #3',
    },
    {
      jahr: 2016,
      label: '2016',
      title: 'Veränderungen im Verein',
      text: 'Nach 19 Jahren übergab Heiner (TC) die Verantwortung für die Vereinsstatistik. Über fast zwei Jahrzehnte hinweg hatte er die statistische Dokumentation des Vereins geprägt und zuverlässig begleitet. Mit der einstimmigen Wahl von Martin (mad) als Nachfolger wurde diese Aufgabe in neue Hände gelegt – verbunden mit dem Vertrauen, die Statistik im Sinne des Vereins weiterzuführen und weiterzuentwickeln.<br><br>Neben der personellen Veränderung wurde im selben Jahr auch ein neues Vereinslogo eingeführt.<br><br>Mit Rainer verabschiedete sich am 23.04.2016 ein Mitglied, das dem Verein seit 1995 angehörte und ihn über 21 Jahre hinweg maßgeblich mitgeprägt hatte. Mit seinem Ausscheiden endete eine besonders lange und prägende Phase der Vereinszugehörigkeit.',
      images: [
        { src: 'assets/timeline/dfb-logo-alt.jpg', alt: 'Altes Vereinslogo' },
        { src: 'assets/logo.svg', alt: 'Neues Vereinslogo' },
      ],
    },
    {
      jahr: 2017,
      label: '2017',
      title: 'Veränderung im Spielsystem und im Team',
      text: 'Im Jahr 2017 wurde ein neues Spielformat eingeführt: Statt Best of 3 wurde fortan im Modus Best of 5 gespielt. Dadurch gewann der Spielbetrieb an sportlicher Tiefe und Konstanz.<br><br>Nachdem im Vorjahr ein langjähriges Mitglied seine aktive Zeit beendet hatte, kam es 2017 erneut zu einer personellen Veränderung: Nach elf Jahren Vereinszugehörigkeit gab Nico am 14.04.2017 nach dem dritten Oscarabend seinen Austritt aus dem Verein bekannt. In dieser Zeit prägte er den Verein vor allem sportlich und gehörte zu den erfolgreichsten Spielern. Seitdem besteht das Team aus fünf Mitgliedern.<br><br>Dartfahrt nach Kreta - Sissi 🇬🇷',
    },
    {
      jahr: 2018,
      label: '2018',
      title: 'Einführung Elektronischer Datenerfassung',
      text: 'Zwei Jahre nach der Übernahme der Statistikverantwortung leitete Martin (mad) mit der Einführung der elektronischen Datenerfassung im Jahr 2018 ein neues Kapitel im Verein ein. Statt Tafel und Kreide wurden die Spiele fortan digital mit dem Tool n01 erfasst.<br>Die gewonnenen Spieldaten bilden seitdem die Grundlage für eine strukturierte Statistik, aus der nicht nur Auswertungen, sondern auch die heutige Vereins-Website entstanden ist – ein wichtiger Schritt hin zu mehr Transparenz, Übersicht und nachhaltiger Dokumentation des Vereinslebens.',
    },
    {
      jahr: 2019,
      label: '2019',
      title: 'Regelwerk vereinfacht',
      text: 'Im Jahr 2019 wurde das Regelwerk weiter vereinfacht. Die Bonuspunkte für Highscore und Highfinish wurden abgeschafft, sodass seitdem ausschließlich das reine Spielergebnis in die Wertung einfließt – mit dem Ziel einer klareren und besser vergleichbaren Wertung.<br><br>Dartfahrt ans Mittelmeer, Málaga 🇪🇸<br><br>Tagesfahrt zur European Darts Championship - Lokhalle, Göttingen',
    },
    {
      jahr: 2021,
      label: '2021',
      title: 'Spielbetrieb unterbrochen',
      text: 'Bedingt durch die COVID-19-Pandemie musste der Spielbetrieb für 266 Tage pausiert werden. Zwischen Spieltag 8 am 17.10.2020 und Spieltag 9 am 10.07.2021 ruhte der Spielbetrieb vollständig.<br>Erst im Sommer 2021 konnte der Spielbetrieb wieder aufgenommen werden.',
    },
    {
      jahr: 2023,
      label: '2023',
      title: 'Dartfahrt',
      text: 'Dartfahrt ans Mittelmeer, Calpe 🇪🇸 #4<br><br>Tagesausflug nach Dortmund zur European Championship.',
    },
    {
      jahr: 2024,
      label: '2024',
      title: 'Dartfahrt',
      text: 'Dartfahrt ans Mittelmeer, Calpe 🇪🇸 #5',
    },
    {
      jahr: 2026,
      label: '2026',
      title: 'Dartfahrt',
      text: 'Dartfahrt an die Ostsee, Laboe 🇩🇪',
    },
  ];

  get oskarsiegerTimeline() {
    // Vereinsgeschichte nach Jahr indexieren
    const geschichteByJahr = new Map<
      number,
      { title: string; text: string; images?: { src: string; alt: string }[] }
    >();
    for (const g of this.vereinsgeschichte) {
      geschichteByJahr.set(g.jahr, {
        title: g.title,
        text: g.text,
        images: g.images,
      });
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
        seasonLabel: (entry as any).seasonLabel || String(entry.jahr),
        title: extra?.title || '',
        text: extra?.text || '',
        images: extra?.images || [],
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

  currentSeason = '';
  readonly heutigesDatum = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  constructor(
    private statsService: StatsService,
    private statsQueryService: StatsQueryService,
    private oskarstatsOskarsiegerTimelineService: OskarstatsOskarsiegerTimelineService,
    private playersService: PlayersService,
  ) {}

  ngOnInit() {
    this.oskarsiegerRaw =
      this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();

    this.statsQueryService.getLatestSeason$().subscribe((season) => {
      this.currentSeason = season || '';
    });

    this.statsService.loadEnrichedStats().subscribe(() => {
      this.oskarsiegerRaw =
        this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();
      this.statsService.getStatsNorm$().subscribe((normRows: any[]) => {
        this.oskarsiegerRaw =
          this.oskarstatsOskarsiegerTimelineService.getAllWinnersMergedFromNormalizedRows(
            normRows,
          );
      });
      this.vergleichsDetails = [];
      this.computeMatchwertungen();
      this.computeSpieltagswertungen();
      this.computeJahreswertungen();
    });
  }

  private readonly altRekorde = Object.create(altRekordData).default as {
    matchwertungen: AltRekord[];
    spieltagswertungen: AltRekord[];
    jahreswertungen: AltRekord[];
  };

  private autoRekordForKey(key: string): Rekord | null {
    switch (key) {
      case 'first9_match': {
        const rows = this.statsService.getBestFirst9Match();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          Math.round(rows[0].avg_first9 * 10) / 10,
        );
      }
      case '3dart_match': {
        const rows = this.statsService.getBest3DAMatch();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          Math.round(rows[0].avg_3dart * 10) / 10,
        );
      }
      case 'avgdarts_match': {
        const rows = this.statsService.getAllWithBestValue(
          'avg_darts',
          'min',
          (s) => s.legs_won === 3,
        );
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          Math.round(rows[0].avg_darts * 100) / 100,
        );
      }
      case 'first9_spieltag': {
        const rows = this.statsService.getBestFirst9Matchday();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          Math.round(rows[0].avg_first9 * 10) / 10,
        );
      }
      case '3dart_spieltag': {
        const rows = this.statsService.getBest3DAMatchday();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          Math.round(rows[0].avg_3dart * 10) / 10,
        );
      }
      case 'avgdarts_spieltag': {
        const rows = this.statsService.getBestAvgDartsMatchday();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          Math.round(rows[0].avg_darts * 100) / 100,
        );
      }
      case '180s_spieltag': {
        const rows = this.statsService.getMost180sMatchday();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          rows[0].score_180,
        );
      }
      case '180s_spieltag_gesamt': {
        const rows = this.statsService.getMost180sMatchdayTeam();
        if (!rows.length) return null;
        return this.createRekord('', rows[0].season, 'Team', rows[0].score_180);
      }
      case '140s_spieltag': {
        const rows = this.statsService.getMost140sMatchday();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          rows[0].score_140,
        );
      }
      case '140s_spieltag_gesamt': {
        const rows = this.statsService.getMost140sMatchdayTeam();
        if (!rows.length) return null;
        return this.createRekord('', rows[0].season, 'Team', rows[0].score_140);
      }
      case 'tons_spieltag': {
        const rows = this.statsService.getMostTONsMatchday();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          rows[0].score_100,
        );
      }
      case '180s_saison': {
        const rows = this.statsService.getMost180sSeason();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          rows[0].score_180,
        );
      }
      case '180s_saison_gesamt': {
        const rows = this.statsService.getMost180sSeasonTeam();
        if (!rows.length) return null;
        return this.createRekord('', rows[0].season, 'Team', rows[0].score_180);
      }
      case '140s_saison': {
        const rows = this.statsService.getMost140sSeason();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          rows[0].score_140,
        );
      }
      case '140s_saison_gesamt': {
        const rows = this.statsService.getMost140sSeasonTeam();
        if (!rows.length) return null;
        return this.createRekord('', rows[0].season, 'Team', rows[0].score_140);
      }
      case 'tons_saison': {
        const rows = this.statsService.getMostTONsSeason();
        if (!rows.length) return null;
        return this.createRekord(
          '',
          rows[0].season,
          rows.map((r: any) => r.playerName).join(', '),
          rows[0].score_100,
        );
      }
      default:
        return null;
    }
  }

  private pickBestRekord(alt: AltRekord, kategorie: string): Rekord {
    const fallback = this.createRekord(alt.was, alt.wann, alt.wer, alt.count);
    if (!alt.vergleich || !alt.key) return fallback;

    const auto = this.autoRekordForKey(alt.key);

    const detail: VergleichsDetail = {
      was: alt.was,
      kategorie,
      autoWert: auto ? auto.count : null,
      autoWer: auto ? auto.wer : '–',
      autoWann: auto ? auto.wann : '–',
      altWert: alt.count,
      altWer: alt.wer,
      altWann: alt.wann,
      gewinner: !auto ? 'kein auto' : 'historisch',
      delta: null,
    };

    if (auto) {
      const autoBetter =
        alt.vergleich === 'max'
          ? auto.count > alt.count
          : auto.count < alt.count;
      detail.gewinner = autoBetter ? 'auto' : 'historisch';
      detail.delta =
        alt.vergleich === 'max'
          ? Math.round((auto.count - alt.count) * 100) / 100
          : Math.round((alt.count - auto.count) * 100) / 100;
      if (autoBetter) {
        this.vergleichsDetails.push(detail);
        return { ...auto, was: alt.was };
      }
    }

    this.vergleichsDetails.push(detail);
    return fallback;
  }

  private computeMatchwertungen() {
    this.matchwertungen = this.altRekorde.matchwertungen.map((alt) =>
      this.pickBestRekord(alt, 'Match'),
    );
  }

  private computeSpieltagswertungen() {
    this.spieltagswertungen = this.altRekorde.spieltagswertungen.map((alt) =>
      this.pickBestRekord(alt, 'Spieltag'),
    );
  }

  private computeJahreswertungen() {
    this.jahreswertungen = this.altRekorde.jahreswertungen.map((alt) =>
      this.pickBestRekord(alt, 'Jahr'),
    );
  }

  gesamtwertungen: Rekord[] = [
    this.createRekord('Jahres-Oscar Gesamt [3]', '2007–2016', 'Nico', 10),
    this.createRekord('Jahres-Oscar Gewinn in Folge', '2007–2016', 'Nico', 10),
    this.createRekord('Monats-Oscar Gesamt', '1996–2023/24', 'Franz-Josef', 81),
    this.createRekord('Monats-Oscar Gewinn in Folge', '2019–2024', 'mad', 8),
  ];

  jahreswertungen: Rekord[] = [];

  spieltagswertungen: Rekord[] = [];

  matchwertungen: Rekord[] = [];

  vergleichsDetails: VergleichsDetail[] = [];

  get vergleichsMatch() {
    return this.vergleichsDetails.filter((d) => d.kategorie === 'Match');
  }

  get vergleichsSpieltag() {
    return this.vergleichsDetails.filter((d) => d.kategorie === 'Spieltag');
  }

  get vergleichsJahr() {
    return this.vergleichsDetails.filter((d) => d.kategorie === 'Jahr');
  }

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
