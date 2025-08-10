// oskarsieger.service.ts
import { Injectable } from '@angular/core';
import oskarsiegerData from '../../assets/oskarsieger.json';
import gamesData from '../../assets/games.json';
import { StatsService } from './stats.service';

type Winner = { jahr: number; player_id: number; label: string };

@Injectable({ providedIn: 'root' })
export class OskarstatsOskarsiegerTimelineService {
  constructor(private statsService: StatsService) {}

  private parseSeasonStartYear(season: unknown): number | null {
    if (typeof season === 'number' && Number.isFinite(season)) return season;
    const s = String(season ?? '');
    const m = s.match(/\b(19|20)\d{2}\b/);
    return m ? parseInt(m[0], 10) : null;
  }

  getManualWinners(): Winner[] {
    const arr = (oskarsiegerData as { jahr: number; player_id: number }[]) || [];
    return arr.map(w => ({ ...w, label: String(w.jahr) }));
  }

  getAutoWinnersFromStats(startYear = 2018): Winner[] {
    const stats = this.statsService.getAllStats();
    if (!stats?.length) return [];

    // Anzahl einzigartiger Spieltage pro Season
    const seasonMatchdays = new Map<number, Set<number>>();
    for (const g of (gamesData as any[])) {
      const y = this.parseSeasonStartYear(g.season);
      if (!y) continue;
      if (!seasonMatchdays.has(y)) seasonMatchdays.set(y, new Set());
      seasonMatchdays.get(y)!.add(Number(g.matchday));
    }

    const yearPlayerTotals = new Map<number, Map<number, number>>();
    const yearLabel = new Map<number, string>();

    for (const s of stats) {
      const y = this.parseSeasonStartYear(s.season);
      if (y === null || y < startYear) continue;

      // ❗ Nur Seasons mit mind. 10 verschiedenen Spieltagen
      if ((seasonMatchdays.get(y)?.size || 0) < 10) continue;

      if (!yearPlayerTotals.has(y)) yearPlayerTotals.set(y, new Map());
      const seasonStr = (s.season != null) ? String(s.season) : String(y);
      if (!yearLabel.has(y)) yearLabel.set(y, seasonStr);

      const pid = Number(s.player_id);
      const legs = Number(s.legs_won) || 0;
      const totals = yearPlayerTotals.get(y)!;
      totals.set(pid, (totals.get(pid) || 0) + legs);
    }

    const winners: Winner[] = [];
    for (const [jahr, totals] of yearPlayerTotals) {
      let topId = -1, topVal = -1;
      for (const [pid, sum] of totals) {
        if (sum > topVal) { topVal = sum; topId = pid; }
      }
      if (topId !== -1) {
        winners.push({
          jahr,
          player_id: topId,
          label: yearLabel.get(jahr) ?? String(jahr),
        });
      }
    }
    return winners.sort((a, b) => a.jahr - b.jahr);
  }

  getAllWinnersMerged(): Winner[] {
    const manual = this.getManualWinners();
    const manualYears = new Set(manual.map(w => w.jahr));
    const auto = this.getAutoWinnersFromStats(2018).filter(w => !manualYears.has(w.jahr));
    return [...manual, ...auto].sort((a, b) => b.jahr - a.jahr);
  }
}
