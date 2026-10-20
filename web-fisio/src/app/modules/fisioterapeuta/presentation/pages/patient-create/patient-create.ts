import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { KeyFilterModule } from 'primeng/keyfilter';
// 1. Importamos los módulos para la ventana flotante
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PatientUseCase } from '../../../../../core/patient/application/patient.use-case';
import { Patient } from '../../../../../core/patient/domain/patient.model';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    ButtonModule, InputTextModule, DropdownModule, 
    InputNumberModule, KeyFilterModule,
    ToastModule // 2. Lo agregamos a los imports
  ],
  providers: [MessageService], // 3. ¡Súper importante para que funcione el Toast!
  templateUrl: './patient-create.html'
})
export class PatientCreateComponent implements OnInit {
  generos: any[] | undefined;

  regexLetras: RegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  regexEmail: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  nuevoPaciente: Patient = {
    physiotherapist_id: 1, 
    first_name: '',
    last_name_p: '',
    last_name_m: '',
    birth_year: undefined,
    sex: '',
    height: undefined,
    weight: undefined,
    email: ''
  };

  constructor(
    private patientUseCase: PatientUseCase,
    private router: Router,
    private messageService: MessageService // 4. Lo inyectamos aquí
  ) {}

  ngOnInit() {
    this.generos = [
      { label: 'Hombre', value: 'M' },
      { label: 'Mujer', value: 'F' }
    ];
  }

  private limpiarTexto(texto: string | undefined): string {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  guardarPaciente() {
    this.messageService.clear();

    const p = this.nuevoPaciente;

    // 1. Validación de campos obligatorios
    if (!p.first_name || !p.last_name_p || !p.email || !p.birth_year || !p.sex || !p.height || !p.weight) {
       this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor, llena TODOS los campos.' });
       return;
    }

    // 2. Validación de solo letras
    if (!this.regexLetras.test(p.first_name) || !this.regexLetras.test(p.last_name_p)) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre y apellido paterno solo pueden contener letras.' });
      return;
    }
    if (p.last_name_m && !this.regexLetras.test(p.last_name_m)) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El apellido materno solo puede contener letras.' });
      return;
    }

    // 3. Validación de Correo
    if (!this.regexEmail.test(p.email)) {
      this.messageService.add({ severity: 'warn', summary: 'Correo inválido', detail: 'Por favor, proporciona un correo electrónico válido.' });
      return;
    }

    // 4. Validación estricta del Año de Nacimiento
    const currentYear = new Date().getFullYear();
    const birthYearNum = Number(p.birth_year);
    if (birthYearNum < 1900 || birthYearNum > currentYear) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Año incorrecto', 
        detail: `El año de nacimiento debe estar entre 1900 y ${currentYear}.` 
      });
      return;
    }

    // 5. Validación lógica de Estatura
    const alturaNum = Number(p.height);
    if (alturaNum < 0.40 || alturaNum > 2.50) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Revisa la estatura', 
        detail: 'La estatura debe estar en metros (ej. 1.75). Asegúrate de usar el punto decimal.' 
      });
      return;
    }

    // 6. Validación lógica de Peso
    const pesoNum = Number(p.weight);
    if (pesoNum <= 0 || pesoNum > 700) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Revisa el peso', 
        detail: 'El peso debe ser mayor a 0 y menor a 700 Kg. Revisa tus decimales.' 
      });
      return;
    }

    // 7. Preparar payload (ya con la seguridad de que todo está validado)
    const payloadParaBackend = {
      firstName: this.limpiarTexto(p.first_name),
      lastNameP: this.limpiarTexto(p.last_name_p),
      lastNameM: p.last_name_m ? this.limpiarTexto(p.last_name_m) : undefined,
      birthYear: birthYearNum,
      sex: p.sex,
      height: alturaNum,
      weight: pesoNum,
      email: p.email.toLowerCase().trim(),
      physiotherapistId: 1 
    };

    console.log(`📦 Enviando POST al backend:`, payloadParaBackend);

    this.patientUseCase.executeCreate(payloadParaBackend as any).subscribe({
      next: (respuesta: any) => {
        this.messageService.clear(); 
        this.messageService.add({ severity: 'success', summary: '¡Éxito!', detail: 'Paciente registrado correctamente.' });
        
        setTimeout(() => {
          this.router.navigate(['/dashboard/pacientes']);
        }, 1500);
      },
      error: (err: any) => {
        this.messageService.clear(); 
        const mensajeBackend = err.error?.message || err.error?.error || 'Error de validación en el servidor.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: mensajeBackend });
      }
    });
  }
}