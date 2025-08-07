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
        label: 'Spieltag',
        items: [
          {
            label: 'Aktueller Spieltag',
            icon: 'pi pi-fw pi-clock',
            routerLink: 'pages/spieltag',
            fragment: 'aktueller-spieltag',
          },
          {
            label: 'Jahrestabelle',
            icon: 'pi pi-fw pi-table',
            routerLink: 'pages/spieltag',
            fragment: 'jahrestabelle',
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
            label: 'Spieler',
            icon: 'pi pi-fw pi-user',
            routerLink: 'pages/spieler',
          },
          {
            label: 'Bestleistungen',
            icon: 'pi pi-fw pi-bolt',
            routerLink: 'pages/spieler',
          },
          {
            label: 'Spieler vs. Spieler',
            icon: 'pi pi-fw pi-users',
            routerLink: 'pages/spieler',
          },
        ],
      },
      {
        label: 'Statistiken',
        icon: 'pi pi-fw pi-crown',
        routerLink: 'pages/statistiken',
        items: [
          {
            label: 'Allzeit-Rekorde',
            icon: 'pi pi-fw pi-crown',
            routerLink: 'pages/statistiken',
            fragment: 'allzeit-rekorde',
          },
          {
            label: 'Jahresvergleich',
            icon: 'pi pi-fw pi-chart-bar',
            routerLink: 'pages/statistiken',
          },
          {
            label: 'Trendverlauf',
            icon: 'pi pi-fw pi-chart-line',
            routerLink: 'pages/statistiken',
            fragment: 'trendverlauf',
          },
          {
            label: 'Oskarsieger',
            icon: 'pi pi-fw pi-trophy',
            routerLink: 'pages/statistiken',
            fragment: 'oskarsieger',
          },
        ],
      },
      {
        label: 'Rekorde',
        items: [
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
      {
        label: 'Regelwerk',
        items: [
          {
            label: 'Spielregeln',
            icon: 'pi pi-fw pi-book',
            routerLink: 'pages/regelwerk',
          },
          {
            label: 'Dartkasse',
            icon: 'pi pi-fw pi-wallet',
            routerLink: 'pages/regelwerk',
          },
          {
            label: 'Vereinsregeln',
            icon: 'pi pi-fw pi-file',
            routerLink: 'pages/regelwerk',
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
