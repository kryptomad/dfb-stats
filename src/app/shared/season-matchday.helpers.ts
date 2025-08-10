// src/app/shared/season.helpers.ts
export type SeasonLike = string | number;

export interface HasSeasonMatchday {
  season: SeasonLike;
  matchday: number | string;
}

/** Normiert Season:
 *  - 2024        -> "2024"
 *  - "2024/25"   -> "2024/2025"
 *  - "2024-2025" -> "2024/2025"
 *  - "2024 / 25" -> "2024/2025"
 */
export function normalizeSeason(x: SeasonLike): string {
  const raw = String(x).trim();
  // Greife "YYYY", "YYYY/YY", "YYYY/ YYYY", "YYYY-YYYY", "YYYY–YY" etc. ab
  const m = raw.replace(/[\s–—-]+/g, '/').match(/^(\d{4})(?:\s*\/\s*(\d{2,4}))?$/);
  if (!m) return raw; // Fallback: gib Original zurück, falls Format unerwartet

  const start = parseInt(m[1], 10);
  const endRaw = m[2];

  if (!endRaw) return String(start);

  let end = parseInt(endRaw, 10);
  if (endRaw.length === 2) {
    const startCentury = Math.floor(start / 100) * 100;
    const startYY = start % 100;
    end = startCentury + end;
    if (end < start) end += 100; // z.B. 1999/00 -> 2000
  }
  return `${start}/${end}`;
}

/** Startjahr als Zahl (für Sortierung). */
export function seasonStartYear(x: SeasonLike): number {
  const s = normalizeSeason(x);
  const m = s.match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : Number.NEGATIVE_INFINITY;
}

/** Einzigartige Seasons (normalisiert) sortiert (ASC). */
export function listSeasons<T extends HasSeasonMatchday>(rows: T[]): string[] {
  const set = new Set(rows.map(r => normalizeSeason(r.season)));
  return Array.from(set).sort((a, b) => seasonStartYear(a) - seasonStartYear(b));
}

/** Jüngste Season (oder null, wenn leer). */
export function latestSeason<T extends HasSeasonMatchday>(rows: T[]): string | null {
  const seasons = listSeasons(rows);
  return seasons.length ? seasons[seasons.length - 1] : null;
}

/** Alle Matchdays (unique, numeric, sortiert) für eine Season. */
export function listMatchdays<T extends HasSeasonMatchday>(
  rows: T[],
  season: SeasonLike,
): number[] {
  const target = normalizeSeason(season);
  const mdSet = new Set<number>();
  for (const r of rows) {
    if (normalizeSeason(r.season) === target) {
      const n = typeof r.matchday === 'string' ? parseInt(r.matchday, 10) : r.matchday;
      if (!Number.isNaN(n)) mdSet.add(n);
    }
  }
  return Array.from(mdSet).sort((a, b) => a - b);
}

/** Filter: alle Zeilen einer Season. */
export function filterBySeason<T extends HasSeasonMatchday>(rows: T[], season: SeasonLike): T[] {
  const target = normalizeSeason(season);
  return rows.filter(r => normalizeSeason(r.season) === target);
}

/** Filter: Season + Matchday. */
export function filterBySeasonAndMatchday<T extends HasSeasonMatchday>(
  rows: T[],
  season: SeasonLike,
  matchday: number | string,
): T[] {
  const md = typeof matchday === 'string' ? parseInt(matchday, 10) : matchday;
  const target = normalizeSeason(season);
  return rows.filter(
    r => normalizeSeason(r.season) === target &&
      (typeof r.matchday === 'string' ? parseInt(r.matchday, 10) : r.matchday) === md,
  );
}

/** Optional: Sortierung nach Season (ASC) dann Matchday (ASC). */
export function sortBySeasonThenMatchday<T extends HasSeasonMatchday>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const sa = seasonStartYear(a.season);
    const sb = seasonStartYear(b.season);
    if (sa !== sb) return sa - sb;
    const ma = typeof a.matchday === 'string' ? parseInt(a.matchday, 10) : a.matchday;
    const mb = typeof b.matchday === 'string' ? parseInt(b.matchday, 10) : b.matchday;
    return (ma ?? 0) - (mb ?? 0);
  });
}
