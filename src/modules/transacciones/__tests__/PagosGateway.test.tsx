import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env, resolveEnv } from '@/configs/env'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import {
  detectPlanPriceDiscrepancies,
  formatStatusLabel,
  mapBackendRole,
  mapCancellationToStoreDto,
  mapPaymentResponse,
  mapPaymentStatus,
  mapPlansResponse,
  mapRetryPaymentResponse,
  mapStartSubscriptionResponse,
  mapSubscriptionStatus,
  mapSubscriptionToMiPlanDto,
  mapSubscriptionToStoreDto,
  toApiPaymentStatusFilter,
  toSubscriberType,
} from '../mappers/paymentsMappers'
import AdminPaymentsPage from '../pages/AdminPaymentsPage'
import { BuyerPaymentsSection } from '../pages/BuyerPaymentsPage'
import { paymentService } from '../services/paymentService'
import { planService } from '../services/planService'
import { storeSubscriptionService } from '../services/storeSubscriptionService'
import { userPlanService } from '../services/userPlanService'

function setSession(id: string, role: string, email = 'persona@correo.co') {
  localStorage.setItem('sr_token', 'jwt-demo-token')
  localStorage.setItem('sr_user', JSON.stringify({ id, name: 'Usuario QA', email, role }))
}

describe('bandera VITE_USE_MOCKS_PAGOS en env.ts', () => {
  it('sin VITE_USE_MOCKS_PAGOS hereda VITE_USE_MOCKS', () => {
    const localDefault = resolveEnv({ MODE: 'development', VITE_APP_ENV: 'local', VITE_USE_MOCKS: 'true' })
    expect(localDefault.useMocks).toBe(true)
    expect(localDefault.useMocksPagos).toBe(true)

    const qaFalse = resolveEnv({
      MODE: 'qa',
      VITE_APP_ENV: 'qa',
      VITE_USE_MOCKS: 'false',
      VITE_API_URL: 'https://gateway.example.com',
    })
    expect(qaFalse.useMocks).toBe(false)
    expect(qaFalse.useMocksPagos).toBe(false)
  })

  it('con VITE_USE_MOCKS_PAGOS=true o false manda solo para pagos', () => {
    const pagosReal = resolveEnv({
      MODE: 'development',
      VITE_APP_ENV: 'local',
      VITE_USE_MOCKS: 'true',
      VITE_USE_MOCKS_PAGOS: 'false',
      VITE_API_URL: 'http://localhost:8080',
    })
    expect(pagosReal.useMocks).toBe(true)
    expect(pagosReal.useMocksPagos).toBe(false)

    const pagosMock = resolveEnv({
      MODE: 'qa',
      VITE_APP_ENV: 'qa',
      VITE_USE_MOCKS: 'false',
      VITE_USE_MOCKS_PAGOS: 'true',
      VITE_API_URL: 'https://gateway.example.com',
    })
    expect(pagosMock.useMocks).toBe(false)
    expect(pagosMock.useMocksPagos).toBe(true)
  })

  it('valida valores inválidos, URL obligatoria y restricción en producción', () => {
    expect(() =>
      resolveEnv({ VITE_APP_ENV: 'local', VITE_USE_MOCKS_PAGOS: 'si' }),
    ).toThrow(/VITE_USE_MOCKS_PAGOS/)

    expect(() =>
      resolveEnv({ VITE_APP_ENV: 'qa', VITE_USE_MOCKS: 'true', VITE_USE_MOCKS_PAGOS: 'false' }),
    ).toThrow(/VITE_API_URL/)

    expect(() =>
      resolveEnv({
        VITE_APP_ENV: 'production',
        VITE_USE_MOCKS: 'false',
        VITE_USE_MOCKS_PAGOS: 'true',
        VITE_API_URL: 'https://gateway.example.com',
      }),
    ).toThrow(/producción/)
  })
})

describe('adaptadores y mappers de ms-pagos', () => {
  it('traduce estados conocidos y maneja estados desconocidos sin romper', () => {
    expect(mapSubscriptionStatus('PENDING')).toEqual({ status: 'PENDIENTE' })
    expect(mapSubscriptionStatus('ACTIVE')).toEqual({ status: 'ACTIVA' })
    expect(mapSubscriptionStatus('SUSPENDED')).toEqual({ status: 'SUSPENDIDA' })
    expect(mapSubscriptionStatus('CHARGEBACK_HOLD')).toEqual({
      status: 'PENDIENTE',
      unknownStatus: 'CHARGEBACK_HOLD',
    })

    expect(mapPaymentStatus('PENDING')).toEqual({ status: 'pendiente', estado: 'PENDIENTE' })
    expect(mapPaymentStatus('APPROVED')).toEqual({ status: 'aprobado', estado: 'APROBADO' })
    expect(mapPaymentStatus('REJECTED')).toEqual({ status: 'rechazado', estado: 'RECHAZADO' })
    expect(mapPaymentStatus('DISPUTED')).toEqual({
      status: 'pendiente',
      estado: 'PENDIENTE',
      unknownStatus: 'DISPUTED',
    })

    expect(formatStatusLabel('PENDIENTE', 'DISPUTED')).toBe('No reconocido (DISPUTED)')
    expect(toApiPaymentStatusFilter('aprobado')).toBe('APPROVED')
    expect(toApiPaymentStatusFilter('')).toBeUndefined()
  })

  it('traduce roles y detecta diferencias de precio entre GET /plans y v4', () => {
    expect(mapBackendRole('BUYER')).toBe('BUYER')
    expect(mapBackendRole('STORE_ADMIN')).toBe('STORE_ADMIN')
    expect(mapBackendRole('FOUNDATION_REPRESENTATIVE')).toBe('FOUNDATION_REPRESENTATIVE')
    expect(mapBackendRole('STYLERADAR_ADMIN')).toBe('STYLERADAR_ADMIN')
    expect(toSubscriberType('STORE_ADMIN')).toBe('STORE')
    expect(toSubscriberType('BUYER')).toBe('USER')

    const mapped = mapPlansResponse([
      { id: 1, name: 'Radar', subscriberType: 'USER', price: { value: 0, currency: 'COP' }, active: true },
      { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 16000, currency: 'COP' }, active: true },
      { id: 3, name: 'Store Basic', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' }, active: true },
    ])
    expect(mapped).toHaveLength(3)
    expect(mapped[1].price).toBe(16000)
    expect(mapped[1].backendPlanId).toBe(2)

    const diffs = detectPlanPriceDiscrepancies(mapped)
    expect(diffs).toHaveLength(1)
    expect(diffs[0]).toMatchObject({ planId: 'plus', expectedV4: 14900, backendValue: 16000 })
  })

  it('traduce respuestas de inicio, suscripción, cancelación, pago y reintento', () => {
    const start = mapStartSubscriptionResponse({
      subscriptionId: 55,
      orderId: 901,
      status: 'PENDING',
      initPoint: 'https://checkout.mercadopago.example/init/901',
    })
    expect(start).toMatchObject({
      initPoint: 'https://checkout.mercadopago.example/init/901',
      suscripcionId: '55',
      ordenId: '901',
      estado: 'PENDIENTE',
    })

    const buyerPlan = mapSubscriptionToMiPlanDto({
      id: 55,
      subscriberId: 'usr-10',
      subscriberType: 'USER',
      plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
      status: 'ACTIVE',
      startDate: '2026-11-01',
      endDate: '2026-12-01',
      autoRenewal: true,
      access: true,
    })
    expect(buyerPlan).toMatchObject({
      plan: 'RADAR_PLUS',
      suscripcionId: '55',
      estado: 'ACTIVA',
      renewalEnabled: true,
    })

    const storeSub = mapSubscriptionToStoreDto({
      id: 77,
      subscriberId: 'store-uuid-1',
      subscriberType: 'STORE',
      plan: { id: 3, name: 'Store Basic', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' } },
      status: 'ACTIVE',
      startDate: '2026-11-01',
      endDate: '2026-12-01',
      autoRenewal: true,
      taxId: '900123456',
      storeId: 'store-uuid-1',
    })
    expect(storeSub).toMatchObject({
      suscripcionId: '77',
      status: 'ACTIVA',
      nit: '900123456',
      almacenId: 'store-uuid-1',
    })

    const cancelled = mapCancellationToStoreDto(
      { subscriptionId: 77, autoRenewal: false, status: 'ACTIVE', endDate: '2026-12-01', cancellationConfirmed: true },
      storeSub,
    )
    expect(cancelled.renewalEnabled).toBe(false)
    expect(cancelled.status).toBe('ACTIVA')

    const payment = mapPaymentResponse({
      id: 300,
      subscriptionId: 55,
      amount: { value: 14900, currency: 'COP' },
      status: 'APPROVED',
      externalPaymentId: 'MP-EXT-300',
      createdAt: '2026-11-20T12:00:00Z',
    })
    expect(payment).toMatchObject({
      id: '300',
      suscripcionId: '55',
      amount: 14900,
      status: 'aprobado',
      estado: 'APROBADO',
      mpReference: 'MP-EXT-300',
      date: '2026-11-20',
    })

    const retried = mapRetryPaymentResponse(
      { orderId: 902, status: 'PENDING', initPoint: 'https://checkout.mercadopago.example/init/902' },
      { orderId: '901', status: 'rechazado', planName: 'Radar+', amount: 14900 },
      'pagador@correo.co',
    )
    expect(retried).toMatchObject({
      orderId: '902',
      status: 'pendiente',
      initPoint: 'https://checkout.mercadopago.example/init/902',
    })
  })
})

describe('servicios reales contra Gateway (VITE_USE_MOCKS_PAGOS=false)', () => {
  const originalMocksPagos = env.useMocksPagos

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
    ;(env as { useMocksPagos: boolean }).useMocksPagos = false
  })

  afterEach(() => {
    ;(env as { useMocksPagos: boolean }).useMocksPagos = originalMocksPagos
    vi.restoreAllMocks()
  })

  it('planService llama GET /api/v1/plans, POST /api/v1/subscriptions/start, GET /api/v1/subscriptions/{id} y POST /api/v1/payments/{orderId}/retry sin headers extra', async () => {
    setSession('usr-42', 'BUYER', 'buyer@correo.co')
    const getSpy = vi.spyOn(apiClient, 'get')
    const postSpy = vi.spyOn(apiClient, 'post')

    getSpy.mockResolvedValueOnce({
      data: [{ id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' }, active: true }],
    })
    const plans = await planService.getPlans()
    expect(getSpy).toHaveBeenCalledWith('/api/v1/plans')
    expect(plans[0].price).toBe(14900)

    postSpy.mockResolvedValueOnce({
      data: { subscriptionId: 10, orderId: 20, status: 'PENDING', initPoint: 'https://mp.example/pay/20' },
    })
    const checkout = await planService.createCheckout('plus', 'buyer@correo.co', 2)
    expect(postSpy).toHaveBeenCalledWith('/api/v1/subscriptions/start', {
      subscriberType: 'USER',
      payerEmail: 'buyer@correo.co',
      planId: 2,
    })
    expect(checkout.initPoint).toBe('https://mp.example/pay/20')

    getSpy.mockResolvedValueOnce({
      data: { id: 10, subscriberId: 'usr-42', subscriberType: 'USER', status: 'PENDING' },
    })
    const pendingRes = await planService.getCheckoutResult('20')
    expect(getSpy).toHaveBeenLastCalledWith('/api/v1/subscriptions/usr-42')
    expect(pendingRes.status).toBe('pendiente')
    expect(pendingRes.estadoSuscripcion).toBe('PENDIENTE')

    postSpy.mockResolvedValueOnce({
      data: { orderId: 21, status: 'PENDING', initPoint: 'https://mp.example/pay/21' },
    })
    const retryRes = await planService.retryRejectedPayment(
      { orderId: '20', status: 'rechazado', planName: 'Radar+', amount: 14900 },
      'buyer@correo.co',
    )
    expect(postSpy).toHaveBeenLastCalledWith('/api/v1/payments/20/retry', { payerEmail: 'buyer@correo.co' })
    expect(retryRes.orderId).toBe('21')
  })

  it('userPlanService y storeSubscriptionService usan rutas del contrato y propagan 401/403/422', async () => {
    setSession('store-uuid-9', 'STORE_ADMIN', 'tienda@correo.co')
    const getSpy = vi.spyOn(apiClient, 'get')
    const postSpy = vi.spyOn(apiClient, 'post')

    postSpy.mockResolvedValueOnce({
      data: { subscriptionId: 88, orderId: 89, status: 'PENDING', initPoint: 'https://mp.example/store/89' },
    })
    const act = await storeSubscriptionService.activateFromOnboarding('tienda@correo.co', 'IGNORED', '900123456')
    expect(postSpy).toHaveBeenCalledWith('/api/v1/subscriptions/start', {
      subscriberType: 'STORE',
      payerEmail: 'tienda@correo.co',
      taxId: '900123456',
      storeId: 'store-uuid-9',
    })
    expect(act.redirectTo).toBe('https://mp.example/store/89')

    postSpy.mockResolvedValueOnce({
      data: { subscriptionId: 88, autoRenewal: false, status: 'ACTIVE', endDate: '2026-12-30', cancellationConfirmed: true },
    })
    const cancelled = await storeSubscriptionService.cancelRenewal()
    expect(postSpy).toHaveBeenLastCalledWith('/api/v1/subscriptions/store-uuid-9/cancel', { confirmed: true })
    expect(cancelled.renewalEnabled).toBe(false)

    getSpy.mockRejectedValueOnce(new ApiError(401, 'Tu sesión venció'))
    await expect(userPlanService.getMyPayments()).rejects.toMatchObject({ status: 401 })

    getSpy.mockRejectedValueOnce(new ApiError(403, 'Sin permiso'))
    await expect(paymentService.list({ status: 'aprobado' })).rejects.toMatchObject({ status: 403 })
    expect(getSpy).toHaveBeenLastCalledWith('/api/v1/admin/payments', { params: { status: 'APPROVED' } })

    postSpy.mockRejectedValueOnce(new ApiError(422, 'No procesable'))
    await expect(storeSubscriptionService.retryPayment('89', 'tienda@correo.co')).rejects.toMatchObject({ status: 422 })
  })
})

describe('estados de carga, vacío, error y estado desconocido en pantallas de pagos', () => {
  const originalMocksPagos = env.useMocksPagos

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
    ;(env as { useMocksPagos: boolean }).useMocksPagos = false
  })

  afterEach(() => {
    ;(env as { useMocksPagos: boolean }).useMocksPagos = originalMocksPagos
    vi.restoreAllMocks()
  })

  it('BuyerPaymentsSection muestra estado vacío y permite reintentar tras error', async () => {
    setSession('usr-50', 'BUYER', 'buyer50@correo.co')
    const user = userEvent.setup()
    const getSpy = vi.spyOn(apiClient, 'get')

    getSpy.mockRejectedValueOnce(new ApiError(500, 'Error temporal'))
    render(
      <MemoryRouter>
        <BuyerPaymentsSection />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/No pudimos cargar tu historial/i)).toBeInTheDocument()
    getSpy.mockResolvedValueOnce({ data: [] })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText(/Aún no tienes pagos de suscripción registrados/i)).toBeInTheDocument()
  })

  it('AdminPaymentsPage renderiza estado desconocido sin romperse y muestra estado vacío', async () => {
    setSession('adm-1', 'STYLERADAR_ADMIN', 'admin@styleradar.co')
    const getSpy = vi.spyOn(apiClient, 'get')
    getSpy.mockResolvedValueOnce({
      data: [
        {
          id: 999,
          subscriptionId: 12,
          amount: { value: 14900, currency: 'COP' },
          status: 'DISPUTED',
          externalPaymentId: 'MP-999',
          createdAt: '2026-11-21T10:00:00Z',
        },
      ],
    })

    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('No reconocido (DISPUTED)')).toBeInTheDocument()
    })
  })
})
