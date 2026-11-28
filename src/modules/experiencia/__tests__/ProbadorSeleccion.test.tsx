import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt, loginAs } from './helpers'
import { QuickTryOnModal } from '@/components/modals/QuickTryOnModal'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { ItemCard } from '@/modules/catalogo/components/ItemCard'
import ItemDetailPage from '@/modules/catalogo/pages/ItemDetailPage'
import PlaylistsPage from '@/modules/catalogo/pages/PlaylistsPage'
import { ITEMS } from '@/modules/catalogo/mocks/items'
import { MOCK_PLAYLISTS } from '@/modules/catalogo/mocks/playlists'
import {
  evaluateGarmentFit,
  evaluatePlaylistOutfit,
  getLayerForGarment,
  getSlotForGarment,
  isGarmentFittable,
} from '../utils/lookEngine'
import {
  saveBodyMeasurements,
} from '../utils/bodyMeasurementsEngine'
import type { BodyMeasurements } from '../types/bodyMeasurements.dto'

function setupMeasurements(custom?: Partial<BodyMeasurements>, persist = true) {
  const data: BodyMeasurements = {
    cuerpoBase: 'femenino',
    unidades: 'metric',
    estatura: 175,
    peso: 65,
    tallaHabitual: 'M',
    pecho: 96,
    cintura: 80,
    cadera: 98,
    hombros: 44,
    largoBrazo: 62,
    largoTorso: 48,
    largoPierna: 102,
    esAproximado: false,
    consentimientoGuardado: true,
    esTemporal: !persist,
    fechaActualizacion: new Date().toISOString(),
    ...custom,
  }
  saveBodyMeasurements(data, persist)
  return data
}

function renderProbador(path = '/probador/arma-tu-look') {
  return renderAt(path, [
    {
      path: '/probador/arma-tu-look',
      element: (
        <AuthProvider>
          <QuickTryOnModal isOpen={true} onClose={vi.fn()} />
        </AuthProvider>
      ),
    },
    {
      path: '/probador',
      element: (
        <AuthProvider>
          <QuickTryOnModal isOpen={true} onClose={vi.fn()} />
        </AuthProvider>
      ),
    },
  ])
}

describe('Motor de ajuste y reglas de look (Requisito 7)', () => {
  const userMeasures = { superior: 'M', inferior: '30', calzado: '38' }

  it('clasifica prendas en los 5 espacios anatómicos correctamente', () => {
    const camisa = ITEMS.find((i) => i.id === 'p8')! // Suéter -> superior
    const pantalon = ITEMS.find((i) => i.id === 'p4')! // Jean -> inferior
    const blazer = ITEMS.find((i) => i.id === 'p1')! // Blazer -> abrigo
    const botas = ITEMS.find((i) => i.id === 'p7')! // Calzado -> calzado
    const cinturon = ITEMS.find((i) => i.id === 'p28')! // Accesorio -> accesorios

    expect(getSlotForGarment(camisa)).toBe('superior')
    expect(getSlotForGarment(pantalon)).toBe('inferior')
    expect(getSlotForGarment(blazer)).toBe('abrigo')
    expect(getSlotForGarment(botas)).toBe('calzado')
    expect(getSlotForGarment(cinturon)).toBe('accesorios')
  })

  it('asigna capas z-index visuales según tipo y regla de capas', () => {
    const camisa = ITEMS.find((i) => i.id === 'p8')!
    const blazer = ITEMS.find((i) => i.id === 'p1')!
    expect(getLayerForGarment(camisa, 'superior')).toBe('camisa')
    expect(getLayerForGarment(blazer, 'abrigo')).toBe('saco')
  })

  it('detecta prendas sin tabla de medidas como no disponibles en el probador', () => {
    const itemInvalido = ITEMS.find((i) => i.id === 'p31')! // Falda artesanal sin patronaje
    expect(isGarmentFittable(itemInvalido)).toBe(false)

    const itemValido = ITEMS.find((i) => i.id === 'p4')! // Jean con medidas
    expect(isGarmentFittable(itemValido)).toBe(true)
  })

  it('evalúa veredictos de ajuste: perfecto, holgado y demasiado pequeño', () => {
    const jean = ITEMS.find((i) => i.id === 'p4')! // Jean tallas 30, 32, 34
    // Talla igual a la del usuario (30)
    const fitPerfecto = evaluateGarmentFit(jean, '30', userMeasures)
    expect(fitPerfecto.apta).toBe(true)
    expect(fitPerfecto.veredicto).toBe('Ajuste perfecto')

    // Talla mayor (32)
    const fitHolgado = evaluateGarmentFit(jean, '32', userMeasures)
    expect(fitHolgado.apta).toBe(true)
    expect(fitHolgado.veredicto).toBe('Corte holgado')

    // Talla demasiado pequeña (26 cuando el usuario es 30)
    const fitPequeno = evaluateGarmentFit(jean, '26', userMeasures)
    expect(fitPequeno.apta).toBe(false)
    expect(fitPequeno.veredicto).toBe('Demasiado pequeña')
    expect(fitPequeno.tallaSugerida).toBe('30')
  })

  it('evalúa outfit de 5 prendas donde 1 es demasiado pequeña: pone 4 y sugiere talla para la faltante', () => {
    const pl = MOCK_PLAYLISTS.find((p) => p.id === 'pl-outfit-5')!
    const items = pl.prendas.map((p) => ({
      item: p,
      talla: p.tallaSeleccionada,
    }))

    const res = evaluatePlaylistOutfit(items, userMeasures)
    expect(res.puestas.length).toBe(4)
    expect(res.fallidas.length).toBe(1)
    expect(res.fallidas[0].item.nombre).toBe('Jean ancho azul')
    expect(res.fallidas[0].tallaSugerida).toBe('30')
    expect(res.resumen).toContain('4 de 5 prendas se pudieron probar')
  })

  it('evalúa playlist con prenda retirada sin romper la ejecución', () => {
    const itemRetirado = { ...ITEMS[0], id: 'retirada-1', nombre: 'Prenda descatalogada', retirada: true }
    const items = [
      { item: ITEMS[1], talla: '30' },
      { item: itemRetirado, talla: 'M' },
    ]

    const res = evaluatePlaylistOutfit(items, userMeasures)
    expect(res.puestas.length).toBe(1)
    expect(res.fallidas.length).toBe(1)
    expect(res.fallidas[0].motivo).toBe('Ya no está disponible')
  })
})

describe('Pruebas adicionales de selección 9B (Flujo UI y probador)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('enlace profundo desde el catálogo con sesión iniciada: el maniquí carga la prenda con la talla indicada', async () => {
    loginAs('u-1', 'Valentina Rojas')
    setupMeasurements()

    // Deep-link: prenda p4 (Jean ancho azul), talla 32, color Azul
    renderProbador('/probador/arma-tu-look?prenda=p4&talla=32&color=Azul')

    await waitFor(() => {
      // Debe aparecer en el panel izquierdo dentro de «Mi look»
      expect(screen.getByRole('heading', { name: /Mi look/i })).toBeInTheDocument()
      expect(screen.getByText('Jean ancho azul')).toBeInTheDocument()
      expect(screen.getByText('32')).toBeInTheDocument()
      expect(screen.getByText(/Color: Azul/i)).toBeInTheDocument()
    })
  })

  it('enlace profundo sin sesión: pide autenticación y carga la prenda al iniciar sesión', async () => {
    // Sin sesión
    renderProbador('/probador?prenda=p4&talla=32&color=Azul')

    await waitFor(() => {
      // Muestra modal de inicio de sesión
      expect(screen.getByRole('dialog', { name: /Inicia sesión/i })).toBeInTheDocument()
    })

    // Simular que el usuario inicia sesión disparando el evento de login exitoso
    window.dispatchEvent(new CustomEvent('sr:login-success', { detail: { id: 'u-1', name: 'Valentina' } }))

    // Prenda cargada intacta en el maniquí
    await waitFor(() => {
      expect(screen.getByText('Jean ancho azul')).toBeInTheDocument()
      expect(screen.getByText('32')).toBeInTheDocument()
    })
  })

  it('playlist de 5 prendas con una demasiado pequeña: se ponen 4, se explica por qué falta una y se puede cambiar su talla', async () => {
    loginAs('u-1', 'Valentina Rojas')
    setupMeasurements()

    // Deep-link con la playlist pl-outfit-5
    renderProbador('/probador/arma-tu-look?playlist=pl-outfit-5')

    await waitFor(() => {
      // Aviso resumen visible
      expect(screen.getAllByText(/4 de 5 prendas se pudieron probar/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/Jean ancho azul no se puede probar/i)[0]).toBeInTheDocument()

      // Botón para cambiar de talla a la sugerida
      const btnCambiarTalla = screen.getByRole('button', { name: /Cambiar a talla 30 y probar/i })
      expect(btnCambiarTalla).toBeInTheDocument()

      // Al hacer clic, se viste la 5ta prenda en la talla recomendada
      fireEvent.click(btnCambiarTalla)
    })

    await waitFor(() => {
      expect(screen.getByText('Jean ancho azul')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
    })
  })

  it('escoger una prenda para un espacio ocupado: reemplaza y permite deshacer', async () => {
    loginAs('u-1', 'Valentina Rojas')
    setupMeasurements()

    // Carga inicial con Jean ancho azul en espacio inferior
    renderProbador('/probador?prenda=p4&talla=30')

    await waitFor(() => {
      expect(screen.getByText('Jean ancho azul')).toBeInTheDocument()
    })

    // Abrir drawer de selección
    const btnEscoger = screen.getByRole('button', { name: /Escoger prenda/i })
    fireEvent.click(btnEscoger)

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Seleccionar prendas del catálogo/i })).toBeInTheDocument()
    })

    // Buscar Pantalón de pinzas (también inferior)
    const searchInput = screen.getByRole('searchbox', { name: /Buscar prenda en catálogo/i })
    await userEvent.type(searchInput, 'pinzas')

    await waitFor(() => {
      expect(screen.getByText('Pantalón de pinzas')).toBeInTheDocument()
    })

    // Oprimir botón para probar
    const btnProbarPinzas = screen.getByRole('button', { name: /Probar en el maniquí/i })
    fireEvent.click(btnProbarPinzas)

    // Confirmar en el modal de talla
    await waitFor(() => {
      const btnConfirmar = screen.getByRole('button', { name: /Confirmar y probar en el maniquí/i })
      fireEvent.click(btnConfirmar)
    })

    // Ahora el espacio inferior tiene "Pantalón de pinzas"
    await waitFor(() => {
      expect(screen.getByText('Pantalón de pinzas')).toBeInTheDocument()
      expect(screen.queryByText('Jean ancho azul')).not.toBeInTheDocument()
    })

    // Botón Deshacer debe estar activo
    const btnDeshacer = screen.getByRole('button', { name: /Deshacer/i })
    expect(btnDeshacer).not.toBeDisabled()

    // Oprimir Deshacer
    fireEvent.click(btnDeshacer)

    // Vuelve a estar el Jean ancho azul
    await waitFor(() => {
      expect(screen.getByText('Jean ancho azul')).toBeInTheDocument()
      expect(screen.queryByText('Pantalón de pinzas')).not.toBeInTheDocument()
    })
  })

  it('panel de selección: abrir, cerrar con Esc, filtros, búsqueda, estado vacío y prenda sin medidas', async () => {
    setupMeasurements()
    renderProbador()

    // Abrir panel lateral
    const btnEscoger = screen.getByRole('button', { name: /Escoger prenda/i })
    fireEvent.click(btnEscoger)

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Seleccionar prendas del catálogo/i })).toBeInTheDocument()
    })

    // Prenda sin tabla de medidas aparece marcada como "No disponible en el probador"
    expect(screen.getByText('Falda artesanal sin patronaje')).toBeInTheDocument()
    expect(screen.getByText('No disponible en el probador')).toBeInTheDocument()

    // Búsqueda que no arroja resultados muestra estado vacío
    const searchInput = screen.getByRole('searchbox', { name: /Buscar prenda en catálogo/i })
    await userEvent.type(searchInput, 'inmexistente-xyz-123')

    await waitFor(() => {
      expect(screen.getByText(/No encontramos prendas/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Limpiar filtros/i })).toBeInTheDocument()
    })

    // Limpiar filtros restaura catálogo
    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/i }))
    await waitFor(() => {
      expect(screen.getByText('Blazer oversize')).toBeInTheDocument()
    })

    // Cerrar panel con tecla Escape
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Seleccionar prendas del catálogo/i })).not.toBeInTheDocument()
    })
  })

  it('«Probar en el maniquí» funciona desde la tarjeta del catálogo (ItemCard)', () => {
    const item = ITEMS[0]
    renderAt('/catalogo', [{ path: '/catalogo', element: <ItemCard item={item} /> }])
    const btnCardProbar = screen.getByRole('link', { name: new RegExp(`Probar ${item.nombre} en el maniquí`, 'i') })
    expect(btnCardProbar).toHaveAttribute('href', expect.stringContaining('/probador/arma-tu-look?prenda=p1'))
  })

  it('«Probar en el maniquí» y «Ver tienda» funcionan desde el detalle de prenda (ItemDetailPage)', async () => {
    renderAt('/catalogo/p1', [
      { path: '/catalogo/:id', element: <ItemDetailPage /> },
      { path: '/probador', element: <div>Pantalla Probador</div> },
    ])
    await waitFor(() => {
      const btnDetalleProbar = screen.getByRole('link', { name: /Probar en el maniquí/i })
      expect(btnDetalleProbar).toHaveAttribute('href', expect.stringContaining('/probador?prenda=p1'))
      const btnVerTienda = screen.getByRole('link', { name: /Ver tienda/i })
      expect(btnVerTienda).toBeInTheDocument()
    })
  })

  it('«Probar outfit completo» funciona desde el detalle de la playlist (PlaylistsPage)', async () => {
    renderAt('/playlists/pl-outfit-5', [
      { path: '/playlists/:id', element: <PlaylistsPage /> },
      { path: '/probador', element: <div>Pantalla Probador</div> },
    ])
    await waitFor(() => {
      const btnOutfitCompleto = screen.getByRole('link', { name: /Probar outfit completo/i })
      expect(btnOutfitCompleto).toHaveAttribute('href', expect.stringContaining('/probador?playlist=pl-outfit-5'))
    })
  })
})

describe('Comportamiento limpio del probador (las medidas ya no interrumpen en el probador)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('no muestra modal emergente de medidas al entrar a /probador (se piden en registro y perfil)', async () => {
    loginAs('u-1', 'Valentina Rojas')
    renderProbador('/probador')

    // El probador no interrumpe con ningún asistente emergente
    expect(screen.queryByRole('heading', { name: /Elige tu silueta base y unidades/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mi look/i })).toBeInTheDocument()
  })

  it('«Escoger prenda» abre directamente el catálogo sin interceptar con medidas', async () => {
    loginAs('u-1', 'Valentina Rojas')
    renderProbador('/probador')

    const btnEscoger = screen.getByRole('button', { name: /Escoger prenda/i })
    fireEvent.click(btnEscoger)

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Seleccionar prendas del catálogo/i })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Elige tu silueta base y unidades/i })).not.toBeInTheDocument()
    })
  })

  it('la tarjeta de medidas ya no aparece en el panel izquierdo del probador', async () => {
    loginAs('u-1', 'Valentina Rojas')
    renderProbador('/probador')

    expect(screen.queryByRole('region', { name: /Mis medidas corporales/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Completa tus medidas para probar ropa realista/i)).not.toBeInTheDocument()
  })

  it('el maniquí adapta su silueta y escala en altura (scaleY) según las medidas guardadas en el perfil', async () => {
    // 1. Maniquí masculino bajo (140 cm -> scaleY 0.8)
    setupMeasurements({ estatura: 140, cuerpoBase: 'masculino' })
    loginAs('u-1', 'Valentina Rojas')
    const { unmount } = renderProbador('/probador')

    await waitFor(() => {
      const baseImg = screen.getByTestId('mannequin-base-img')
      expect(baseImg).toHaveAttribute('src', expect.stringContaining('maniqui.png'))
      expect(baseImg).not.toHaveAttribute('src', expect.stringContaining('maniqui-f.png'))

      const wrapper = screen.getByTestId('mannequin-wrapper')
      expect(wrapper.style.transform).toContain('scaleY(0.8)')
    })

    unmount()

    // 2. Maniquí femenino alto (210 cm -> scaleY 1.2)
    setupMeasurements({ estatura: 210, cuerpoBase: 'femenino' })
    renderProbador('/probador')

    await waitFor(() => {
      const baseImg = screen.getByTestId('mannequin-base-img')
      expect(baseImg).toHaveAttribute('src', expect.stringContaining('maniqui-f.png'))

      const wrapper = screen.getByTestId('mannequin-wrapper')
      expect(wrapper.style.transform).toContain('scaleY(1.2)')
    })
  })

  it('muestra la regla de altura de 1,40 m a 2,00 m con la marca de la estatura de la persona alineada al maniquí', async () => {
    setupMeasurements()
    renderProbador('/probador')

    await waitFor(() => {
      expect(screen.getByText('2,00 m')).toBeInTheDocument()
      expect(screen.getByText('1,90 m')).toBeInTheDocument()
      expect(screen.getByText('1,60 m')).toBeInTheDocument()
      expect(screen.getByText('1,50 m')).toBeInTheDocument()
      expect(screen.getAllByText('1,40 m').length).toBeGreaterThan(0)
      expect(screen.getByText(/^Tú · \d,\d\d m$/)).toBeInTheDocument()
    })
  })

  it('el maniquí adapta el ancho y muestra la contextura morfológica (scaleX) según las medidas corporales masculinas y femeninas', async () => {
    // 1. Maniquí masculino Muy Delgado (160 cm, 50 kg)
    setupMeasurements({
      cuerpoBase: 'masculino',
      estatura: 160,
      peso: 50,
      tallaHabitual: 'XS',
      pecho: 80,
      cintura: 66,
      cadera: 82,
    })
    loginAs('u-1', 'Valentina Rojas')
    const { unmount } = renderProbador('/probador')

    await waitFor(() => {
      const wrapper = screen.getByTestId('mannequin-wrapper')
      expect(wrapper.style.transform).toContain('scaleY(0.91)')
      // scaleX debe reflejar contextura delgada (< 0.90)
      expect(wrapper.style.transform).toMatch(/scaleX\(0\.[78]\d*\)/)
      expect(screen.getByText(/Muy Delgado/i)).toBeInTheDocument()
    })

    unmount()

    // 2. Maniquí femenino Obesa Grande (165 cm, 120 kg)
    setupMeasurements({
      cuerpoBase: 'femenino',
      estatura: 165,
      peso: 120,
      tallaHabitual: 'XXL',
      pecho: 128,
      cintura: 120,
      cadera: 130,
    })
    renderProbador('/probador')

    await waitFor(() => {
      const wrapper = screen.getByTestId('mannequin-wrapper')
      // scaleX debe reflejar contextura ancha (> 1.35)
      expect(wrapper.style.transform).toMatch(/scaleX\(1\.[345]\d*\)/)
      expect(screen.getByText(/Obesa Grande/i)).toBeInTheDocument()
    })
  })

  it('muestra a la vez la vista frontal y la trasera, sin botones para cambiar de vista', async () => {
    setupMeasurements({ cuerpoBase: 'femenino', estatura: 165 })
    loginAs('u-1', 'Valentina Rojas')
    renderProbador('/probador')

    expect(await screen.findByTestId('mannequin-base-img')).toHaveAttribute('src', expect.stringContaining('maniqui-f.png'))
    expect(screen.getByText('Vista Frontal')).toBeInTheDocument()
    expect(screen.getByText('Vista Trasera')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Vista (lateral|de frente|posterior)/i })).not.toBeInTheDocument()
  })
})
