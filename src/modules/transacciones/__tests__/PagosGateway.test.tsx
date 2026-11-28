import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env, resolveEnv } from '@/configs/env'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { CancelSubscriptionButton } from '../components/CancelSubscriptionButton'
import {
  buildPaymentsCsv,
  deriveSubscriptionStatus,
  detectPlanPriceDiscrepancies,
  formatStatusLabel,
  formatSubscriptionDate,
  mapBackendRole,
  mapCancellationToStoreDto,
  mapPaymentResponse,
  mapPaymentStatus,
  mapPlansResponse,
  mapRetryPaymentResponse,
  mapStartSubscriptionResponse,
  mapSubscriberTypeToRole,
  mapSubscriptionToMiPlanDto,
  mapSubscriptionToStoreDto,
  registerCatalogPlans,
  toApiPaymentStatusFilter,
  toSubscriberType,
} from '../mappers/paymentsMappers'
import AdminPaymentsPage from '../pages/AdminPaymentsPage'
import { BuyerPaymentsSection } from '../pages/BuyerPaymentsPage'
import CheckoutPage from '../pages/CheckoutPage'
import PlansPage from '../pages/PlansPage'
import StoreActivateSubscriptionPage from '../pages/StoreActivateSubscriptionPage'
import StoreSubscriptionPage from '../pages/StoreSubscriptionPage'
import { paymentService } from '../services/paymentService'
import { planService } from '../services/planService'
import { storeSubscriptionService } from '../services/storeSubscriptionService'
import { userPlanService } from '../services/userPlanService'

function setSession(id: string, role: string, email = 'persona@correo.co') {
  localStorage.setItem('sr_token', 'jwt-demo-token')
  localStorage.setItem('sr_user', JSON.stringify({ id, name: 'Usuario QA', email, role }))
}

function withAuth(ui: React.ReactElement, role: 'BUYER' | 'STORE_ADMIN' | 'STYLERADAR_ADMIN', id = 'usr-42', email = 'buyer@correo.co') {
  return (
    <AuthContext.Provider
      value={{
        user: { id, name: 'Usuario QA', email, role },
        login: vi.fn(),
        register: vi.fn(),
        verifyOtp: vi.fn(),
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      }}
    >
      {ui}
    </AuthContext.Provider>
  )
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
    expect(() => resolveEnv({ VITE_APP_ENV: 'local', VITE_USE_MOCKS_PAGOS: 'si' })).toThrow(/VITE_USE_MOCKS_PAGOS/)
    expect(() => resolveEnv({ VITE_APP_ENV: 'qa', VITE_USE_MOCKS: 'true', VITE_USE_MOCKS_PAGOS: 'false' })).toThrow(/VITE_API_URL/)
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

describe('adaptadores y mappers del contrato final de ms-pagos', () => {
  it('implementa cada fila de la tabla de etiquetas de estado de suscripción', () => {
    const today = '2026-11-23'
    expect(deriveSubscriptionStatus('PENDING', { today })).toEqual({ status: 'PENDIENTE', label: 'PENDIENTE' })
    expect(deriveSubscriptionStatus('ACTIVE', { autoRenewal: true, today })).toEqual({ status: 'ACTIVA', label: 'ACTIVA' })
    expect(deriveSubscriptionStatus('ACTIVE', { autoRenewal: false, today })).toEqual({
      status: 'ACTIVA',
      label: 'Activa sin renovación',
    })
    expect(deriveSubscriptionStatus('SUSPENDED', { endDate: '2026-11-20', today })).toEqual({
      status: 'VENCIDA',
      label: 'VENCIDA',
    })
    expect(deriveSubscriptionStatus('SUSPENDED', { endDate: '2026-12-01', today })).toEqual({
      status: 'SUSPENDIDA',
      label: 'SUSPENDIDA',
    })
    expect(deriveSubscriptionStatus('SUSPENDED', { endDate: null, today })).toEqual({
      status: 'SUSPENDIDA',
      label: 'SUSPENDIDA',
    })
    expect(deriveSubscriptionStatus('CHARGEBACK_HOLD', { today })).toEqual({
      status: 'PENDIENTE',
      label: 'No reconocido (CHARGEBACK_HOLD)',
      unknownStatus: 'CHARGEBACK_HOLD',
    })
  })

  it('traduce PaymentResponse usando subscriberType (USER, STORE, vacío y desconocido) y planId del catálogo sin depender de planName', () => {
    const catalog = mapPlansResponse([
      { id: 101, name: 'Nivel Inicial', subscriberType: 'USER', price: { value: 0, currency: 'COP' }, active: true },
      { id: 202, name: 'Promo Comprador', subscriberType: 'USER', price: { value: 14900, currency: 'COP' }, active: true },
      { id: 303, name: 'Membresía Comercial', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' }, active: true },
    ])

    // USER + planId del catálogo, con planName arbitrario (no influye en la lógica)
    const userPayment = mapPaymentResponse(
      {
        id: 300,
        subscriptionId: 55,
        subscriberId: 'usr-abc-123',
        subscriberType: 'USER',
        planId: 202,
        planName: 'Nombre Arbitrario Tienda',
        amount: { value: 14900, currency: 'COP' },
        status: 'APPROVED',
        externalPaymentId: 'MP-EXT-300',
        createdAt: '2026-11-20T12:00:00Z',
      },
      catalog,
    )
    expect(userPayment).toMatchObject({
      id: '300',
      suscripcionId: '55',
      suscriptorId: 'usr-abc-123',
      subscriberType: 'USER',
      subscriberRoleLabel: 'Comprador',
      userRole: 'BUYER',
      backendPlanId: 202,
      planId: 'plus',
      planName: 'Nombre Arbitrario Tienda',
      amount: 14900,
      currency: 'COP',
      status: 'aprobado',
      estado: 'APROBADO',
      mpReference: 'MP-EXT-300',
      date: '2026-11-20',
    })

    // STORE + planId del catálogo
    const storePayment = mapPaymentResponse(
      {
        id: 302,
        subscriptionId: 57,
        subscriberId: 'store-xyz',
        subscriberType: 'STORE',
        planId: 303,
        planName: 'Cualquier Texto',
        amount: { value: 89000, currency: 'COP' },
        status: 'PENDING',
        externalPaymentId: 'MP-EXT-302',
        createdAt: '2026-11-21T10:00:00Z',
      },
      catalog,
    )
    expect(storePayment).toMatchObject({
      subscriberType: 'STORE',
      subscriberRoleLabel: 'Tienda',
      userRole: 'STORE_ADMIN',
      backendPlanId: 303,
      planId: 'store',
      planName: 'Cualquier Texto',
    })

    // subscriberType vacío y sin planName: muestra "—", no adivina por monto ni rompe
    const emptyType = mapPaymentResponse({
      id: 301,
      subscriptionId: 56,
      subscriberId: 'store-xyz',
      subscriberType: '',
      amount: { value: 89000, currency: 'COP' },
      status: 'DISPUTED',
      externalPaymentId: 'MP-EXT-301',
      createdAt: '2026-11-21T10:00:00Z',
    })
    expect(emptyType.subscriberType).toBeUndefined()
    expect(emptyType.userRole).toBeUndefined()
    expect(emptyType.subscriberRoleLabel).toBe('—')
    expect(emptyType.planName).toBe('—')
    expect(emptyType.suscriptorId).toBe('store-xyz')
    expect(emptyType.unknownStatus).toBe('DISPUTED')
    expect(formatStatusLabel('PENDIENTE', emptyType.unknownStatus)).toBe('No reconocido (DISPUTED)')

    // subscriberType desconocido: muestra "—", no adivina ni rompe
    expect(mapSubscriberTypeToRole('ENTERPRISE')).toEqual({
      subscriberType: undefined,
      userRole: undefined,
      subscriberRoleLabel: '—',
    })
    expect(mapSubscriberTypeToRole(undefined)).toEqual({
      subscriberType: undefined,
      userRole: undefined,
      subscriberRoleLabel: '—',
    })
    expect(formatSubscriptionDate('2026-12-09T23:59:59Z')).toBe('9 de diciembre de 2026')
    registerCatalogPlans([])

    expect(mapPaymentStatus('PENDING')).toEqual({ status: 'pendiente', estado: 'PENDIENTE' })
    expect(mapPaymentStatus('APPROVED')).toEqual({ status: 'aprobado', estado: 'APROBADO' })
    expect(mapPaymentStatus('REJECTED')).toEqual({ status: 'rechazado', estado: 'RECHAZADO' })
    expect(toApiPaymentStatusFilter('aprobado')).toBe('APPROVED')
    expect(toApiPaymentStatusFilter('')).toBeUndefined()
  })

  it('traduce roles, planes, suscripciones, cancelación, reintento y genera CSV del listado', () => {
    expect(mapBackendRole('BUYER')).toBe('BUYER')
    expect(mapBackendRole('STORE_ADMIN')).toBe('STORE_ADMIN')
    expect(mapBackendRole('FOUNDATION_REPRESENTATIVE')).toBe('FOUNDATION_REPRESENTATIVE')
    expect(mapBackendRole('STYLERADAR_ADMIN')).toBe('STYLERADAR_ADMIN')
    expect(toSubscriberType('STORE_ADMIN')).toBe('STORE')
    expect(toSubscriberType('BUYER')).toBe('USER')

    const mappedPlans = mapPlansResponse([
      { id: 1, name: 'Radar', subscriberType: 'USER', price: { value: 0, currency: 'COP' }, active: true },
      { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 16000, currency: 'COP' }, active: true },
      { id: 3, name: 'Store Basic', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' }, active: true },
    ])
    expect(detectPlanPriceDiscrepancies(mappedPlans)).toEqual([
      { planId: 'plus', planName: 'Radar+', expectedV4: 14900, backendValue: 16000 },
    ])

    expect(
      mapStartSubscriptionResponse({
        subscriptionId: 55,
        orderId: 901,
        status: 'PENDING',
        initPoint: 'https://checkout.mercadopago.example/init/901',
      }),
    ).toMatchObject({ suscripcionId: '55', ordenId: '901', estado: 'PENDIENTE' })

    const buyerExpired = mapSubscriptionToMiPlanDto(
      {
        id: 55,
        subscriberId: 'usr-10',
        subscriberType: 'USER',
        plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
        status: 'SUSPENDED',
        endDate: '2026-10-01',
        autoRenewal: false,
        access: false,
      },
      '2026-11-23',
    )
    expect(buyerExpired.estado).toBe('VENCIDA')
    expect(buyerExpired.plan).toBe('RADAR')

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
    const cancelled = mapCancellationToStoreDto(
      { subscriptionId: 77, autoRenewal: false, status: 'ACTIVE', endDate: '2026-12-01', cancellationConfirmed: true },
      storeSub,
    )
    expect(cancelled.renewalEnabled).toBe(false)
    expect(cancelled.status).toBe('ACTIVA')

    const retried = mapRetryPaymentResponse(
      { orderId: 902, status: 'PENDING', initPoint: 'https://checkout.mercadopago.example/init/902' },
      { orderId: '901', status: 'rechazado', planName: 'Radar+', amount: 14900 },
      'pagador@correo.co',
    )
    expect(retried).toMatchObject({ orderId: '902', status: 'pendiente' })

    const csv = buildPaymentsCsv([
      mapPaymentResponse({
        id: 500,
        subscriptionId: 77,
        subscriberId: 'store-uuid-1',
        planId: 3,
        planName: 'Store Basic',
        amount: { value: 89000, currency: 'COP' },
        status: 'APPROVED',
        externalPaymentId: 'MP-500',
        createdAt: '2026-11-22T09:00:00Z',
      }),
    ])
    expect(csv).toContain('"pagoId";"suscripcionId";"suscriptorId";"plan";"valor";"moneda";"estado";"fecha";"referencia"')
    expect(csv).toContain('"500";"77";"store-uuid-1";"Store Basic";"89000";"COP";"APROBADO";"2026-11-22";"MP-500"')
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

  it('paymentService.getById usa GET /api/v1/admin/payments/{id} y list usa ?status=', async () => {
    setSession('adm-1', 'STYLERADAR_ADMIN', 'admin@styleradar.co')
    const getSpy = vi.spyOn(apiClient, 'get')

    getSpy.mockResolvedValueOnce({
      data: {
        id: 701,
        subscriptionId: 88,
        subscriberId: 'store-9',
        planId: 3,
        planName: 'Store Basic',
        amount: { value: 89000, currency: 'COP' },
        status: 'APPROVED',
        externalPaymentId: 'MP-701',
        createdAt: '2026-11-22T15:00:00Z',
      },
    })
    const detail = await paymentService.getById('701')
    expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/payments/701')
    expect(detail).toMatchObject({ id: '701', suscriptorId: 'store-9', planName: 'Store Basic', amount: 89000 })

    getSpy.mockRejectedValueOnce(new ApiError(403, 'Sin permiso'))
    await expect(paymentService.list({ status: 'aprobado' })).rejects.toMatchObject({ status: 403 })
    expect(getSpy).toHaveBeenLastCalledWith('/api/v1/admin/payments', { params: { status: 'APPROVED' } })
  })

  it('planService, userPlanService y storeSubscriptionService usan los endpoints del contrato y propagan 401/422', async () => {
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
    await planService.createCheckout('plus', 'buyer@correo.co', 2)
    expect(postSpy).toHaveBeenCalledWith('/api/v1/subscriptions/start', {
      subscriberType: 'USER',
      payerEmail: 'buyer@correo.co',
      planId: 2,
    })

    getSpy.mockRejectedValueOnce(new ApiError(401, 'Tu sesión venció'))
    await expect(userPlanService.getMyPayments()).rejects.toMatchObject({ status: 401 })

    postSpy.mockRejectedValueOnce(new ApiError(422, 'No procesable'))
    await expect(storeSubscriptionService.retryPayment('89', 'tienda@correo.co')).rejects.toMatchObject({ status: 422 })
  })
})

describe('botones, /planes, admin CSV y retorno de Mercado Pago', () => {
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

  it('CancelSubscriptionButton: solo en ACTIVA+autoRenewal=true; sin botón de cancelar ni reactivar en Activa sin renovación', () => {
    const { rerender } = render(
      <CancelSubscriptionButton tipo="comprador" status="ACTIVA" renewalEnabled={true} fechaFin="2026-12-09" />,
    )
    expect(screen.getByRole('button', { name: 'Cancelar suscripción' })).toBeInTheDocument()

    rerender(
      <CancelSubscriptionButton tipo="comprador" status="ACTIVA" renewalEnabled={false} fechaFin="2026-12-09" />,
    )
    expect(screen.getByText('Activa sin renovación')).toBeInTheDocument()
    expect(screen.getByText(/Tu plan sigue activo hasta 2026-12-09/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancelar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reactivar/i })).not.toBeInTheDocument()

    rerender(
      <CancelSubscriptionButton tipo="comprador" status="SUSPENDIDA" renewalEnabled={false} fechaFin="2026-12-09" />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('PlansPage: «Cancelar suscripción» confirma con endDate, llama POST /cancel, refresca GET /subscriptions/{id} y muestra Activa sin renovación', async () => {
    setSession('usr-42', 'BUYER', 'buyer@correo.co')
    const user = userEvent.setup()
    const getSpy = vi.spyOn(apiClient, 'get')
    const postSpy = vi.spyOn(apiClient, 'post')

    getSpy.mockResolvedValue({
      data: {
        id: 10,
        subscriberId: 'usr-42',
        subscriberType: 'USER',
        plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
        status: 'ACTIVE',
        startDate: '2026-11-01',
        endDate: '2026-12-01',
        autoRenewal: true,
        access: true,
      },
    })
    postSpy.mockImplementationOnce(async () => {
      getSpy.mockResolvedValue({
        data: {
          id: 10,
          subscriberId: 'usr-42',
          subscriberType: 'USER',
          plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
          status: 'ACTIVE',
          startDate: '2026-11-01',
          endDate: '2026-12-01',
          autoRenewal: false,
          access: true,
        },
      })
      return {
        data: { subscriptionId: 10, autoRenewal: false, status: 'ACTIVE', endDate: '2026-12-01', cancellationConfirmed: true },
      }
    })

    render(
      withAuth(
        <MemoryRouter initialEntries={['/planes']}>
          <PlansPage />
        </MemoryRouter>,
        'BUYER',
      ),
    )

    const cancelarBtn = await screen.findByRole('button', { name: 'Cancelar suscripción' })
    const getCallsBeforeCancel = getSpy.mock.calls.length
    await user.click(cancelarBtn)

    const dialogo = await screen.findByRole('dialog', { name: '¿Cancelar Radar+?' })
    expect(dialogo).toHaveTextContent('Conservas los beneficios de Radar+ hasta el 1 de diciembre de 2026')
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar suscripción' }))

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/api/v1/subscriptions/usr-42/cancel', { confirmed: true })
    })
    await waitFor(() => {
      expect(getSpy.mock.calls.length).toBeGreaterThan(getCallsBeforeCancel)
    })
    expect(await screen.findByText('Activa sin renovación')).toBeInTheDocument()
    expect(screen.getByText(/No se renovará: ese día vuelves al plan Radar/)).toBeInTheDocument()
  })

  it('oculta botones de nueva suscripción en ACTIVE, ACTIVE sin renovación y PENDING; «Volver a suscribirme» solo en SUSPENDIDA/VENCIDA', async () => {
    setSession('usr-42', 'BUYER', 'buyer@correo.co')
    const getSpy = vi.spyOn(apiClient, 'get')

    // 1) PlansPage en PENDING: sin botón "Activar Radar+" ni "Volver a suscribirme"
    getSpy.mockResolvedValue({
      data: {
        id: 11,
        subscriberId: 'usr-42',
        subscriberType: 'USER',
        plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
        status: 'PENDING',
        autoRenewal: false,
        access: false,
      },
    })
    const { unmount: unmountPlansPending } = render(
      withAuth(
        <MemoryRouter initialEntries={['/planes']}>
          <PlansPage />
        </MemoryRouter>,
        'BUYER',
      ),
    )
    expect(await screen.findByText('Suscripción pendiente')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Activar Radar\+|Volver a suscribirme/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Pásate a Radar|Renovar a Radar/i })).not.toBeInTheDocument()
    unmountPlansPending()

    // 2) CheckoutPage en ACTIVE sin renovación: muestra estado en vez del formulario de pago
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/api/v1/plans') {
        return {
          data: [
            { id: 1, name: 'Radar', subscriberType: 'USER', price: { value: 0, currency: 'COP' }, active: true },
            { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' }, active: true },
          ],
        }
      }
      return {
        data: {
          id: 10,
          subscriberId: 'usr-42',
          subscriberType: 'USER',
          plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
          status: 'ACTIVE',
          endDate: '2026-12-09',
          autoRenewal: false,
          access: true,
        },
      }
    })
    const { unmount: unmountCheckoutActive } = render(
      withAuth(
        <MemoryRouter initialEntries={['/suscripcion']}>
          <CheckoutPage />
        </MemoryRouter>,
        'BUYER',
      ),
    )
    expect(await screen.findByText('Tu plan sigue activo hasta 9 de diciembre de 2026')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pagar con Mercado Pago/i })).not.toBeInTheDocument()
    unmountCheckoutActive()

    // 3) StoreActivateSubscriptionPage en PENDING: muestra estado en vez del formulario
    setSession('store-uuid-9', 'STORE_ADMIN', 'tienda@correo.co')
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/api/v1/payments/history') return { data: [] }
      return {
        data: {
          id: 77,
          subscriberId: 'store-uuid-9',
          subscriberType: 'STORE',
          plan: { id: 3, name: 'Store Basic', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' } },
          status: 'PENDING',
          autoRenewal: false,
          storeId: 'store-uuid-9',
        },
      }
    })
    const { unmount: unmountStoreActivate } = render(
      withAuth(
        <MemoryRouter initialEntries={['/tienda/suscripcion/activar']}>
          <StoreActivateSubscriptionPage />
        </MemoryRouter>,
        'STORE_ADMIN',
        'store-uuid-9',
        'tienda@correo.co',
      ),
    )
    expect(await screen.findByText('Ya tienes una suscripción activa o en proceso')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continuar a Mercado Pago/i })).not.toBeInTheDocument()
    unmountStoreActivate()

    // 4) StoreSubscriptionPage en PENDING: sin botón de nueva suscripción
    const { unmount: unmountStorePending } = render(
      withAuth(
        <MemoryRouter>
          <StoreSubscriptionPage />
        </MemoryRouter>,
        'STORE_ADMIN',
        'store-uuid-9',
        'tienda@correo.co',
      ),
    )
    expect(await screen.findByText('Pendiente')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pagar y activar|Volver a suscribirme/i })).not.toBeInTheDocument()
    unmountStorePending()
  })

  it('409 SUBSCRIPTION_ALREADY_EXISTS en POST /subscriptions/start muestra mensaje claro, refresca GET /subscriptions/{id} y no reintenta solo', async () => {
    setSession('usr-42', 'BUYER', 'buyer@correo.co')
    const user = userEvent.setup()
    const getSpy = vi.spyOn(apiClient, 'get')
    const postSpy = vi.spyOn(apiClient, 'post')

    let subState: 'SUSPENDED' | 'ACTIVE' = 'SUSPENDED'
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/api/v1/plans') {
        return {
          data: [
            { id: 1, name: 'Radar', subscriberType: 'USER', price: { value: 0, currency: 'COP' }, active: true },
            { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' }, active: true },
          ],
        }
      }
      return {
        data: {
          id: 10,
          subscriberId: 'usr-42',
          subscriberType: 'USER',
          plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
          status: subState,
          endDate: '2026-12-09',
          autoRenewal: subState === 'ACTIVE',
          access: subState === 'ACTIVE',
        },
      }
    })
    postSpy.mockImplementationOnce(async () => {
      subState = 'ACTIVE'
      throw new ApiError(409, 'Conflicto', 'SUBSCRIPTION_ALREADY_EXISTS')
    })

    render(
      withAuth(
        <MemoryRouter initialEntries={['/suscripcion']}>
          <CheckoutPage />
        </MemoryRouter>,
        'BUYER',
      ),
    )

    const payBtn = await screen.findByRole('button', { name: 'Pagar con Mercado Pago' })
    const subGetsBefore = getSpy.mock.calls.filter(([u]) => u === '/api/v1/subscriptions/usr-42').length
    await user.click(payBtn)

    expect(await screen.findByText('Ya tienes una suscripción activa o en proceso')).toBeInTheDocument()
    expect(postSpy).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      const subGetsAfter = getSpy.mock.calls.filter(([u]) => u === '/api/v1/subscriptions/usr-42').length
      expect(subGetsAfter).toBeGreaterThan(subGetsBefore)
    })
  })

  it('storeSubscriptionService.cancelRenewal consulta GET /subscriptions/{id} tras POST /cancel', async () => {
    setSession('store-uuid-9', 'STORE_ADMIN', 'tienda@correo.co')
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { subscriptionId: 77, autoRenewal: false, status: 'ACTIVE', endDate: '2026-12-09', cancellationConfirmed: true },
    })
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        id: 77,
        subscriberId: 'store-uuid-9',
        subscriberType: 'STORE',
        plan: { id: 3, name: 'Store Basic', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' } },
        status: 'ACTIVE',
        startDate: '2026-11-09',
        endDate: '2026-12-09',
        autoRenewal: false,
        storeId: 'store-uuid-9',
      },
    })

    const updated = await storeSubscriptionService.cancelRenewal()
    expect(postSpy).toHaveBeenCalledWith('/api/v1/subscriptions/store-uuid-9/cancel', { confirmed: true })
    expect(getSpy).toHaveBeenCalledWith('/api/v1/subscriptions/store-uuid-9')
    expect(updated.renewalEnabled).toBe(false)
    expect(updated.fechaFin).toBe('2026-12-09')
  })

  it('StoreSubscriptionPage: en VENCIDA/SUSPENDIDA muestra «Volver a pagar», pide el NIT y llama POST /subscriptions/start', async () => {
    setSession('store-uuid-9', 'STORE_ADMIN', 'tienda@correo.co')
    const user = userEvent.setup()
    const getSpy = vi.spyOn(apiClient, 'get')
    const postSpy = vi.spyOn(apiClient, 'post')

    getSpy.mockResolvedValueOnce({
      data: {
        id: 77,
        subscriberId: 'store-uuid-9',
        subscriberType: 'STORE',
        plan: { id: 3, name: 'Store Basic', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' } },
        status: 'SUSPENDED',
        startDate: '2026-09-01',
        endDate: '2026-10-01',
        autoRenewal: false,
        storeId: 'store-uuid-9',
      },
    })
    getSpy.mockResolvedValueOnce({ data: [] })
    postSpy.mockResolvedValueOnce({
      data: { subscriptionId: 78, orderId: 90, status: 'PENDING', initPoint: '' },
    })
    // Al enviar, la página busca el plan de tiendas y vuelve a consultar la suscripción
    getSpy.mockImplementation(async (url: string) =>
      url === '/api/v1/plans'
        ? { data: [{ id: 3, name: 'Tienda aliada', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' }, active: true }] }
        : { data: { id: 78, subscriberId: 'store-uuid-9', subscriberType: 'STORE', plan: { id: 3, name: 'Tienda aliada', subscriberType: 'STORE', price: { value: 89000, currency: 'COP' } }, status: 'PENDING', autoRenewal: false } },
    )

    render(
      withAuth(
        <MemoryRouter>
          <StoreSubscriptionPage />
        </MemoryRouter>,
        'STORE_ADMIN',
        'store-uuid-9',
        'tienda@correo.co',
      ),
    )

    await user.click(await screen.findByRole('button', { name: 'Volver a pagar' }))
    await user.type(screen.getByLabelText(/NIT de la tienda/), '900555777')
    await user.click(screen.getByRole('button', { name: 'Volver a pagar' }))

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/subscriptions/start',
        expect.objectContaining({ subscriberType: 'STORE', payerEmail: 'tienda@correo.co', taxId: '900555777' }),
      )
    })
  })

  it('AdminPaymentsPage exporta CSV del listado cargado y muestra planName', async () => {
    setSession('adm-1', 'STYLERADAR_ADMIN', 'admin@styleradar.co')
    const user = userEvent.setup()
    const getSpy = vi.spyOn(apiClient, 'get')
    const createUrl = vi.fn(() => 'blob:pagos-csv')
    const revokeUrl = vi.fn()
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    getSpy.mockResolvedValueOnce({
      data: [
        {
          id: 999,
          subscriptionId: 12,
          subscriberId: 'usr-99',
          planId: 2,
          planName: 'Radar+',
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

    expect(await screen.findByText('No reconocido (DISPUTED)')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Radar+')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    expect(createUrl).toHaveBeenCalledOnce()
    const blob = (createUrl.mock.calls[0] as unknown as [Blob])[0]
    expect(await blob.text()).toContain('"999";"12";"usr-99";"Radar+";"14900";"COP";"No reconocido (DISPUTED)"')
    expect(clickSpy).toHaveBeenCalledOnce()
    clickSpy.mockRestore()
  })

  it('CheckoutPage (/pago/resultado) maneja retorno de Mercado Pago con y sin parámetros sin activar localmente', async () => {
    setSession('usr-42', 'BUYER', 'buyer@correo.co')
    const getSpy = vi.spyOn(apiClient, 'get')

    // Con parámetros de Mercado Pago (status=approved), consulta GET /subscriptions/{id} y muestra PENDIENTE si el back aún no activa
    getSpy.mockResolvedValueOnce({
      data: {
        id: 10,
        subscriberId: 'usr-42',
        subscriberType: 'USER',
        plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
        status: 'PENDING',
        autoRenewal: false,
      },
    })

    const { unmount } = render(
      <MemoryRouter initialEntries={['/pago/resultado?status=approved&payment_id=MP-777&external_reference=ORD-777']}>
        <Routes>
          <Route path="/pago/resultado" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Pago pendiente')).toBeInTheDocument()
    expect(screen.getByText(/Mercado Pago informó el pago como aprobado/i)).toBeInTheDocument()
    expect(getSpy).toHaveBeenCalledWith('/api/v1/subscriptions/usr-42')
    unmount()

    // Sin parámetros en la URL: no se rompe y consulta GET /subscriptions/{id}
    getSpy.mockResolvedValueOnce({
      data: {
        id: 10,
        subscriberId: 'usr-42',
        subscriberType: 'USER',
        plan: { id: 2, name: 'Radar+', subscriberType: 'USER', price: { value: 14900, currency: 'COP' } },
        status: 'PENDING',
        autoRenewal: false,
      },
    })

    render(
      <MemoryRouter initialEntries={['/pago/resultado']}>
        <Routes>
          <Route path="/pago/resultado" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Pago pendiente')).toBeInTheDocument()
    expect(getSpy).toHaveBeenLastCalledWith('/api/v1/subscriptions/usr-42')
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
})
