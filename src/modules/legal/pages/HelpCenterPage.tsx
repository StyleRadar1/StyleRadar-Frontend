import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL_DOCS_REGISTRY, PROVIDER_INFO } from '../config/legalConfig'
import { LegalLayout } from '../components/LegalLayout'

interface FaqItem {
  question: string
  answer: string
  category: 'compras' | 'probador' | 'retracto' | 'tiendas' | 'fundaciones'
}

const FAQS: FaqItem[] = [
  {
    category: 'compras',
    question: '¿Qué es Style Radar y cómo funciona?',
    answer:
      'Style Radar es una plataforma web que conecta a compradores con tiendas independientes de moda local, marcas urbanas y proyectos circulares de Bogotá. Puedes descubrir prendas colgadas en percheros virtuales, probarlas con tecnología interactiva y comprarlas directamente a las tiendas.',
  },
  {
    category: 'compras',
    question: '¿Cómo se pagan los planes y suscripciones?',
    answer:
      'Con Mercado Pago, y StyleRadar no almacena datos de tarjetas ni de otros medios de pago',
  },
  {
    category: 'retracto',
    question: '¿Puedo devolver una prenda si no me queda o no me gusta?',
    answer:
      'Sí. Conforme a la Ley 1480 de 2011 (Estatuto del Consumidor), cuentas con el Derecho de Retracto dentro de los 5 días hábiles siguientes a la entrega de la prenda, siempre que esté nueva, sin lavar y con etiquetas. Por motivos de higiene, se exceptúan prendas de uso íntimo.',
  },
  {
    category: 'retracto',
    question: '¿Qué garantía tienen las prendas?',
    answer:
      'Todas las prendas nuevas cuentan con una garantía legal mínima de 30 días calendario por defectos de confección, costuras o materiales. Puedes solicitarla directamente a través de nuestro módulo de PQRS.',
  },
  {
    category: 'probador',
    question: '¿Es obligatorio subir mi foto para usar el Probador Virtual?',
    answer:
      'No. El uso de tu fotografía personal es 100% opcional. Puedes utilizar maniquíes digitales predeterminados (femenino, masculino o neutro). Si decides subir tu foto, tus datos de imagen son procesados bajo consentimiento expreso y puedes eliminarlos cuando desees.',
  },
  {
    category: 'tiendas',
    question: 'Tengo una tienda de moda en Bogotá, ¿cómo puedo vincularme?',
    answer:
      'Solo necesitas tu RUT activo y matrícula de Cámara de Comercio. Revisa nuestros planes para comercios, diligencia el registro de tienda y nuestro equipo validará tu catálogo en menos de 48 horas hábiles.',
  },
  {
    category: 'fundaciones',
    question: '¿Cómo funciona la donación de ropa para fundaciones?',
    answer:
      'A través del módulo de donación, los usuarios pueden programar entregas de prendas en buen estado. Las fundaciones aliadas son ESAL verificadas, garantizan que la ropa no se revenderá comercialmente y emiten certificados de donación.',
  },
]

export default function HelpCenterPage() {
  const meta = LEGAL_DOCS_REGISTRY['centro-ayuda']
  const [activeCategory, setActiveCategory] = useState<string>('todos')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const filteredFaqs = FAQS.filter(
    (f) => activeCategory === 'todos' || f.category === activeCategory
  )

  return (
    <LegalLayout docMeta={meta}>
      <div className="space-y-8">
        {/* Canales directos de soporte y atención */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-5 space-y-2">
            <span className="text-xl" aria-hidden="true">💬</span>
            <h3 className="font-bold text-sm text-[var(--color-text)]">Línea WhatsApp Bogotá</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{PROVIDER_INFO.telefono}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">{PROVIDER_INFO.horarioAtencion}</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-5 space-y-2">
            <span className="text-xl" aria-hidden="true">✉️</span>
            <h3 className="font-bold text-sm text-[var(--color-text)]">Correo de Atención</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{PROVIDER_INFO.correoGeneral}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Respuesta en menos de 24 horas</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-5 space-y-2">
            <span className="text-xl" aria-hidden="true">📋</span>
            <h3 className="font-bold text-sm text-[var(--color-text)]">Canal Oficial PQRS</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Radicación formal con número de radicado</p>
            <Link to="/legal/pqrs" className="text-xs font-bold text-[var(--color-accent)] hover:underline block pt-1">
              Radicar PQRS ahora →
            </Link>
          </div>
        </div>

        {/* Preguntas Frecuentes (FAQ) */}
        <div className="space-y-4 pt-4">
          <div className="border-b border-[var(--color-border)] pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">
                Preguntas Frecuentes
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Respuestas inmediatas a las dudas más habituales sobre compras, probador y tiendas.
              </p>
            </div>

            {/* Filtros de FAQ */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {(['todos', 'compras', 'retracto', 'probador', 'tiendas', 'fundaciones'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                    activeCategory === cat
                      ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)]'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Acordeón de FAQs */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 text-left text-xs sm:text-sm font-bold text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <svg
                      className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[var(--color-accent)]' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--color-border)]/50 px-4 py-3 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed bg-[var(--color-surface-raised)]/20 animate-in fade-in duration-150">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </LegalLayout>
  )
}
