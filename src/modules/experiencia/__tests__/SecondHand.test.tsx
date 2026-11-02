import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import PublishListingPage from '../pages/PublishListingPage'
import SecondHandPage from '../pages/SecondHandPage'
import { resetSecondHandMock } from '../services/secondHandService'
import { loginAs, png, renderAt } from './helpers'

const routes = [
  { path: '/segunda-mano', element: <SecondHandPage /> },
  { path: '/segunda-mano/publicar', element: <PublishListingPage /> },
  { path: '/segunda-mano/:id/editar', element: <PublishListingPage /> },
]

beforeEach(() => { resetSecondHandMock(); loginAs('u-1', 'Valentina Rojas') })

describe('asistente de publicación C2C (RF-33 a RF-35)', () => {
  it('se completa en 3 pantallas, valida cada paso y no pierde datos al volver', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/segunda-mano/publicar', routes)
    expect(screen.getByRole('list', { name: 'Paso 1 de 3' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Agrega al menos una foto de la prenda.')).toBeInTheDocument()
    expect(screen.getByText('Elige en qué estado está la prenda.')).toBeInTheDocument()

    await user.upload(screen.getByTestId('lfotos-input'), [png('1.png'), png('2.png'), png('3.png'), png('4.png'), png('5.png')])
    expect(screen.getByText('Máximo 4 fotos por prenda.')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /Foto \d/ })).toHaveLength(4)
    expect(screen.queryByRole('button', { name: '+ Agregar foto' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Muy bueno' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('list', { name: 'Paso 2 de 3' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre de la prenda'), 'Chaqueta de jean')
    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getAllByRole('img', { name: /Foto \d/ })).toHaveLength(4)
    expect(screen.getByRole('radio', { name: 'Muy bueno' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByLabelText('Nombre de la prenda')).toHaveValue('Chaqueta de jean')

    await user.selectOptions(screen.getByLabelText('Categoría'), 'Chaquetas')
    await user.selectOptions(screen.getByLabelText('Talla'), 'M')
    await user.click(screen.getByLabelText('No tiene marca o no la sé'))
    await user.type(screen.getByLabelText('Descripción'), 'Azul medio, sin rotos, la usé dos veces.')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('list', { name: 'Paso 3 de 3' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Precio en pesos colombianos (COP)'), '-5')
    await user.click(screen.getByRole('button', { name: 'Publicar' }))
    expect(screen.getByText('Escribe solo números, sin decimales.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Precio en pesos colombianos (COP)'))
    await user.type(screen.getByLabelText('Precio en pesos colombianos (COP)'), '75000')
    expect(within(screen.getByLabelText('Resumen de la publicación')).getByText(/75\.000/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Publicar' }))
    expect(await screen.findByText('¡Tu prenda ya está en Segunda vida!', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('si el API falla, muestra el error y conserva los datos', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/segunda-mano/publicar', routes)
    await user.upload(screen.getByTestId('lfotos-input'), png())
    await user.click(screen.getByRole('radio', { name: 'Bueno' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.type(screen.getByLabelText('Nombre de la prenda'), 'Camisa blanca')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Camisas')
    await user.selectOptions(screen.getByLabelText('Talla'), 'S')
    await user.type(screen.getByLabelText('Marca'), 'Arturo Calle')
    await user.type(screen.getByLabelText('Descripción'), 'Manga larga, cuello en buen estado.')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.type(screen.getByLabelText('Precio en pesos colombianos (COP)'), '40000')
    sessionStorage.setItem('sr_mock', 'sin-red')
    await user.click(screen.getByRole('button', { name: 'Publicar' }))
    expect(await screen.findByText(/No pudimos publicar tu prenda/)).toBeInTheDocument()
    expect(screen.getByLabelText('Precio en pesos colombianos (COP)')).toHaveValue('40000')
  })
})

describe('explorar segunda mano (RF-36)', () => {
  it('solo muestra disponibles y filtra por estado, talla y precio', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/segunda-mano', routes)
    const res = await screen.findByRole('list', { name: 'Resultados' }, { timeout: 3000 })
    expect(within(res).queryByText('Chaqueta de cuero negra')).not.toBeInTheDocument()
    expect(within(res).queryByText('Hoodie azul')).not.toBeInTheDocument()
    expect(within(res).getAllByRole('listitem')).toHaveLength(4)

    await user.click(screen.getByRole('button', { name: 'Como nuevo' }))
    expect(await screen.findByText('1 prenda disponible', {}, { timeout: 3000 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Como nuevo' }))
    await user.type(screen.getByLabelText('Precio mínimo'), '100000')
    await user.type(screen.getByLabelText('Precio máximo'), '50000')
    expect(screen.getByText('El precio mínimo no puede ser mayor que el máximo.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Precio máximo'))
    await user.selectOptions(screen.getByLabelText('Talla'), 'XL')
    expect(await screen.findByText('No hay prendas con esos filtros', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('si el API está caída muestra el error con opción de reintentar', async () => {
    sessionStorage.setItem('sr_mock', 'sin-red')
    renderAt('/segunda-mano', routes)
    expect(await screen.findByText('No pudimos cargar Segunda vida', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('gestionar publicaciones propias (RF-37 a RF-39)', () => {
  it('las vendidas no tienen acciones y las disponibles se pueden vender o retirar', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/segunda-mano?vista=mias', routes)
    const list = await screen.findByRole('list', { name: 'Mis publicaciones' }, { timeout: 3000 })
    expect(within(list).queryByRole('button', { name: /Chaqueta de cuero negra/ })).not.toBeInTheDocument()
    expect(within(list).getByText('Vendida: ya no se puede cambiar.')).toBeInTheDocument()

    await user.click(within(list).getByRole('button', { name: 'Marcar Jean recto azul claro como vendida' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Marcar vendida' }))
    expect(await screen.findByText('«Jean recto azul claro» quedó como vendida.')).toBeInTheDocument()
    expect(within(list).queryByRole('button', { name: /Jean recto azul claro/ })).not.toBeInTheDocument()
  })

  it('un 409 se explica y la lista se actualiza', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/segunda-mano?vista=mias', routes)
    const list = await screen.findByRole('list', { name: 'Mis publicaciones' }, { timeout: 3000 })
    sessionStorage.setItem('sr_mock', 'conflicto')
    await user.click(within(list).getByRole('button', { name: 'Retirar Jean recto azul claro' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirar' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('no deja editar una publicación vendida', async () => {
    renderAt('/segunda-mano/l2/editar', routes)
    expect(await screen.findByText(/está vendida y ya no se puede editar/, {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
