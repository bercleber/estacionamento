import { Route, Routes } from 'react-router';
import LayoutPrincipal from '../components/layout/LayoutPrincipal.jsx';
import Inicio from '../pages/Inicio.jsx';
import NaoEncontrada from '../pages/NaoEncontrada.jsx';
import Login from '../pages/Login.jsx';
import RotaProtegida from './RotaProtegida.jsx';
import Usuarios from '../pages/Usuarios.jsx';
import Vagas from '../pages/Vagas.jsx';
import Tarifas from '../pages/Tarifas.jsx';
import Clientes from '../pages/Clientes.jsx';
import ClienteDetalhes from '../pages/ClienteDetalhes.jsx';
import Movimentacoes from '../pages/Movimentacoes.jsx';
import HistoricoMovimentacoes from '../pages/HistoricoMovimentacoes.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route element={<LayoutPrincipal />}>
          <Route index element={<Inicio />} />
          <Route path="movimentacoes" element={<Movimentacoes />} />
          <Route path="movimentacoes/historico" element={<HistoricoMovimentacoes />} />
          <Route path="vagas" element={<Vagas />} />
          <Route path="tarifas" element={<Tarifas />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetalhes />} />
          <Route element={<RotaProtegida perfis={['ADMINISTRADOR']} />}>
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  );
}
