const contagem = { type: 'integer', minimum: 0 };

const operacao = {
  type: 'object', additionalProperties: false,
  required: ['vagas_livres', 'vagas_ocupadas', 'vagas_cativas_desocupadas', 'entradas_hoje', 'saidas_hoje'],
  properties: {
    vagas_livres: contagem,
    vagas_ocupadas: contagem,
    vagas_cativas_desocupadas: contagem,
    entradas_hoje: contagem,
    saidas_hoje: contagem,
  },
};

const gestao = {
  type: 'object', additionalProperties: false,
  required: ['vagas_inativas', 'clientes_ativos', 'valor_cobrado_hoje'],
  properties: {
    vagas_inativas: contagem,
    clientes_ativos: {
      type: 'object', additionalProperties: false,
      required: ['horistas', 'mensalistas'],
      properties: { horistas: contagem, mensalistas: contagem },
    },
    valor_cobrado_hoje: { type: 'string', pattern: '^[0-9]+\\.[0-9]{2}$' },
  },
};

const administracao = {
  type: 'object', additionalProperties: false,
  required: ['usuarios_ativos', 'usuarios_inativos'],
  properties: { usuarios_ativos: contagem, usuarios_inativos: contagem },
};

export const consultarPainelSchema = {
  response: {
    200: {
      type: 'object', additionalProperties: false,
      required: ['data_referencia', 'consultado_em', 'operacao'],
      properties: {
        data_referencia: { type: 'string', format: 'date' },
        consultado_em: { type: 'string', format: 'date-time' },
        operacao,
        gestao,
        administracao,
      },
    },
  },
};
