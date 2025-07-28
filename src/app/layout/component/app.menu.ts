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
            label: 'Jahrestabelle',
            routerLink: 'spieltag/jahrestabelle',
          },
        ],
      },
      {
        label: 'Spiele',
        items: [],
      },
      {
        label: 'Spieler',
        items: [
          {
            label: 'Bestleistungen',
          },
          {
            label: 'Spieler vs. Spieler',
          },
        ],
      },
      {
        label: 'Statistiken',
        items: [
          {
            label: 'Allzeit-Rekorde',
          },
          {
            label: 'Jahresvergleich',
          },
          {
            label: 'Trendverlauf',
          },
        ],
      },
      {
        label: 'Rekorde',
        items: [
          {
            label: 'Gesamtwertungen',
          },
          {
            label: 'Jahreswertungen',
          },
          {
            label: 'Spieltagswertungen',
          },
          {
            label: 'Matchwertungen',
          },
        ],
      },
      {
        label: 'Regelwerk',
        items: [
          {
            label: 'Spielregeln',
          },
          {
            label: 'Dartkasse',
          },
          {
            label: 'Vereinsregeln',
          },
        ],
      },
    ];
  }
}
