interface PhotoUploadGuideProps {
  variant: 'garment' | 'user-tryon'
  className?: string
  darkSurface?: boolean
}

const GARMENT_RULES = [
  'Prenda de frente y completa: sin recortar hombros, mangas ni el ruedo o bota.',
  'Formato vertical 3:4 (ideal 800×1066 px o más) en JPG, PNG o WEBP.',
  'Fondo liso y buena luz: prenda extendida o en modelo recto con brazos separados del torso.',
  'Evita ganchos grandes cruzando el cuello, sombras duras, filtros o texto encima.',
]

const USER_TRYON_RULES = [
  'Cuerpo entero de frente: desde la cabeza hasta los pies, mirando directo a cámara.',
  'Brazos ligeramente separados del torso (sin cruzarlos ni meter manos en bolsillos).',
  'Fondo despejado y luz frontal pareja para que la IA detecte bien tu silueta.',
  'Formato vertical JPG o PNG (proporción 3:4, mínimo 300×400 px, máximo 5 MB).',
]

export function PhotoUploadGuide({
  variant,
  className = '',
  darkSurface = false,
}: PhotoUploadGuideProps) {
  const isGarment = variant === 'garment'
  const rules = isGarment ? GARMENT_RULES : USER_TRYON_RULES
  const title = isGarment
    ? 'Reglas para fotos de prendas (compatible con probador IA)'
    : 'Cómo tomar o subir tu foto para el probador IA'

  const containerCls = darkSurface
    ? 'rounded-xl border border-white/12 bg-white/[0.04] p-3 text-white/85'
    : 'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]/60 p-3 text-[var(--color-text)]'

  const titleCls = darkSurface
    ? 'text-[11px] font-bold uppercase tracking-wider text-violeta-claro'
    : 'text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]'

  const itemCls = darkSurface
    ? 'text-[11px] leading-snug text-white/75'
    : 'text-[11px] leading-snug text-[var(--color-text-muted)]'

  return (
    <div className={`${containerCls} ${className}`}>
      <p className={titleCls}>{title}</p>
      <ul className="mt-1.5 space-y-1">
        {rules.map((rule) => (
          <li key={rule} className={`flex items-start gap-1.5 ${itemCls}`}>
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
