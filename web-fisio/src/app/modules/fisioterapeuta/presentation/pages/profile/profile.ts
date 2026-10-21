import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog'; 
import { MessageService, ConfirmationService } from 'primeng/api'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PasswordModule } from 'primeng/password';
import { API_ROOT } from '../../../../../core/api-url';
import { readTokenPayload } from '../../../../../core/auth/application/token-payload';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule, 
    DividerModule, 
    ToastModule,
    ConfirmDialogModule,
    PasswordModule
  ],
  providers: [MessageService, ConfirmationService], // 🪄 PROVEEMOS EL SERVICIO
  templateUrl: './profile.html'
})
export class PerfilComponent implements OnInit {
  nombreCompleto: string = 'Cargando...';
  cedula: string = 'Cargando...'; 

 correoEditable: string = '';
  correoOriginal: string = ''; 

  passwordActual: string = '';
  passwordNueva: string = '';
  passwordConfirmar: string = '';

  telefono: string = '';
  mostrarWhatsapp: boolean = true;
  isSavingContact: boolean = false;

  isSavingEmail: boolean = false;
  isSavingPass: boolean = false;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.cargarDatosDelToken();
    this.cargarContacto();
  }

  cargarContacto() {
    this.http.get<any>(`${API_ROOT}/physiotherapists/me/contact`).subscribe({
      next: (res) => {
        this.telefono = res?.phone || '';
        this.mostrarWhatsapp = res?.showWhatsapp !== false;
      },
      error: () => {}
    });
  }

  guardarContacto() {
    const limpio = (this.telefono || '').replace(/\D/g, '');
    if (limpio && limpio.length !== 10) {
      this.messageService.add({ severity: 'warn', summary: 'Revisa el celular', detail: 'Escribe los 10 números, sin lada.' });
      return;
    }
    this.isSavingContact = true;
    this.http.put<any>(`${API_ROOT}/physiotherapists/me/contact`, { phone: limpio, showWhatsapp: this.mostrarWhatsapp }).subscribe({
      next: (res) => {
        this.isSavingContact = false;
        this.telefono = limpio;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res?.message || 'Datos de contacto guardados.' });
      },
      error: (err) => {
        this.isSavingContact = false;
        this.messageService.add({ severity: 'error', summary: 'No se guardó', detail: err.error?.message || 'Intenta de nuevo.' });
      }
    });
  }
  enfocarSiguiente(idDelInput: string) {
    const elemento = document.getElementById(idDelInput);
    if (elemento) {
      elemento.focus();
    }
  }
  cargarDatosDelToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = readTokenPayload(token) || {};
        const firstName = payload.first_name || payload.firstName || '';
        const lastName = [payload.last_name_paternal, payload.last_name_maternal].filter(Boolean).join(' ');

        this.nombreCompleto = `${firstName} ${lastName}`.trim();
        
        // 🪄 Guardamos el editable y respaldamos el original
        this.correoEditable = payload.email || '';
        this.correoOriginal = payload.email || ''; 
        
        // 🪄 BUSCAMOS EL NOMBRE EXACTO DE TU BASE DE DATOS
        this.cedula = payload.professional_license || payload.cedula || 'Número no disponible';
      } catch (error) {
        console.error('Error leyendo el token', error);
      }
    }
  }

  // 🪄 FLUJO DE CORREO: 1. VALIDAR -> 2. CONFIRMAR -> 3. EJECUTAR
  confirmarActualizarCorreo() {
    this.messageService.clear();

    // Expresión regular para validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.correoEditable.trim() === this.correoOriginal.trim()) {
      this.messageService.add({ severity: 'info', summary: 'Sin modificaciones', detail: 'El correo ingresado es exactamente el mismo que ya tienes.' });
      return; // Detenemos la ejecución
    }
    if (!this.correoEditable || !emailRegex.test(this.correoEditable)) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Ingresa un correo electrónico con formato válido (ej. correo@dominio.com).' });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas actualizar tu correo de acceso?',
      header: 'Confirmar Actualización',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, actualizar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-text text-color-secondary',
      accept: () => {
        this.ejecutarActualizarCorreo();
      }
    });
  }

  ejecutarActualizarCorreo() {
    this.isSavingEmail = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.patch(`${API_ROOT}/auth/update-email`, 
      { email: this.correoEditable }, 
      { headers }
    ).subscribe({
      next: (res: any) => {
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Tu correo ha sido actualizado.' });
        
        // 🪄 Actualizamos el original para que la validación de "Sin cambios" se resetee
        this.correoOriginal = this.correoEditable; 
        this.isSavingEmail = false;
      },
      error: (err) => {
        this.isSavingEmail = false;
        this.messageService.clear();
        // 🪄 AQUÍ ATRAPAMOS EL ERROR DEL BACKEND ("Este correo ya está registrado...")
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar el correo.' });
      }
    });
  }

  // 🪄 FLUJO DE CONTRASEÑA: 1. VALIDAR -> 2. CONFIRMAR -> 3. EJECUTAR
  confirmarCambiarPassword() {
    this.messageService.clear();

    if (!this.passwordActual || !this.passwordNueva || !this.passwordConfirmar) {
      this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Por favor, llena todos los campos de contraseña.' });
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmar) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    // 🪄 VALIDAMOS QUE LA NUEVA NO SEA IGUAL A LA VIEJA
    if (this.passwordActual === this.passwordNueva) {
      this.messageService.add({ severity: 'error', summary: 'Error de Seguridad', detail: 'La nueva contraseña no puede ser igual a la que ya tienes.' });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cambiar tu contraseña de acceso? La sesión no se cerrará.',
      header: 'Confirmar Seguridad',
      icon: 'pi pi-shield',
      acceptLabel: 'Sí, cambiar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger', // Usamos rojo para acciones de seguridad
      rejectButtonStyleClass: 'p-button-text text-color-secondary',
      accept: () => {
        this.ejecutarCambiarPassword();
      }
    });
  }

  ejecutarCambiarPassword() {
    this.isSavingPass = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.patch(`${API_ROOT}/auth/update-password`, 
      { 
        passwordActual: this.passwordActual, 
        passwordNueva: this.passwordNueva 
      }, 
      { headers }
    ).subscribe({
      next: (res: any) => {
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'Seguridad Actualizada', detail: res.message || 'Tu contraseña se cambió correctamente.' });
        
        // Limpiamos los campos
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordConfirmar = '';
        this.isSavingPass = false;
      },
      error: (err) => {
        this.isSavingPass = false;
        this.messageService.clear();
        // 🪄 AQUÍ ATRAPAMOS EL ERROR DEL BACKEND ("La contraseña actual es incorrecta...")
        this.messageService.add({ severity: 'error', summary: 'Error de Seguridad', detail: err.error?.message || 'Error al cambiar la contraseña.' });
      }
    });
  }
}
