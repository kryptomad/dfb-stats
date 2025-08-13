import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Card } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { NgIf } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { CommonModule } from '@angular/common'; // Für number-Pipe
import { PlayersService, Player } from '../../services/players.service';
import { StatsQueryService } from '../../services/stats-query.service';
import { SeasonSelectorService } from '../../services/season-selector.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatRow } from '../../services/stats.service';

@Component({
  selector: 'app-profil',
  imports: [
    Card,
    RouterModule,
    FieldsetModule,
    TagModule,
    TabsModule,
    NgIf,
    BadgeModule,
    CommonModule,
  ],
  providers: [PlayersService, StatsQueryService, SeasonSelectorService],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss'],
})
export class ProfilComponent implements OnInit {
  playerId!: number;
  player: Player | undefined;
  selectedSeason: string = '2024/2025';
  stats$: Observable<StatRow[]>;
  totalLegsWon: number = 0;
  total180s: number = 0;
  avgDarts: number = 0;
  setsWon: number = 0;
  setsWonPercent: string = 'TBD';
  bestLeg: number = 0;
  worstLeg: number = 0;
  highFinish: number = 0;
  highScore: number = 0;
  score100: number = 0;
  score140: number = 0;
  score180: number = 0;
  shortGames: number = 0;
  avgDartsNeeded: string = 'TBD';
  breakCount: number = 0;
  breakPercent: string = 'TBD';
  legsPlayed: number = 0;
  legsWon: number = 0;
  legsWonPercent: string = 'TBD';
  keepPercent: string = 'TBD';
  keepCount: number = 0;
  best3DAMatch: number = 0;
  bestFirst9Match: number = 0;

  constructor(
    private route: ActivatedRoute,
    private playersService: PlayersService,
    private statsQuery: StatsQueryService,
    private seasonSelector: SeasonSelectorService,
  ) {
    this.playerId = Number(this.route.snapshot.paramMap.get('id'));
    this.stats$ = this.statsQuery.getFullStatsBySeason$(this.selectedSeason);
  }

  ngOnInit() {
    this.player = this.playersService.getPlayer(this.playerId);
    this.seasonSelector.getSeasons$().subscribe((seasons) => {
      if (seasons.length > 0 && !seasons.includes(this.selectedSeason)) {
        this.selectedSeason = seasons[0];
      }
      this.updateStats();
    });
    this.updateStats();
  }

  onSeasonChange(season: string) {
    this.selectedSeason = season;
    this.updateStats();
  }

  private updateStats() {
    this.stats$ = this.statsQuery.getFullStatsBySeason$(this.selectedSeason);
    this.stats$.subscribe((rows) => {
      const seasonStr = this.selectedSeason.toString();
      const playerRows = rows.filter(
        (r) => r.player_id === this.playerId && r.season === seasonStr,
      );
      console.log('Gefilterte Player Rows für Saison:', playerRows);
      this.totalLegsWon = playerRows.reduce(
        (sum, r) => sum + (r.legs_won || 0),
        0,
      );
      this.total180s = playerRows.reduce(
        (sum, r) => sum + (r.score_180 || 0),
        0,
      );
      this.avgDarts =
        playerRows.reduce((sum, r) => sum + (r.avg_darts || 0), 0) /
          playerRows.length || 0;
      this.setsWon = playerRows.reduce((sum, r) => sum + (r.sets_won || 0), 0);
      this.bestLeg =
        playerRows.reduce(
          (min, r) =>
            r.best_leg !== null && (min === 0 || r.best_leg < min)
              ? r.best_leg
              : min,
          Infinity,
        ) || 0;
      this.worstLeg =
        playerRows.reduce(
          (min, r) =>
            r.worst_leg !== null && (min === 0 || r.worst_leg < min)
              ? r.worst_leg
              : min,
          Infinity,
        ) || 0;
      this.highFinish = playerRows.reduce(
        (max, r) => Math.max(max, r.high_finish || 0),
        0,
      );
      this.highScore = playerRows.reduce(
        (max, r) => Math.max(max, r.high_score || 0),
        0,
      );
      this.score100 = playerRows.reduce(
        (sum, r) => sum + (r.score_100 || 0) + (r.score_100_plus || 0),
        0,
      );
      this.score140 = playerRows.reduce(
        (sum, r) => sum + (r.score_140 || 0) + (r.score_140_plus || 0), // Geändert
        0,
      );
      this.score180 = playerRows.reduce(
        (sum, r) => sum + (r.score_180 || 0),
        0,
      );
      this.shortGames = playerRows.reduce(
        (sum, r) =>
          sum +
          (r.best_leg !== null && r.best_leg >= 9 && r.best_leg <= 21 ? 1 : 0),
        0,
      );
      this.avgDartsNeeded = 'TBD';
      this.breakCount = playerRows.reduce(
        (sum, r) => sum + Number(r.break_ratio.split('/')[0] || 0),
        0,
      );
      this.breakPercent = 'TBD';
      this.legsPlayed = playerRows.reduce(
        (sum, r) => sum + (r.legs_played || 0),
        0,
      );
      this.legsWon = playerRows.reduce((sum, r) => sum + (r.legs_won || 0), 0);
      this.legsWonPercent = 'TBD';
      this.keepPercent = 'TBD';
      this.keepCount = playerRows.reduce(
        (sum, r) => sum + Number(r.keep_ratio.split('/')[0] || 0),
        0,
      );
      this.best3DAMatch = playerRows.reduce(
        (max, r) => Math.max(max, r.avg_3dart || 0),
        0,
      );
      this.bestFirst9Match = playerRows.reduce(
        (max, r) => Math.max(max, r.avg_first9 || 0),
        0,
      );
    });
  }
}