import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, shareReplay, map } from 'rxjs/operators';
import { SeasonDataSource, SeasonSelectorService } from './season-selector.service';

export interface LegRow {
  id: number;
  game_id: number | string;
  season?: string | number;
  matchday?: number;
  leg_number: number;
  player1_id: number;
  player2_id: number;
  p1_score?: number | null;
  p1_left?: number | null;
  p2_score?: number | null;
  p2_left?: number | null;
  round?: number | null;
  p1_darts_leg: number | null;
  p2_darts_leg: number | null;
  p1_avg_3dart_leg?: number | null;
  p2_avg_3dart_leg?: number | null;
  leg_winner_id: number | null;
  starter?: string | null;
  starter_id?: number | null;
}

export interface CheckoutData {
  value: number;
  darts: number;
  matchday: number;
  gameId: number | string;
  legNumber: number;
  season: string;
}

export interface WonLegData {
  darts: number;
  avg: number;
  matchday: number;
  gameId: number | string;
  legNumber: number;
  season: string;
}

export interface HighlightMatch {
  rank: number;
  gameId: number | string;
  season: string;
  matchday: number;
  player1Id: number;
  player1Avg: number;
  player2Id: number;
  player2Avg: number;
  result: string; // "3:2"
  combinedAvg: number;
}

interface GameData {
  game_id: number | string;
  season?: string | number;
  matchday?: number;
  legs: {
    leg_number: number;
    starter_id: number;
    leg_winner_id: number | null;
    p1_darts_leg: number | null;
    p2_darts_leg: number | null;
    p1_avg_3dart_leg?: number | null;
    p2_avg_3dart_leg?: number | null;
    rounds: {
      round: number;
      p1_score?: number | null;
      p1_left?: number | null;
      p2_score?: number | null;
      p2_left?: number | null;
    }[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class LegsService implements SeasonDataSource {
  private legsUrl = 'assets/legs.json';
  private legsSignal = signal<LegRow[] | null>(null);
  private gamesDataSignal = signal<GameData[] | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  constructor(private http: HttpClient, private seasonSelector: SeasonSelectorService) {
    this.initializeSeasonSelector();
  }

  private initializeSeasonSelector(): void {
    this.seasonSelector.setDataSource(this);
  }

  loadLegs$(): Observable<LegRow[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.get<GameData[]>(this.legsUrl).pipe(
      map(games => {
        this.gamesDataSignal.set(games);
        return this.transformGamesToLegs(games);
      }),
      catchError(err => {
        console.error('Fehler beim Laden der Legs-Daten:', err);
        this.errorSignal.set('Leg-Daten konnten nicht geladen werden.');
        return of([]);
      }),
      shareReplay(1)
    );
  }

  private transformGamesToLegs(games: GameData[]): LegRow[] {
    const legs: LegRow[] = [];
    let idCounter = 1;
    games.forEach(game => {
      game.legs.forEach(leg => {
        legs.push({
          id: idCounter++,
          game_id: game.game_id,
          season: game.season,
          matchday: game.matchday,
          leg_number: leg.leg_number,
          player1_id: game.legs[0].starter_id, // Annahme: player1_id ist der Starter
          player2_id: game.legs.find(l => l.starter_id !== leg.starter_id)?.starter_id || 0,
          p1_score: leg.rounds[leg.rounds.length - 1]?.p1_score || null,
          p1_left: leg.rounds[leg.rounds.length - 1]?.p1_left || null,
          p2_score: leg.rounds[leg.rounds.length - 1]?.p2_score || null,
          p2_left: leg.rounds[leg.rounds.length - 1]?.p2_left || null,
          round: leg.rounds.length > 0 ? leg.rounds[leg.rounds.length - 1].round : null,
          p1_darts_leg: leg.p1_darts_leg,
          p2_darts_leg: leg.p2_darts_leg,
          p1_avg_3dart_leg: leg.p1_avg_3dart_leg,
          p2_avg_3dart_leg: leg.p2_avg_3dart_leg,
          leg_winner_id: leg.leg_winner_id,
          starter: null,
          starter_id: leg.starter_id
        });
      });
    });
    return legs;
  }

  async ensureLoaded(): Promise<void> {
    if (this.legsSignal() !== null) return;
    const rows = await firstValueFrom(this.loadLegs$());
    this.legsSignal.set(rows ?? []);
    this.loadingSignal.set(false);
  }

  getLegs(): LegRow[] {
    return this.legsSignal() ?? [];
  }

  isLoading(): boolean {
    return this.loadingSignal();
  }

  getError(): string | null {
    return this.errorSignal();
  }

  async refresh(): Promise<void> {
    this.legsSignal.set(null);
    this.gamesDataSignal.set(null);
    await this.ensureLoaded();
  }

  getPlayerCheckouts(playerId: number, season: string, limit: number = 5): CheckoutData[] {
    const games = this.gamesDataSignal();
    if (!games) return [];

    const checkouts: CheckoutData[] = [];

    games
      .filter(g => g.season === season)
      .forEach(game => {
        game.legs.forEach(leg => {
          // Check if player won this leg
          if (leg.leg_winner_id !== playerId) return;

          // Determine if player is p1 or p2
          const isPlayer1 = game.legs[0].starter_id === playerId ||
                           (leg.starter_id === playerId && leg.leg_number === 1);

          // Get the last round
          const lastRound = leg.rounds[leg.rounds.length - 1];
          if (!lastRound) return;

          const score = isPlayer1 ? lastRound.p1_score : lastRound.p2_score;
          const left = isPlayer1 ? lastRound.p1_left : lastRound.p2_left;

          // Check if this is a checkout (negative score and null left)
          if (score && score < 0 && left === null) {
            // Get the previous round for checkout value
            const prevRound = leg.rounds[leg.rounds.length - 2];
            if (prevRound) {
              const checkoutValue = isPlayer1 ? prevRound.p1_left : prevRound.p2_left;
              if (checkoutValue && checkoutValue > 0) {
                checkouts.push({
                  value: checkoutValue,
                  darts: Math.abs(score),
                  matchday: game.matchday || 0,
                  gameId: game.game_id,
                  legNumber: leg.leg_number,
                  season: season
                });
              }
            }
          }
        });
      });

    // Sort by matchday desc, then game_id desc, then leg_number desc
    return checkouts
      .sort((a, b) => {
        if (b.matchday !== a.matchday) return b.matchday - a.matchday;
        if (Number(b.gameId) !== Number(a.gameId)) return Number(b.gameId) - Number(a.gameId);
        return b.legNumber - a.legNumber;
      })
      .slice(0, limit);
  }

  getPlayerWonLegs(playerId: number, season: string, limit: number = 5): WonLegData[] {
    const games = this.gamesDataSignal();
    if (!games) return [];

    const wonLegs: WonLegData[] = [];

    games
      .filter(g => g.season === season)
      .forEach(game => {
        game.legs.forEach(leg => {
          // Check if player won this leg
          if (leg.leg_winner_id !== playerId) return;

          // Determine if player is p1 or p2
          const isPlayer1 = game.legs[0].starter_id === playerId ||
                           (leg.starter_id === playerId && leg.leg_number === 1);

          const darts = isPlayer1 ? leg.p1_darts_leg : leg.p2_darts_leg;
          const avg = isPlayer1 ? leg.p1_avg_3dart_leg : leg.p2_avg_3dart_leg;

          if (darts && avg) {
            wonLegs.push({
              darts,
              avg,
              matchday: game.matchday || 0,
              gameId: game.game_id,
              legNumber: leg.leg_number,
              season: season
            });
          }
        });
      });

    // Sort by matchday desc, then game_id desc, then leg_number desc
    return wonLegs
      .sort((a, b) => {
        if (b.matchday !== a.matchday) return b.matchday - a.matchday;
        if (Number(b.gameId) !== Number(a.gameId)) return Number(b.gameId) - Number(a.gameId);
        return b.legNumber - a.legNumber;
      })
      .slice(0, limit);
  }

  getSeasons$(): Observable<any[]> {
    return this.loadLegs$();
  }

  getHighlightMatches(season: string = 'All-Time', limit: number = 10): HighlightMatch[] {
    const games = this.gamesDataSignal();
    if (!games) return [];

    const highlights: HighlightMatch[] = [];

    games
      .filter(g => season === 'All-Time' || g.season === season)
      .forEach(game => {
        // Identify player1 and player2 (player1 is starter of first leg)
        const player1Id = game.legs[0]?.starter_id;
        if (!player1Id) return;

        // Find player2 by looking for a different starter_id
        const player2Leg = game.legs.find(l => l.starter_id !== player1Id);
        const player2Id = player2Leg?.starter_id;
        if (!player2Id) return; // Skip if we can't identify both players

        // Calculate averages for both players across all legs
        let p1TotalScore = 0;
        let p1TotalDarts = 0;
        let p2TotalScore = 0;
        let p2TotalDarts = 0;
        let p1LegsWon = 0;
        let p2LegsWon = 0;

        game.legs.forEach(leg => {
          const isPlayer1Starter = leg.starter_id === player1Id;

          // Accumulate stats based on who started this leg
          if (isPlayer1Starter) {
            // Player1 is p1 in this leg, Player2 is p2
            if (leg.p1_avg_3dart_leg && leg.p1_darts_leg) {
              p1TotalScore += leg.p1_avg_3dart_leg * (leg.p1_darts_leg / 3);
              p1TotalDarts += leg.p1_darts_leg;
            }
            if (leg.p2_avg_3dart_leg && leg.p2_darts_leg) {
              p2TotalScore += leg.p2_avg_3dart_leg * (leg.p2_darts_leg / 3);
              p2TotalDarts += leg.p2_darts_leg;
            }
          } else {
            // Player1 is p2 in this leg, Player2 is p1
            if (leg.p1_avg_3dart_leg && leg.p1_darts_leg) {
              p2TotalScore += leg.p1_avg_3dart_leg * (leg.p1_darts_leg / 3);
              p2TotalDarts += leg.p1_darts_leg;
            }
            if (leg.p2_avg_3dart_leg && leg.p2_darts_leg) {
              p1TotalScore += leg.p2_avg_3dart_leg * (leg.p2_darts_leg / 3);
              p1TotalDarts += leg.p2_darts_leg;
            }
          }

          // Count legs won
          if (leg.leg_winner_id === player1Id) p1LegsWon++;
          else if (leg.leg_winner_id === player2Id) p2LegsWon++;
        });

        // Calculate weighted averages
        const p1Avg = p1TotalDarts > 0 ? (p1TotalScore / p1TotalDarts) * 3 : 0;
        const p2Avg = p2TotalDarts > 0 ? (p2TotalScore / p2TotalDarts) * 3 : 0;
        const combinedAvg = p1Avg + p2Avg;

        // Skip if averages are too low (indicates incomplete data)
        if (combinedAvg < 50) return;

        highlights.push({
          rank: 0, // Will be set after sorting
          gameId: game.game_id,
          season: String(game.season || ''),
          matchday: game.matchday || 0,
          player1Id,
          player1Avg: p1Avg,
          player2Id,
          player2Avg: p2Avg,
          result: `${p1LegsWon}:${p2LegsWon}`,
          combinedAvg
        });
      });

    // Sort by combined average DESC
    const sorted = highlights
      .sort((a, b) => b.combinedAvg - a.combinedAvg)
      .slice(0, limit);

    // Add ranks
    sorted.forEach((h, i) => h.rank = i + 1);

    return sorted;
  }
}