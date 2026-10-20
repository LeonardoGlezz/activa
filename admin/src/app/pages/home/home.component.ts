import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  appName = 'Activa';
  tagline = 'Panel de Administración';
  description = 'Bienvenido al panel administrativo de Activa. Gestiona la plataforma, valida profesionales y monitorea la calidad del servicio.';

  adminFeatures = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administra fisioterapeutas, pacientes y personal autorizado. Controla accesos y permisos del sistema.',
      icon: '👥'
    },
    {
      title: 'Validación de Profesionales',
      description: 'Verifica credenciales, certificaciones y antecedentes de fisioterapeutas antes de activarlos en la plataforma.',
      icon: '✓'
    },
    {
      title: 'Análisis y Reportes',
      description: 'Visualiza estadísticas en tiempo real, genera reportes detallados y monitorea el desempeño de la plataforma.',
      icon: '📊'
    },
    {
      title: 'Seguridad y Cumplimiento',
      description: 'Auditoría de actividades, gestión de permisos y cumplimiento de normativas de protección de datos.',
      icon: '🔐'
    }
  ];

  responsibilities = [
    {
      title: 'Supervisión de Calidad',
      description: 'Mantén los estándares de calidad validando que todos los fisioterapeutas cumplan con los requisitos profesionales necesarios.',
      details: ['Verificar certificaciones', 'Revisar experiencia', 'Evaluar referencias', 'Aprobar perfiles']
    },
    {
      title: 'Soporte y Operaciones',
      description: 'Proporciona soporte técnico a usuarios, resuelve conflictos y asegura la continuidad operativa de la plataforma.',
      details: ['Atender tickets', 'Resolver problemas', 'Mantener disponibilidad', 'Documentar incidentes']
    }
  ];
}
