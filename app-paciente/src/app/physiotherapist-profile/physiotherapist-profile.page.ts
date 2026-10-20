import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PhysiotherapistApiService, Physiotherapist } from '../core/infrastructure/api/physiotherapist-api.service';
import { ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-physiotherapist-profile',
  templateUrl: './physiotherapist-profile.page.html',
  styleUrls: ['./physiotherapist-profile.page.scss'],
  standalone: false,
})
export class PhysiotherapistProfilePage implements OnInit {
  physio: Physiotherapist | null = null;
  photoTimestamp: number = Date.now();
  age: number | null = null;
  currentYear = new Date().getFullYear();

  constructor(
    private storage: Storage,
    private physioApi: PhysiotherapistApiService,
    private http: HttpClient,
    private toast: ToastController
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const patient = await this.storage.get('currentPatient');
    if (patient && patient.physiotherapistId) {
      this.physioApi.getById(patient.physiotherapistId).subscribe((p) => {
        this.physio = p;
        if (p?.birthYear) {
          this.age = this.currentYear - p.birthYear;
        }
      });
    }
  }

  getAvatarUrl(): string {
    if (this.physio?.photoUrl) {
      const url = this.physio.photoUrl;
      const base = environment.backendUrl;
      return `${base}/${url}?t=${this.photoTimestamp}`;
    }
    return this.physio?.id ? `https://i.pravatar.cc/150?u=physio${this.physio.id}` : 'https://i.pravatar.cc/150?u=physio';
  }

  async changePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        saveToGallery: true,
        promptLabelHeader: 'Cambiar Foto del Fisioterapeuta',
        promptLabelPhoto: 'Elegir de Galería',
        promptLabelPicture: 'Tomar Foto'
      });

      if (image.dataUrl) {
        await this.uploadPhoto(image.dataUrl);
      }
    } catch (e: any) {
      console.error('Error al capturar imagen', e);
      if (e.message !== 'User cancelled photos app') {
        const t = await this.toast.create({
          message: 'Error al abrir la cámara/galería',
          duration: 3000,
          color: 'danger'
        });
        await t.present();
      }
    }
  }

  async uploadPhoto(dataUrl: string) {
    if (!this.physio?.id) return;

    const blob = await (await fetch(dataUrl)).blob();
    const formData = new FormData();
    formData.append('photo', blob, `physio_${this.physio.id}.jpg`);

    this.http.post<{ success: boolean; photoUrl: string }>(`${environment.apiUrl}/physiotherapists/${this.physio.id}/photo`, formData)
      .subscribe(async (res) => {
        if (res.success) {
          this.physio!.photoUrl = res.photoUrl;
          this.photoTimestamp = Date.now();
          const t = await this.toast.create({
            message: 'Foto de perfil actualizada correctamente',
            duration: 2000,
            color: 'success',
            position: 'bottom'
          });
          await t.present();
        }
      }, async (err) => {
        const t = await this.toast.create({
          message: 'Error al subir la imagen',
          duration: 3000,
          color: 'danger'
        });
        await t.present();
      });
  }
}
