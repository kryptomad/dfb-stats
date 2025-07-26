import { NgModule } from '@angular/core';
import { StartseiteComponent } from './startseite/startseite.component';
import { SpieltagComponent } from './spieltag/spieltag.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [StartseiteComponent, SpieltagComponent],
  imports: [CommonModule],
  exports: [StartseiteComponent, SpieltagComponent],
})
export class ContentModule {}
