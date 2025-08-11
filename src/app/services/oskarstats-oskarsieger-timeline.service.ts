// src/app/services/oskarsstats-oskarsieger-timeline.service.ts
import { Injectable } from '@angular/core';
import oskarsiegerData from '../../assets/oskarsieger.json';
import { StatsService } from './stats.service';

type Winner = { jahr: number; player_id: number; label: string };

@Injectable({ providedIn: 'root' })
export class OskarstatsOskarsiegerTimelineService {
  constructor(private statsService: StatsService) {}

  // zentral nutzbarer Season-Parser (Startjahr)
  public static parseSeasonStartYear(season: unknown): number | null {
    if (typeof season === 'number' && Number.isFinite(season)) return season;
    const s = String(season ?? '');
    const m = s.match(/\b(19|20)\d{2}\b/);
    return m ? parseInt(m[0], 10) : null;
  }

  // Manuelle Sieger aus JSON
  getManualWinners(): Winner[] {
    const arr =
      (oskarsiegerData as { jahr: number; player_id: number }[]) || [];
    return arr.map((w) => ({ ...w, label: String(w.jahr) }));
  }

  // Automatisch berechnete Sieger (OHNE Matchday-Filter)
  getAutoWinnersFromStats(startYear = 2018): Winner[] {
    const stats = this.statsService.getAllStats() ?? [];
    if (!Array.isArray(stats) || stats.length === 0) return [];

    const yearPlayerTotals = new Map<number, Map<number, number>>();
    const yearLabel = new Map<number, string>();

    for (const s of stats as any[]) {
      const y = OskarstatsOskarsiegerTimelineService.parseSeasonStartYear(
        s?.season,
      );
      if (y === null || y < startYear) continue;

      const pid = Number(s?.player_id);
      const legs = Number(s?.legs_won) || 0;
      if (!Number.isFinite(pid)) continue;

      if (!yearPlayerTotals.has(y)) yearPlayerTotals.set(y, new Map());
      if (!yearLabel.has(y)) yearLabel.set(y, String(s?.season ?? y));

      const totals = yearPlayerTotals.get(y)!;
      totals.set(pid, (totals.get(pid) || 0) + legs);
    }

    const winners: Winner[] = [];
    for (const [jahr, totals] of yearPlayerTotals) {
      let topId = -1,
        topVal = -1;
      for (const [pid, sum] of totals) {
        if (sum > topVal) {
          topVal = sum;
          topId = pid;
        }
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

  private static readonly MIN_MATCHDAYS = 10;

  /** Auto-Sieger aus NORMALISIERTEN Rows (mit optionalem Matchday-Filter) */
  getAutoWinnersFromNormalizedRows(rows: any[], startYear = 2018): Winner[] {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    // Matchday-Count pro Season aus den Rows (nur wenn Feld vorhanden)
    const mdCountBySeason = new Map<string, number>();
    for (const r of rows) {
      const season = String(r.season);
      const md = Number((r as any).matchday);
      if (!Number.isFinite(md)) continue;
      // distinct zählen
      const key = `${season}#${md}`;
      // kleine Trick-Map: pro Season ein Set simulieren
      // (alternativ richtiges Set je Season aufbauen)
      (mdCountBySeason as any)._seen ??= new Set<string>();
      const seen = (mdCountBySeason as any)._seen as Set<string>;
      if (!seen.has(key)) {
        seen.add(key);
        mdCountBySeason.set(season, (mdCountBySeason.get(season) ?? 0) + 1);
      }
    }

    const seasons: string[] = Array.from(
      new Set(rows.map((r) => String(r.season))),
    );
    const winners: Winner[] = [];

    for (const season of seasons) {
      // Startjahr bestimmen (aus normalisiertem String, z. B. "2023/2024")
      const m = season.match(/\b(19|20)\d{2}\b/);
      const start = m ? parseInt(m[0], 10) : null;
      if (start === null || start < startYear) continue;

      // >=10-Spieltageregel NUR anwenden, wenn wir die Anzahl sicher kennen
      const knownMd = mdCountBySeason.get(season);
      if (
        knownMd !== undefined &&
        knownMd < OskarstatsOskarsiegerTimelineService.MIN_MATCHDAYS
      ) {
        continue; // Season (z. B. die aktuelle) überspringen
      }

      const seasonRows = rows.filter((r) => String(r.season) === season);

      // Legs je Spieler summieren
      const totals = new Map<number, number>();
      for (const r of seasonRows) {
        const pid = Number(r.player_id);
        const legs = Number(r.legs_won) || 0;
        if (!Number.isFinite(pid)) continue;
        totals.set(pid, (totals.get(pid) || 0) + legs);
      }

      // Sieger der Season
      let topId = -1,
        topVal = -1;
      for (const [pid, sum] of totals.entries()) {
        if (sum > topVal) {
          topVal = sum;
          topId = pid;
        }
      }
      if (topId !== -1) {
        winners.push({ jahr: start, player_id: topId, label: season });
      }
    }

    return winners.sort((a, b) => a.jahr - b.jahr);
  }

  /** Manuell + Auto (aus NORMALISIERTEN Rows) zusammenführen */
  getAllWinnersMergedFromNormalizedRows(rows: any[]): Winner[] {
    const manual = this.getManualWinners();
    const manualYears = new Set(manual.map((w) => w.jahr));
    const auto = this.getAutoWinnersFromNormalizedRows(rows, 2018).filter(
      (w) => !manualYears.has(w.jahr),
    );
    return [...manual, ...auto].sort((a, b) => b.jahr - a.jahr);
  }

  // Manuell + Auto zusammen, manuelle Jahre haben Vorrang
  getAllWinnersMerged(): Winner[] {
    const manual = this.getManualWinners();
    const manualYears = new Set(manual.map((w) => w.jahr));
    const auto = this.getAutoWinnersFromStats(2018).filter(
      (w) => !manualYears.has(w.jahr),
    );
    return [...manual, ...auto].sort((a, b) => b.jahr - a.jahr);
  }
}
