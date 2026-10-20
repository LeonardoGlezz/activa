import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RouteAnimationService {
  
  private previousUrl: string = '';
  private currentUrl: string = '';

  constructor(private router: Router) {
    this.initializeRouteAnimation();
  }

  private initializeRouteAnimation(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: any) => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
        this.applyTransitionAnimation();
      });
  }

  private applyTransitionAnimation(): void {
    const routerOutlet = document.querySelector('ion-router-outlet');
    if (routerOutlet) {
      // Remover clase de animación anterior
      routerOutlet.classList.remove('page-enter', 'page-exit');
      
      // Trigger reflow para reiniciar la animación
      void (routerOutlet as any).offsetHeight;
      
      // Agregar clase de entrada
      routerOutlet.classList.add('page-enter');
    }
  }

  /**
   * Navegar con animación personalizada
   */
  public navigateWithAnimation(
    commands: any[],
    animationType: 'slide' | 'fade' | 'scale' = 'slide'
  ): void {
    document.documentElement.style.setProperty('--animation-type', animationType);
    this.router.navigate(commands);
  }
}
