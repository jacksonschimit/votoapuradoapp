import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { SeletorEleicaoPage } from '@/pages/SeletorEleicaoPage'
import { VisaoEstadoPage } from '@/pages/VisaoEstadoPage'
import { MunicipioPage } from '@/pages/MunicipioPage'
import { ZonaPage } from '@/pages/ZonaPage'
import { LocalVotacaoPage } from '@/pages/LocalVotacaoPage'
import { SecaoPage } from '@/pages/SecaoPage'
import { ComparativoPage } from '@/pages/ComparativoPage'
import { CandidatoPage } from '@/pages/CandidatoPage'
import { TerritoriosPage } from '@/pages/TerritoriosPage'
import { OportunidadesPage } from '@/pages/OportunidadesPage'
import { CenariosPage } from '@/pages/CenariosPage'
import { CandidatosPage } from '@/pages/CandidatosPage'
import { PesquisasPage } from '@/pages/PesquisasPage'
import { RelatoriosPage } from '@/pages/RelatoriosPage'
import { ConfiguracoesPage } from '@/pages/ConfiguracoesPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppShell />}>
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
        <Route path="/dashboard/territorios" element={<TerritoriosPage />} />
        <Route path="/dashboard/oportunidades" element={<OportunidadesPage />} />
        <Route path="/dashboard/cenarios" element={<CenariosPage />} />
        <Route path="/dashboard/comparativo" element={<ComparativoPage />} />
        <Route path="/dashboard/candidatos" element={<CandidatosPage />} />
        <Route path="/dashboard/pesquisas" element={<PesquisasPage />} />
        <Route path="/dashboard/relatorios" element={<RelatoriosPage />} />
        <Route path="/dashboard/configuracoes" element={<ConfiguracoesPage />} />
        <Route
          path="/dashboard/:eleicaoId/:uf/candidato/:sqCandidato"
          element={<CandidatoPage />}
        />
      </Route>
    </Routes>
  )
}

export default App
