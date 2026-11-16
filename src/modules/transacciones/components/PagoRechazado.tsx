import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { TEXTOS_PLAN } from '../utils/erroresPlan'
import './PagoRechazado.css'

/** 0 tarjeta afuera · 1 entra · 2-5 procesando · 6 rechazado (estado final). */
const FINAL = 6
const PASOS = [600, 1000, 380, 380, 380, 380]

/** Datáfono: la tarjeta entra, la pantalla procesa, rechaza, la tarjeta sale y se imprime el recibo sellado. */
export function Datafono() {
  const quieto = useReducedMotion()
  const [paso, setPaso] = useState(0)
  useEffect(() => {
    if (quieto || paso >= FINAL) return
    const t = setTimeout(() => setPaso((p) => p + 1), PASOS[paso])
    return () => clearTimeout(t)
  }, [paso, quieto])
  const fase = quieto ? FINAL : paso
  const rechazado = fase >= FINAL
  const dentro = fase >= 1 && !rechazado
  const pantalla = rechazado ? <>PAGO<br />RECHAZADO</> : fase >= 2 ? `PROCESANDO${'.'.repeat(fase - 2)}` : 'INSERTE TARJETA'

  return (
    <>
      <div className="sr-datafono">
        <div className="sr-datafono-ranura" />
        <div className="sr-datafono-pantalla" data-mal={rechazado}>{pantalla}</div>
        <div className="sr-datafono-teclas">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
      </div>
      <motion.div
        className="sr-tarjeta"
        initial={false}
        animate={{ y: dentro ? '95%' : '0%', x: rechazado && !quieto ? [0, -6, 6, -4, 3, 0] : 0 }}
        transition={{ y: { duration: 1, ease: [0.3, 0.7, 0.2, 1] }, x: { duration: 0.5 } }}
      />
      <motion.div
        className="sr-recibo"
        initial={false}
        animate={{ height: rechazado ? '34%' : '0%' }}
        transition={{ duration: quieto ? 0 : 1.6, ease: 'linear', delay: quieto ? 0 : 0.5 }}
      >
        <div className="sr-recibo-lineas"><i style={{ width: '70%' }} /><i /><i style={{ width: '55%' }} /><i /><i style={{ width: '40%' }} /></div>
        <motion.span
          className="sr-sello"
          initial={false}
          animate={rechazado ? { opacity: 0.9, scale: 1, x: '-50%', y: '-50%', rotate: -14 } : { opacity: 0, scale: 2, x: '-50%', y: '-50%', rotate: -14 }}
          transition={{ type: 'spring', stiffness: 420, damping: 14, delay: quieto ? 0 : 2 }}
        >RECHAZADO</motion.span>
      </motion.div>
    </>
  )
}

/**
 * Pantalla «Pago rechazado» (plan de errores · Cristian): escena del datáfono a la izquierda,
 * mensaje y Reintentar a la derecha. Sin código: el plan no le pone número.
 */
export function PagoRechazado({ detalle, acciones }: { detalle?: ReactNode; acciones: ReactNode }) {
  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-7 px-4 py-10 md:grid-cols-[1.2fr_1fr]" style={{ ['--k' as string]: 'var(--sr-bad)' }}>
      <div role="img" aria-label="Ilustración: la tarjeta entra al datáfono, el pago se rechaza y sale un recibo sellado"
        className="sr-escena relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--sr-tx)_8%,transparent)]">
        <Datafono />
      </div>
      <div className="grid content-start gap-4">
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--k)]">
          <i aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--k)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--k)_22%,transparent)]" />
          Pago
        </span>
        <h1 className="text-3xl font-extrabold leading-tight text-[var(--sr-tx)] md:text-4xl">{TEXTOS_PLAN.rechazado.titulo}</h1>
        <p className="max-w-[46ch] text-sm leading-relaxed text-[var(--sr-tx-2)]">{TEXTOS_PLAN.rechazado.texto}</p>
        {detalle}
        <div className="flex flex-wrap gap-2">{acciones}</div>
      </div>
    </section>
  )
}
