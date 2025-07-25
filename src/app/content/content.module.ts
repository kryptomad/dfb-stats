import { NgModule } from '@angular/core';
import { StartseiteComponent } from './startseite/startseite.component';
import { SpieltagComponent } from './spieltag/spieltag.component';

@NgModule({
  declarations: [StartseiteComponent, SpieltagComponent],
  exports: [StartseiteComponent, SpieltagComponent],
})
export class ContentModule {}
