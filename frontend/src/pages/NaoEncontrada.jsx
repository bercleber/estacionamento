import { Link } from 'react-router';
import EstadoVazio from '../components/ui/EstadoVazio.jsx';
import Icone from '../components/ui/Icone.jsx';

export default function NaoEncontrada() {
  return (
    <section aria-label="Página não encontrada">
      <EstadoVazio icone="buscar" titulo="Página não encontrada" descricao="O endereço informado não corresponde a uma página.">
        <Link to="/" className="vp-button vp-button-primary"><Icone nome="voltar" />Voltar ao início</Link>
      </EstadoVazio>
    </section>
  );
}
