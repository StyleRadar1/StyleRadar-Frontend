import { motion, useReducedMotion } from 'framer-motion'

/**
 * Ilustraciones animadas de las pantallas de error (propuesta «Errores en vivo»).
 * Usan las fotos que ya están en el repo y el color de acento en var(--k).
 * Con «reducir movimiento» del sistema quedan quietas en su estado final.
 */

const VINILO = '/img/vinyl-record.png'
const MANIQUI = '/prototipo/assets/img/general/maniqui.png'

/** 404 · Perchero con las perchas vacías meciéndose. */
export function Perchero() {
  const quieto = useReducedMotion()
  const percha = (x: number, dur: number, desfase: number) => (
    <motion.g
      key={x}
      style={{ originX: `${x + 50}px`, originY: '44px', transformBox: 'view-box' }}
      animate={quieto ? undefined : { rotate: [0, 5, -4, 2.5, 0] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay: desfase }}
    >
      <path d={`M${x + 50} 40 q9 0 9 8 q0 7 -9 11 L${x + 50} 64 L${x + 8} 96 Q${x + 3} 100 ${x + 10} 100 L${x + 90} 100 Q${x + 97} 100 ${x + 92} 96 L${x + 50} 64`}
        fill="none" stroke="url(#sr-metal)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
  )
  return (
    <svg viewBox="0 0 400 320" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sr-metal" x1="0" x2="1"><stop offset="0" stopColor="var(--sr-metal-1)" /><stop offset=".5" stopColor="var(--sr-metal-2)" /><stop offset="1" stopColor="var(--sr-metal-1)" /></linearGradient>
      </defs>
      <g transform="translate(20 28) scale(.9)">
      <rect x="44" y="52" width="6" height="170" rx="3" fill="url(#sr-metal)" />
      <rect x="350" y="52" width="6" height="170" rx="3" fill="url(#sr-metal)" />
      <rect x="34" y="46" width="332" height="8" rx="4" fill="url(#sr-metal)" />
      {percha(70, 3.2, 0)}
      {percha(150, 2.8, 0.4)}
      {percha(230, 3.6, 0.8)}
      </g>
      <ellipse cx="200" cy="262" rx="120" ry="10" className="sr-escena-sombra" fill="var(--sr-sombra)" opacity=".5" />
    </svg>
  )
}

/** 500 · 503 · 504 · El vinilo se queda sin energía, frena y el brazo se levanta. */
export function Tornamesa({ intento = 0 }: { intento?: number }) {
  const quieto = useReducedMotion()
  return (
    <div className="absolute inset-[18%_12%_16%] rounded-2xl bg-[linear-gradient(160deg,#2c2c33,#141417)] shadow-[0_24px_40px_-18px_var(--sr-sombra)]">
      <div className="absolute left-[7%] top-[9%] aspect-square w-[62%] rounded-full bg-[radial-gradient(circle,#2a2a2e_0_62%,#111_63%)] shadow-[0_0_0_4px_#0c0c0e]" />
      <motion.img
        key={`disco-${intento}`}
        src={VINILO} alt=""
        className="absolute left-[9%] top-[11.5%] aspect-square w-[58%] rounded-full object-cover"
        initial={{ rotate: 0 }}
        animate={quieto ? { rotate: 0 } : { rotate: [0, 1080, 1260] }}
        transition={{ duration: 4.2, times: [0, 0.62, 1], ease: ['linear', 'easeOut'] }}
      />
      <motion.svg
        key={`brazo-${intento}`}
        viewBox="0 0 120 220" aria-hidden="true"
        className="absolute left-[72%] top-[6%] w-[22%]"
        style={{ originX: '78%', originY: '10%' }}
        initial={{ rotate: 0 }}
        animate={{ rotate: -24 }}
        transition={{ delay: quieto ? 0 : 3.4, duration: quieto ? 0 : 1.1, ease: [0.3, 0.7, 0.2, 1] }}
      >
        <circle cx="94" cy="22" r="17" fill="#1b1b1f" stroke="#55525c" strokeWidth="2" />
        <circle cx="94" cy="22" r="7" fill="#d9d6de" />
        <path d="M94 22 L86 150 L58 196" fill="none" stroke="#d9d6de" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="42" y="188" width="26" height="16" rx="3" transform="rotate(-30 55 196)" fill="#2b2b31" stroke="#77737d" />
      </motion.svg>
      <motion.span
        key={`led-${intento}`}
        className="absolute bottom-[9%] left-[6%] h-2 w-2 rounded-full"
        initial={{ backgroundColor: '#9be3b4' }}
        animate={{ backgroundColor: 'var(--k)', opacity: quieto ? 1 : [1, 0.3, 1] }}
        transition={{ delay: quieto ? 0 : 3.4, duration: 1, repeat: quieto ? 0 : Infinity }}
      />
    </div>
  )
}

/** 429 · El maniquí bajo un foco y el anillo de la cuenta regresiva. */
export function Maniqui({ restante, total }: { restante: number; total: number }) {
  const quieto = useReducedMotion()
  const lleno = total > 0 ? Math.max(0, Math.min(1, restante / total)) : 0
  const mm = Math.floor(restante / 60)
  const ss = String(restante % 60).padStart(2, '0')
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[-10%] h-[110%] w-[70%] -translate-x-1/2 blur-[6px]"
        style={{ background: 'conic-gradient(from 165deg at 50% 0, transparent 0 4deg, color-mix(in srgb, var(--k) 18%, transparent) 15deg, transparent 26deg)', originY: 0 }}
        animate={quieto ? undefined : { opacity: [0.7, 1, 0.7], scaleX: [1, 1.06, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <img src={MANIQUI} alt="" className="absolute bottom-[13%] left-1/2 h-[76%] -translate-x-1/2 object-contain drop-shadow-[0_18px_18px_var(--sr-sombra)]" />
      <div className="absolute right-[8%] top-[24%] aspect-square w-[27%]">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="color-mix(in srgb, var(--sr-tx) 12%, transparent)" strokeWidth="6" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--k)" strokeWidth="6" strokeLinecap="round" pathLength={100}
            strokeDasharray="100" strokeDashoffset={100 - lleno * 100} transform="rotate(-90 50 50)"
            style={{ transition: quieto ? 'none' : 'stroke-dashoffset 1s linear' }} />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums text-[var(--sr-tx)]">{mm}:{ss}</span>
      </div>
    </>
  )
}

/** 401 · La etiqueta de la prenda se mece y su reloj llega a cero. */
export function Etiqueta() {
  const quieto = useReducedMotion()
  return (
    <svg viewBox="0 0 400 320" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <circle cx="200" cy="34" r="6" fill="var(--sr-metal-2)" />
      <motion.g
        style={{ originX: '200px', originY: '34px', transformBox: 'view-box' }}
        animate={quieto ? undefined : { rotate: [-7, 7, -7] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M200 34 C 197 52, 203 70, 200 88" fill="none" stroke="#b89c74" strokeWidth="1.5" />
        <path d="M172 86 L228 86 L250 110 L250 232 Q250 240 242 240 L158 240 Q150 240 150 232 L150 110 Z" fill="#f4ecdf" stroke="#b89c74" strokeWidth="1.5" />
        <circle cx="200" cy="102" r="6" fill="var(--sr-bg)" stroke="#b89c74" />
        <text x="200" y="130" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="#5c4d3c" fontFamily="ui-monospace, monospace">STYLERADAR</text>
        <circle cx="200" cy="172" r="28" fill="none" stroke="var(--k)" strokeWidth="3" />
        <motion.line x1="200" y1="172" x2="200" y2="150" stroke="var(--k)" strokeWidth="3" strokeLinecap="round"
          style={{ originX: '200px', originY: '172px', transformBox: 'view-box' }}
          initial={{ rotate: quieto ? 360 : 0 }} animate={{ rotate: 360 }} transition={{ duration: quieto ? 0 : 3, ease: 'easeOut' }} />
        <circle cx="200" cy="172" r="3.5" fill="var(--k)" />
        <text x="200" y="222" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2b2118" fontFamily="ui-monospace, monospace">00:00</text>
      </motion.g>
      <ellipse cx="200" cy="276" rx="70" ry="8" fill="var(--sr-sombra)" opacity=".45" />
    </svg>
  )
}

/** Estado vacío · El radar busca y solo deja ecos que se apagan. No es un error del plan. */
export function Radar() {
  const quieto = useReducedMotion()
  const ecos: [number, number, number][] = [[30, 34, 0], [68, 40, 0.7], [44, 70, 1.4], [62, 62, 2.1]]
  return (
    <div className="sr-radar absolute left-1/2 top-[14%] aspect-square w-[54%] -translate-x-1/2 rounded-full">
      <span className="absolute inset-y-0 left-1/2 w-px bg-[color-mix(in_srgb,var(--k)_25%,transparent)]" />
      <span className="absolute inset-x-0 top-1/2 h-px bg-[color-mix(in_srgb,var(--k)_25%,transparent)]" />
      <motion.div
        className="sr-radar-barrido absolute inset-0 rounded-full"
        animate={quieto ? undefined : { rotate: -360 }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
      />
      {!quieto && ecos.map(([x, y, d]) => (
        <motion.span key={`${x}-${y}`} className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sr-tx-2)]"
          style={{ left: `${x}%`, top: `${y}%` }}
          animate={{ scale: [0.3, 2.4], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, delay: d }} />
      ))}
    </div>
  )
}
