import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, finalize, of, retry, switchMap, timeout } from 'rxjs';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './subscription.html',
  styleUrl: './subscription.scss'
})
export class SubscriptionComponent implements OnInit {
  private readonly defaultPlans: any[] = [
    {
      id_plan: 0,
      name: 'Plan Gratis',
      patient_limit: 5,
      appointment_limit_mo: 10,
      routine_limit: 10,
      logbook_limit_mo: 10,
      tracking_limit_mo: 10,
    },
    {
      id_plan: 1,
      name: 'Plan Basico',
      patient_limit: 20,
      appointment_limit_mo: 50,
      routine_limit: 30,
      logbook_limit_mo: 50,
      tracking_limit_mo: 100,
    },
    {
      id_plan: 2,
      name: 'Plan Premium',
      patient_limit: null,
      appointment_limit_mo: null,
      routine_limit: null,
      logbook_limit_mo: null,
      tracking_limit_mo: null,
    }
  ];

  plans: any[] = [...this.defaultPlans];
  current: any = null;
  loadingPlans = false;
  loadingCurrent = false;
  processingPlanId: number | null = null;
  openingPortal = false;
  syncingCheckout = false;
  pendingUpgradePlanId: number | null = null;
  selectedPlanForChange: any = null;
  showConfirmModal = false;
  confirmModalType: 'upgrade' | 'downgrade' | null = null;
  pendingChange: { plan: any; date: string } | null = null;
  processingChange = false;
  cancellingPending = false;
  backendStatus: 'ok' | 'down' | 'checking' = 'checking';
  sessionStatus: 'valid' | 'missing' | 'expired' | 'checking' = 'checking';
  sourceStatus: 'private' | 'public-fallback' | 'none' = 'none';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.handleCheckoutReturn();
    this.pendingUpgradePlanId = Number(this.route.snapshot.queryParamMap.get('upgrade')) || null;
    this.hydrateFromToken();
    this.runDiagnostics();
    this.loadCurrentSubscription();
    this.loadPlans();
  }

  hydrateFromToken(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const tokenPlanId = payload?.id_plan;
      const tokenStatus = payload?.subscription_status;

      if (tokenPlanId === null || tokenPlanId === undefined) {
        return;
      }

      const matchedPlan = this.defaultPlans.find((plan) => Number(plan.id_plan) === Number(tokenPlanId)) || null;
      this.current = {
        id_plan: Number(tokenPlanId),
        subscription_status: tokenStatus || 'none',
        plan: matchedPlan,
      };
    } catch {
      // Fallback a carga remota si falla
    }
  }

  handleCheckoutReturn(): void {
    const checkoutStatus = this.route.snapshot.queryParamMap.get('checkout');
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (checkoutStatus === 'cancel') {
      this.messageService.clear();
      this.messageService.add({ severity: 'info', summary: 'Pago cancelado', detail: 'No se realizaron cambios en tu suscripción.' });
      return;
    }

    if (checkoutStatus !== 'success' || !sessionId) {
      return;
    }

    this.syncingCheckout = true;
    this.http.get<any>(`${environment.webservice.baseUrl}/api/suscripciones/confirmar-checkout`, {
      params: { session_id: sessionId }
    }).pipe(
      finalize(() => {
        this.syncingCheckout = false;
      })
    ).subscribe({
      next: () => {
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'Suscripción actualizada', detail: 'Tu plan se sincronizó correctamente.' });
        this.loadCurrentSubscription();
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.clear();
        this.messageService.add({ severity: 'warn', summary: 'Sincronización pendiente', detail: 'No se pudo confirmar al instante. El webhook puede tardar unos segundos.' });
        this.cdr.detectChanges();
      }
    });
  }

  runDiagnostics(): void {
    const token = localStorage.getItem('token');
    this.sessionStatus = token ? 'valid' : 'missing';

    this.backendStatus = 'checking';
    this.http.get<any>(`${environment.webservice.baseUrl}/api/publico/planes`).pipe(
      timeout(5000),
      catchError(() => of(null))
    ).subscribe((resp) => {
      this.backendStatus = resp?.data ? 'ok' : 'down';
    });
  }

  loadPlans(): void {
    this.loadingPlans = true;

    this.http.get<any>(`${environment.webservice.baseUrl}/api/suscripciones/planes`).pipe(
      timeout(8000),
      retry({ count: 1, delay: 800 }),
      catchError(() => of(null)),
      switchMap((resp) => {
        if (resp?.data) {
          this.sourceStatus = 'private';
          return of(resp);
        }
        this.sourceStatus = 'public-fallback';
        return this.http.get<any>(`${environment.webservice.baseUrl}/api/publico/planes`).pipe(
          timeout(8000),
          retry({ count: 1, delay: 800 }),
          catchError(() => of({ data: [] }))
        );
      }),
      finalize(() => {
        this.loadingPlans = false;
      })
    ).subscribe({
      next: (resp) => {
        const apiPlans = resp?.data || [];
        if (apiPlans.length > 0) {
          this.plans = apiPlans;
        }

        if (this.pendingUpgradePlanId) {
          const selectedPlan = this.plans.find((p) => Number(p?.id_plan) === this.pendingUpgradePlanId);
          const targetPlanId = this.pendingUpgradePlanId;
          this.pendingUpgradePlanId = null;

          if (selectedPlan && !this.isCurrentPlan(selectedPlan) && targetPlanId !== 0) {
            this.goCheckout(selectedPlan);
            return;
          }
        }

        if (!this.plans.length) {
          this.messageService.clear();
          this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'No hay planes disponibles para mostrar.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los planes. Intenta abrir Suscripción nuevamente.' });
        this.cdr.detectChanges();
      }
    });
  }

  loadCurrentSubscription(): void {
    this.loadingCurrent = !this.current?.subscription_status;
    this.http.get<any>(`${environment.webservice.baseUrl}/api/suscripciones/mi-plan`).pipe(
      timeout(9000),
      retry({ count: 1, delay: 800 }),
      catchError((err) => of({ __error: err })),
      finalize(() => {
        this.loadingCurrent = false;
      })
    ).subscribe({
      next: (resp) => {
        if (resp?.__error) {
          const err = resp.__error;
          this.current = this.current || { subscription_status: 'none', id_plan: null, plan: null };
          if (err?.status === 401) {
            this.sessionStatus = 'expired';
            this.cdr.detectChanges();
            return;
          }
          this.messageService.clear();
          this.messageService.add({ severity: 'warn', summary: 'Sincronización pendiente', detail: 'No se pudo cargar tu estado al primer intento. Puedes volver a abrir Suscripción.' });
          this.cdr.detectChanges();
          return;
        }

        this.current = resp?.data || this.current || null;
        this.sessionStatus = 'valid';

        if (resp?.data?.pending_plan_id && resp?.data?.pending_plan) {
          this.pendingChange = {
            plan: resp.data.pending_plan,
            date: resp.data.pending_plan_change_date || '',
          };
        } else {
          this.pendingChange = null;
        }
        this.cdr.detectChanges();
      }
    });
  }

  statusLabel(status: string): string {
    if (status === 'active') return 'Activa';
    if (status === 'past_due') return 'Pago pendiente';
    if (status === 'canceled') return 'Cancelada';
    return 'Sin suscripción';
  }

  statusClass(status: string): string {
    if (status === 'active') return 'status-active';
    if (status === 'past_due') return 'status-past-due';
    if (status === 'canceled') return 'status-canceled';
    return 'status-none';
  }

  isCurrentPlan(plan: any): boolean {
    const currentIdRaw = this.current?.id_plan;
    const planIdRaw = plan?.id_plan;

    if (currentIdRaw !== null && currentIdRaw !== undefined && planIdRaw !== null && planIdRaw !== undefined) {
      return Number(currentIdRaw) === Number(planIdRaw);
    }

    const currentName = String(this.current?.plan?.name || '').trim().toLowerCase();
    const planName = String(plan?.name || '').trim().toLowerCase();
    return !!currentName && !!planName && currentName === planName;
  }

  isPlanDisabled(plan: any): boolean {
    return this.processingPlanId === Number(plan?.id_plan) || this.processingChange;
  }

  isPendingPlan(plan: any): boolean {
    return !!this.pendingChange && Number(this.pendingChange.plan?.id_plan) === Number(plan?.id_plan);
  }

  getCurrentPlanId(): number | null {
    const raw = this.current?.id_plan;
    if (raw === null || raw === undefined || Number.isNaN(Number(raw))) return null;
    return Number(raw);
  }

  getPlanRank(plan: any): number {
    const name = String(plan?.name || '').trim().toLowerCase();
    if (name.includes('premium')) return 2;
    if (name.includes('basic') || name.includes('basico') || name.includes('básico')) return 1;
    if (name.includes('gratis') || name.includes('free')) return 0;

    const patientLimit = plan?.patient_limit;
    const routineLimit = plan?.routine_limit;
    if (patientLimit === null || patientLimit === undefined || routineLimit === null || routineLimit === undefined) {
      return 2;
    }
    if (Number(patientLimit) <= 5 && Number(routineLimit) <= 0) {
      return 0;
    }
    return 1;
  }

  getCurrentPlanRank(): number | null {
    if (this.current?.plan) return this.getPlanRank(this.current.plan);
    const currentId = this.getCurrentPlanId();
    if (currentId === null) return null;
    const planById = this.visiblePlans.find((p) => Number(p?.id_plan) === currentId);
    if (!planById) return null;
    return this.getPlanRank(planById);
  }

  isUpgradeDirection(plan: any): boolean {
    const currentRank = this.getCurrentPlanRank();
    const nextRank = this.getPlanRank(plan);
    if (currentRank === null) return false;
    return nextRank > currentRank;
  }

  getPlanButtonLabel(plan: any): string {
    if (this.isCurrentPlan(plan)) return 'Plan actual';
    if (this.isPendingPlan(plan)) return 'Cambio programado';

    const currentRank = this.getCurrentPlanRank();
    const nextRank = this.getPlanRank(plan);
    const isActive = this.current?.subscription_status === 'active';

    if (!isActive || currentRank === null) return 'Elegir plan';
    if (nextRank > currentRank) return 'Mejorar plan';
    return 'Cambiar a este plan';
  }

  getPlanCardClass(plan: any): string {
    if (this.isCurrentPlan(plan)) return 'plan-current';
    if (this.isPendingPlan(plan)) return 'plan-pending-change';
    const planId = Number(plan?.id_plan);
    if (planId === 2) return 'plan-premium';
    if (planId === 1) return 'plan-basic';
    return 'plan-free';
  }

  getFeatureLosses(currentPlan: any, targetPlan: any): string[] {
    if (!currentPlan || !targetPlan) return [];
    const losses: string[] = [];

    const curP = currentPlan.patient_limit;
    const newP = targetPlan.patient_limit;
    if (newP !== null && newP !== undefined) {
      if (curP === null || curP === undefined) losses.push(`Pacientes: de ilimitados a máximo ${newP}`);
      else if (curP > newP) losses.push(`Pacientes: de ${curP} a máximo ${newP}`);
    }

    const curA = currentPlan.appointment_limit_mo;
    const newA = targetPlan.appointment_limit_mo;
    if (newA !== null && newA !== undefined) {
      if (curA === null || curA === undefined) losses.push(`Citas: de ilimitadas a ${newA}/mes`);
      else if (curA > newA) losses.push(`Citas: de ${curA} a ${newA}/mes`);
    }

    const curR = currentPlan.routine_limit;
    const newR = targetPlan.routine_limit;
    if (newR !== null && newR !== undefined) {
      if (curR === null || curR === undefined) losses.push(`Rutinas: de ilimitadas a ${newR === 0 ? 'sin acceso' : newR}`);
      else if (curR > newR) losses.push(`Rutinas: de ${curR} a ${newR === 0 ? 'sin acceso' : newR}`);
    }

    return losses;
  }

  hasPatientLimitWarning(targetPlan: any): boolean {
    const curLimit = this.current?.plan?.patient_limit;
    const newLimit = targetPlan?.patient_limit;
    return newLimit !== null && newLimit !== undefined && (curLimit === null || curLimit === undefined || curLimit > newLimit);
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  }

  get headerStatusLabel(): string {
    if (this.loadingCurrent && !this.current?.subscription_status) return 'Cargando estado...';
    return this.statusLabel(this.current?.subscription_status || 'none');
  }

  get shouldShowCurrentCard(): boolean {
    return !!this.current?.plan || !this.loadingCurrent;
  }

  selectPlanChange(plan: any): void {
    if (this.isCurrentPlan(plan) || this.isPendingPlan(plan)) return;

    const currentRank = this.getCurrentPlanRank();
    const nextRank = this.getPlanRank(plan);

    if (this.current?.subscription_status !== 'active') {
      this.goCheckout(plan);
      return;
    }

    if (currentRank === 0 && nextRank > 0) {
      this.goCheckout(plan);
      return;
    }

    if (currentRank === null) {
      this.goCheckout(plan);
      return;
    }
    this.selectedPlanForChange = plan;
    this.confirmModalType = nextRank > currentRank ? 'upgrade' : 'downgrade';
    this.showConfirmModal = true;
  }

  closeModal(): void {
    this.showConfirmModal = false;
    this.selectedPlanForChange = null;
    this.confirmModalType = null;
  }

  confirmChange(): void {
    if (!this.selectedPlanForChange || this.processingChange) return;

    this.processingChange = true;

    const planIdNum = Number(this.selectedPlanForChange.id_plan);
    let planString = 'free';
    if (planIdNum === 1) planString = 'basico';
    if (planIdNum === 2) planString = 'ilimitado';

    this.http.post<any>(`${environment.webservice.baseUrl}/api/suscripciones/cambiar-plan`, {
      planId: planString
    }).pipe(
      finalize(() => { this.processingChange = false; })
    ).subscribe({
      next: (resp) => {
        if (resp?.requires_checkout && resp?.url) {
          window.location.href = resp.url;
          return;
        }

        if (resp?.data) {
          this.current = { ...this.current, ...resp.data };
          if (resp.data.pending_plan_id && resp.data.pending_plan) {
            this.pendingChange = { plan: resp.data.pending_plan, date: resp.data.pending_plan_change_date || '' };
          } else {
            this.pendingChange = null;
          }
        }
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: '¡Listo!', detail: resp?.message || 'Plan actualizado.' });
        this.closeModal();
        this.loadCurrentSubscription();
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = String(err?.error?.message || '');
        if (msg.includes('No tienes una suscripción activa en Stripe') && this.confirmModalType === 'upgrade') {
          const target = this.selectedPlanForChange;
          this.closeModal();
          this.goCheckout(target);
          return;
        }
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cambiar el plan.' });
        this.cdr.detectChanges();
      }
    });
  }

  cancelPendingChange(): void {
    if (this.cancellingPending) return;
    this.cancellingPending = true;

    this.http.delete<any>(`${environment.webservice.baseUrl}/api/suscripciones/cambio-pendiente`).pipe(
      finalize(() => { this.cancellingPending = false; })
    ).subscribe({
      next: (resp) => {
        this.pendingChange = null;
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'Cambio cancelado', detail: resp?.message || 'Tu plan actual se mantiene.' });
        this.loadCurrentSubscription();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cancelar el cambio pendiente.' });
        this.cdr.detectChanges();
      }
    });
  }

  clearPlanSelection(): void {
    this.closeModal();
  }

  getSelectedActionText(): string {
    if (!this.selectedPlanForChange) return '';
    return this.getPlanButtonLabel(this.selectedPlanForChange);
  }

  goToPortalForPlanChange(): void {
    this.openBillingPortal();
  }

  formatLimit(value: number | null | undefined, monthly = false): string {
    if (value === null || value === undefined) return 'Ilimitado';
    return monthly ? `${value} / mes` : String(value);
  }

  get visiblePlans(): any[] {
    return this.plans.length ? this.plans : this.defaultPlans;
  }

  goCheckout(plan: any): void {
    const planIdNum = Number(plan?.id_plan);
    if (!planIdNum) return;

    this.processingPlanId = planIdNum;

    let planString = '';
    if (planIdNum === 1) planString = 'basico';
    if (planIdNum === 2) planString = 'ilimitado';

    this.http.post<any>(`${environment.webservice.baseUrl}/api/suscripciones/checkout`, { 
      planId: planString 
    }).subscribe({
      next: (resp) => {
        const url = resp?.url;
        if (url) {
          window.location.href = url;
          return;
        }
        this.processingPlanId = null;
        this.messageService.clear();
        this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'No se recibió URL de pago.' });
      },
      error: (err) => {
        this.processingPlanId = null;
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo iniciar el checkout.' });
      }
    });
  }

  openBillingPortal(): void {
    this.openingPortal = true;
    this.http.post<any>(`${environment.webservice.baseUrl}/api/suscripciones/portal`, {}).pipe(
      finalize(() => {
        this.openingPortal = false;
      })
    ).subscribe({
      next: (resp) => {
        const url = resp?.url;
        if (url) {
          window.location.href = url;
          return;
        }
        this.messageService.clear();
        this.messageService.add({ severity: 'warn', summary: 'Atencion', detail: 'No se recibio la URL del portal.' });
      },
      error: (err) => {
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo abrir el portal de Stripe.' });
      }
    });
  }
}