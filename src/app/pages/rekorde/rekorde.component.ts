import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TableModule } from 'primeng/table';

export interface Rekord {
  was: string;
  wann: string;
  wer: string;
  count: number;
}

@Component({
  selector: 'app-rekorde',
  templateUrl: './rekorde.component.html',
  styleUrls: ['./rekorde.component.scss'],
  standalone: true,
  imports: [Card, FieldsetModule, TableModule],
  providers: [],
})
export class RekordeComponent {
  gesamtwertungen: Rekord[] = [
    this.createRekord('Jahres-Oscar Gesamt [3]', '2007–2016', 'Nico', 10),
    this.createRekord('Jahres-Oscar Gewinn in Folge', '2007–2016', 'Nico', 10),
    this.createRekord('Monats-Oscar Gesamt', '1996–2023/24', 'Y', 81),
    this.createRekord('Monats-Oscar Gewinn in Folge', '2019–2024', 'mad', 8),
  ];

  jahreswertungen: Rekord[] = [
    this.createRekord(
      'Monats-Oscar Gesamt in einem Jahr',
      '2003, 2020/21, 2023/24',
      'Y, mad',
      9,
    ),
    this.createRekord('High Check', '2003, 2020/21, 2023/24', 'Y, mad', 9),
    this.createRekord(
      'High Check geworfen [1] (+100)',
      '2008, 2013 / 2019, 2020/21',
      'Nico, mad',
      3,
    ),
    this.createRekord('Geworfene 180er', '2006, 2013', 'Y, Nico', 5),
    this.createRekord('Geworfene 180er, Gesamt', '2008, 2013', 'Team', 8),
    this.createRekord('Geworfene 140er', '2021/2022', 'mad', 30),
    this.createRekord('Geworfene 140er, Gesamt', '2009, 2012', 'Team', 64),
    this.createRekord('Geworfene TONs [8]', '2021/2022', 'mad', 149),
    this.createRekord('Punkte Jahreswertung [7]', '2020/21', 'mad', 120),
    this.createRekord('Spiele gewonnen [5]', '2020/21, 2023/24', 'mad', 40),
    this.createRekord('Spiele in Serie gewonnen', '2023/24', 'mad', 33),
    this.createRekord('Short Games geworfen [2]', '2023/24', 'mad', 17),
    this.createRekord('Short Game, Anzahl Darts [2]', '01.01.2007', 'Nico', 14),
  ];

  spieltagswertungen: Rekord[] = [
    this.createRekord('Geworfene 180er', '2006–2024', 'Y, Nico, mad', 2),
    this.createRekord('Geworfene 180er, Gesamt [2]', '02.02.2013', 'Team', 3),
    this.createRekord('Geworfene 140er', '13.04.2017', 'Nico', 8),
    this.createRekord('Geworfene 140er, Gesamt [2]', '2009–2017', 'Team', 12),
    this.createRekord('Geworfene TONs [8]', '21.12.2019', 'mad', 22),
    this.createRekord('First 9 Dart Average [6]', '2023/24', 'mad', 71.9),
    this.createRekord('3 Dart Average [6]', '2019', 'mad', 62.8),
    this.createRekord('Average Darts needed [6]', '2019', 'mad', 23.75),
  ];

  matchwertungen: Rekord[] = [
    this.createRekord('First 9 Dart Average', '2019', 'Y', 92.7),
    this.createRekord('3 Dart Average', '2019', 'mad', 79.1),
    this.createRekord('Average Darts needed', '2019', 'mad', 19),
  ];

  private createRekord(
    was: string,
    wann: string,
    wer: string,
    count: number,
  ): Rekord {
    return {
      was,
      wann,
      wer,
      count,
    };
  }
}
