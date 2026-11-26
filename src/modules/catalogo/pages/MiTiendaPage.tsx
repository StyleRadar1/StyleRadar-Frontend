import { useCallback, useContext, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StoreSuspendedBanner } from '@/modules/transacciones/components/StoreSuspendedBanner'
import { storeSubscriptionService } from '@/modules/transacciones/services/storeSubscriptionService'
import { hasScenario } from '@/modules/core/api/mockScenario'
import { ErrorCard } from '@/modules/core/components/ErrorScene'
import { ErrorBanner, FieldError } from '@/modules/core/components/ErrorFeedback'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { env } from '@/configs/env'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { inventoryService } from '../services/inventoryService'
import { erroresDeConfiguracion, storeSettingsService } from '../services/storeSettingsService'
import { errorDeFoto, ordenadas, storePhotoService, TEXTOS_FOTOS } from '../services/storePhotoService'
import {
  ALLOWED_STORE_PHOTO_TYPES, LOW_STOCK_DEFAULT, LOW_STOCK_MAX, LOW_STOCK_MIN, MAX_STORE_PHOTOS, NEW_ARRIVAL_DEFAULT,
  NEW_ARRIVAL_OPTIONS, type StorePhotoDto, type StoreResponseDto,
} from '../types/store.dto'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import './MiTiendaPage.css'
import './MiTiendaDashboard.css'
import '@/styles/tienda-glass.css'

type StoreItem = {
  id: string
  name: string
  category: string
  color: string
  brand: string
  style: string
  price: number
  stock: number
  stockBySize: Record<string, number>
  sizes: string
  image: string
  status: 'Publicadas' | 'En revisión' | 'Agotadas' | 'Retiradas'
  flag?: 'Últimas unidades' | 'Nueva llegada'
  collection?: string
}

type StoreCollection = {
  id: string
  title: string
  description: string
  visibility: 'Pública' | 'Borrador'
  items: number
  likes: number
  image: string
}

type LegalStoreInfo = {
  legalName: string
  nit: string
  representative: string
  phone: string
  email: string
  payoutAccount: string
  address: string
  hours: string
}

const INITIAL_LEGAL_INFO: LegalStoreInfo = {
  legalName: 'Luna Store',
  nit: '901.482.337-1',
  representative: 'Daniela Luna',
  phone: '+57 601 555 0123',
  email: 'luna@styleradar.co',
  payoutAccount: 'Bancolombia ••• 4410',
  address: 'Cra. 13 #57-22, Chapinero',
  hours: 'Lun a sáb · 10:00 a 20:00',
}

const STORAGE_LEGAL_KEY = 'styleradar-store-legal-info'
const COLLECTIONS_STORAGE_KEY = 'styleradar-store-collections'

const DEFAULT_COLLECTIONS: StoreCollection[] = [
  { id: 'running-city', title: 'Running de ciudad', description: 'Lo esencial para correr Bogotá.', visibility: 'Pública', items: 4, likes: 188, image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg' },
]

function readCollections(): StoreCollection[] {
  if (!env.useMocks) return []
  try {
    const saved = localStorage.getItem(COLLECTIONS_STORAGE_KEY)
    return saved ? JSON.parse(saved) as StoreCollection[] : DEFAULT_COLLECTIONS
  } catch {
    return DEFAULT_COLLECTIONS
  }
}

/** F-19: lo que trae ms-tiendas del almacén de la Tienda; lo que no trae se queda como estaba. */
function legalDesdeServidor(store: StoreResponseDto): Partial<LegalStoreInfo> {
  return {
    nit: store.nit,
    ...(store.tradeName ? { legalName: store.tradeName } : {}),
    ...(store.phone ? { phone: store.phone } : {}),
    ...(store.contactEmail ? { email: store.contactEmail } : {}),
  }
}

/** Texto cuando no se pudo leer el almacén de la Tienda (GET /users/{userId}/store). */
const SIN_ALMACEN = 'Tu cuenta todavía no tiene un almacén asociado. Regístralo para empezar a vender.'

function readLegalInfo(fallbackName = '', fallbackEmail = ''): LegalStoreInfo {
  if (!env.useMocks) {
    return {
      legalName: fallbackName,
      nit: '',
      representative: fallbackName,
      phone: '',
      email: fallbackEmail,
      payoutAccount: '',
      address: '',
      hours: '',
    }
  }
  try {
    const saved = localStorage.getItem(STORAGE_LEGAL_KEY)
    return saved ? { ...INITIAL_LEGAL_INFO, ...JSON.parse(saved) as Partial<LegalStoreInfo> } : INITIAL_LEGAL_INFO
  } catch {
    return INITIAL_LEGAL_INFO
  }
}

const ITEMS: StoreItem[] = [
  { id: 'gorra-ny', name: 'Gorra NY lavada', category: 'Accesorio', color: 'Azul', brand: 'Luna Store', style: 'Urbano', price: 79000, stock: 6, stockBySize: { Única: 6 }, sizes: 'Única', image: '/prototipo/assets/img/productos/r1c2-gorra-ny.jpg', status: 'Publicadas' },
  { id: 'chaqueta-track', name: 'Chaqueta track negra', category: 'Chaqueta', color: 'Negro', brand: 'Luna Store', style: 'Urbano', price: 229000, stock: 3, stockBySize: { S: 1, M: 1, L: 1, XL: 0 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/r1c3-chaqueta-track.jpg', status: 'Publicadas', flag: 'Últimas unidades' },
  { id: 'pantalon-track', name: 'Pantalón track tres rayas', category: 'Pantalón', color: 'Negro', brand: 'Luna Store', style: 'Urbano', price: 189000, stock: 6, stockBySize: { '28': 2, '30': 2, '32': 1, '34': 1 }, sizes: '28 30 32 34', image: '/prototipo/assets/img/productos/r1c3-pantalon-track.jpg', status: 'Publicadas' },
  { id: 'tenis-running', name: 'Tenis running plata', category: 'Calzado', color: 'Plata', brand: 'Luna Store', style: 'Deportivo', price: 349000, stock: 6, stockBySize: { '37': 1, '38': 1, '39': 1, '40': 1, '41': 1, '42': 1 }, sizes: '37 38 39 40 41 42', image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg', status: 'Publicadas', flag: 'Nueva llegada' },
  { id: 'gorra-sport', name: 'Gorra deportiva negra', category: 'Accesorio', color: 'Negro', brand: 'Luna Store', style: 'Deportivo', price: 69000, stock: 6, stockBySize: { Única: 6 }, sizes: 'Única', image: '/prototipo/assets/img/productos/r1c3-gorra-negra.jpg', status: 'Publicadas' },
  { id: 'rinonera-sport', name: 'Riñonera deportiva', category: 'Accesorio', color: 'Negro', brand: 'Luna Store', style: 'Deportivo', price: 99000, stock: 6, stockBySize: { Única: 6 }, sizes: 'Única', image: '/prototipo/assets/img/productos/r1c3-rinonera.jpg', status: 'Publicadas' },
  { id: 'audifonos-over-ear', name: 'Audífonos over-ear', category: 'Accesorio', color: 'Negro', brand: 'Luna Store', style: 'Deportivo', price: 380000, stock: 2, stockBySize: { Única: 2 }, sizes: 'Única', image: '/prototipo/assets/img/productos/r1c3-audifonos.jpg', status: 'Publicadas', flag: 'Últimas unidades' },
  { id: 'botella-termica', name: 'Botella térmica 1 L', category: 'Accesorio', color: 'Negro', brand: 'Luna Store', style: 'Deportivo', price: 89000, stock: 0, stockBySize: { Única: 0 }, sizes: 'Única', image: '/prototipo/assets/img/productos/r1c3-botella.jpg', status: 'Agotadas' },
  { id: 'hoodie-gris', name: 'Hoodie gris jaspeado', category: 'Buzo', color: 'Gris', brand: 'Luna Store', style: 'Urbano', price: 139000, stock: 6, stockBySize: { S: 1, M: 2, L: 2, XL: 1 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/hoodie-gris-jaspeado.jpg', status: 'Publicadas' },
  { id: 'conjunto-tecnico', name: 'Conjunto técnico negro', category: 'Conjunto', color: 'Negro', brand: 'Luna Store', style: 'Deportivo', price: 389000, stock: 6, stockBySize: { S: 1, M: 2, L: 2, XL: 1 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/conjunto-tecnico-negro.jpg', status: 'Publicadas', flag: 'Nueva llegada' },
  { id: 'tenis-trail', name: 'Tenis de trail', category: 'Calzado', color: 'Blanco', brand: 'Luna Store', style: 'Deportivo', price: 319000, stock: 6, stockBySize: { '37': 1, '38': 1, '39': 1, '40': 1, '41': 1, '42': 1 }, sizes: '37 38 39 40 41 42', image: '/prototipo/assets/img/productos/urbana-trail.jpg', status: 'Publicadas' },
  { id: 'gorra-ny-azul', name: 'Gorra NY azul', category: 'Accesorio', color: 'Azul', brand: 'Luna Store', style: 'Urbano', price: 79000, stock: 6, stockBySize: { Única: 6 }, sizes: 'Única', image: '/prototipo/assets/img/productos/luna-gorra-azul.jpg', status: 'Publicadas' },
  { id: 'hoodie-azul', name: 'Hoodie azul noche', category: 'Buzo', color: 'Azul', brand: 'Luna Store', style: 'Urbano', price: 169000, stock: 6, stockBySize: { S: 1, M: 2, L: 2, XL: 1 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/hoodie-azul-noche.jpg', status: 'Publicadas' },
]

const HERO_PHOTO = '/img/sesion/rol-tienda.jpg'

const WEEK_VISITS = [
  { label: '4 nov', visits: 38 }, { label: '5 nov', visits: 45 }, { label: '6 nov', visits: 62 },
  { label: '7 nov', visits: 75 }, { label: '8 nov', visits: 59 }, { label: '9 nov', visits: 64 },
  { label: '10 nov', visits: 51 },
]
const WEEKLY_VISITS = 445
const WEEKLY_GOAL = 500

export default function MiTiendaPage() {
  const user = useContext(AuthContext)?.user ?? null
  const [searchParams] = useSearchParams()
  const [notice, setNotice] = useState('')
  const [items, setItems] = useState<StoreItem[]>(() => (env.useMocks ? ITEMS : []))

  /* Información de la tienda */
  const [legalInfo, setLegalInfo] = useState<LegalStoreInfo>(() => readLegalInfo(user?.name ?? '', user?.email ?? ''))
  const [editingInfo, setEditingInfo] = useState(false)
  const [legalDraft, setLegalDraft] = useState<LegalStoreInfo>(() => readLegalInfo(user?.name ?? '', user?.email ?? ''))

  /* F-19: el NIT del almacén sale de ms-tiendas (GET /api/v1/users/{userId}/store). Con datos de prueba se usa el guardado. */
  const [storeError, setStoreError] = useState('')
  const [storeNit, setStoreNit] = useState(() => (env.useMocks ? INITIAL_LEGAL_INFO.nit : ''))
  const [subStatusLabel, setSubStatusLabel] = useState(() => (env.useMocks ? 'Suscripción activa' : 'Consultando suscripción…'))
  const [rejectedSubAlert, setRejectedSubAlert] = useState(false)
  const userId = user?.id ? String(user.id) : ''
  useEffect(() => {
    if (env.useMocks || !userId) return
    let active = true
    storeSettingsService.getMyStore(userId)
      .then((store) => {
        if (!active) return
        const desdeServidor = legalDesdeServidor(store)
        setLegalInfo((li) => ({ ...li, ...desdeServidor }))
        setLegalDraft((li) => ({ ...li, ...desdeServidor }))
        setStoreNit(store.nit)
        if (store.verificationStatus === 'APPROVED') setVerificationStatus('VERIFICADA')
        else if (store.verificationStatus === 'PENDING') setVerificationStatus('EN_REVISION')
        else setVerificationStatus('SIN_VERIFICAR')
        if (store.nit) {
          inventoryService.getStoreInventory(store.nit).then((invList) => {
            if (!active) return
            setItems(invList.map((it) => ({
              id: it.id,
              name: it.nombre,
              category: it.categoria,
              color: it.color || '',
              brand: it.marca || store.tradeName || '',
              style: it.estilo,
              price: it.precio,
              stock: it.stockTotal,
              stockBySize: it.stockPorTalla,
              sizes: it.tallasDisponibles.join(' '),
              image: it.imagenUrl,
              status: it.estado === 'RETIRADO' ? 'Retiradas' : it.estado === 'AGOTADA' ? 'Agotadas' : it.estadoPublicacion === 'PENDIENTE' ? 'En revisión' : 'Publicadas',
            })))
          }).catch(() => {})
        }
      })
      .catch((e) => {
        if (active) setStoreError(errorKind(e) === 'no-existe' ? SIN_ALMACEN : errorMessage(e, 'No pudimos cargar los datos de tu almacén.'))
      })
    storeSubscriptionService.get()
      .then((res) => {
        if (!active) return
        if (res.sinSuscripcion) {
          setSubStatusLabel('Sin suscripción')
        } else if (res.subscription.status === 'ACTIVA') {
          setSubStatusLabel('Suscripción activa')
        } else {
          setSubStatusLabel(`Suscripción ${res.subscription.status.toLowerCase()}`)
        }
        const lastPay = res.payments[0]
        setRejectedSubAlert(Boolean(lastPay?.status === 'rechazado' && res.subscription.status !== 'ACTIVA'))
      })
      .catch(() => {
        if (active) setSubStatusLabel('Suscripción')
      })
    return () => { active = false }
  }, [userId])

  /* Fotos de la tienda */
  /* SR-RF-74 · F-20: la galería vive en ms-tiendas (máximo 6; la primera es la portada). */
  const [storeGallery, setStoreGallery] = useState<StorePhotoDto[]>([])
  const [photoError, setPhotoError] = useState('')
  const [photosBusy, setPhotosBusy] = useState(false)
  /* Hasta tener la galería real no se sube nada: así el conteo de 6 y el orden salen del servidor. */
  const [photosReady, setPhotosReady] = useState(false)
  const [photoToRemove, setPhotoToRemove] = useState<StorePhotoDto | null>(null)
  const cerrarQuitarFoto = useCallback(() => setPhotoToRemove(null), [])

  /* Colecciones */
  const [collections, setCollections] = useState<StoreCollection[]>(readCollections)
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [collectionTitle, setCollectionTitle] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [collectionVisibility, setCollectionVisibility] = useState<'Pública' | 'Borrador'>('Pública')
  const [collectionError, setCollectionError] = useState('')

  /* Verificación y distintivos */
  const [verificationStatus, setVerificationStatus] = useState<'SIN_VERIFICAR' | 'EN_REVISION' | 'VERIFICADA'>('SIN_VERIFICAR')
  const [verificationError, setVerificationError] = useState('')
  const [badgesDialogOpen, setBadgesDialogOpen] = useState(false)
  const [lastUnitsLimit, setLastUnitsLimit] = useState(LOW_STOCK_DEFAULT)
  /** Si la tienda ya guardó, una lectura inicial que llegue tarde no debe pisar lo guardado. */
  const badgesSaved = useRef(false)
  const [newArrivalDays, setNewArrivalDays] = useState(NEW_ARRIVAL_DEFAULT)
  const [lastUnitsDraft, setLastUnitsDraft] = useState(String(LOW_STOCK_DEFAULT))
  const [newArrivalDaysDraft, setNewArrivalDaysDraft] = useState(String(NEW_ARRIVAL_DEFAULT))
  const [badgesErrors, setBadgesErrors] = useState<Record<string, string>>({})
  const [badgesError, setBadgesError] = useState('')
  const [badgesBusy, setBadgesBusy] = useState(false)

  /* SR-RF-59 · SR-RF-60: las reglas de distintivos se leen de ms-tiendas con el NIT del almacén. */
  useEffect(() => {
    if (!storeNit) return
    let active = true
    storeSettingsService.getCatalogSettings(storeNit)
      .then((c) => {
        if (!active || badgesSaved.current) return
        setLastUnitsLimit(c.lowStockThreshold)
        setNewArrivalDays(c.newArrivalDays)
      })
      .catch(() => { /* se quedan los valores por defecto; al guardar se muestra el error */ })
    return () => { active = false }
  }, [storeNit])

  useEffect(() => {
    if (!storeNit) return
    let active = true
    storePhotoService.list(storeNit)
      .then((fotos) => { if (active) { setStoreGallery(fotos); setPhotosReady(true) } })
      .catch((e) => { if (active) setPhotoError(errorKind(e) === 'no-existe' ? SIN_ALMACEN : errorMessage(e, 'No pudimos cargar las fotos de tu tienda.')) })
    return () => { active = false }
  }, [storeNit])

  /* Resumen del panel */
  const activeCount = items.filter((item) => item.status === 'Publicadas' && item.stock > 0).length
  const lowStockCount = items.filter((item) => item.status !== 'Retiradas' && item.stock > 0 && item.stock <= lastUnitsLimit).length
  const visitorsToday = env.useMocks ? WEEK_VISITS[WEEK_VISITS.length - 1].visits : '—'
  const weeklyProgress = env.useMocks ? Math.min(100, Math.round((WEEKLY_VISITS / WEEKLY_GOAL) * 100)) : 0

  /* Guardar / descartar información de tienda */
  const saveLegalInfo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: LegalStoreInfo = {
      legalName: legalDraft.legalName.trim() || legalInfo.legalName,
      nit: legalDraft.nit.trim() || legalInfo.nit,
      representative: legalDraft.representative.trim() || legalInfo.representative,
      phone: legalDraft.phone.trim() || legalInfo.phone,
      email: legalDraft.email.trim() || legalInfo.email,
      payoutAccount: legalDraft.payoutAccount.trim() || legalInfo.payoutAccount,
      address: legalDraft.address.trim() || legalInfo.address,
      hours: legalDraft.hours.trim() || legalInfo.hours,
    }
    setLegalInfo(next)
    setLegalDraft(next)
    try {
      localStorage.setItem(STORAGE_LEGAL_KEY, JSON.stringify(next))
    } catch {}
    setEditingInfo(false)
    setNotice('La información de la tienda se guardó con éxito.')
  }

  const discardLegalInfo = () => {
    setLegalDraft(legalInfo)
    setEditingInfo(false)
  }

  /* Subir y quitar fotos de la tienda */
  const cargarFotos = useCallback((nit: string) => storePhotoService.list(nit).then(setStoreGallery), [])
  const errorDeGaleria = (e: unknown) => {
    if (e instanceof ApiError && e.status === 422) return TEXTOS_FOTOS.maximo
    if (errorKind(e) === 'no-existe') return 'No encontramos tu almacén. Recarga la página o escríbele a soporte.'
    return errorMessage(e, 'No se pudo actualizar la galería.')
  }

  const handleUploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    setPhotoError('')
    if (!selected.length || photosBusy || !photosReady) return
    if (!storeNit) { setPhotoError(storeError || SIN_ALMACEN); return }
    const remaining = Math.max(0, MAX_STORE_PHOTOS - storeGallery.length)
    if (!remaining) {
      setPhotoError(TEXTOS_FOTOS.maximo)
      return
    }
    const invalidMsg = selected.map(errorDeFoto).find(Boolean)
    if (invalidMsg) {
      setPhotoError(invalidMsg)
      return
    }
    // El back recibe una foto por petición: se suben en orden y cada una aparece al terminar.
    setPhotosBusy(true)
    let subidas = 0
    try {
      for (const file of selected.slice(0, remaining)) {
        const foto = await storePhotoService.upload(storeNit, file)
        setStoreGallery((g) => ordenadas([...g.filter((x) => String(x.id) !== String(foto.id)), foto]))
        subidas++
      }
      if (selected.length > remaining) setPhotoError(TEXTOS_FOTOS.maximo)
    } catch (e) {
      setPhotoError(errorDeGaleria(e))
    } finally {
      setPhotosBusy(false)
    }
    if (subidas) setNotice('Fotos de la tienda actualizadas con éxito.')
  }

  const moverFoto = async (index: number, paso: -1 | 1) => {
    const destino = index + paso
    if (!storeNit || photosBusy || destino < 0 || destino >= storeGallery.length) return
    const orden = storeGallery.map((f) => f.id)
    ;[orden[index], orden[destino]] = [orden[destino], orden[index]]
    setPhotosBusy(true); setPhotoError('')
    try {
      setStoreGallery(await storePhotoService.reorder(storeNit, orden))
      setNotice(destino === 0 || index === 0 ? 'Orden guardado. La primera foto es la portada.' : 'Orden de las fotos guardado.')
    } catch (e) {
      // FA-09: otra sesión cambió la galería; se vuelve a pedir para tener la lista real.
      if (errorKind(e) === 'datos') { setPhotoError(TEXTOS_FOTOS.ordenDesactualizado); cargarFotos(storeNit).catch(() => {}) }
      else setPhotoError(errorDeGaleria(e))
    } finally {
      setPhotosBusy(false)
    }
  }

  const handleRemovePhoto = async () => {
    const foto = photoToRemove
    if (!foto || !storeNit || photosBusy) return
    setPhotosBusy(true); setPhotoError('')
    try {
      await storePhotoService.remove(storeNit, foto.id)
      // La siguiente pasa a ser la portada (RN-03): se vuelve a pedir la galería con las posiciones nuevas.
      await cargarFotos(storeNit)
      setNotice('Foto eliminada.')
    } catch (e) {
      setPhotoError(errorDeGaleria(e))
    } finally {
      setPhotosBusy(false)
      setPhotoToRemove(null)
    }
  }

  /* Colecciones */
  const createCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = collectionTitle.trim()
    if (!title) {
      setCollectionError('Escribe un título para la colección.')
      return
    }
    const nextCol: StoreCollection = {
      id: `collection-${Date.now()}`,
      title,
      description: collectionDescription.trim(),
      visibility: collectionVisibility,
      items: 0,
      likes: 0,
      image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg',
    }
    const next = [nextCol, ...collections]
    setCollections(next)
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(next))
    } catch {}
    setCollectionTitle('')
    setCollectionDescription('')
    setCollectionVisibility('Pública')
    setCollectionError('')
    setCollectionDialogOpen(false)
    setNotice(`Colección «${title}» creada con éxito.`)
  }
  const requestVerification = () => {
    setVerificationError('')
    if (verificationStatus === 'EN_REVISION' || hasScenario('regla')) {
      setVerificationError('Tu solicitud ya está en revisión')
      return
    }
    setVerificationStatus('EN_REVISION')
    setNotice('Solicitud de verificación enviada. Quedó en revisión.')
  }

  /* Distintivos */
  const openBadgesSettings = () => {
    setLastUnitsDraft(String(lastUnitsLimit))
    setNewArrivalDaysDraft(String(newArrivalDays))
    setBadgesErrors({}); setBadgesError('')
    setBadgesDialogOpen(true)
  }
  const saveBadgesSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (badgesBusy) return
    const aNumero = (v: string) => (v.trim() === '' ? null : Number(v))
    const body = { lowStockThreshold: aNumero(lastUnitsDraft), newArrivalDays: aNumero(newArrivalDaysDraft) }
    const errores = erroresDeConfiguracion(body)
    setBadgesErrors(errores); setBadgesError('')
    if (Object.keys(errores).length) return
    if (!storeNit) { setBadgesError(storeError || SIN_ALMACEN); return }
    setBadgesBusy(true)
    let guardado
    try {
      guardado = await storeSettingsService.saveCatalogSettings(storeNit, body as { lowStockThreshold: number; newArrivalDays: number })
    } catch (e) {
      const campos = fieldErrors(e)
      if (campos.lowStockThreshold || campos.newArrivalDays) setBadgesErrors(campos)
      else setBadgesError(errorKind(e) === 'no-existe' ? 'No encontramos tu almacén. Recarga la página o escríbele a soporte.' : errorMessage(e, 'No se pudieron guardar los distintivos.'))
      return
    } finally {
      setBadgesBusy(false)
    }
    badgesSaved.current = true
    const threshold = guardado.lowStockThreshold
    const days = guardado.newArrivalDays
    setLastUnitsLimit(threshold)
    setNewArrivalDays(days)
    setItems((current) => current.map((item) => {
      if (item.status !== 'Publicadas' || item.stock === 0) return item
      if (item.stock <= threshold) return { ...item, flag: 'Últimas unidades' }
      return item.flag === 'Últimas unidades' ? { ...item, flag: undefined } : item
    }))
    setBadgesDialogOpen(false)
    setNotice('Se guardaron las reglas de distintivos automáticos.')
  }

  const requestedStoreId = searchParams.get('tiendaId')
  const forbidden = (requestedStoreId !== null && requestedStoreId !== 't-1')
    || hasScenario('sin-permiso')
    || (user !== null && user.role !== 'STORE_ADMIN')

  if (forbidden) {
    return (
      <main className="my-store sr-tienda-glass">
        <div className="my-store__content">
          <ErrorCard
            grande
            variant="etiqueta"
            tone="warn"
            chip="Sin acceso"
            title="No existe o no tienes acceso"
            description="Solo puedes administrar tu propia tienda."
            actions={
              <Link className="my-store__button my-store__button--primary" to="/mi-tienda">
                Ir a mi tienda
              </Link>
            }
          />
        </div>
      </main>
    )
  }

  return (
    <main className="my-store msd sr-tienda-glass">
      <StoreSuspendedBanner />
      {/* ── Hero a todo el ancho ── */}
      <section className="msd-hero" aria-labelledby="store-title">
        <div className="msd-hero__media" aria-hidden="true"><img src={HERO_PHOTO} alt="" /></div>
        <div className="msd-hero__shade" aria-hidden="true" />
        <div className="msd-hero__inner">
          <nav className="msd-hero__crumbs" aria-label="Ruta de navegación">
            <Link to="/mi-tienda">Inicio</Link><span aria-hidden="true">/</span><span>Mi tienda</span>
          </nav>
          <span className="msd-hero__eyebrow">PANEL DE TIENDA · BOGOTÁ</span>
          <h1 id="store-title" className="msd-hero__title">{legalInfo.legalName}</h1>
          <p className="msd-hero__lead">Administra tu inventario, tus colecciones y tu información en un solo lugar.</p>
          <div className="msd-hero__pills">
            <span className="msd-pill msd-pill--glass">◉ Así te ven tus clientes · Las herramientas de edición solo las ves tú</span>
            <span className="msd-pill msd-pill--glass">DEPORTIVO & URBANO</span>
            <span className="msd-pill msd-pill--verified">{verificationStatus === 'VERIFICADA' ? 'Verificada' : verificationStatus === 'EN_REVISION' ? 'En revisión' : 'Sin verificar'}</span>
            <span className="msd-pill msd-pill--glass">{subStatusLabel}</span>
          </div>
          <div className="msd-hero__actions">
            <Link className="msd-btn msd-btn--primary" to="/tienda/inventario">＋ Nueva prenda</Link>
            <Link
              className="msd-btn msd-btn--ghost"
              to={env.useMocks ? '/tiendas/luna' : storeNit ? `/tiendas/${encodeURIComponent(storeNit)}` : '/tienda/registro'}
              target={env.useMocks || storeNit ? '_blank' : undefined}
              rel={env.useMocks || storeNit ? 'noopener noreferrer' : undefined}
            >
              Ver tienda pública (como comprador) ↗
            </Link>
            {verificationStatus !== 'VERIFICADA' && (
              <button className="msd-btn msd-btn--ghost" type="button" onClick={requestVerification}>Solicitar verificación</button>
            )}
            <Link className="msd-btn msd-btn--ghost" to="/tienda/estadisticas">Ver estadísticas</Link>
          </div>

          <ul className="msd-kpis" aria-label="Resumen de la tienda">
            <li className="msd-kpi">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 6a2 2 0 1 1 2 2c-1 0-2 .7-2 1.6V10l9 6.2c.8.6.4 1.8-.6 1.8H3.6c-1 0-1.4-1.2-.6-1.8L12 10" /></svg></span>
              <div><b>{activeCount}</b><span>Prendas activas</span></div>
            </li>
            <li className="msd-kpi">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.5" /></svg></span>
              <div><b>{lowStockCount}</b><span>Stock bajo</span></div>
            </li>
            <li className="msd-kpi">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg></span>
              <div><b>{visitorsToday}</b><span>Visitantes hoy</span></div>
            </li>
            <li className="msd-kpi msd-kpi--goal">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 17 6-6 4 4 8-8m0 0h-5m5 0v5" /></svg></span>
              <div className="msd-kpi__goal">
                <span>Meta semanal</span>
                <b>{weeklyProgress}%</b>
                <span className="msd-progress" role="progressbar" aria-label="Meta semanal de visitas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weeklyProgress}><i style={{ width: `${weeklyProgress}%` }} /></span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <div className="msd-content">
        {rejectedSubAlert && (
          <div className="msd-alert" role="alert">
            <span className="msd-alert__mark" aria-hidden="true">!</span>
            <div><strong>No pudimos cobrar tu suscripción</strong><p>El pago reciente fue rechazado. Reintenta el pago con Mercado Pago para mantener tu tienda visible</p></div>
            <Link to="/tienda/suscripcion">Pagar ahora <span aria-hidden="true">↗</span></Link>
          </div>
        )}
        {storeError && <ErrorBanner tone="warn" icon="info" title={storeError}
          actions={storeError === SIN_ALMACEN ? <Link to="/tienda/registro" className="font-semibold underline">Registrar mi tienda</Link> : undefined} />}
        {verificationError && (
          <ErrorBanner tone="warn" icon="info" title={verificationError}>
            Nuestro equipo ya está revisando los documentos de tu tienda. Te avisaremos cuando finalice la revisión.
          </ErrorBanner>
        )}

        {notice ? <div className="msd-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div> : null}

        {/* ── Fila 1: Información de la tienda (en el lugar del inventario) ── */}
        <div className="msd-row msd-row--main">
          <section className="msd-card" id="informacion" aria-labelledby="store-info-title">
            <header className="msd-card__head">
              <div>
                <h2 id="store-info-title">Información de la tienda</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-1">Datos legales, de contacto y comerciales de tu tienda en Bogotá.</p>
              </div>
              {!editingInfo ? (
                <button type="button" className="msd-link font-semibold" onClick={() => setEditingInfo(true)}>
                  Editar información
                </button>
              ) : null}
            </header>

            {!editingInfo ? (
              <div className="msd-info-grid">
                <article className="msd-info-tile">
                  <span>Razón social</span>
                  <strong>{legalInfo.legalName}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>NIT</span>
                  <strong>{legalInfo.nit}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Representante legal</span>
                  <strong>{legalInfo.representative}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Teléfono</span>
                  <strong>{legalInfo.phone}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Correo de la cuenta</span>
                  <strong>{legalInfo.email}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Cuenta para pagos</span>
                  <strong>{legalInfo.payoutAccount}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Dirección comercial</span>
                  <strong>{legalInfo.address}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Horario de atención</span>
                  <strong>{legalInfo.hours}</strong>
                </article>
              </div>
            ) : (
              <form className="msd-info-form" onSubmit={saveLegalInfo}>
                <label className="msd-info-field">
                  <span>Razón social</span>
                  <input
                    value={legalDraft.legalName}
                    onChange={(e) => setLegalDraft({ ...legalDraft, legalName: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>NIT</span>
                  <input
                    value={legalDraft.nit}
                    onChange={(e) => setLegalDraft({ ...legalDraft, nit: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Representante legal</span>
                  <input
                    value={legalDraft.representative}
                    onChange={(e) => setLegalDraft({ ...legalDraft, representative: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Teléfono</span>
                  <input
                    value={legalDraft.phone}
                    onChange={(e) => setLegalDraft({ ...legalDraft, phone: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Correo de la cuenta</span>
                  <input
                    value={legalDraft.email}
                    readOnly
                    className="opacity-75 cursor-not-allowed"
                  />
                </label>
                <label className="msd-info-field">
                  <span>Cuenta para pagos</span>
                  <input
                    value={legalDraft.payoutAccount}
                    onChange={(e) => setLegalDraft({ ...legalDraft, payoutAccount: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Dirección comercial</span>
                  <input
                    value={legalDraft.address}
                    onChange={(e) => setLegalDraft({ ...legalDraft, address: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Horario de atención</span>
                  <input
                    value={legalDraft.hours}
                    onChange={(e) => setLegalDraft({ ...legalDraft, hours: e.target.value })}
                    required
                  />
                </label>
                <div className="msd-info-actions">
                  <button type="button" className="msd-btn msd-btn--ghost" onClick={discardLegalInfo}>
                    Descartar
                  </button>
                  <button type="submit" className="msd-btn msd-btn--primary">
                    Guardar cambios
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* ── Fila 2: Colecciones y Fotos de la tienda (más arriba, estilo idéntico) ── */}
        <div className="msd-row msd-row--gallery">
          <section className="msd-card" id="colecciones" aria-labelledby="collections-title">
            <header className="msd-card__head">
              <div>
                <h2 id="collections-title">Colecciones</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-0.5">Agrupa tus prendas por temporada o estilo.</p>
              </div>
            </header>
            <div className="msd-collections">
              {collections.map((collection) => (
                <Link
                  className="msd-collection"
                  key={collection.id}
                  to={`/playlists/${collection.id}`}
                  state={{ collection }}
                  aria-label={`Abrir colección ${collection.title}`}
                >
                  <img src={collection.image} alt="" loading="lazy" />
                  <span className="msd-collection__shade" aria-hidden="true" />
                  <span className="msd-collection__name">{collection.title}</span>
                  <span className="msd-collection__meta">{collection.items} prendas · {collection.visibility}</span>
                </Link>
              ))}
              <button
                className="msd-collection msd-collection--new"
                type="button"
                onClick={() => { setCollectionError(''); setCollectionDialogOpen(true) }}
              >
                ＋ Nueva colección
              </button>
            </div>
          </section>

          <section className="msd-card" id="fotos-tienda" aria-labelledby="store-photos-title">
            <header className="msd-card__head">
              <div>
                <h2 id="store-photos-title">Fotos de la tienda</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-0.5">Fachada, vitrina e interior (hasta 6 fotos; la primera es la portada). {storeGallery.length}/6 fotos.</p>
              </div>
            </header>
            <FieldError id="store-photos-err" message={photoError} />
            <div className="msd-collections">
              {storeGallery.map((photo, index) => (
                <div key={photo.id} className="msd-collection">
                  <img src={photo.url} alt={`Foto ${index + 1} de ${legalInfo.legalName}`} loading="lazy" />
                  <span className="msd-collection__shade" aria-hidden="true" />
                  <span className="msd-collection__name">{photo.cover ? 'Portada' : `Foto ${index + 1}`}</span>
                  <span className="msd-collection__meta flex items-center gap-1.5">
                    <button type="button" className="inline-grid min-h-7 min-w-7 place-items-center rounded-md" disabled={photosBusy || index === 0} onClick={() => moverFoto(index, -1)} aria-label={`Mover foto ${index + 1} antes`} title="Mover antes">←</button>
                    <button type="button" className="inline-grid min-h-7 min-w-7 place-items-center rounded-md" disabled={photosBusy || index === storeGallery.length - 1} onClick={() => moverFoto(index, 1)} aria-label={`Mover foto ${index + 1} después`} title="Mover después">→</button>
                  </span>
                  <button
                    type="button"
                    disabled={photosBusy}
                    onClick={() => setPhotoToRemove(photo)}
                    className="msd-photo-del"
                    aria-label={`Quitar foto ${index + 1}`}
                    title="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photosReady && storeGallery.length < MAX_STORE_PHOTOS && (
                <label className="msd-collection msd-collection--new cursor-pointer" aria-busy={photosBusy}>
                  <span>{photosBusy ? 'Subiendo…' : '＋ Subir foto'}</span>
                  <input
                    type="file"
                    accept={ALLOWED_STORE_PHOTO_TYPES.join(',')}
                    multiple
                    disabled={photosBusy}
                    className="sr-only"
                    onChange={handleUploadPhotos}
                  />
                </label>
              )}
            </div>
            <ConfirmDialog open={!!photoToRemove} busy={photosBusy} danger
              title="¿Quitar esta foto?"
              confirmLabel="Quitar foto"
              onCancel={cerrarQuitarFoto} onConfirm={handleRemovePhoto}>
              {photoToRemove?.cover ? 'Es la portada: la siguiente foto pasará a ser la portada.' : 'La foto dejará de verse en la página de tu tienda.'}
            </ConfirmDialog>
          </section>
        </div>

        {/* ── Fila 3: Distintivos de la tienda ── */}
        <div className="msd-row msd-row--main">
          <section className="msd-card" aria-labelledby="msd-badges-title">
            <header className="msd-card__head">
              <div>
                <h2 id="msd-badges-title">Distintivos de la tienda</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-0.5">Insignias automáticas que se muestran en el radar y en tus prendas.</p>
              </div>
              <button type="button" className="msd-link font-semibold" onClick={openBadgesSettings}>Configurar</button>
            </header>
            <ul className="msd-badges">
              <li><span className="msd-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" /></svg></span>Tienda verificada</li>
              <li><span className="msd-badge msd-badge--soft" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v10m0 4v1" /></svg></span>Últimas unidades<small>≤ {lastUnitsLimit} uds</small></li>
              <li><span className="msd-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z" /></svg></span>Nueva llegada<small>{newArrivalDays} días</small></li>
            </ul>
          </section>
        </div>
      </div>

      {badgesDialogOpen ? <div className="my-store__dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBadgesDialogOpen(false) }}>
        <form className="my-store__dialog my-store__dialog--badges" role="dialog" aria-modal="true" aria-labelledby="badges-title" onSubmit={saveBadgesSettings} noValidate>
          <button className="my-store__dialog-close" type="button" onClick={() => setBadgesDialogOpen(false)} aria-label="Cerrar">×</button>
          <span className="my-store__eyebrow">MI TIENDA</span>
          <h2 id="badges-title">Distintivos automáticos</h2>
          <p>StyleRadar pone estas etiquetas solas sobre tus prendas, según tu inventario y la fecha de publicación.</p>
          <label className="my-store__badge-rule">«ÚLTIMAS UNIDADES» CUANDO QUEDEN
            <span className="my-store__badge-threshold"><input type="number" min={LOW_STOCK_MIN} max={LOW_STOCK_MAX} step="1" value={lastUnitsDraft} onChange={(event) => setLastUnitsDraft(event.target.value)} aria-label="Umbral de últimas unidades" aria-invalid={!!badgesErrors.lowStockThreshold} aria-describedby={badgesErrors.lowStockThreshold ? 'badges-umbral-error' : undefined} /><b>UNIDADES O MENOS</b></span>
          </label>
          <FieldError id="badges-umbral-error" message={badgesErrors.lowStockThreshold} />
          <label className="my-store__badge-rule">«NUEVA LLEGADA» DURANTE
            <select value={newArrivalDaysDraft} onChange={(event) => setNewArrivalDaysDraft(event.target.value)} aria-label="Duración de nueva llegada" aria-invalid={!!badgesErrors.newArrivalDays} aria-describedby={badgesErrors.newArrivalDays ? 'badges-dias-error' : undefined}>
              {/* Si el back guardó otro periodo válido (1 a 60), también se ofrece para no perderlo. */}
              {[...new Set<number>([...NEW_ARRIVAL_OPTIONS, newArrivalDays])].sort((a, b) => a - b).map((d) => (
                <option key={d} value={String(d)}>{d} días desde que se publica</option>
              ))}
            </select>
          </label>
          <FieldError id="badges-dias-error" message={badgesErrors.newArrivalDays} />
          {badgesError && <p role="alert" className="my-store__photo-error">{badgesError}</p>}
          <div className="my-store__dialog-actions"><button type="button" onClick={() => setBadgesDialogOpen(false)}>Cancelar</button><button className="my-store__button--primary" type="submit" disabled={badgesBusy}>{badgesBusy ? 'Guardando…' : 'Guardar'}</button></div>
        </form>
      </div> : null}

      {collectionDialogOpen ? <div className="my-store__dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCollectionDialogOpen(false) }}>
        <form className="my-store__dialog my-store__dialog--collection" role="dialog" aria-modal="true" aria-labelledby="new-collection-title" onSubmit={createCollection}>
          <button className="my-store__dialog-close" type="button" onClick={() => setCollectionDialogOpen(false)} aria-label="Cerrar">×</button>
          <span className="my-store__eyebrow">{(legalInfo.legalName || 'Mi tienda').toUpperCase()}</span>
          <h2 id="new-collection-title">Nueva colección</h2>
          <label className="my-store__collection-label">TÍTULO<input autoFocus value={collectionTitle} onChange={(event) => setCollectionTitle(event.target.value)} placeholder="Ej. Temporada de lluvias" maxLength={60} required /></label>
          <label className="my-store__collection-label">DESCRIPCIÓN <span>opcional</span><textarea value={collectionDescription} onChange={(event) => setCollectionDescription(event.target.value)} rows={4} maxLength={240} /></label>
          <fieldset className="my-store__visibility-field"><legend>VISIBILIDAD</legend><div>
            <button className={collectionVisibility === 'Pública' ? 'is-selected' : ''} type="button" onClick={() => setCollectionVisibility('Pública')}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7" /></svg><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" /><circle cx="10" cy="10" r="2" /></svg>PÚBLICA</button>
            <button className={collectionVisibility === 'Borrador' ? 'is-selected' : ''} type="button" onClick={() => setCollectionVisibility('Borrador')}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="1" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>BORRADOR</button>
          </div></fieldset>
          {collectionError ? <p className="my-store__photo-error" role="alert">{collectionError}</p> : null}
          <div className="my-store__dialog-actions"><button type="button" onClick={() => setCollectionDialogOpen(false)}>Cancelar</button><button className="my-store__button--primary" type="submit">Crear colección</button></div>
        </form>
      </div> : null}
    </main>
  )
}
