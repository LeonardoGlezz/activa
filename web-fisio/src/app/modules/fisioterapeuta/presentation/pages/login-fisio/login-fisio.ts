import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// IMPORTAMOS NUESTRO CASO DE USO
import { AuthUseCase } from '../../../../../core/auth/application/auth.use-case';

@Component({
  selector: 'app-login-fisio',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    ButtonModule, 
    InputTextModule, 
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login-fisio.html',
  styleUrl: './login-fisio.scss'
})
export class LoginFisioComponent implements OnInit {
  
  loginForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private authUseCase: AuthUseCase
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin() {
    // 🪄 CANDADO: Previene el doble clic o el doble Enter
    if (this.isLoading) return;

    this.messageService.clear();

    if (this.loginForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, ingresa un correo y contraseña válidos.' });
      return;
    }

    this.isLoading = true;
    const credenciales = this.loginForm.value;

    // LLAMAMOS AL BACKEND REAL
    this.authUseCase.login(credenciales).subscribe({
      next: (respuesta: any) => {
        this.isLoading = false;
        
        // GUARDAMOS EL TOKEN REAL EN EL NAVEGADOR
        const token = respuesta.token || respuesta.data?.token;
        
        if (token) {
          localStorage.setItem('token', token);
        }

        // Guardamos id_physio directamente para evitar depender del JWT decode
        const idPhysio = respuesta.fisio?.id_physio || respuesta.data?.fisio?.id_physio;
        if (idPhysio) {
          localStorage.setItem('id_physio', String(idPhysio));
        }

        // Extraemos el estatus real que nos acaba de mandar el backend
        const estatusUsuario = respuesta.fisio.status;

        this.messageService.add({ severity: 'success', summary: 'Bienvenido', detail: 'Credenciales verificadas con éxito.' });
        
        // REDIRIGIMOS DEPENDIENDO DEL ESTATUS
        setTimeout(() => {
          if (estatusUsuario === 'pending_profile') {
            this.router.navigate(['/verificar-datos']);
          } else {
            this.router.navigate(['/dashboard/inicio']); 
          }
        }, 1500);

      },
      error: (errorRes: any) => {
        this.isLoading = false;
        console.error('Error de login:', errorRes);
        const errorMsg = errorRes.error?.message || 'Correo o contraseña incorrectos.';
        this.messageService.add({ severity: 'error', summary: 'Acceso Denegado', detail: errorMsg });
      }
    });
  }

  // 🪄 FUNCIÓN MEJORADA: Salta de input y destruye el evento para no enviar el form vacío
  enfocarSiguiente(idDelInput: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const elemento = document.getElementById(idDelInput);
    if (elemento) {
      elemento.focus();
    }
  }
}