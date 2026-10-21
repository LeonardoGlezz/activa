import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { PhysiotherapistApiService, MyPhysio } from '../core/infrastructure/api/physiotherapist-api.service';

@Component({
  selector: 'app-physiotherapist-profile',
  templateUrl: './physiotherapist-profile.page.html',
  styleUrls: ['./physiotherapist-profile.page.scss'],
  standalone: false,
})
export class PhysiotherapistProfilePage implements OnInit {
  physio: MyPhysio | null = null;
  loading = true;
  whatsappUrl: string | null = null;

  constructor(
    private storage: Storage,
    private physioApi: PhysiotherapistApiService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const patient = await this.storage.get('currentPatient');
    const patientName = patient?.firstName ?? patient?.first_name ?? '';
    this.physioApi.getMine().subscribe((p) => {
      this.physio = p;
      this.whatsappUrl = this.physioApi.whatsappUrl(p, patientName);
      this.loading = false;
    });
  }

  get initials(): string {
    return (this.physio?.fullName || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }
}
