import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthUseCase } from '../../../../../core/auth/application/auth.use-case';
import { RegisterPhysioDTO } from '../../../../../core/auth/domain/auth.model';
import { AuthRepository } from '../../../../../core/auth/domain/auth.repository';
import { AuthHttpRepository } from '../../../../../core/auth/infrastructure/auth-http.repository';

// =================================================================
// VALIDADOR PERSONALIZADO: Mayor de 18 años
// =================================================================
export function mayorDeEdadValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const fechaNacimiento = new Date(control.value);
  const hoy = new Date();
  
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }

  if (edad < 18 || edad > 100) {
    return { edadInvalida: true };
  }
  
  return null;
}

@Component({
  selector: 'app-registro-fisio',
  standalone: true, 
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    CalendarModule, ButtonModule, InputTextModule,
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

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private messageService: MessageService,
    private authUseCase: AuthUseCase
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/; 
    const cedulaRegex = /^\d{7,8}$/; 

    this.perfilForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3), Validators.pattern(soloLetrasRegex)]],
      apellidos: ['', [Validators.required, Validators.pattern(soloLetrasRegex)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      cedula: ['', [Validators.required, Validators.pattern(cedulaRegex)]],
      curp: ['', [Validators.required, Validators.pattern(curpRegex)]],
      fechaNacimiento: [null, [Validators.required, mayorDeEdadValidator]]
    });
  }

  // =================================================================
  // FUNCIONES PARA BLOQUEAR TECLADO EN TIEMPO REAL
  // =================================================================
  permitirSoloLetras(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.perfilForm.get(controlName)?.setValue(newValue, { emitEvent: false });
  }

  permitirSoloNumeros(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.replace(/[^0-9]/g, '');
    this.perfilForm.get(controlName)?.setValue(newValue, { emitEvent: false });
  }

  formatearCurp(event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    this.perfilForm.get('curp')?.setValue(newValue, { emitEvent: false });
  }

  // =================================================================
  // ENVÍO AL BACKEND Y AUTO-LOGIN
  // =================================================================
  onSubmit() {
    this.messageService.clear();

    if (this.perfilForm.valid) {
      this.isLoading = true; 

      const formValues = this.perfilForm.value;
      const apellidosArray = formValues.apellidos.trim().split(' ');
      const lastNameP = apellidosArray[0] || '';
      const lastNameM = apellidosArray.slice(1).join(' ') || '';

      const fecha: Date = formValues.fechaNacimiento;
      const birthDateString = fecha.toISOString().split('T')[0];

      const payload: RegisterPhysioDTO = {
        firstName: formValues.nombres,
        lastNameP: lastNameP,
        lastNameM: lastNameM,
        birthDate: birthDateString,
        email: formValues.email,
        password: formValues.password,
        professionalLicense: formValues.cedula,
        curp: formValues.curp.toUpperCase() 
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
              this.messageService.add({ severity: 'success', summary: '¡Éxito!', detail: 'Cuenta creada. Redirigiendo a subir documentos...' });
              
              // 3. AHORA SÍ, PASAMOS AL CADENERO Y VAMOS A LOS PDFs
              setTimeout(() => {
                this.router.navigate(['/verificar-datos']); 
              }, 1500);
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