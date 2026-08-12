import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { SeletorEleicaoPage } from '@/pages/SeletorEleicaoPage'
import { VisaoEstadoPage } from '@/pages/VisaoEstadoPage'
import { MunicipioPage } from '@/pages/MunicipioPage'
import { ZonaPage } from '@/pages/ZonaPage'
import { LocalVotacaoPage } from '@/pages/LocalVotacaoPage'
import { SecaoPage } from '@/pages/SecaoPage'
import { ComparativoPage } from '@/pages/ComparativoPage'
import { CandidatoPage } from '@/pages/CandidatoPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<SeletorEleicaoPage />} />
        <Route path="/dashboard/:eleicaoId/:uf" element={<VisaoEstadoPage />} />
        <Route
          path="/dashboard/:eleicaoId/:uf/municipio/:codigoIbge"
          element={<MunicipioPage />}
        />
        <Route
          path="/dashboard/:eleicaoId/:uf/municipio/:codigoIbge/zona/:zonaId"
          element={<ZonaPage />}
        />
        <Route
          path="/dashboard/:eleicaoId/:uf/municipio/:codigoIbge/zona/:zonaId/local/:localVotacaoId"
          element={<LocalVotacaoPage />}
        />
        <Route
          path="/dashboard/:eleicaoId/:uf/municipio/:codigoIbge/zona/:zonaId/secao/:secaoId"
          element={<SecaoPage />}
        />
        <Route path="/dashboard/comparativo" element={<ComparativoPage />} />
        <Route
          path="/dashboard/:eleicaoId/:uf/candidato/:sqCandidato"
          element={<CandidatoPage />}
        />
      </Route>
    </Routes>
  )
}

export default App
