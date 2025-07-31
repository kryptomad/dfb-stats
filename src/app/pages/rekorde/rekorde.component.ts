import { Component } from '@angular/core';
import {Card} from "primeng/card";
import {NgForOf} from "@angular/common";

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
  imports: [
    Card,
    NgForOf
  ],
  providers: [],
})
export class RekordeComponent {

  gesamtwertungen: Rekord[] = [
    this.createRekord('Jahres-Oscar Gesamt', '2007–2016', 'Nico', 10),
    this.createRekord('Jahres-Oscar Gewinn in Folge', '2007–2016', 'Nico', 10),
    this.createRekord('Monats-Oscar Gesamt', '1996–2023/24', 'Y', 81),
    this.createRekord('Monats-Oscar Gewinn in Folge', '2019–2024', 'mad', 8),
  ]

  jahreswertungen: Rekord[] = [
    this.createRekord('Monats-Oscar Gesamt in einem Jahr', '2007–2016', 'Nico', 10),
    this.createRekord('High Check', '2003, 2020/21, 2023/24', 'Y, mad', 9),
    this.createRekord('High Check geworfen (+100)', '2016, 2020/21', 'Nico, Uwe', 156),
    this.createRekord('Geworfene 180er', '2019–2024', 'mad', 8),
    this.createRekord('Geworfene 180er, Gesamt', '2019–2024', 'mad', 8),
    this.createRekord('Geworfene 140er', '2019–2024', 'mad', 8),
    this.createRekord('Geworfene 140er, Gesamt', '2019–2024', 'mad', 8),
    this.createRekord('Geworfene TONs', '2019–2024', 'mad', 8),
    this.createRekord('Punkte Jahreswertung', '2019–2024', 'mad', 8),
    this.createRekord('Spiele gewonnen', '2019–2024', 'mad', 8),
    this.createRekord('Spiele in Serie gewonnen', '2019–2024', 'mad', 8),
    this.createRekord('Short Games geworfen', '2019–2024', 'mad', 8),
    this.createRekord('Short Game, Anzahl Darts', '2019–2024', 'mad', 8),
  ]

  spieltagswertungen: Rekord[] = [
    this.createRekord('Jahres-Oscar Gesamt', '2007–2016', 'Nico', 10),
    this.createRekord('Jahres-Oscar Gewinn in Folge', '2007–2016', 'Nico', 10),
    this.createRekord('Monats-Oscar Gesamt', '1996–2023/24', 'Y', 81),
    this.createRekord('Monats-Oscar Gewinn in Folge', '2019–2024', 'mad', 8),
  ]

  matchwertungen: Rekord[] = [
    this.createRekord('Jahres-Oscar Gesamt', '2007–2016', 'Nico', 10),
    this.createRekord('Jahres-Oscar Gewinn in Folge', '2007–2016', 'Nico', 10),
    this.createRekord('Monats-Oscar Gesamt', '1996–2023/24', 'Y', 81),
    this.createRekord('Monats-Oscar Gewinn in Folge', '2019–2024', 'mad', 8),
  ]



  private createRekord(was: string, wann: string, wer: string, count: number): Rekord {
    return {
      was,
      wann,
      wer,
      count
    }
  }
}
