import { Link } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { RecommendedHangingRack } from '@/modules/catalogo/components/RecommendedHangingRack'
import { ProbadorIntro } from '../components/ProbadorIntro'
import { MapaCercano } from '../components/MapaCercano'
import './HomePage.css'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="sr-inicio">
      <section className="sr-inicio-bloque sr-inicio-recomendados" aria-label="Recomendaciones según tu estilo">
        {user && <RecommendedHangingRack key={user.id} userId={String(user.id)} />}
        <div className="sr-inicio-recomendados__pie">
          <Link to="/catalogo" className="sr-inicio-enlace">
            Ver todo el catálogo →
          </Link>
        </div>
      </section>

      <ProbadorIntro />

      <MapaCercano />
    </div>
  )
}
