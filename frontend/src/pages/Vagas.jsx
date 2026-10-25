import TituloPagina from '../components/ui/TituloPagina.jsx';
import EstadoVazio from '../components/ui/EstadoVazio.jsx';
import Icone from '../components/ui/Icone.jsx';
import Selo from '../components/ui/Selo.jsx';
import MaisAcoes from '../components/ui/MaisAcoes.jsx';
import Carregando from '../components/ui/Carregando.jsx';
import { useEffect, useState } from 'react';
import FormularioVaga from '../components/vagas/FormularioVaga.jsx';
import ConfirmarSituacaoVaga from '../components/vagas/ConfirmarSituacaoVaga.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { listarVagas } from '../services/vagas.service.js';
import { useAuth } from '../hooks/useAuth.js';

const disponibilidades = {
  LIVRE: { nome: 'Livre', tom: 'sucesso' },
  OCUPADA: { nome: 'Ocupada', tom: 'aviso' },
  CATIVA: { nome: 'Cativa', tom: 'informacao' },
  INATIVA: { nome: 'Inativa', tom: 'neutro' },
};

export default function Vagas() {
  const { usuario } = useAuth();
  const podeGerenciar = ['ADMINISTRADOR', 'GERENTE'].includes(usuario.perfil);
  const [vagas, setVagas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [vagaSituacao, setVagaSituacao] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    listarVagas({ signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setVagas(dados); })
      .catch(() => {
        if (!controller.signal.aborted) setErro('Não foi possível carregar as vagas. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  function abrirFormulario(vaga = null) {
    setSucesso('');
    setFormulario({ vaga });
  }

  function operacaoConcluida(mensagem) {
    setFormulario(null);
    setVagaSituacao(null);
    setSucesso(mensagem);
    setAtualizacao((atual) => atual + 1);
  }

  function acoesVaga(vaga) {
    if (!podeGerenciar) return null;
    return <div className="flex flex-wrap gap-2">
      <Botao variante="secundario" onClick={() => abrirFormulario(vaga)} aria-label={`Editar vaga ${vaga.numero}`}><Icone nome="editar" />Editar</Botao>
      <MaisAcoes ariaLabel={`Mais ações da vaga ${vaga.numero}`}>
        <Botao variante="secundario" className="w-full" onClick={() => { setSucesso(''); setVagaSituacao(vaga); }} aria-label={`${vaga.ativa ? 'Inativar' : 'Ativar'} vaga ${vaga.numero}`}>{vaga.ativa ? 'Inativar' : 'Ativar'} vaga</Botao>
      </MaisAcoes>
    </div>;
  }

  return (
    <section aria-labelledby="titulo-vagas" className="space-y-6">
      <TituloPagina id="titulo-vagas" icone="vagas" titulo="Vagas" descricao="Consulte a disponibilidade das vagas do estacionamento.">
        {podeGerenciar && <Botao onClick={() => abrirFormulario()}><Icone nome="adicionar" />Nova vaga</Botao>}
      </TituloPagina>
      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>}
      {carregando ? <Carregando>Carregando vagas…</Carregando> : !erro && (
        vagas.length === 0 ? <EstadoVazio icone="vagas" titulo="Nenhuma vaga cadastrada" descricao={podeGerenciar ? 'Use “Nova vaga” para cadastrar uma vaga do estacionamento.' : 'As vagas aparecerão aqui após o cadastro.'} /> : (
          <>
            <p role="status" className="text-sm font-medium text-muted">{vagas.length} {vagas.length === 1 ? 'vaga cadastrada' : 'vagas cadastradas'}</p>
            <div className="vp-panel hidden lg:block">
              <table className="vp-table">
                <caption className="sr-only">Vagas cadastradas no estacionamento</caption>
                <thead><tr><th scope="col">Número</th><th scope="col">Disponibilidade</th>{podeGerenciar && <th scope="col">Ações</th>}</tr></thead>
                <tbody>{vagas.map((vaga) => <tr key={vaga.id}>
                  <td className="break-words text-lg font-bold tabular-nums">{vaga.numero}</td>
                  <td><Selo tom={disponibilidades[vaga.disponibilidade].tom}>{disponibilidades[vaga.disponibilidade].nome}</Selo></td>
                  {podeGerenciar && <td>{acoesVaga(vaga)}</td>}
                </tr>)}</tbody>
              </table>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:hidden">{vagas.map((vaga) => <li key={vaga.id} className="vp-panel min-w-0 space-y-5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-muted">Vaga</p><h2 className="mt-1 break-all text-3xl font-extrabold tabular-nums">{vaga.numero}</h2></div><Selo tom={disponibilidades[vaga.disponibilidade].tom}>{disponibilidades[vaga.disponibilidade].nome}</Selo></div>
              {podeGerenciar && <div className="border-t border-slate-100 pt-4">{acoesVaga(vaga)}</div>}
            </li>)}</ul>
          </>
        )
      )}

      {podeGerenciar && formulario && (
        <FormularioVaga
          key={formulario.vaga?.id ?? 'nova'}
          vaga={formulario.vaga}
          onFechar={() => setFormulario(null)}
          onSalvo={() => operacaoConcluida(formulario.vaga
            ? 'Vaga atualizada com sucesso.' : 'Vaga cadastrada com sucesso.')}
        />
      )}
      {podeGerenciar && vagaSituacao && (
        <ConfirmarSituacaoVaga
          vaga={vagaSituacao}
          onFechar={() => setVagaSituacao(null)}
          onConfirmado={(salva) => operacaoConcluida(
            salva.ativa ? 'Vaga ativada com sucesso.' : 'Vaga inativada com sucesso.',
          )}
        />
      )}
    </section>
  );
}
