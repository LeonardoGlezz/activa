import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LegalService, LEGAL_URLS } from '../../../../../core/legal/legal.service';

@Component({
  selector: 'app-aceptar-avisos',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './aceptar-avisos.html',
  styleUrl: './aceptar-avisos.scss',
})
export class AceptarAvisosComponent {
  readonly urls = LEGAL_URLS;
  aceptaPrivacidad = false;
  aceptaTerminos = false;
  enviando = false;

  constructor(
    private legal: LegalService,
    private router: Router,
    private messageService: MessageService
  ) {}

  aceptar() {
    if (!this.aceptaPrivacidad || !this.aceptaTerminos || this.enviando) return;
    this.enviando = true;
    this.legal.acceptAll().subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate([this.siguienteRuta()], { replaceUrl: true });
      },
      error: () => {
        this.enviando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No pudimos guardar tu respuesta. Inténtalo de nuevo.' });
      },
    });
  }

  salir() {
    localStorage.removeItem('token');
    localStorage.removeItem('id_physio');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private siguienteRuta(): string {
    return '/dashboard/inicio';
  }
}
