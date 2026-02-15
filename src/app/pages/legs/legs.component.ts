import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { PlayersService, Player } from '../../services/players.service';
import * as legsData from '../../../assets/legs.json';
import * as statsData from '../../../assets/stats.json';

export const LEG_STATS_FIELDS = [
  { field: 'legs_won', label: 'Legs Won' },
  { field: 'avg_darts', label: 'Average Darts' },
  { field: 'avg_3dart', label: 'Average', digits: '1.2-2' },
  { field: 'avg_first9', label: 'Average First 9', digits: '1.2-2' },
  { field: 'best_leg', label: 'Best Leg' },
  { field: 'high_finish', label: 'High Finish' },
  { field: 'score_100', label: 'TON' },
  { field: 'score_100_plus', label: '100+' },
  { field: 'score_140', label: '140s' },
  { field: 'score_180', label: '180s' },
  // Weitere Felder nach Wunsch ergänzen!
];

@Component({
  selector: 'app-legs',
  imports: [NgIf, NgFor, Card, ButtonModule, CommonModule, TableModule],
  providers: [PlayersService],
  templateUrl: './legs.component.html',
  styleUrl: './legs.component.scss',
})
export class LegsComponent implements OnInit {
  LEG_STATS_FIELDS = LEG_STATS_FIELDS;
  game: any;
  player1: Player | undefined;
  player2: Player | undefined;
  statsP1: any;
  statsP2: any;

  constructor(
    private route: ActivatedRoute,
    private playersService: PlayersService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const gameId = +params['game_id'];
      this.loadGameAndPlayers(gameId);
    });
  }

  loadGameAndPlayers(gameId: number) {
    const legsArray: any[] = (legsData as any).default ?? (legsData as any);
    const statsArray: any[] = (statsData as any).default ?? (statsData as any);

    this.game = legsArray.find((g) => g.game_id === gameId);
    if (!this.game) return;

    this.player1 = this.playersService.getPlayer(this.game.player1_id);
    this.player2 = this.playersService.getPlayer(this.game.player2_id);

    // Hole beide Stats-Blöcke für das Spiel
    this.statsP1 = statsArray.find(
      (s) => s.game_id === gameId && s.player_id === this.game.player1_id,
    );
    this.statsP2 = statsArray.find(
      (s) => s.game_id === gameId && s.player_id === this.game.player2_id,
    );
  }

  formatScore(score: number | string, isCheckout: boolean): string | number {
    if (score === '' || score === null) return '';
    return isCheckout ? `CD ${Math.abs(Number(score))}` : score;
  }

  isCheckout(round: any, player: string, isLastRound: boolean): boolean {
    return isLastRound && round[player + '_score'] < 0;
  }

  abs(val: number | string): number {
    return Math.abs(Number(val));
  }

  goBack() {
    window.history.back();
  }
}
