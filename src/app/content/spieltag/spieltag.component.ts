import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'app-spieltag',
  templateUrl: './spieltag.component.html',
  styleUrl: './spieltag.component.scss',
  standalone: false,
})
export class SpieltagComponent implements OnInit {
  data?: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe((v) => console.log(v));
  }

  ngAfterViewInit(): void {}
}
