import { Injectable } from '@angular/core';
import * as insightsData from '../../assets/insights.json';

export interface Insight {
  insight_id: string;
  player_id: number;
  player: string;
  category: string;
  text: string;
  value: any;
  value2?: any;
  key: string;
  generated_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private insights: Insight[] = [];

  constructor() {
    const raw: any = (insightsData as any).default ?? (insightsData as any);
    this.insights = raw.insights || [];
  }

  getPlayerInsights(playerId: number): Insight[] {
    return this.insights.filter(i => i.player_id === playerId);
  }

  getRandomInsights(playerId: number, count: number): Insight[] {
    const all = this.getPlayerInsights(playerId);
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  resolveText(insight: Insight): string {
    let text = insight.text;
    text = text.replace('{value}', String(insight.value));
    if (insight.value2 !== undefined) {
      text = text.replace('{value2}', String(insight.value2));
    }
    return text;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'uhrzeit': 'Uhrzeit',
      'spielnummer': 'Spielnummer',
      'gegner': 'Gegner',
      'formkurve': 'Formkurve',
      'spielweise': 'Spielweise',
      'saison': 'Saison',
      'fun': 'Kurioses',
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'uhrzeit': 'pi pi-clock',
      'spielnummer': 'pi pi-hashtag',
      'gegner': 'pi pi-users',
      'formkurve': 'pi pi-chart-line',
      'spielweise': 'pi pi-bullseye',
      'saison': 'pi pi-calendar',
      'fun': 'pi pi-star',
    };
    return icons[category] || 'pi pi-info-circle';
  }
}
