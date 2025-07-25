import { NgModule } from '@angular/core';
import { StartseiteComponent } from './startseite/startseite.component';
import { SpieltagComponent } from './spieltag/spieltag.component';
import { NextMatchDayService } from '../services/nextMatchDay.service';
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [StartseiteComponent, SpieltagComponent],
  imports: [CommonModule],
  exports: [StartseiteComponent, SpieltagComponent],
  providers: [NextMatchDayService],
})
export class ContentModule {}
