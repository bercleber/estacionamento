import { withTransaction } from '../../config/database.js';
import { inicioDia } from '../../utils/datas.js';
import * as repository from './painel.repository.js';

const calendario = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function consultarPainel(perfil) {
  return withTransaction(async (connection) => {
    const consultadoEm = new Date();
    const partes = calendario.formatToParts(consultadoEm);
    const obter = (tipo) => partes.find((parte) => parte.type === tipo).value;
    const dataReferencia = `${obter('year')}-${obter('month')}-${obter('day')}`;
    const proximoDia = new Date(`${dataReferencia}T00:00:00Z`);
    proximoDia.setUTCDate(proximoDia.getUTCDate() + 1);
    const inicio = inicioDia(dataReferencia);
    const fim = inicioDia(proximoDia.toISOString().slice(0, 10));

    // Todas as contagens usam a mesma conexão e visão consistente dos registros.
    const vagas = await repository.contarVagas(connection);
    const movimentacoes = await repository.contarMovimentacoes(inicio, fim, connection);
    const painel = {
      data_referencia: dataReferencia,
      consultado_em: consultadoEm.toISOString(),
      operacao: {
        vagas_livres: vagas.LIVRE,
        vagas_ocupadas: vagas.OCUPADA,
        vagas_cativas_desocupadas: vagas.CATIVA,
        entradas_hoje: movimentacoes.entradas,
        saidas_hoje: movimentacoes.saidas,
      },
    };

    if (['GERENTE', 'ADMINISTRADOR'].includes(perfil)) {
      painel.gestao = {
        vagas_inativas: vagas.INATIVA,
        clientes_ativos: await repository.contarClientesAtivos(connection),
        valor_cobrado_hoje: await repository.somarCobrancas(inicio, fim, connection),
      };
    }
    if (perfil === 'ADMINISTRADOR') {
      const usuarios = await repository.contarUsuarios(connection);
      painel.administracao = { usuarios_ativos: usuarios.ativos, usuarios_inativos: usuarios.inativos };
    }
    return painel;
  });
}
