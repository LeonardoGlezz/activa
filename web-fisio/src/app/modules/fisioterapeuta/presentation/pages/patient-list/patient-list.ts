import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api'; 
import { KeyFilterModule } from 'primeng/keyfilter';

import { PatientUseCase } from '../../../../../core/patient/application/patient.use-case';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, 
    ButtonModule, InputTextModule, DialogModule, 
    ToastModule, KeyFilterModule 
  ],
  providers: [MessageService], 
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss'
})
export class PatientListComponent implements OnInit {
  
  allPatients: any[] = []; // Guardará todos los pacientes originales
  filteredPatients: any[] = []; // Guardará los que se muestran al buscar
  searchQuery: string = ''; // Lo que el usuario escribe en el buscador

  displayEditModal: boolean = false;
  pacienteEditando: any = {};
  pacienteOriginal: any = {};

  regexLetras: RegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  constructor(
    private messageService: MessageService,
    private patientUseCase: PatientUseCase,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarPacientes();
  }

  cargarPacientes() {
    this.patientUseCase.getPatients().subscribe({
      next: (respuestaBackend: any) => {
        const listaPacientes = respuestaBackend.rows || [];

        // 🛠️ FUNCIÓN PARA CAPITALIZAR NOMBRES
        const capitalizar = (str: string) => {
          if (!str) return '';
          return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        this.allPatients = listaPacientes.map((p: any) => {
          
          // 1. LEEMOS Y CAPITALIZAMOS 
          const nombreRaw = p.first_name || p.firstName || '';
          const apellidoPRaw = p.last_name_paternal || p.lastNameP || ''; 
          const apellidoMRaw = p.last_name_maternal || p.lastNameM || ''; 

          const nombre = capitalizar(nombreRaw);
          const apellidoP = capitalizar(apellidoPRaw);
          const apellidoM = capitalizar(apellidoMRaw);
          
          const apellidoMTexto = apellidoM ? ` ${apellidoM}` : '';
          const fullName = `${nombre} ${apellidoP}${apellidoMTexto}`;

          // 2. EXTRAEMOS SOLO EL AÑO Y LEEMOS EL CORREO 
          const anioNacFull = p.birth_date || p.birthYear || '';
          const anioNac = anioNacFull ? anioNacFull.toString().substring(0, 4) : '';
          const correo = p.email || p.user?.email || p.User?.email || p.UserModel?.email || '';
          
          return {
            id: p.id_patient || p.id,
            name: fullName,
            first_name: nombre,
            last_name_p: apellidoP, 
            last_name_m: apellidoM, 
            email: correo,
            birth_year: anioNac,
            height: p.height,
            weight: p.weight,
            avatar: `https://ui-avatars.com/api/?name=${nombre}+${apellidoP}&background=0D8B97&color=fff&rounded=true`
          };
        });

        // Al inicio, los pacientes filtrados son exactamente todos los pacientes
        this.filteredPatients = [...this.allPatients];
        this.cdr.detectChanges(); 
      },
      error: (err: any) => {
        console.error('❌ Error al cargar pacientes:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pacientes.' });
      }
    });
  }

  // 🔍 FUNCIÓN DEL BUSCADOR
  filtrarPacientes() {
    if (!this.searchQuery) {
      this.filteredPatients = [...this.allPatients];
      return;
    }
    const query = this.searchQuery.toLowerCase();
    this.filteredPatients = this.allPatients.filter(p => p.name.toLowerCase().includes(query));
  }

  verDetallePaciente(id: number) {
    this.router.navigate(['/dashboard/ver-paciente', id]);
  }

  abrirModalEditar(patient: any) {
    this.pacienteEditando = { ...patient };
    this.pacienteOriginal = { ...patient };
    this.displayEditModal = true;
  }

  cerrarModal() {
    this.displayEditModal = false;
  }

  guardarCambios() {
    this.messageService.clear();
    const p = this.pacienteEditando;
    const orig = this.pacienteOriginal;

    const sinCambios = (
      p.first_name === orig.first_name &&
      p.last_name_p === orig.last_name_p &&
      p.last_name_m === orig.last_name_m &&
      p.email === orig.email &&
      Number(p.birth_year) === Number(orig.birth_year) &&
      Number(p.height) === Number(orig.height) &&
      Number(p.weight) === Number(orig.weight)
    );

    if (sinCambios) {
      this.messageService.add({ severity: 'info', summary: 'Sin modificaciones', detail: 'No se detectaron cambios.' });
      this.displayEditModal = false;
      return; 
    }

    if (!p.first_name || !p.last_name_p || !p.email || !p.birth_year || !p.height || !p.weight) {
      this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Llena todos los campos obligatorios.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(p.email)) {
      this.messageService.add({ severity: 'warn', summary: 'Correo inválido', detail: 'Proporciona un correo válido.' });
      return;
    }

    const currentYear = new Date().getFullYear();
    const birthYearNum = Number(p.birth_year);
    if (birthYearNum < 1900 || birthYearNum > currentYear) {
      this.messageService.add({ severity: 'warn', summary: 'Año incorrecto', detail: `El año de nacimiento debe estar entre 1900 y ${currentYear}.` });
      return;
    }

    const alturaNum = Number(p.height);
    if (alturaNum < 0.40 || alturaNum > 2.50) {
      this.messageService.add({ severity: 'warn', summary: 'Revisa la estatura', detail: 'La estatura debe estar en metros (ej. 1.75).' });
      return;
    }

    const pesoNum = Number(p.weight);
    if (pesoNum <= 0 || pesoNum > 700) {
      this.messageService.add({ severity: 'warn', summary: 'Revisa el peso', detail: 'El peso debe ser mayor a 0 y menor a 700 Kg.' });
      return;
    }

    const payloadParaBackend = {
      firstName: p.first_name,
      lastNameP: p.last_name_p,
      lastNameM: p.last_name_m ? p.last_name_m : undefined, 
      email: p.email,
      birthYear: birthYearNum,
      height: alturaNum,
      weight: pesoNum
    };

    this.patientUseCase.executeUpdate(p.id, payloadParaBackend as any).subscribe({
      next: (respuesta: any) => {
        this.messageService.add({ severity: 'success', summary: '¡Actualizado!', detail: 'Paciente modificado correctamente.' });
        this.cargarPacientes();
        this.displayEditModal = false;
      },
      error: (err: any) => {
        const mensajeBackend = err.error?.message || err.error?.error || 'Ocurrió un problema al guardar en el servidor.';
        this.messageService.add({ severity: 'error', summary: 'Error del Servidor', detail: mensajeBackend });
      }
    });
  }
}