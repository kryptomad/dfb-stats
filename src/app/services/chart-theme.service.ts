import { Injectable, signal } from '@angular/core';

export interface Jahreszeile {
  name: string;
  altePunkte: number;
  punkte: number;
}

@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  // ---- Dark/Light erkennen (wie in deinem Code) ----
  private isDomDark = () =>
    document.documentElement.classList.contains('app-dark') ||
    document.documentElement.classList.contains('dark');

  isDark = signal<boolean>(this.isDomDark());

  watchDomTheme() {
    const mo = new MutationObserver(() => this.isDark.set(this.isDomDark()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
 getCssVar(name: string, fallback: string): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  hexToRgba(hex: string, alpha: number): string {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const num = parseInt(h, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getPrimaryFill(alpha = 0.55): string {
    const primary = this.getCssVar('--primary-color', '#2196F3');
    return this.hexToRgba(primary, alpha);
  }

  private baseColors() {
    const dark = this.isDark();
    const text = dark ? '#f3f3f3ff' : '#464646ff';
    const grid = dark ? '#363636ff' : '#dadadaff';
    return { text, grid };
  }

  radarOptions({ showTicks = false } = {}) {
    const { text, grid } = this.baseColors();
    return {
      responsive: true,
      plugins: { legend: { labels: { color: text } }, datalabels: { color: text } },
      scales: {
        r: {
          beginAtZero: true,
          pointLabels: { color: text, font: { size: 12 } },
          angleLines: { color: grid },
          grid: { color: grid },
          ticks: { display: showTicks, showLabelBackdrop: false }
        }
      }
    };
  }

  cartesianOptions(extra?: any) {
    const { text, grid } = this.baseColors();
    return {
      responsive: true,
      plugins: {
        legend: { labels: { color: text } },
        datalabels: { color: text },
        tooltip: { enabled: true }
      },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { color: grid } }
      },
      ...(extra ?? {})
    };
  }


}