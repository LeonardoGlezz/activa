import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, interval } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ActivityEvent, AdminService, PatientRow, PhysioRow } from '../../services/admin.service';
import { activityIcon, formatWhen } from '../../shared/format';

type Menu = 'bell' | 'user' | 'search' | null;

interface SearchResult {
  kind: 'Fisio' | 'Paciente';
  label: string;
  detail: string;
  link: any[];
  queryParams?: Record<string, string>;
}

const BELL_SEEN_KEY = 'adminBellSeen';

/** Fecha de un evento en milisegundos (las sesiones solo traen el día) */
function eventTime(date: string): number {
  return (date.length === 10 ? new Date(`${date}T12:00:00`) : new Date(date)).getTime();
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  applicationName = 'Activa';
  readonly siteUrl = `${location.origin}/`;
  isMenuOpen = false;
  isLoggedIn = false;
  open: Menu = null;

  user: { name?: string; email?: string } | null = null;

  // Campana
  pendientes = 0;
  recientes: ActivityEvent[] = [];
  nuevos = 0;

  // Búsqueda
  query = '';
  private physios: PhysioRow[] | null = null;
  private patients: PatientRow[] | null = null;
  buscando = false;

  readonly icon = activityIcon;
  readonly when = formatWhen;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit() {
    this.authService.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      if (loggedIn) this.refrescarAvisos();
    });
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((u) => (this.user = u));

    // Al cambiar de página se cierran los menús y se actualiza la campana
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        this.open = null;
        this.isMenuOpen = false;
        this.physios = this.patients = null;
        if (this.isLoggedIn) this.refrescarAvisos();
      });
    interval(120000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.isLoggedIn && this.refrescarAvisos());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open = null;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.open = null;
  }

  toggle(menu: Exclude<Menu, null>) {
    this.open = this.open === menu ? null : menu;
    if (this.open === 'bell') this.marcarVistos();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.open = null;
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  // ----- Campana -----

  private refrescarAvisos() {
    forkJoin({ overview: this.adminService.getOverview(), activity: this.adminService.getActivity(7) }).subscribe({
      next: ({ overview, activity }) => {
        this.pendientes = overview.physiotherapists.pending_approval;
        this.recientes = activity.slice(0, 6);
        const seen = this.lastSeen();
        this.nuevos = activity.filter((e) => eventTime(e.date) > seen).length;
      },
      error: () => {},
    });
  }

  get badge(): number {
    return this.pendientes + this.nuevos;
  }

  private lastSeen(): number {
    try {
      return Number(localStorage.getItem(BELL_SEEN_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  private marcarVistos() {
    this.nuevos = 0;
    try {
      localStorage.setItem(BELL_SEEN_KEY, String(Date.now()));
    } catch {}
  }

  // ----- Búsqueda -----

  onSearchFocus() {
    this.open = 'search';
    if (this.physios && this.patients) return;
    this.buscando = true;
    forkJoin({ physios: this.adminService.listAllPhysios(), patients: this.adminService.listPatients() }).subscribe({
      next: ({ physios, patients }) => {
        this.physios = physios;
        this.patients = patients;
        this.buscando = false;
        this.actualizarResultados();
      },
      error: () => (this.buscando = false),
    });
  }

  /** Se recalcula solo al escribir: si cambiara en cada ciclo, el clic caería en un elemento ya reemplazado */
  resultados: SearchResult[] = [];

  actualizarResultados() {
    this.resultados = this.calcularResultados();
  }

  private calcularResultados(): SearchResult[] {
    const q = this.normalize(this.query);
    if (q.length < 2) return [];
    const physios: SearchResult[] = (this.physios ?? [])
      .map((p) => ({ p, name: [p.first_name, p.last_name_paternal, p.last_name_maternal].filter(Boolean).join(' ') }))
      .filter(({ p, name }) => this.normalize(`${name} ${p.email ?? ''} ${p.professional_license ?? ''}`).includes(q))
      .map(({ p, name }) => ({ kind: 'Fisio', label: name, detail: p.email ?? '', link: ['/fisioterapeuta'], queryParams: { buscar: name } }));
    const patients: SearchResult[] = (this.patients ?? [])
      .filter((p) => this.normalize(`${p.name} ${p.email ?? ''}`).includes(q))
      .map((p) => ({ kind: 'Paciente', label: p.name, detail: `de ${p.physio_name}`, link: ['/pacientes', p.id_patient] }));
    return [...physios, ...patients].slice(0, 8);
  }

  irAResultado(r: SearchResult) {
    this.query = '';
    this.resultados = [];
    this.open = null;
    this.router.navigate(r.link, { queryParams: r.queryParams });
  }

  onSearchEnter() {
    const first = this.resultados[0];
    if (first) this.irAResultado(first);
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
