import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { TrackingApiService, Tracking } from '../core/infrastructure/api/tracking-api.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: false,
})
export class HistorialPage implements OnInit {
  trackings: Tracking[] = [];
  loading = true;

  constructor(
    private storage: Storage,
    private trackingApi: TrackingApiService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const patientId = await this.storage.get('currentPatientId');
    if (patientId) {
      this.trackingApi.getByPatientId(patientId).subscribe({
        next: (rows) => {
          this.trackings = rows;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.loading = false;
    }
  }

  formatTime(timeStr?: string): string {
    if (!timeStr) return '';
    const parts = String(timeStr).split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    }
    return timeStr;
  }

  // --- CAMBIOS PARA UNA VIBRA MÁS POSITIVA ---

  getPainLabel(level: number): string {
    // Cambiamos "Bajo, Moderado, Alto" por frases que celebren el esfuerzo
    if (level <= 3) return 'Excelente ritmo';
    if (level <= 6) return 'Buen esfuerzo';
    return 'Máxima intensidad';
  }

  getPainColor(level: number): string {
    // Alineamos los rangos (3 y 6) con la lógica de los íconos del HTML
    // Ojo: Seguimos devolviendo success/warning/danger porque así los nombramos en el SCSS,
    // pero recuerda que visualmente ahora son Azul, Amarillo y Naranja.
    if (level <= 3) return 'success'; 
    if (level <= 6) return 'warning'; 
    return 'danger';
  }

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}