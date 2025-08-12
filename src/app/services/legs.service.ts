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
      map(games => this.transformGamesToLegs(games)),
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
    await this.ensureLoaded();
  }

  getSeasons$(): Observable<any[]> {
    return this.loadLegs$();
  }
}