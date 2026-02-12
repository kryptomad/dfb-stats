import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `
    <ul class="layout-menu">
      <ng-container *ngFor="let item of model; let i = index">
        <li
          app-menuitem
          *ngIf="!item.separator"
          [item]="item"
          [index]="i"
          [root]="true"
        ></li>
        <li *ngIf="item.separator" class="menu-separator"></li>
      </ng-container>
    </ul>
  `,
})
export class AppMenu implements OnInit {
  model: MenuItem[] = [];

  ngOnInit() {
    this.model = [
      {
        label: 'Startseite',
        items: [
          { label: 'Startseite', icon: 'pi pi-fw pi-home', routerLink: '/' },
        ],
      },
      {
        label: 'Aktuelle Saison',
        items: [
          {
            label: 'Aktueller Spieltag',
            icon: 'pi pi-fw pi-clock',
            routerLink: 'pages/spieltag',
            fragment: 'aktueller-spieltag',
          },
          {
            label: 'Aktueller Tabellenstand',
            icon: 'pi pi-fw pi-table',
            routerLink: 'pages/spieltag',
            fragment: 'aktueller-tabellenstand',
          },
          {
            label: 'Spieltagverlauf',
            icon: 'pi pi-fw pi-list',
            routerLink: 'pages/spieltag',
            fragment: 'spieltagverlauf',
          },
          {
            label: 'Saisonwertungen',
            icon: 'pi pi-fw pi-trophy',
            routerLink: 'pages/spieltag',
            fragment: 'saisonwertungen',
          },
        ],
      },
      {
        label: 'Spiele',
        items: [
          {
            label: 'Alle Spiele',
            icon: 'pi pi-fw pi-list',
            routerLink: 'pages/spiele',
            fragment: 'alle-spiele',
          },
        ],
      },
      {
        label: 'Spieler',
        items: [
          {
            label: 'Aktive Spieler',
            icon: 'pi pi-fw pi-user',
            routerLink: 'pages/spieler',
          },
        ],
      },
      {
        label: 'Statistiken',
        items: [
          {
            label: 'Spielerstatistiken',
            icon: 'pi pi-fw pi-users',
            items: [
              {
                label: 'Bestleistungen',
                icon: 'pi pi-fw pi-bolt',
                routerLink: 'pages/spielerstatistiken',
                fragment: 'bestleistungen',
              },
              {
                label: 'Spieler vs. Spieler',
                icon: 'pi pi-fw pi-users',
                routerLink: 'pages/spielerstatistiken',
                fragment: 'spieler-vs-spieler',
              },
              {
                label: 'Scorevergleich',
                icon: 'pi pi-fw pi-chart-bar',
                routerLink: 'pages/spielerstatistiken',
                fragment: 'scorevergleich',
              },
              {
                label: 'Checkdarts',
                icon: 'pi pi-fw pi-percentage',
                routerLink: 'pages/spielerstatistiken',
                fragment: 'checkdarts',
              },
              {
                label: 'Allzeit-Rekorde',
                icon: 'pi pi-fw pi-crown',
                routerLink: 'pages/spielerstatistiken',
                fragment: 'allzeit-rekorde',
              },
              {
                label: 'Top 5 Ranglisten',
                icon: 'pi pi-fw pi-list-check',
                routerLink: 'pages/spielerstatistiken',
                fragment: 'top5',
              },
            ],
          },
          {
            label: 'Jahresstatistiken',
            icon: 'pi pi-fw pi-calendar',
            items: [
              {
                label: 'Highlight Legs',
                icon: 'pi pi-fw pi-flag',
                routerLink: 'pages/jahresstatistiken',
                fragment: 'highlight-legs',
              },
              {
                label: 'Highlight Matches',
                icon: 'pi pi-fw pi-star',
                routerLink: 'pages/jahresstatistiken',
                fragment: 'highlight-matches',
              },
              {
                label: 'Saisonvergleich',
                icon: 'pi pi-fw pi-chart-bar',
                routerLink: 'pages/jahresstatistiken',
                fragment: 'jahresvergleich',
              },
              {
                label: 'Trendverlauf',
                icon: 'pi pi-fw pi-chart-line',
                routerLink: 'pages/jahresstatistiken',
                fragment: 'trendverlauf',
              },
              {
                label: 'Jahresvergleich',
                icon: 'pi pi-fw pi-chart-line',
                routerLink: 'pages/jahresstatistiken',
                fragment: 'jahresvergleich-punkte',
              },
            ],
          },
        ],
      },
      {
        label: 'Rekorde',
        items: [
          {
            label: 'Vereinsrekorde',
            icon: 'pi pi-fw pi-trophy',
            items: [
              {
                label: 'Oskarsieger',
                icon: 'pi pi-fw pi-crown',
                routerLink: 'pages/rekorde',
                fragment: 'oskarsieger',
              },
              {
                label: 'Gesamtwertungen',
                icon: 'pi pi-fw pi-trophy',
                routerLink: 'pages/rekorde',
                fragment: 'gesamtwertungen',
              },
              {
                label: 'Jahreswertungen',
                icon: 'pi pi-fw pi-calendar',
                routerLink: 'pages/rekorde',
                fragment: 'jahreswertungen',
              },
              {
                label: 'Spieltagswertungen',
                icon: 'pi pi-fw pi-flag',
                routerLink: 'pages/rekorde',
                fragment: 'spieltagswertungen',
              },
              {
                label: 'Matchwertungen',
                icon: 'pi pi-fw pi-star',
                routerLink: 'pages/rekorde',
                fragment: 'matchwertungen',
              },
            ],
          },
        ],
      },
      {
        label: 'Verein',
        items: [
          {
            label: 'Regelwerk',
            icon: 'pi pi-fw pi-book',
            items: [
              {
                label: 'Spielregeln',
                icon: 'pi pi-fw pi-book',
                routerLink: 'pages/regelwerk',
                fragment: 'spielregeln',
              },
              {
                label: 'Dartkasse',
                icon: 'pi pi-fw pi-wallet',
                routerLink: 'pages/regelwerk',
                fragment: 'dartkasse',
              },
              {
                label: 'Vereinsregeln',
                icon: 'pi pi-fw pi-file',
                routerLink: 'pages/regelwerk',
                fragment: 'vereinsregeln',
              },
            ],
          },
        ],
      },
      {
        label: 'Abzeichen',
        items: [
          {
            label: 'Abzeichen',
            icon: 'pi pi-fw pi-shield',
            routerLink: 'pages/abzeichen',
          },
        ],
      },
    ];
  }
}