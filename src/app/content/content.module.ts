import { NgModule } from '@angular/core';
import { StartseiteComponent } from './startseite/startseite.component';
import { SpieltagComponent } from './spieltag/spieltag.component';
import { CommonModule } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';

@NgModule({
  declarations: [StartseiteComponent, SpieltagComponent],
  imports: [CommonModule, DataViewModule, ButtonModule],
  exports: [StartseiteComponent, SpieltagComponent],
})
export class ContentModule {}
