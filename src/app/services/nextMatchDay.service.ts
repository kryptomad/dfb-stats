import { Injectable, signal, Signal } from '@angular/core';
import * as data from '../../assets/nextMatchday.json';

export interface NextMatchDay {
  gastgeber: string;
  datum: string;
  zeit: string;
  oskardarten: boolean;
  gelddarten: boolean;
}

@Injectable()
export class NextMatchDayService {
  public loadNextMatchDay(): Signal<NextMatchDay> {
    console.log('Load next match day');
    console.log(data);
    console.log(typeof data);
    return signal<NextMatchDay>(data);
  }
}
