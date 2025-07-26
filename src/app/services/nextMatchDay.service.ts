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
    return signal<NextMatchDay>(data);
  }
}
