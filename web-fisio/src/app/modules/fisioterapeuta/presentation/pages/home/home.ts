import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { API_ROOT } from '../../../../../core/api-url';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ChartModule, TableModule],
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
  
  isLoading: boolean = true;

  kpis = { pacientesActivos: 0, citasMesActual: 0, nivelDolorPromedio: 0 };
  citasHoy: any[] = [];

  donaData: any;
  donaOptions: any;
  lineData: any;
  lineOptions: any;
  barData: any;
  barOptions: any;

  // 🪄 Inyectamos el ChangeDetectorRef
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.iniciarOpcionesDeGraficas();
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get(`${API_ROOT}/dashboard/stats`, { headers }).subscribe({
      next: (res: any) => {
        this.kpis = res.kpis;
        this.citasHoy = res.citasHoy;

        // 1. Gráfica de Dona (Real)
        const estados = res.graficas.citasPorEstado;
        this.donaData = {
          labels: ['Completadas', 'Pendientes', 'Canceladas', 'Confirmadas'],
          datasets: [{
            data: [estados.completadas, estados.pendientes, estados.canceladas, estados.confirmadas],
            backgroundColor: ['#0ea5e9', '#ef4444', '#22c55e', '#f59e0b'],
            hoverBackgroundColor: ['#0284c7', '#dc2626', '#16a34a', '#d97706']
          }]
        };

        // 2. Gráfica de Barras (Real - Conectada a la BD)
        this.barData = {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [{
            label: 'Citas', 
            backgroundColor: '#3b82f6', 
            data: res.graficas.citasPorDia, 
            borderRadius: 4 
          }]
        };

        // 3. Gráfica de Líneas (Vacía y lista para el futuro)
        this.lineData = {
          labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
          datasets: [] // Vacío porque aún no hay seguimientos
        };

        this.isLoading = false;
        
        // 🪄 MAGIA: Le decimos a Angular que pinte la pantalla AHORA MISMO
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error cargando el dashboard:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarOpcionesDeGraficas() {
    const textColor = '#495057';
    const surfaceBorder = '#dfe7ef';

    this.donaOptions = {
      maintainAspectRatio: false, // 🪄 Permite cambiar el tamaño
      plugins: { 
        legend: { 
          position: 'right', // 🪄 Movemos la leyenda a la derecha para que quepa
          labels: { color: textColor, usePointStyle: true } 
        } 
      }
    };

    this.lineOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: surfaceBorder } },
        y: { ticks: { color: textColor }, grid: { color: surfaceBorder }, min: 0, max: 10 }
      }
    };

    this.barOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: surfaceBorder }, suggestedMax: 10 }
      }
    };
  }
}