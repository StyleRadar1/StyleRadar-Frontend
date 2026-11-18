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
    localStorage.setItem('sr_user_measurements', JSON.stringify({ superior: 'M', inferior: '30', calzado: '38' }))

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

  it('enlace profundo sin sesión ni medidas: pide autenticación/asistente y carga la prenda al completarlo', async () => {
    // Sin sesión ni medidas
    renderProbador('/probador?prenda=p4&talla=32&color=Azul')

    await waitFor(() => {
      // Muestra modal de inicio de sesión o asistente
      expect(screen.getByRole('dialog', { name: /Inicia sesión/i })).toBeInTheDocument()
    })

    // Simular que el usuario inicia sesión disparando el evento de login exitoso
    window.dispatchEvent(new CustomEvent('sr:login-success', { detail: { id: 'u-1', name: 'Valentina' } }))

    // Debe abrir el asistente de medidas si aún no las tiene
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Configura tus medidas/i })).toBeInTheDocument()
    })

    // Guardar medidas en el asistente
    const btnGuardar = screen.getByRole('button', { name: /Guardar medidas y probar/i })
    fireEvent.click(btnGuardar)

    // Prenda cargada intacta sin perderse
    await waitFor(() => {
      expect(screen.getByText('Jean ancho azul')).toBeInTheDocument()
      expect(screen.getByText('32')).toBeInTheDocument()
    })
  })

  it('playlist de 5 prendas con una demasiado pequeña: se ponen 4, se explica por qué falta una y se puede cambiar su talla', async () => {
    loginAs('u-1', 'Valentina Rojas')
    localStorage.setItem('sr_user_measurements', JSON.stringify({ superior: 'M', inferior: '30', calzado: '38' }))

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
    localStorage.setItem('sr_user_measurements', JSON.stringify({ superior: 'M', inferior: '30', calzado: '38' }))

    // Carga inicial con Jean ancho azul en espacio inferior
    renderProbador('/probador?prenda=p4&talla=30')

    await waitFor(() => {
      expect(screen.getByText('Jean ancho azul')).toBeInTheDocument()
    })

    // Abrir drawer de selección
    const btnEscoger = screen.getByRole('button', { name: /Escoger prenda para probar/i })
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
    renderProbador()

    // Abrir panel lateral
    const btnEscoger = screen.getByRole('button', { name: /Escoger prenda para probar/i })
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
