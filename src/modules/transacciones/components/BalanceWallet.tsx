import { formatCOP } from '@/modules/core/utils/format'

interface BalanceWalletProps {
  total: number
  plusSum: number
  storeSum: number
}

export function BalanceWallet({ total, plusSum, storeSum }: BalanceWalletProps) {
  return (
    <figure
      className="group relative mx-auto my-6 h-48 w-full max-w-md select-none"
      aria-label="Monedero de pagos aprobados"
    >
      <div className="absolute left-[8%] right-[30%] top-0 h-24 -rotate-6 rounded-2xl border border-white/20 bg-gradient-to-br from-[#9d5cff] to-[#48119a] p-3.5 shadow-[0_12px_30px_-12px_rgba(72,17,154,0.9)] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:-rotate-[8deg] motion-reduce:transition-none">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/75">Radar+</p>
        <p className="mt-1 text-base font-extrabold tabular-nums text-white">{formatCOP(plusSum)}</p>
      </div>

      <div className="absolute left-[30%] right-[8%] top-3 h-24 rotate-[5deg] rounded-2xl border border-white/20 bg-gradient-to-br from-[#9be3b4] to-[#2f7d57] p-3.5 shadow-[0_12px_30px_-12px_rgba(20,80,50,0.9)] transition-transform duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-[7deg] motion-reduce:transition-none">
        <p className="text-right text-[10px] font-bold uppercase tracking-[.16em] text-[#0f2a1d]/75">Tiendas</p>
        <p className="mt-1 text-right text-base font-extrabold tabular-nums text-[#0f2a1d]">{formatCOP(storeSum)}</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden rounded-[1.4rem] border border-white/15 bg-gradient-to-br from-[#2b1655] via-[#1d0f3d] to-[#120826] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.9)]">
        <div className="absolute inset-x-4 top-3 border-t border-dashed border-white/15" aria-hidden="true" />
        <div className="absolute bottom-4 left-5">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-lavanda">Total aprobado</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-blanco">{formatCOP(total)}</p>
        </div>
        <div className="absolute right-0 top-1/2 flex h-14 w-20 -translate-y-1/2 items-center justify-start rounded-l-2xl border border-r-0 border-white/15 bg-gradient-to-br from-[#3d2177] to-[#24124a] pl-3">
          <span className="h-5 w-5 rounded-full border-2 border-[#e8dccb]/80 bg-[#e8dccb]/20" aria-hidden="true" />
        </div>
      </div>

      <figcaption className="sr-only">
        Total aprobado {formatCOP(total)}: Radar+ {formatCOP(plusSum)} y Tiendas {formatCOP(storeSum)}.
      </figcaption>
    </figure>
  )
}
