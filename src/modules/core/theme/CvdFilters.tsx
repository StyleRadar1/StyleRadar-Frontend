import { MODOS_CVD, CVD_MATRIZ, idFiltroCvd, matrizSvg, type ModoCvdActivo } from './cvdSim'
import './cvdSim.css'

const ACTIVOS = MODOS_CVD.filter((m): m is ModoCvdActivo => m !== 'normal')

/**
 * Define una sola vez los filtros SVG del simulador. Se monta en main.tsx, junto al ThemeProvider;
 * el modo guardado se aplica allí mismo antes de pintar, para que no haya parpadeo.
 */
export function CvdFilters() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {ACTIVOS.map((modo) => (
          <filter key={modo} id={idFiltroCvd(modo)} colorInterpolationFilters="linearRGB">
            <feColorMatrix type="matrix" values={matrizSvg(CVD_MATRIZ[modo])} />
          </filter>
        ))}
      </defs>
    </svg>
  )
}
