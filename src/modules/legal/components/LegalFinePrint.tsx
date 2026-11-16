import { Link } from 'react-router-dom'

interface LegalFinePrintProps {
  fechaInicio?: string
  fechaFin?: string
  canales?: string
  exclusiones?: string
  unidadesMinimas?: number
  className?: string
}

/**
 * Plantilla estandarizada de letra pequeña legal para promociones y descuentos,
 * exigida por el Estatuto del Consumidor (Ley 1480 de 2011) y la SIC.
 */
export function LegalFinePrint({
  fechaInicio = '12 DE NOVIEMBRE DE 2026',
  fechaFin = '30 DE NOVIEMBRE DE 2026',
  canales = 'TIENDAS FÍSICAS ALIADAS EN BOGOTÁ Y EN LA PLATAFORMA WWW.STYLERADAR.CO',
  exclusiones = 'NO APLICA PARA PRENDAS DE SEGUNDA MANO SIN DESCUENTO NI LÍNEAS DE LUJO SELECCIONADAS',
  unidadesMinimas = 5,
  className = '',
}: LegalFinePrintProps) {
  return (
    <aside
      className={`text-[10px] sm:text-[11px] leading-tight text-[var(--color-text-muted)] tracking-tight uppercase border-t border-[var(--color-border)]/50 pt-3 pb-1 ${className}`}
      aria-label="Términos legales de la promoción"
    >
      <p>
        PROMOCIÓN VÁLIDA DEL {fechaInicio} AL {fechaFin} O HASTA AGOTAR EXISTENCIAS EN {canales}. MÍNIMO {unidadesMinimas} UNIDADES DISPONIBLES POR REFERENCIA. {exclusiones}. NO ACUMULABLE CON OTROS CUPONES Y/O DESCUENTOS. IMÁGENES DE REFERENCIA; LA ESCALA Y TONO PUEDEN VARIAR SEGÚN LA PANTALLA. VÁLIDA ÚNICAMENTE DURANTE LAS FECHAS Y HORARIOS DE ATENCIÓN INFORMADOS.{' '}
        <Link
          to="/legal/promociones-descuentos"
          className="font-bold underline underline-offset-1 text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
        >
          CONSULTA TÉRMINOS Y CONDICIONES COMPLETOS AQUÍ
        </Link>
        .
      </p>
    </aside>
  )
}
