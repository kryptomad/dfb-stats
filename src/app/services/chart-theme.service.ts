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
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
  getCssVar(name: string, fallback = ''): string {
    const fromRoot = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    if (fromRoot) return fromRoot;
    const fromBody = getComputedStyle(document.body)
      .getPropertyValue(name)
      .trim();
    return fromBody || fallback;
  }

  hexToRgba(hex: string, alpha: number): string {
    let h = hex.replace('#', '').trim();
    if (h.length === 3)
      h = h
        .split('')
        .map((x) => x + x)
        .join('');
    const num = parseInt(h, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getPrimary(): string {
    // v18 nutzt meist --p-primary-500; dann erst die alten Tokens
    return (
      this.getCssVar('--p-primary-500', '') ||
      this.getCssVar('--p-primary-color', '') ||
      this.getCssVar('--primary-color', '') ||
      '#4b98afff'
    );
  }

  getPrimaryFill(alpha = 0.55): string {
    return this.hexToRgba(this.getPrimary(), alpha);
  }
  getSecondary(): string {
    return this.getCssVar('--text-color-secondary', '#aaaaaa');
  }
  getSecondaryFill(alpha = 0.4): string {
    return this.hexToRgba(this.getSecondary(), alpha);
  }

  private baseColors() {
    const dark = this.isDark();
    const text = dark ? '#f3f3f3ff' : '#464646ff';
    const grid = dark ? '#363636ff' : '#dadadaff';
    return { text, grid };
  }

  getRadarChartOptions({ showTicks = false } = {}) {
    const { text, grid } = this.baseColors();
    return {
      responsive: true,
      plugins: {
        legend: { labels: { color: text } },
        datalabels: { display: true, color: text },
      },
      scales: {
        r: {
          beginAtZero: true,
          pointLabels: { color: text, font: { size: 12 } },
          angleLines: { color: grid },
          grid: { color: grid },
          ticks: { display: showTicks, showLabelBackdrop: false },
        },
      },
    };
  }

  getLineChartOptions(extra?: any) {
    const { text, grid } = this.baseColors();
    return {
      responsive: true,
      plugins: {
        legend: { labels: { color: text } },
        datalabels: { color: text },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { color: grid } },
      },
      ...(extra ?? {}),
    };
  }

  getBarStackedOptions(extra?: any) {
    const { text, grid } = this.baseColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: text } },
        datalabels: { color: text, display: false },
        tooltip: { enabled: true },
        colors: { enabled: false }, // Autocolors aus, deine Farben gelten
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: text },
          grid: { color: grid, display: false },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: text },
          grid: { color: grid, display: false },
        },
      },
      ...(extra ?? {}),
    };
  }

  getBarOptions(extra?: any) {
    const { text, grid } = this.baseColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: text } },
        datalabels: { color: text, display: false },
        tooltip: { enabled: true },
        colors: { enabled: false },
      },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid } },
        y: { beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
      },
      ...(extra ?? {}),
    };
  }
}