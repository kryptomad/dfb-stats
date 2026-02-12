import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { OskarstatsOskarsiegerTimelineService } from '../../services/oskarstats-oskarsieger-timeline.service';

@Component({
  standalone: true,
  selector: 'app-oskarstatistiken',
  imports: [
    CommonModule,
    NgIf,
    Card,
    TimelineModule,
  ],
  templateUrl: './oskarstatistiken.component.html',
  styleUrls: ['./oskarstatistiken.component.scss'],
})
export class OskarstatistikenComponent implements OnInit {
  constructor(
    private statsService: StatsService,
    private oskarstatsOskarsiegerTimelineService: OskarstatsOskarsiegerTimelineService,
    private playersService: PlayersService,
  ) {}

  //OSKARSIEGER (Timeline)
  oskarsiegerRaw: { jahr: number; player_id: number }[] = [];

  /** Angereicherte Timeline-Einträge inkl. Player-Objekt */
  get oskarsiegerTimeline() {
    return this.oskarsiegerRaw.map((entry) => ({
      ...entry,
      player: this.playersService.getPlayer(entry.player_id),
    }));
  }

  ngOnInit() {
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

    // Timeline
    this.oskarsiegerRaw =
      this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();
  }
}