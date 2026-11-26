import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

const PASOS = [
  { n: '01', titulo: 'Sube tu foto', texto: 'De cuerpo completo, con buena luz.' },
  { n: '02', titulo: 'Elige las prendas', texto: 'Del catálogo de las tiendas del radar.' },
  { n: '03', titulo: 'Mira cómo te queda', texto: 'Compara tallas antes de ir a la tienda.' },
]

export function ProbadorIntro() {
  const reducir = useReducedMotion()
  const aparecer = (retraso = 0) =>
    reducir
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.6, delay: retraso, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <section className="sr-inicio-bloque sr-inicio-probador" aria-labelledby="inicio-probador-titulo">
      <div className="sr-inicio-probador__grid">
        <motion.div className="sr-inicio-probador__texto" {...aparecer()}>
          <p className="sr-inicio-kicker">Probador virtual</p>
          <h2 id="inicio-probador-titulo" className="sr-inicio-titulo">
            Pruébatelo <span className="sr-inicio-acento">antes de salir</span>
          </h2>
          <p className="sr-inicio-descripcion">
            Combina prendas de distintas tiendas sobre tu propia foto y revisa el ajuste por talla sin moverte de casa.
          </p>

          <ol className="sr-inicio-pasos">
            {PASOS.map((paso, i) => (
              <motion.li key={paso.n} className="sr-inicio-paso" {...aparecer(0.12 + i * 0.1)}>
                <span className="sr-inicio-paso__n" aria-hidden="true">{paso.n}</span>
                <span>
                  <strong className="sr-inicio-paso__titulo">{paso.titulo}</strong>
                  <span className="sr-inicio-paso__texto">{paso.texto}</span>
                </span>
              </motion.li>
            ))}
          </ol>

          <Link to="/probador" className="sr-inicio-cta">
            Abrir el probador
          </Link>
        </motion.div>

        <motion.div className="sr-inicio-probador__visual" aria-hidden="true" {...aparecer(0.2)}>
          <div className="sr-inicio-probador__halo" />
          <img src="/img/mannequins/croquis-f-frente.png" alt="" className="sr-inicio-probador__maniqui sr-inicio-probador__maniqui--a" />
          <img src="/img/mannequins/croquis-m-frente.png" alt="" className="sr-inicio-probador__maniqui sr-inicio-probador__maniqui--b" />
          <span className="sr-inicio-probador__chip sr-inicio-probador__chip--uno">Tu foto</span>
          <span className="sr-inicio-probador__chip sr-inicio-probador__chip--dos">Tu look</span>
        </motion.div>
      </div>
    </section>
  )
}
