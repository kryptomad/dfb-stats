import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-spieler',
  imports: [Card, FieldsetModule, TagModule, TabsModule],
  templateUrl: './spieler.component.html',
  styleUrl: './spieler.component.scss',
  standalone: true,
})
export class SpielerComponent {}
