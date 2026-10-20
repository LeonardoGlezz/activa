import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { API_ROOT } from '../../../../../core/api-url';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-verify-data',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonModule, 
    ToastModule,
    ProgressBarModule
  ],
  providers: [MessageService],
  templateUrl: './verify-data.html',
  styleUrl: './verify-data.scss'
})
export class VerifyDataComponent implements OnInit {

  degreeFile: File | null = null;
  idFile: File | null = null;

  isUploadingDegree: boolean = false;
  isUploadingId: boolean = false;
  isSubmitting: boolean = false;

  degreeProgress: number = 0;
  idProgress: number = 0;

  constructor(
    private messageService: MessageService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // ✨ EL ESCUDO: Si ya los subió, lo rebotamos inmediatamente sin importar el token
    if (localStorage.getItem('documentos_subidos') === 'true') {
      this.router.navigate(['/dashboard/citas']);
      return; // Detenemos la ejecución aquí
    }

    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Si su gafete YA NO ES 'pending_profile', no tiene nada que hacer aquí
        if (payload.status !== 'pending_profile') {
          this.router.navigate(['/dashboard/citas']);
        }
      } catch (error) {
        console.error("Error leyendo token en verify-data:", error);
      }
    }
  }

  onFileSelected(event: any, documentType: 'degree' | 'id') {
    const file: File = event.target.files[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        this.messageService.add({ severity: 'warn', summary: 'Archivo muy grande', detail: 'El documento no debe pesar más de 5MB.' });
        event.target.value = ''; 
        return;
      }
      
      if (file.type !== 'application/pdf') {
        this.messageService.add({ severity: 'error', summary: 'Formato inválido', detail: 'Solo se permiten archivos PDF.' });
        event.target.value = '';
        return;
      }

      this.simulateUpload(file, documentType);
    }
  }

  simulateUpload(file: File, documentType: 'degree' | 'id') {
    if (documentType === 'degree') {
      this.isUploadingDegree = true;
      this.degreeProgress = 0;
    } else {
      this.isUploadingId = true;
      this.idProgress = 0;
    }

    const interval = setInterval(() => {
      if (documentType === 'degree') {
        this.degreeProgress += 15;
        if (this.degreeProgress >= 100) {
          this.degreeProgress = 100;
          this.isUploadingDegree = false;
          this.degreeFile = file;
          clearInterval(interval);
        }
      } else {
        this.idProgress += 15;
        if (this.idProgress >= 100) {
          this.idProgress = 100;
          this.isUploadingId = false;
          this.idFile = file;
          clearInterval(interval);
        }
      }

      this.cdr.detectChanges(); 

    }, 150); 
  }

  removeFile(documentType: 'degree' | 'id') {
    if (documentType === 'degree') {
      this.degreeFile = null;
      this.degreeProgress = 0;
    } else {
      this.idFile = null;
      this.idProgress = 0;
    }
    this.cdr.detectChanges();
  }

  finishRegistration() {
    if (!this.degreeFile || !this.idFile) {
      this.messageService.add({ severity: 'error', summary: 'Documentos faltantes', detail: 'Debes subir ambos documentos para continuar.' });
      return;
    }

    this.isSubmitting = true; 

    const formData = new FormData();
    formData.append('cedulaPdf', this.degreeFile);
    formData.append('ineFront', this.idFile);

    this.http.post(`${API_ROOT}/physiotherapists/upload-documents`, formData)
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          // Ya no necesitamos la nota local falsa, dependemos del token al hacer login de nuevo
          localStorage.setItem('documentos_subidos', 'true'); 
          this.messageService.add({ severity: 'success', summary: '¡Documentos enviados!', detail: 'Tu perfil está en revisión. Redirigiendo a tu panel...' });
          
          setTimeout(() => {
            this.router.navigate(['/dashboard/citas']); 
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error al subir los PDFs:', err);
          const errorMsg = err.error?.message || 'Hubo un problema enviando los archivos al servidor.';
          this.messageService.add({ severity: 'error', summary: 'Error de conexión', detail: errorMsg });
          this.cdr.detectChanges();
        }
      });
  }
}