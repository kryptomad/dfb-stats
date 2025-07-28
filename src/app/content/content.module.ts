import { NgModule } from '@angular/core';
import { StartseiteComponent } from './startseite/startseite.component';
import { SpieltagComponent } from './spieltag/spieltag.component';
import { CommonModule } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';

@NgModule({
  declarations: [StartseiteComponent, SpieltagComponent],
  imports: [CommonModule, DataViewModule, ButtonModule, Card],
  exports: [StartseiteComponent, SpieltagComponent],
})
export class ContentModule {}
