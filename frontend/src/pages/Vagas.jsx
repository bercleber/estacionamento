import { useEffect, useState } from 'react';
import FormularioVaga from '../components/vagas/FormularioVaga.jsx';
import ConfirmarSituacaoVaga from '../components/vagas/ConfirmarSituacaoVaga.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { listarVagas } from '../services/vagas.service.js';
import { useAuth } from '../hooks/useAuth.js';

const disponibilidades = {
  LIVRE: { nome: 'Livre', estilo: 'bg-emerald-50 text-emerald-700' },
  OCUPADA: { nome: 'Ocupada', estilo: 'bg-amber-50 text-amber-800' },
  CATIVA: { nome: 'Cativa', estilo: 'bg-blue-50 text-blue-700' },
  INATIVA: { nome: 'Inativa', estilo: 'bg-slate-100 text-slate-600' },
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

  return (
    <section aria-labelledby="titulo-vagas" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="titulo-vagas" className="text-2xl font-semibold tracking-tight">Vagas</h1>
          <p className="mt-2 text-sm text-slate-600">Consulte a disponibilidade das vagas do estacionamento.</p>
        </div>
        {podeGerenciar && <Botao onClick={() => abrirFormulario()}>Nova vaga</Botao>}
      </div>

      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && (
        <div className="space-y-3">
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      )}

      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando vagas…</p> : !erro && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Vagas cadastradas no estacionamento</caption>
            <thead className="border-b border-slate-200 bg-slate-100/60 text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium">Número</th>
                <th scope="col" className="px-5 py-4 font-medium">Disponibilidade</th>
                {podeGerenciar && <th scope="col" className="px-5 py-4 font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vagas.map((vaga) => (
                <tr key={vaga.id}>
                  <td className="break-words px-5 py-4 font-medium">{vaga.numero}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${disponibilidades[vaga.disponibilidade].estilo}`}>
                      {disponibilidades[vaga.disponibilidade].nome}
                    </span>
                  </td>
                  {podeGerenciar && (
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Botao variante="secundario" onClick={() => abrirFormulario(vaga)} aria-label={`Editar vaga ${vaga.numero}`}>
                          Editar
                        </Botao>
                        <Botao
                          variante="secundario"
                          onClick={() => { setSucesso(''); setVagaSituacao(vaga); }}
                          aria-label={`${vaga.ativa ? 'Inativar' : 'Ativar'} vaga ${vaga.numero}`}
                        >
                          {vaga.ativa ? 'Inativar' : 'Ativar'}
                        </Botao>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {vagas.length === 0 && (
                <tr><td colSpan={podeGerenciar ? 3 : 2} className="px-5 py-8 text-center text-slate-500">Nenhuma vaga cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
