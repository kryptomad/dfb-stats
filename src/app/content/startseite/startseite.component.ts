import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'app-startseite',
  templateUrl: './startseite.component.html',
  styleUrl: './startseite.component.scss',
  standalone: false,
})
export class StartseiteComponent implements OnInit {
  data?: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe((v) => console.log(v));
  }

  ngAfterViewInit(): void {}
}
