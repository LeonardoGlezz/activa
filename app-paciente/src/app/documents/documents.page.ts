import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { MedicalDocumentApiService, MedicalDocument } from '../core/infrastructure/api/medical-document-api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.page.html',
  styleUrls: ['./documents.page.scss'],
  standalone: false,
})
export class DocumentsPage implements OnInit {
  documents: MedicalDocument[] = [];
  loading = true;
  showAddForm = false;
  
  // Variables del formulario
  newName = '';
  newType = 'otro';
  selectedFile: File | null = null; // Guardará el archivo PDF físico
  saving = false;

  constructor(
    private storage: Storage,
    private documentApi: MedicalDocumentApiService,
    private toast: ToastController
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading = true;
    this.storage.get('currentPatientId').then((patientId) => {
      if (!patientId) {
        this.loading = false;
        return;
      }
      this.documentApi.list(patientId).subscribe({
        next: (rows) => {
          this.documents = rows;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      // Limpiamos el formulario al cerrar
      this.newName = '';
      this.newType = 'otro';
      this.selectedFile = null; 
    }
  }

  // Captura el archivo cuando el usuario lo selecciona
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.toast.create({ message: 'Por favor, selecciona un archivo PDF válido.', duration: 2500, position: 'bottom', color: 'warning' }).then(t => t.present());
        return;
      }
      this.selectedFile = file;
    }
  }

  async addDocument() {
    const name = (this.newName || '').trim();
    
    // Validamos que exista el nombre y el archivo PDF
    if (!name || !this.selectedFile) {
      const t = await this.toast.create({ message: 'El nombre y el archivo PDF son obligatorios', duration: 2500, position: 'bottom', color: 'warning' });
      await t.present();
      return;
    }
    
    const patientId = await this.storage.get('currentPatientId');
    if (!patientId) {
      const t = await this.toast.create({ message: 'No se pudo identificar al paciente', duration: 2000, position: 'bottom', color: 'danger' });
      await t.present();
      return;
    }

    this.saving = true;

    // IMPORTANTE: Preparamos los datos como FormData para poder enviar el archivo físico
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('name', name);
    formData.append('type', this.newType);
    formData.append('file', this.selectedFile);

    // Nota: Usamos "as any" temporalmente por si tu servicio aún espera un JSON estricto
    this.documentApi.create(formData as any).subscribe({
      next: (doc) => {
        this.saving = false;
        if (doc) {
          this.documents = [doc, ...this.documents];
          this.toggleAddForm();
          this.toast.create({ message: 'Documento guardado', duration: 2000, position: 'bottom', color: 'success' }).then((x) => x.present());
        } else {
          this.toast.create({ message: 'Error al guardar', duration: 2000, position: 'bottom', color: 'danger' }).then((x) => x.present());
        }
      },
      error: () => {
        this.saving = false;
        this.toast.create({ message: 'Error de conexión o al subir archivo', duration: 2000, position: 'bottom', color: 'danger' }).then((x) => x.present());
      },
    });
  }

  openDoc(doc: MedicalDocument) {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank', 'noopener');
    }
  }

  async deleteDoc(doc: MedicalDocument) {
    const patientId = await this.storage.get('currentPatientId');
    if (!patientId) return;
    this.documentApi.delete(doc.id, patientId).subscribe({
      next: (ok) => {
        if (ok) {
          this.documents = this.documents.filter((d) => d.id !== doc.id);
          this.toast.create({ message: 'Documento eliminado', duration: 2000, position: 'bottom', color: 'medium' }).then((x) => x.present());
        }
      },
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      informe: 'Informe',
      radiografia: 'Radiografía',
      analisis: 'Análisis',
      receta: 'Receta',
      otro: 'Otro',
    };
    return labels[type] || type;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}