import { useEffect, useRef } from 'react'

interface SizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  tipoPrenda?: string
}

export function SizeGuideModal({ isOpen, onClose, tipoPrenda = 'general' }: SizeGuideModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sizeGuideTitle"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl text-[var(--color-text)] animate-in zoom-in-95 duration-150"
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--color-accent)]">
              Referencia de medidas {tipoPrenda ? `· ${tipoPrenda}` : ''}
            </span>
            <h2 id="sizeGuideTitle" className="text-lg font-black tracking-tight text-[var(--color-text)]">
              Guía de tallas colombianas
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía de tallas"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition"
          >
            ✕
          </button>
        </div>

        {/* Tabla de medidas superiores */}
        <div className="mt-5 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text)] mb-2">
              Prendas superiores (Buzos, Chaquetas, Camisas, Sacos)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-raised)]/80 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Talla</th>
                    <th className="py-2.5 px-3">Pecho (cm)</th>
                    <th className="py-2.5 px-3">Cintura (cm)</th>
                    <th className="py-2.5 px-3">Largo (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">XS</td>
                    <td className="py-2 px-3">86 - 91</td>
                    <td className="py-2 px-3">71 - 76</td>
                    <td className="py-2 px-3">66 - 68</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">S</td>
                    <td className="py-2 px-3">91 - 96</td>
                    <td className="py-2 px-3">76 - 81</td>
                    <td className="py-2 px-3">68 - 70</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">M</td>
                    <td className="py-2 px-3">96 - 101</td>
                    <td className="py-2 px-3">81 - 86</td>
                    <td className="py-2 px-3">70 - 72</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">L</td>
                    <td className="py-2 px-3">101 - 106</td>
                    <td className="py-2 px-3">86 - 91</td>
                    <td className="py-2 px-3">72 - 74</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">XL</td>
                    <td className="py-2 px-3">106 - 111</td>
                    <td className="py-2 px-3">91 - 96</td>
                    <td className="py-2 px-3">74 - 76</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de pantalones y jeans */}
          <div className="pt-2">
            <h3 className="font-bold text-sm text-[var(--color-text)] mb-2">
              Prendas inferiores (Pantalones, Jeans, Bermudas)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-raised)]/80 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Talla (CO/US)</th>
                    <th className="py-2.5 px-3">Cintura (cm)</th>
                    <th className="py-2.5 px-3">Cadera (cm)</th>
                    <th className="py-2.5 px-3">Largo total (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">28</td>
                    <td className="py-2 px-3">71 - 74</td>
                    <td className="py-2 px-3">87 - 90</td>
                    <td className="py-2 px-3">100 - 102</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">30</td>
                    <td className="py-2 px-3">76 - 79</td>
                    <td className="py-2 px-3">92 - 95</td>
                    <td className="py-2 px-3">102 - 104</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">32</td>
                    <td className="py-2 px-3">81 - 84</td>
                    <td className="py-2 px-3">97 - 100</td>
                    <td className="py-2 px-3">104 - 106</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)]">34</td>
                    <td className="py-2 px-3">86 - 89</td>
                    <td className="py-2 px-3">102 - 105</td>
                    <td className="py-2 px-3">106 - 108</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Consejo local */}
        <div className="mt-5 rounded-2xl bg-[var(--color-surface-raised)]/70 border border-[var(--color-border)] p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <p className="font-semibold text-[var(--color-text)] mb-1">
            💡 ¿Tienes dudas con el corte o la silueta?
          </p>
          Las prendas de autor y segunda mano en Bogotá pueden tener variaciones según el patronaje de cada taller o marca. Si dudas entre dos tallas, pulsa en «Escribir a la tienda» para confirmar medidas exactas antes de reservar o visitarlos.
        </div>

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--color-accent)] px-5 py-2 text-xs font-bold text-[var(--color-text-on-accent)] hover:brightness-110 transition shadow"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
