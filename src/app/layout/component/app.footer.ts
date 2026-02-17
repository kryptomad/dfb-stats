import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'app-footer',
  template: `
    <footer class="app-footer">
      <div>© {{ year }} Dartfreunde Borchen n.e.V.</div>
      <div class="data-note">Elektronische Datenerfassung seit 2018 via n01</div>
      <div>
        <a routerLink="pages/impressum">Impressum</a> <span style="color: var(--primary-color)">·</span>
        <a routerLink="pages/datenschutz">Datenschutz</a>
      </div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        text-align: center;
        color: var(--text-color-secondary);
        padding: 1rem 0;
        font-size: 0.95rem;
      }
      .data-note {
        font-size: 0.8rem;
        opacity: 0.6;
        margin: 0.25rem 0;
      }
      .app-footer a {
        color: var(--text-color-secondary);
        opacity: 0.7;
        text-decoration: underline;
        margin: 0 0.4em;
      }
      .app-footer a:hover {
        opacity: 1;
      }
    `,
  ],
})
export class AppFooter {
  year: number = new Date().getFullYear();
}
