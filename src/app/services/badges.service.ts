import { Injectable } from '@angular/core';
import { PlayersService } from './players.service';
import * as rawStatsData from '../../assets/stats.json';
import * as rawLegsData from '../../assets/legs.json';

export interface BadgeDefinition {
  name: string;
  punkte: number;
  beschreibung: string;
  kategorie: string;
  icon: string;
}

export interface BadgeAward {
  season: string;
  matchday: number;
  badgeName: string;
  playerId: number;
}

export interface BadgeHolder {
  playerId: number;
  count: number;
}

export interface BadgeWithHolder extends BadgeDefinition {
  halterId: number;
  count: number;
  holders: BadgeHolder[];
}

export interface LeaderboardEntry {
  playerId: number;
  name: string;
  avatar: string;
  chips: number;
}

export interface PlayerBadge {
  badge: BadgeDefinition;
  count: number;
}

export interface ChipWinner {
  playerId: number;
  name: string;
  avatar: string;
  wins: number;
}

@Injectable({ providedIn: 'root' })
export class BadgesService {
  private stats: any[];
  private games: any[];
  private allAwards: BadgeAward[] = [];
  private chipWinnersList: ChipWinner[] = [];

  currentSeason = '';
  latestMatchday = 0;

  readonly badgeDefinitions: BadgeDefinition[] = [
    {
      name: 'TON-Machine',
      punkte: 5,
      beschreibung: 'Meisten TONs am Spieltag',
      kategorie: 'Score',
      icon: 'fa-solid fa-square-root-variable',
    },
    {
      name: '140-Bomber',
      punkte: 7,
      beschreibung: 'Meisten 140 am Spieltag',
      kategorie: 'Score',
      icon: 'fa-solid fa-bomb',
    },
    {
      name: '180er-Gott',
      punkte: 10,
      beschreibung: 'Meisten 180 am Spieltag',
      kategorie: 'Score',
      icon: 'fa-solid fa-burst',
    },
    {
      name: '26-Legende',
      punkte: 3,
      beschreibung: 'Am meisten 26 geworfen',
      kategorie: 'Score',
      icon: 'fa-solid fa-fish',
    },
    {
      name: 'Checkout-Monster',
      punkte: 10,
      beschreibung: '100+ Checkout am Spieltag',
      kategorie: 'Checkout',
      icon: 'fa-solid fa-ghost',
    },
    {
      name: 'Big Finish',
      punkte: 7,
      beschreibung: 'Höchster Checkout am Spieltag',
      kategorie: 'Checkout',
      icon: 'fa-solid fa-crosshairs',
    },
    {
      name: 'Clutch King',
      punkte: 6,
      beschreibung: 'Beste 1-Dart-Checkout-Quote %',
      kategorie: 'Checkout',
      icon: 'fa-solid fa-crown',
    },
    {
      name: 'Safe Finisher',
      punkte: 5,
      beschreibung: 'Beste 2-Dart-Checkout-Quote %',
      kategorie: 'Checkout',
      icon: 'fa-solid fa-lock',
    },
    {
      name: 'Drama King',
      punkte: 4,
      beschreibung: 'Beste 3-Dart-Checkout-Quote %',
      kategorie: 'Checkout',
      icon: 'fa-solid fa-mask',
    },
    {
      name: 'Fast & Furious',
      punkte: 8,
      beschreibung: 'Beste Leg des Spieltags',
      kategorie: 'Performance',
      icon: 'fa-solid fa-stopwatch',
    },
    {
      name: 'Average King',
      punkte: 8,
      beschreibung: 'Höchster 3-Dart Average am Spieltag',
      kategorie: 'Performance',
      icon: 'fa-solid fa-percent',
    },
    {
      name: 'Power Scorer',
      punkte: 8,
      beschreibung: 'Höchster First-9 Average am Spieltag',
      kategorie: 'Performance',
      icon: 'fa-solid fa-robot',
    },
    {
      name: 'Iron Man',
      punkte: 5,
      beschreibung: 'Meisten Legs gespielt',
      kategorie: 'Performance',
      icon: 'fa-solid fa-dumbbell',
    },
    {
      name: 'Streak Shooter',
      punkte: 5,
      beschreibung: '3 Spiele in Folge 3DA > Ø55',
      kategorie: 'Performance',
      icon: 'fa-solid fa-trophy',
    },
    {
      name: 'Comeback Hero',
      punkte: 3,
      beschreibung: 'Sieg nach 0:2 Rückstand',
      kategorie: 'Performance',
      icon: 'fa-solid fa-rotate-left',
    },
    {
      name: 'Bust-King',
      punkte: 3,
      beschreibung: 'Längste Serie an Bust Würfen',
      kategorie: 'Fun',
      icon: 'fa-solid fa-trash',
    },
    {
      name: 'Kleinvieh',
      punkte: 3,
      beschreibung: 'Meisten Würfe unter 26 bei den First 9',
      kategorie: 'Fun',
      icon: 'fa-solid fa-poop',
    },
    {
      name: 'Der Erlöser',
      punkte: 3,
      beschreibung: 'Gewinnt das längste Leg am Abend',
      kategorie: 'Fun',
      icon: 'fa-solid fa-hands',
    },
    {
      name: 'Diesel-Motor',
      punkte: 3,
      beschreibung: 'Schlechteste First-9 Average am Spieltag',
      kategorie: 'Fun',
      icon: 'fa-solid fa-hourglass-end',
    },
  ];

  readonly kategorieNamen = [
    { name: 'Score', titel: 'Score' },
    { name: 'Checkout', titel: 'Checkout' },
    { name: 'Performance', titel: 'Performance' },
    { name: 'Fun', titel: 'Fun' },
  ];

  readonly kategorieFarbe: Record<string, string> = {
    Checkout: 'bg-green-900 text-white',
    Score: 'bg-red-700 text-white',
    Performance: 'bg-orange-400 text-white',
    Fun: 'bg-purple-900 text-white',
  };

  constructor(private playersService: PlayersService) {
    this.stats = (Object.create(rawStatsData) as any).default;
    this.games = (Object.create(rawLegsData) as any).default;
    this.init();
  }

  private init(): void {
    const seasons = [
      ...new Set(this.stats.map((s: any) => s.season as string)),
    ].sort();
    this.currentSeason = seasons[seasons.length - 1] || '';

    const matchdays = this.stats
      .filter((s: any) => s.season === this.currentSeason)
      .map((s: any) => s.matchday as number);
    this.latestMatchday = matchdays.length > 0 ? Math.max(...matchdays) : 0;

    for (let md = 1; md <= this.latestMatchday; md++) {
      this.calculateMatchdayBadges(this.currentSeason, md);
    }

    this.calculateChipWinners();
  }

  // =====================
  //  PUBLIC API
  // =====================

  getBadgesForKategorie(kategorie: string): BadgeWithHolder[] {
    return this.badgeDefinitions
      .filter((b) => b.kategorie === kategorie)
      .map((b) => {
        const holders = this.getCurrentHolders(b.name);
        const first = holders[0] || { playerId: 0, count: 0 };
        return { ...b, halterId: first.playerId, count: first.count, holders };
      });
  }

  getCurrentHolders(badgeName: string): BadgeHolder[] {
    const latestAwards = this.allAwards.filter(
      (a) => a.badgeName === badgeName && a.matchday === this.latestMatchday,
    );
    if (latestAwards.length === 0) return [];

    return latestAwards.map((a) => ({
      playerId: a.playerId,
      count: this.allAwards.filter(
        (aw) => aw.badgeName === badgeName && aw.playerId === a.playerId,
      ).length,
    }));
  }

  getCurrentHolder(badgeName: string): { playerId: number; count: number } {
    const holders = this.getCurrentHolders(badgeName);
    return holders[0] || { playerId: 0, count: 0 };
  }

  /**
   * Chip-Leaderboard mit Reset-Logik.
   * Wenn jemand 100 erreicht → alle resetten.
   * Gibt die aktuellen Chip-Stände zurück.
   */
  getChipTotals(): LeaderboardEntry[] {
    const chipMap = new Map<number, number>();

    // Simuliere Spieltag für Spieltag
    for (let md = 1; md <= this.latestMatchday; md++) {
      const mdAwards = this.allAwards.filter((a) => a.matchday === md);
      for (const award of mdAwards) {
        const def = this.badgeDefinitions.find(
          (b) => b.name === award.badgeName,
        );
        if (!def) continue;
        chipMap.set(
          award.playerId,
          (chipMap.get(award.playerId) || 0) + def.punkte,
        );
      }

      // Prüfe ob jemand >= 100 erreicht hat → nur dessen Punkte resetten
      for (const [pid, chips] of chipMap) {
        if (chips >= 100) {
          chipMap.set(pid, 0);
        }
      }
    }

    const entries: LeaderboardEntry[] = [];
    chipMap.forEach((chips, playerId) => {
      const player = this.playersService.getPlayer(playerId);
      if (player) {
        entries.push({
          playerId,
          name: player.name,
          avatar: 'assets/players/' + player.image,
          chips,
        });
      }
    });
    return entries.sort((a, b) => b.chips - a.chips);
  }

  /** Alle Gewinner die 100 Chips erreicht haben */
  getChipWinners(): ChipWinner[] {
    return this.chipWinnersList;
  }

  /** Berechne wer wann 100 Chips erreicht hat */
  private calculateChipWinners(): void {
    const chipMap = new Map<number, number>();
    const winCounts = new Map<number, number>();

    for (let md = 1; md <= this.latestMatchday; md++) {
      const mdAwards = this.allAwards.filter((a) => a.matchday === md);
      for (const award of mdAwards) {
        const def = this.badgeDefinitions.find(
          (b) => b.name === award.badgeName,
        );
        if (!def) continue;
        chipMap.set(
          award.playerId,
          (chipMap.get(award.playerId) || 0) + def.punkte,
        );
      }

      // Prüfe ob jemand >= 100 erreicht hat → nur dessen Punkte resetten
      for (const [pid, chips] of chipMap) {
        if (chips >= 100) {
          winCounts.set(pid, (winCounts.get(pid) || 0) + 1);
          chipMap.set(pid, 0);
        }
      }
    }

    // Pro Spieler einen Eintrag mit Gesamtsiegen
    for (const [pid, wins] of winCounts) {
      const player = this.playersService.getPlayer(pid);
      if (player) {
        this.chipWinnersList.push({
          playerId: pid,
          name: player.name,
          avatar: 'assets/players/' + player.image,
          wins,
        });
      }
    }
    this.chipWinnersList.sort((a, b) => b.wins - a.wins);
  }

  /** Komplette Badge-Historie eines Spielers (alle Spieltage) */
  getPlayerBadgeHistory(playerId: number): PlayerBadge[] {
    const badgeCounts = new Map<string, number>();
    for (const award of this.allAwards) {
      if (award.playerId === playerId) {
        badgeCounts.set(award.badgeName, (badgeCounts.get(award.badgeName) || 0) + 1);
      }
    }

    return Array.from(badgeCounts.entries())
      .map(([name, count]) => {
        const def = this.badgeDefinitions.find((b) => b.name === name);
        if (!def) return null;
        return { badge: def, count };
      })
      .filter((b): b is PlayerBadge => b !== null)
      .sort((a, b) => b.count - a.count);
  }

  /** Nur Badges vom letzten Spieltag (fürs Profil) */
  getPlayerCurrentBadges(playerId: number): PlayerBadge[] {
    const latestAwards = this.allAwards.filter(
      (a) => a.playerId === playerId && a.matchday === this.latestMatchday,
    );
    return latestAwards
      .map((a) => {
        const def = this.badgeDefinitions.find((b) => b.name === a.badgeName);
        if (!def) return null;
        const totalCount = this.allAwards.filter(
          (aw) => aw.playerId === playerId && aw.badgeName === a.badgeName,
        ).length;
        return { badge: def, count: totalCount };
      })
      .filter((b): b is PlayerBadge => b !== null);
  }

  getSpielerBild(playerId: number): string {
    const p = this.playersService.getPlayer(playerId);
    return p ? 'assets/players/' + p.image : 'assets/players/default.png';
  }

  getSpielerName(playerId: number): string {
    return this.playersService.getPlayer(playerId)?.name || '';
  }

  // =====================
  //  BADGE CALCULATION
  // =====================

  private calculateMatchdayBadges(season: string, matchday: number): void {
    const mdStats = this.stats.filter(
      (s: any) => s.season === season && s.matchday === matchday,
    );
    const mdGames = this.games.filter(
      (g: any) => g.season === season && g.matchday === matchday,
    );

    // --- STATS-BASED ---

    // TON-Machine: meisten 100er (score_100)
    this.awardByPlayerSum(
      season,
      matchday,
      'TON-Machine',
      mdStats,
      (s) => s.score_100 || 0,
      1,
    );

    // 140-Bomber: meisten 140er (score_140)
    this.awardByPlayerSum(
      season,
      matchday,
      '140-Bomber',
      mdStats,
      (s) => s.score_140 || 0,
      1,
    );

    // 180er-Gott: meisten 180er
    this.awardByPlayerSum(
      season,
      matchday,
      '180er-Gott',
      mdStats,
      (s) => s.score_180 || 0,
      1,
    );

    // Average King: gewichteter Spieltag-Durchschnitt (3-Dart)
    this.awardByWeightedAvg(
      season,
      matchday,
      'Average King',
      mdStats,
      (s) => s.avg_3dart || 0,
      (s) => s.darts_thrown || 0,
    );

    // Power Scorer: gewichteter Spieltag-Durchschnitt (First 9)
    this.awardByWeightedAvg(
      season,
      matchday,
      'Power Scorer',
      mdStats,
      (s) => s.avg_first9 || 0,
      (s) => s.legs_played || 0,
    );

    // Iron Man: meisten Legs gespielt
    this.awardByPlayerSum(
      season,
      matchday,
      'Iron Man',
      mdStats,
      (s) => s.legs_played || 0,
    );

    // Streak Shooter: 3 Spiele in Folge mit avg > 55
    this.calculateStreakShooter(season, matchday, mdStats);

    // Diesel-Motor: schlechtester First-9 Average
    this.awardByWeightedAvgLowest(
      season,
      matchday,
      'Diesel-Motor',
      mdStats,
      (s) => s.avg_first9 || 0,
      (s) => s.legs_played || 0,
    );

    // --- LEGS-BASED (inkl. Fast & Furious) ---
    this.calculateLegsBadges(season, matchday, mdGames);
  }

  // =====================
  //  STATS HELPERS
  // =====================

  /** Badge: höchste Summe pro Spieler */
  private awardByPlayerSum(
    season: string,
    matchday: number,
    badgeName: string,
    mdStats: any[],
    extractor: (s: any) => number,
    minValue = 0,
  ): void {
    const sums = new Map<number, number>();
    for (const s of mdStats) {
      const pid = s.player_id;
      sums.set(pid, (sums.get(pid) || 0) + extractor(s));
    }

    let best = -Infinity;
    for (const v of sums.values()) if (v > best) best = v;
    if (best < minValue) return;

    for (const [pid, v] of sums) {
      if (v === best) {
        this.allAwards.push({ season, matchday, badgeName, playerId: pid });
      }
    }
  }

  /** Badge: höchster gewichteter Durchschnitt über den Spieltag */
  private awardByWeightedAvg(
    season: string,
    matchday: number,
    badgeName: string,
    mdStats: any[],
    valueExtractor: (s: any) => number,
    weightExtractor: (s: any) => number,
  ): void {
    const playerNumerator = new Map<number, number>();
    const playerDenominator = new Map<number, number>();

    for (const s of mdStats) {
      const pid = s.player_id;
      const val = valueExtractor(s);
      const weight = weightExtractor(s);
      if (weight <= 0) continue;
      playerNumerator.set(pid, (playerNumerator.get(pid) || 0) + val * weight);
      playerDenominator.set(pid, (playerDenominator.get(pid) || 0) + weight);
    }

    const avgs = new Map<number, number>();
    for (const [pid, num] of playerNumerator) {
      const den = playerDenominator.get(pid) || 0;
      if (den > 0) avgs.set(pid, num / den);
    }

    if (avgs.size === 0) return;

    let best = -Infinity;
    for (const v of avgs.values()) if (v > best) best = v;

    for (const [pid, v] of avgs) {
      if (v === best) {
        this.allAwards.push({ season, matchday, badgeName, playerId: pid });
      }
    }
  }

  /** Badge: niedrigster gewichteter Durchschnitt über den Spieltag */
  private awardByWeightedAvgLowest(
    season: string,
    matchday: number,
    badgeName: string,
    mdStats: any[],
    valueExtractor: (s: any) => number,
    weightExtractor: (s: any) => number,
  ): void {
    const playerNumerator = new Map<number, number>();
    const playerDenominator = new Map<number, number>();

    for (const s of mdStats) {
      const pid = s.player_id;
      const val = valueExtractor(s);
      const weight = weightExtractor(s);
      if (weight <= 0) continue;
      playerNumerator.set(pid, (playerNumerator.get(pid) || 0) + val * weight);
      playerDenominator.set(pid, (playerDenominator.get(pid) || 0) + weight);
    }

    const avgs = new Map<number, number>();
    for (const [pid, num] of playerNumerator) {
      const den = playerDenominator.get(pid) || 0;
      if (den > 0) avgs.set(pid, num / den);
    }

    if (avgs.size === 0) return;

    let worst = Infinity;
    for (const v of avgs.values()) if (v < worst) worst = v;

    for (const [pid, v] of avgs) {
      if (v === worst) {
        this.allAwards.push({ season, matchday, badgeName, playerId: pid });
      }
    }
  }

  /** Streak Shooter: 3+ aufeinanderfolgende Spiele mit avg_3dart > 55 */
  private calculateStreakShooter(
    season: string,
    matchday: number,
    mdStats: any[],
  ): void {
    const playerGames = new Map<number, number[]>();
    const sorted = [...mdStats].sort((a, b) => a.game_id - b.game_id);
    for (const s of sorted) {
      const pid = s.player_id;
      if (!playerGames.has(pid)) playerGames.set(pid, []);
      playerGames.get(pid)!.push(s.avg_3dart || 0);
    }

    let bestStreak = 0;
    const winners: number[] = [];

    for (const [pid, avgs] of playerGames) {
      let streak = 0;
      let maxStreak = 0;
      for (const avg of avgs) {
        if (avg > 55) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
      }
      if (maxStreak >= 3) {
        if (maxStreak > bestStreak) {
          bestStreak = maxStreak;
          winners.length = 0;
          winners.push(pid);
        } else if (maxStreak === bestStreak) {
          winners.push(pid);
        }
      }
    }

    for (const pid of winners) {
      this.allAwards.push({
        season,
        matchday,
        badgeName: 'Streak Shooter',
        playerId: pid,
      });
    }
  }

  // =====================
  //  LEGS ANALYSIS
  // =====================

  private calculateLegsBadges(
    season: string,
    matchday: number,
    mdGames: any[],
  ): void {
    const playerData = new Map<
      number,
      {
        count26: number;
        maxBustStreak: number;
        bestWonLegDarts: number; // Fast & Furious: nur gewonnene Legs
        checkouts: { value: number; darts: number }[];
        kleinviehCount: number;
        comebacks: number;
      }
    >();

    const ensurePlayer = (pid: number) => {
      if (!playerData.has(pid)) {
        playerData.set(pid, {
          count26: 0,
          maxBustStreak: 0,
          bestWonLegDarts: Infinity,
          checkouts: [],
          kleinviehCount: 0,
          comebacks: 0,
        });
      }
      return playerData.get(pid)!;
    };

    for (const game of mdGames) {
      const p1 = game.player1_id;
      const p2 = game.player2_id;
      const p1Data = ensurePlayer(p1);
      const p2Data = ensurePlayer(p2);

      let p1LegsWon = 0;
      let p2LegsWon = 0;
      let p1WasDown02 = false;
      let p2WasDown02 = false;

      for (const leg of game.legs || []) {
        let p1BustStreak = 0;
        let p2BustStreak = 0;
        let prevP1Left = 501;
        let prevP2Left = 501;

        // Fast & Furious: nur gewonnene Legs zählen
        if (leg.leg_winner_id === p1 && leg.p1_darts_leg > 0) {
          p1Data.bestWonLegDarts = Math.min(
            p1Data.bestWonLegDarts,
            leg.p1_darts_leg,
          );
        }
        if (leg.leg_winner_id === p2 && leg.p2_darts_leg > 0) {
          p2Data.bestWonLegDarts = Math.min(
            p2Data.bestWonLegDarts,
            leg.p2_darts_leg,
          );
        }

        const rounds = leg.rounds || [];
        for (const round of rounds) {
          if (round.round === 0) continue;

          const p1Score = round.p1_score;
          const p2Score = round.p2_score;

          // 26er zählen
          if (p1Score === 26) p1Data.count26++;
          if (p2Score === 26) p2Data.count26++;

          // Bust-Streak (Score = 0)
          if (p1Score === 0) {
            p1BustStreak++;
            p1Data.maxBustStreak = Math.max(p1Data.maxBustStreak, p1BustStreak);
          } else {
            p1BustStreak = 0;
          }
          if (p2Score === 0) {
            p2BustStreak++;
            p2Data.maxBustStreak = Math.max(p2Data.maxBustStreak, p2BustStreak);
          } else {
            p2BustStreak = 0;
          }

          // Checkout-Erkennung (negativer Score)
          if (p1Score !== null && p1Score < 0) {
            p1Data.checkouts.push({
              value: prevP1Left,
              darts: Math.abs(p1Score),
            });
          }
          if (p2Score !== null && p2Score < 0) {
            p2Data.checkouts.push({
              value: prevP2Left,
              darts: Math.abs(p2Score),
            });
          }

          // Kleinvieh: First 9 (Runden 1-3), Score < 26
          if (round.round >= 1 && round.round <= 3) {
            if (p1Score !== null && p1Score >= 0 && p1Score < 26)
              p1Data.kleinviehCount++;
            if (p2Score !== null && p2Score >= 0 && p2Score < 26)
              p2Data.kleinviehCount++;
          }

          // Left-Werte für Checkout-Berechnung tracken
          if (round.p1_left !== null && round.p1_left !== undefined)
            prevP1Left = round.p1_left;
          if (round.p2_left !== null && round.p2_left !== undefined)
            prevP2Left = round.p2_left;
        }

        // Comeback-Tracking
        if (leg.leg_winner_id === p1) p1LegsWon++;
        else if (leg.leg_winner_id === p2) p2LegsWon++;

        if (p1LegsWon === 0 && p2LegsWon === 2) p1WasDown02 = true;
        if (p2LegsWon === 0 && p1LegsWon === 2) p2WasDown02 = true;
      }

      // Comeback: War 0:2 hinten und hat trotzdem gewonnen
      if (p1WasDown02 && p1LegsWon > p2LegsWon) p1Data.comebacks++;
      if (p2WasDown02 && p2LegsWon > p1LegsWon) p2Data.comebacks++;
    }

    // --- LEGS-BASED BADGES VERGEBEN ---

    // Fast & Furious: niedrigste Darts in gewonnener Leg
    this.awardFromMap(
      season,
      matchday,
      'Fast & Furious',
      playerData,
      (d) => (d.bestWonLegDarts < Infinity ? -d.bestWonLegDarts : -Infinity),
      1,
      true,
    ); // invertiert: höchster negativer Wert = niedrigste Darts

    // 26-Legende
    this.awardFromMap(
      season,
      matchday,
      '26-Legende',
      playerData,
      (d) => d.count26,
      1,
    );

    // Bust-King
    this.awardFromMap(
      season,
      matchday,
      'Bust-King',
      playerData,
      (d) => d.maxBustStreak,
      1,
    );

    // Kleinvieh
    this.awardFromMap(
      season,
      matchday,
      'Kleinvieh',
      playerData,
      (d) => d.kleinviehCount,
      1,
    );

    // Comeback Hero
    this.awardFromMap(
      season,
      matchday,
      'Comeback Hero',
      playerData,
      (d) => d.comebacks,
      1,
    );

    // Checkout-Monster: meisten Checkouts >= 100
    this.awardFromMap(
      season,
      matchday,
      'Checkout-Monster',
      playerData,
      (d) => d.checkouts.filter((c: any) => c.value >= 100).length,
      1,
    );

    // Big Finish: höchster einzelner Checkout
    this.awardFromMap(
      season,
      matchday,
      'Big Finish',
      playerData,
      (d) =>
        d.checkouts.length > 0
          ? Math.max(...d.checkouts.map((c: any) => c.value))
          : 0,
      1,
    );

    // Checkout-Quoten (min. 3 Checkouts zum Qualifizieren)
    this.awardCheckoutPct(season, matchday, 'Clutch King', playerData, 1);
    this.awardCheckoutPct(season, matchday, 'Safe Finisher', playerData, 2);
    this.awardCheckoutPct(season, matchday, 'Drama King', playerData, 3);

    // Der Erlöser: Gewinner des Spiels mit den meisten Runden
    this.awardDerErloeser(season, matchday, mdGames);
  }

  /** Der Erlöser: Gewinner des längsten einzelnen Legs (meisten Darts in einem Leg) */
  private awardDerErloeser(
    season: string,
    matchday: number,
    mdGames: any[],
  ): void {
    let maxDarts = 0;
    let winnersOfLongest: number[] = [];

    for (const game of mdGames) {
      for (const leg of game.legs || []) {
        const winnerId = leg.leg_winner_id;
        if (!winnerId) continue;

        const winnerDarts = winnerId === game.player1_id
          ? (leg.p1_darts_leg || 0)
          : (leg.p2_darts_leg || 0);
        if (winnerDarts <= 0) continue;

        if (winnerDarts > maxDarts) {
          maxDarts = winnerDarts;
          winnersOfLongest = [winnerId];
        } else if (winnerDarts === maxDarts && !winnersOfLongest.includes(winnerId)) {
          winnersOfLongest.push(winnerId);
        }
      }
    }

    for (const pid of winnersOfLongest) {
      this.allAwards.push({
        season,
        matchday,
        badgeName: 'Der Erlöser',
        playerId: pid,
      });
    }
  }

  /** Badge aus Map-Daten vergeben (höchster Wert gewinnt) */
  private awardFromMap(
    season: string,
    matchday: number,
    badgeName: string,
    data: Map<number, any>,
    extractor: (d: any) => number,
    minValue = 0,
    _inverted = false,
  ): void {
    let best = -Infinity;
    for (const [, d] of data) {
      const val = extractor(d);
      if (val > best) best = val;
    }
    if (best < minValue) return;

    for (const [pid, d] of data) {
      if (extractor(d) === best) {
        this.allAwards.push({ season, matchday, badgeName, playerId: pid });
      }
    }
  }

  /** Checkout-Quoten-Badge vergeben */
  private awardCheckoutPct(
    season: string,
    matchday: number,
    badgeName: string,
    data: Map<number, { checkouts: { value: number; darts: number }[] }>,
    targetDarts: number,
  ): void {
    const MIN_CHECKOUTS = 3;
    let bestPct = -1;
    const winners: number[] = [];

    for (const [pid, d] of data) {
      const total = d.checkouts.length;
      if (total < MIN_CHECKOUTS) continue;

      const matching = d.checkouts.filter(
        (c) => c.darts === targetDarts,
      ).length;
      const pct = matching / total;

      if (pct > bestPct) {
        bestPct = pct;
        winners.length = 0;
        winners.push(pid);
      } else if (pct === bestPct && pct > 0) {
        winners.push(pid);
      }
    }

    if (bestPct <= 0) return;
    for (const pid of winners) {
      this.allAwards.push({ season, matchday, badgeName, playerId: pid });
    }
  }
}
