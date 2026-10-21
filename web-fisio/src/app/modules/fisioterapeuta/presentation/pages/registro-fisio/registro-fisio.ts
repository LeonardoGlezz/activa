import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthUseCase } from '../../../../../core/auth/application/auth.use-case';
import { RegisterPhysioDTO } from '../../../../../core/auth/domain/auth.model';
import { AuthRepository } from '../../../../../core/auth/domain/auth.repository';
import { AuthHttpRepository } from '../../../../../core/auth/infrastructure/auth-http.repository';
import { LegalService, LEGAL_URLS } from '../../../../../core/legal/legal.service';

@Component({
  selector: 'app-registro-fisio',
  standalone: true, 
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    ButtonModule, InputTextModule,
    PasswordModule, ToastModule
  ],
  providers: [
    MessageService
  ],
  templateUrl: './registro-fisio.html',
  styleUrl: './registro-fisio.scss',
})
export class RegistroFisioComponent implements OnInit {
  perfilForm!: FormGroup;
  isLoading: boolean = false;
  readonly legalUrls = LEGAL_URLS;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private messageService: MessageService,
    private authUseCase: AuthUseCase,
    private legal: LegalService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    // Letras con acentos, ñ, ü, espacios, apóstrofo y guion (O'Brien, Pérez-Gil)
    const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' -]+$/;
    const cedulaRegex = /^\d{7,8}$/;

    this.perfilForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.pattern(soloLetrasRegex)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.pattern(soloLetrasRegex)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      cedula: ['', [Validators.required, Validators.pattern(cedulaRegex)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      aceptaAvisos: [false, Validators.requiredTrue]
    });
  }

  // =================================================================
  // FUNCIONES PARA BLOQUEAR TECLADO EN TIEMPO REAL
  // =================================================================
  permitirSoloLetras(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' -]/g, '');
    this.perfilForm.get(controlName)?.setValue(newValue, { emitEvent: false });
  }

  permitirSoloNumeros(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.replace(/[^0-9]/g, '');
    this.perfilForm.get(controlName)?.setValue(newValue, { emitEvent: false });
  }

  // =================================================================
  // ENVÍO AL BACKEND Y AUTO-LOGIN
  // =================================================================
  onSubmit() {
    this.messageService.clear();

    if (this.perfilForm.valid) {
      this.isLoading = true; 

      const formValues = this.perfilForm.value;
      const apellidosArray = formValues.apellidos.trim().split(/\s+/);
      const lastNameP = apellidosArray[0] || '';
      const lastNameM = apellidosArray.slice(1).join(' ') || '';

      const payload: RegisterPhysioDTO = {
        firstName: formValues.nombres.trim(),
        lastNameP: lastNameP,
        lastNameM: lastNameM,
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
        professionalLicense: formValues.cedula,
        phone: formValues.telefono
      };

      this.authUseCase.registerPhysio(payload).subscribe({
        next: (respuesta: any) => {
          
          // 1. EL REGISTRO FUE EXITOSO. AHORA HACEMOS AUTO-LOGIN INVISIBLE
          const credenciales = { email: payload.email, password: payload.password };
          
          this.authUseCase.login(credenciales).subscribe({
            next: (loginRes: any) => {
              // 2. RECIBIMOS EL TOKEN Y LO GUARDAMOS
              const token = loginRes.token || loginRes.data?.token;
              if (token) {
                localStorage.setItem('token', token);
              }

              this.isLoading = false;
              this.messageService.add({ severity: 'success', summary: '¡Éxito!', detail: 'Cuenta creada. Revisaremos tu cédula y te avisaremos.' });
              
              // 3. GUARDAMOS LA ACEPTACIÓN DE LOS AVISOS Y VAMOS A LA SALA DE ESPERA
              // Si no se pudo guardar, la pantalla de avisos se la vuelve a pedir.
              const irAlPanel = () => setTimeout(() => this.router.navigate(['/dashboard']), 1500);
              this.legal.acceptAll().subscribe({ next: irAlPanel, error: irAlPanel });
            },
            error: (err) => {
              // Si por algo falla el auto-login, lo mandamos al login normal
              this.isLoading = false;
              this.router.navigate(['/login']);
            }
          });

        },
        error: (errorRes: any) => {
          this.isLoading = false;
          console.error('Error del backend:', errorRes);
          const errorMsg = errorRes.error?.message || 'Ocurrió un error al intentar registrarse.';
          this.messageService.add({ severity: 'error', summary: 'Registro denegado', detail: errorMsg, life: 5000 });
        }
      });

    } else {
      this.messageService.add({ severity: 'error', summary: 'Formulario Incompleto', detail: 'Por favor, revisa los campos marcados en rojo.' });
      Object.values(this.perfilForm.controls).forEach(control => control.markAsTouched());
    }
  }
}