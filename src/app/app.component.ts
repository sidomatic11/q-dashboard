import {Component, inject, signal} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {Task1Component} from './tasks/task1/task1.component';
import {Task2Component} from './tasks/task2/task2.component';
import {Task3Component} from './tasks/task3/task3.component';
import {MatListItem, MatNavList} from '@angular/material/list';
import {ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {filter, map, mergeMap, tap} from 'rxjs';
import { SecurityService } from './services/security.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatTabsModule,
    Task1Component,
    Task2Component,
    Task3Component,
    MatListItem,
    RouterLink,
    MatNavList,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  title = signal("")
  description = signal("")

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route) => route.data),
        tap((data) => {
          const title = data["title"] || "";
          this.title.set(title);
          const description = data["description"] || "";
          this.description.set(description);
        }),
      )
      .subscribe();
  (window as any).ss = inject(SecurityService);

  }
}
