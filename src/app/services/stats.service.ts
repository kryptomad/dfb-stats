import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class StatsService {
  enrichedStats: any[] = [];

  constructor(private http: HttpClient) {
    this.loadEnrichedStats(); // Lädt die Daten beim Start
  }

  loadEnrichedStats() {
    forkJoin({
      stats: this.http.get<any[]>('../../assets/stats.json'),
      players: this.http.get<any[]>('../../assets/players.json')
    }).pipe(
      map(({ stats, players }) =>
        stats.map(stat => ({
          ...stat,
          playerName: players.find(p => p.player_id === stat.player_id)?.name ?? `ID ${stat.player_id}`
        }))
      )
    ).subscribe(data => {
      this.enrichedStats = data;
    });
  }

  /**
   * Universalmethode: Gibt alle Spieler (jeden nur einmal!) zurück,
   * die einen Bestwert (min/max eines Feldes) in einem Match erreicht haben.
   * Optional kann ein Filter (z.B. nur Sieger) übergeben werden.
   */
  getAllWithBestValue(field: string, comparator: 'min' | 'max', filterFn?: (s: any) => boolean) {
    if (!this.enrichedStats.length) return [];
    let filtered = this.enrichedStats.filter(s => s[field] !== undefined && s[field] !== null && s[field] > 0);
    if (filterFn) filtered = filtered.filter(filterFn);
    if (!filtered.length) return [];
    const bestValue = comparator === 'min'
      ? Math.min(...filtered.map(s => s[field]))
      : Math.max(...filtered.map(s => s[field]));
    const bestStats = filtered.filter(s => s[field] === bestValue);
    // Einmal pro Spieler!
    const uniquePlayers = new Map();
    bestStats.forEach(stat => {
      if (!uniquePlayers.has(stat.player_id)) {
        uniquePlayers.set(stat.player_id, stat);
      }
    });
    return Array.from(uniquePlayers.values());
  }

  // --- Wrapper für alle gewünschten Kategorien ---

  // Best Leg (nur gewonnene Spiele)
  getBestLegMatch() {
    return this.getAllWithBestValue('best_leg', 'min', s => s.legs_won > 0);
  }
  // Highest Checkout (alle)
  getHighestCheckoutMatch() {
    return this.getAllWithBestValue('high_finish', 'max');
  }
  // Most TONs (score_100, alle)
  getMostTONsMatch() {
    return this.getAllWithBestValue('score_100', 'max');
  }
  // Most 140s (alle)
  getMost140sMatch() {
    return this.getAllWithBestValue('score_140', 'max');
  }
  // Most 180s (alle)
  getMost180sMatch() {
    return this.getAllWithBestValue('score_180', 'max');
  }
  // Best 3 Dart Average (nur Sieger, legs_won == 3)
  getBest3DAMatch() {
    return this.getAllWithBestValue('avg_3dart', 'max', s => s.legs_won === 3);
  }
  // Best First 9 Average (alle)
  getBestFirst9Match() {
    return this.getAllWithBestValue('avg_first9', 'max');
  }
}