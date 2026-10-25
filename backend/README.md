# Backend do estacionamento

Node.js, Fastify, JavaScript com ES Modules e o conector oficial `mariadb`.
As versões do Node.js e do pnpm estão fixadas em `mise.toml`.

## Preparação

Execute a partir da pasta `backend`:

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
cp .env.example .env
```

Preencha as credenciais do MariaDB no `.env`. Esse arquivo é local e está
ignorado pelo Git. Se ele já existir, preserve sua configuração.
Configure também `JWT_SECRET` com um segredo aleatório de pelo menos 32
caracteres e `AUTH_ORIGINS` com as origens permitidas do frontend, separadas
por vírgula, sem barra final. A instalação local já tem um segredo gerado.
Em outra instalação, um novo segredo pode ser gerado com:

```bash
mise exec -- node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(48).toString('base64url'))"
```

O `pnpm-workspace.yaml` permite somente o build nativo da dependência Argon2.

## Execução

```bash
mise exec -- pnpm dev
```

O comando `dev` reinicia o servidor quando os arquivos são alterados.
Para executar sem reinicialização automática:

```bash
mise exec -- pnpm start
```

Por padrão, a API atende em `http://127.0.0.1:3000`.
`GET /health` retorna `{"status":"ok"}` e verifica apenas o servidor HTTP.
O pool do MariaDB só é criado quando `getPool()` é chamado por uma operação
que precisa do banco.

## Organização

- `src/app.js`: configuração do Fastify, rotas e tratamento centralizado de erros.
- `src/server.js`: inicialização e encerramento do servidor.
- `src/config/database.js`: criação e encerramento do pool do MariaDB.
- `src/hooks/`: autenticação da sessão e autorização por perfil.
- `src/modules/`: funcionalidades de autenticação, usuários, clientes, veículos,
  vagas, tarifas, movimentações e painel. Endereços pertencem ao módulo de clientes;
  sessões pertencem ao módulo de autenticação.
- `src/utils/`: funções auxiliares compartilhadas, conforme necessário.

Cada módulo terá arquivos `*.routes.js` para os endpoints,
`*.schemas.js` para validação, `*.service.js` para regras de negócio
e `*.repository.js` para SQL parametrizado. Os arquivos serão criados
à medida que as funcionalidades forem implementadas.

Use `import` e `export`, com extensão `.js` nas importações locais, e
`async/await` nas operações assíncronas. Operações de uma mesma transação
devem compartilhar a mesma conexão do pool.

## Autenticação e autorização

O banco deve ter as tabelas `usuarios` e `sessoes_usuarios` conforme
`../docs/database.sql`. A aplicação não cria nem migra tabelas automaticamente.

- `POST /auth/login`: recebe `{ "login": "...", "senha": "..." }`.
- `POST /auth/refresh`: renova os tokens usando o cookie.
- `POST /auth/logout`: revoga a sessão atual e remove o cookie; retorna 204.
- `GET /auth/me`: recebe o access token no header `Authorization: Bearer ...`
  e retorna `id`, `nome`, `login` e `perfil`.
- `PATCH /auth/senha`: recebe `senha_atual` e `nova_senha` e altera somente
  a senha do usuário autenticado, em qualquer um dos três perfis; retorna 204.

Login e renovação retornam `access_token`, `expires_in` e `usuario`.
O JWT usa HS256 e dura até 15 minutos, respeitando o fim da sessão.
O refresh token tem 32 bytes aleatórios; somente seu hash SHA-256 fica no banco.
Cada renovação substitui esse token sem estender a sessão de 8 horas.
Um novo login incrementa a versão e substitui a sessão anterior do usuário.
O logout limpa o hash e a expiração e incrementa a versão, preservando a linha.

O cookie `estacionamento_refresh` usa `HttpOnly`, `SameSite=Strict` e
`Path=/api/auth`, pois o navegador acessa o backend pelo prefixo `/api`.
`Secure` é obrigatório com `NODE_ENV=production` e também pode ser habilitado
localmente com `COOKIE_SECURE=true` quando houver HTTPS.
Login, refresh, logout e alteração de senha exigem um header `Origin` presente em `AUTH_ORIGINS`.
As respostas de autenticação usam `Cache-Control: no-store`.
Login e alteração de senha são limitados a 10 requisições por minuto por IP;
refresh, a 60.

Use `onRequest: app.autenticar` nas rotas protegidas. O hook valida assinatura,
expiração, usuário ativo, vigência e versão da sessão no banco. O perfil atual
é consultado no banco e fica em `request.usuario`.
Para restringir uma operação, use, por exemplo:

```js
onRequest: [app.autenticar, app.autorizar('ADMINISTRADOR', 'GERENTE')]
```

A edição de perfil, a inativação de usuários e a alteração da própria senha
revogam a sessão na mesma transação da alteração.

A alteração de senha identifica o usuário pelo JWT, sem receber um ID no corpo
ou na URL. Na transação, bloqueia o usuário e a sessão, confere novamente sua
vigência e versão e valida a senha atual. Uma senha atual incorreta retorna 400
com código `SENHA_ATUAL_INVALIDA`, preservando a sessão. A nova senha deve ter
entre 8 e 128 caracteres e é armazenada com Argon2id. Ao concluir, a versão da
sessão é incrementada, o refresh token é invalidado e seu cookie é removido.

## Primeiro administrador

Somente quando for autorizado criar o registro no banco, execute em um
terminal interativo:

```bash
mise exec -- pnpm criar-admin
```

O comando solicita nome, login, senha e confirmação, com senha mascarada.
A senha deve ter entre 8 e 128 caracteres e é armazenada com Argon2id.
O administrador fica ativo e com `criado_por = NULL`. A criação é recusada
se já existir qualquer administrador ou se o login já estiver cadastrado.
O comando não é executado automaticamente ao iniciar a aplicação.

## Painel inicial

`GET /painel` exige autenticação e retorna `Cache-Control: no-store`. Não recebe
filtros nesta versão. A sessão determina o perfil; parâmetros enviados pelo
cliente não alteram os grupos retornados.

- Todos os perfis recebem `data_referencia` (`YYYY-MM-DD`), `consultado_em` (ISO)
  e `operacao`: `vagas_livres`, `vagas_ocupadas`, `vagas_cativas_desocupadas`,
  `entradas_hoje` e `saidas_hoje`.
- Gerente e administrador recebem também `gestao`: `vagas_inativas`,
  `clientes_ativos` (`horistas` e `mensalistas`) e `valor_cobrado_hoje`.
- Somente administrador recebe `administracao`: `usuarios_ativos` e
  `usuarios_inativos`. Grupos não permitidos são omitidos, sem consultar seus
  dados específicos.

As vagas seguem a mesma prioridade da listagem: inativa, ocupada, cativa e livre.
Ocupadas incluem cativas com veículo estacionado. Cativas desocupadas ficam
reservadas aos clientes vinculados e não contam como vagas comuns livres.

O dia segue `America/Sao_Paulo`, do início inclusivo ao início exclusivo do dia
seguinte. Entradas são contadas por `entrada_em`; saídas, por `saida_em`, mesmo
que a entrada tenha ocorrido em outra data. O valor cobrado soma somente
`valor_total` gravado nas saídas de horistas do dia, usando o tipo registrado na
movimentação. Não recalcula cobranças e não representa recebimentos.

As contagens usam a mesma conexão e uma visão consistente em uma transação de
consulta, sem gravações. Ausência de registros retorna zero; valores monetários
são strings decimais com duas casas. Consulta bem-sucedida retorna 200; sessão
inválida, 401. Não há alteração no esquema do banco.

## Cadastro de usuários

- `GET /usuarios`: lista `id`, `nome`, `login`, `perfil` e `ativo`, ordenados por nome.
- `POST /usuarios`: recebe `nome`, `login`, `senha` e `perfil`; retorna os mesmos
  dados públicos com status 201. Ambos os endpoints exigem um administrador autenticado.
- `PATCH /usuarios/:id`: recebe `nome`, `login` e `perfil` para editar o cadastro.
- `PATCH /usuarios/:id/situacao`: recebe `{ "ativo": true }` ou `{ "ativo": false }`.
  Os dois endpoints também exigem administrador e retornam os dados públicos com status 200.

Nome e login são obrigatórios, com até 150 e 100 caracteres, respectivamente.
A senha deve ter entre 8 e 128 caracteres. O perfil deve ser `ADMINISTRADOR`,
`GERENTE` ou `OPERADOR`. Nome e login são gravados sem espaços nas extremidades.
A senha é armazenada com Argon2id; `ativo` é definido como verdadeiro e
`criado_por` recebe o ID do administrador autenticado.

Dados inválidos retornam 400; sessão inválida, 401; perfil sem permissão, 403;
login duplicado, 409 com código `LOGIN_DUPLICADO`. As respostas usam uma lista
explícita de campos públicos e não incluem credenciais ou informações da sessão.

Na edição, a senha é preservada. Usuário inexistente retorna 404 com código
`USUARIO_NAO_ENCONTRADO`. A inativação ou mudança de perfil do último administrador
ativo retorna 409 com código `ULTIMO_ADMINISTRADOR`.

As alterações bloqueiam os usuários em ordem de ID dentro de uma transação.
Esse bloqueio serializa as alterações neste cadastro pequeno e permite conferir
o perfil atual de quem executa a operação e a quantidade de administradores
ativos antes de gravar. Alterar o perfil ou inativar revoga a sessão do usuário
afetado; ativar exige um novo login quando a sessão anterior já foi revogada.
Repetir a situação atual não revoga a sessão.

Se o administrador alterar seu próprio perfil ou inativar sua própria conta,
a resposta também remove o cookie de renovação. A regra do último administrador
ativo continua sendo aplicada a essas operações.

## Vagas

- `GET /vagas`: disponível para todos os usuários autenticados.
- `POST /vagas`: recebe `{ "numero": "A01" }`; retorna 201.
- `PATCH /vagas/:id`: recebe `{ "numero": "A02" }`; retorna 200.
- `PATCH /vagas/:id/situacao`: recebe `{ "ativa": true }` ou `{ "ativa": false }`;
  retorna 200. As três operações de escrita exigem administrador ou gerente.

As respostas contêm `id`, `numero`, `ativa` e `disponibilidade`. O número é
obrigatório, limitado a 10 caracteres, convertido para maiúsculas e gravado sem
espaços nas extremidades. Uma nova vaga fica ativa e registra o usuário criador.
O número deve ser único, inclusive entre vagas inativas. A edição altera somente
o número, preservando o ID, os vínculos e o histórico. Não existe exclusão física.

A disponibilidade segue esta prioridade: `INATIVA`, `OCUPADA` (movimentação sem
saída), `CATIVA` (vínculo com cliente) e `LIVRE`. Uma vaga cativa ocupada aparece
como `OCUPADA`. Qualquer vínculo com cliente impede a inativação, assim como
uma movimentação em aberto. A atribuição de vagas cativas pertence ao futuro
módulo de clientes.

Dados inválidos retornam 400; sessão inválida, 401; perfil sem permissão, 403;
vaga inexistente, 404 (`VAGA_NAO_ENCONTRADA`); número repetido, 409
(`VAGA_DUPLICADA`). A tentativa de inativar uma vaga ocupada ou cativa retorna
409 com `VAGA_OCUPADA` ou `VAGA_CATIVA`, respectivamente.

As gravações usam transações. Edição e alteração de situação bloqueiam a linha
da vaga; a inativação também consulta os vínculos com bloqueio. Entradas e
atribuições de vagas cativas bloqueiam a mesma linha da vaga antes de validar
sua situação e criar o vínculo.

## Tarifas

- `GET /tarifas`: todos os perfis autenticados; retorna a configuração ou `null`, com status 200.
- `PUT /tarifas`: administrador e gerente; cria a configuração com status 201 ou
  atualiza a existente com status 200. Não há exclusão.

O corpo do `PUT` exige `valor_hora` e `valor_mes` como strings decimais, por exemplo
`{ "valor_hora": "5.00", "valor_mes": "250.00" }`. Os valores devem estar entre
`0.00` e `99999999.99`, com até duas casas decimais, sem sinal, espaços,
separadores de milhar ou notação científica. Números JSON também são rejeitados.
Valores inválidos retornam 400 (`VALOR_TARIFA_INVALIDO`); campos ausentes, 400;
sessão inválida, 401; perfil sem permissão de escrita, 403.

As respostas contêm somente `id`, `valor_hora` e `valor_mes`, com valores monetários
em strings com duas casas decimais. O conector mantém os campos `DECIMAL` como
strings; não se usa ponto flutuante para validar ou gravar as tarifas.

A configuração usa sempre o ID 1. A chave primária impede a criação de registros
duplicados mesmo em cadastros simultâneos. Cada gravação é transacional e altera
os dois valores juntos. Quando a inserção encontra o registro existente, essa
tentativa é revertida antes de atualizar os valores em uma nova transação.
`criado_por` registra quem fez o primeiro cadastro e é preservado nas alterações,
assim como o ID e a data de criação. Não é necessária alteração no esquema SQL.

A entrada de horistas copia o `valor_hora` para `valor_hora_aplicado`. Alterações
posteriores das tarifas não recalculam movimentações existentes.

## Clientes, veículos e endereços

Todos os endpoints exigem autenticação e retornam `Cache-Control: no-store`.

| Método | Endpoint | Permissão |
| --- | --- | --- |
| GET | `/clientes` | Todos os perfis |
| GET | `/clientes/:id` | Todos os perfis |
| POST | `/clientes` | Todos os perfis |
| PATCH | `/clientes/:id` | Todos os perfis |
| PATCH | `/clientes/:id/situacao` | Administrador e gerente |
| PATCH | `/clientes/:id/vaga-cativa` | Administrador e gerente |
| GET | `/clientes/:id/veiculos` | Todos os perfis |
| POST | `/clientes/:id/veiculos` | Todos os perfis |
| PATCH | `/clientes/:id/veiculos/:veiculoId` | Todos os perfis |
| PATCH | `/clientes/:id/veiculos/:veiculoId/situacao` | Administrador e gerente |
| POST | `/clientes/:id/enderecos` | Todos os perfis |
| PATCH | `/clientes/:id/enderecos/:enderecoId` | Todos os perfis |
| PATCH | `/clientes/:id/enderecos/:enderecoId/principal` | Todos os perfis |
| DELETE | `/clientes/:id/enderecos/:enderecoId` | Todos os perfis |

O cadastro recebe `nome`, `tipo` (`HORISTA` ou `MENSALISTA`), `cpf`, `telefone` e
um objeto `veiculo` obrigatório, com `placa`, `modelo` e `cor`. Exemplo:

```json
{
  "nome": "Maria Silva",
  "tipo": "HORISTA",
  "veiculo": { "placa": "ABC1D23", "modelo": "Fiat Uno", "cor": "Branco" }
}
```

Nome, tipo e a placa do primeiro veículo são obrigatórios. O cliente e seu primeiro
veículo são gravados na mesma conexão e transação; uma placa duplicada reverte
também a criação do cliente. Não é possível criar um cliente sem veículo pela API.
Nome tem até 150 caracteres e telefone até 20.
CPF é opcional, aceita 11 dígitos ou a máscara `000.000.000-00` e tem os dígitos
verificadores conferidos. É gravado sem máscara, com unicidade inclusive para
clientes inativos. Textos são aparados; opcionais vazios viram `NULL`.
O cliente começa ativo e sem vaga cativa; o criador é identificado pela sessão.
O PATCH dos dados básicos aceita alterações parciais e não altera situação ou
vaga cativa. Clientes não são excluídos fisicamente.

As respostas de clientes contêm `id`, `nome`, `cpf`, `telefone`, `tipo`, `ativo`,
`vaga_cativa_id` e `vaga_cativa_numero`. A listagem inclui inativos. A consulta
individual também inclui `enderecos`, ordenados por ID, e `veiculos`, ordenados
por placa e ID. O cadastro retorna o cliente com o primeiro veículo em `veiculos`.

A situação recebe `{ "ativo": false }` ou `{ "ativo": true }`, com booleanos
estritos. A inativação exige ausência de movimentação em aberto e de vaga cativa.
Mudar o tipo exige ausência de movimentação em aberto; mudar para horista também
exige remover a vaga cativa. Os veículos não são alterados automaticamente.

A vaga cativa recebe `{ "vaga_cativa_id": 3 }` ou `null` no mesmo campo para
desvincular. Somente mensalistas ativos recebem vagas; a vaga deve estar ativa,
desocupada e sem outro cliente vinculado. Vincular, trocar ou remover exige que
o cliente esteja sem movimentação em aberto. A remoção também é permitida para
sanear um vínculo preexistente de cliente inativo. Vagas antigas e novas são
bloqueadas em ordem de ID antes do cliente; mudanças concorrentes de vínculo
retornam 409 e exigem atualizar a consulta.

Endereços recebem `logradouro` (até 150), `numero` (20), `complemento` (100),
`bairro` (100), `cidade` (100), `estado` (UF válida) e `cep` (8 dígitos, com ou sem
hífen). Logradouro, cidade e UF são obrigatórios. UF é convertida para maiúsculas;
CEP é gravado sem máscara. A edição aceita alterações parciais. O primeiro
endereço é principal; o endpoint `/principal` não precisa de corpo e transfere
essa condição ao endereço escolhido. Remover o principal promove o endereço
restante mais antigo. `principal` não é editável no cadastro ou PATCH comum.
Todos os endereços são conferidos dentro do cliente informado, inclusive nas
operações de edição, principal e remoção. As gravações bloqueiam o cliente e
seus endereços na mesma transação para serializar alterações desse conjunto.

Cadastros retornam 201; consultas e alterações, 200; remoção de endereço, 204.
Dados inválidos retornam 400; sessão inválida, 401; falta de permissão, 403;
cliente/endereço/vaga inexistentes, 404. CPF duplicado, movimentação em aberto,
vaga indisponível e conflitos de situação/tipo retornam 409 com mensagem e código.

As entradas verificam se o cliente está ativo e bloqueiam a vaga antes do cliente
na transação. Inativar um cliente impede novas entradas de seus veículos,
preservando os registros existentes.

### Veículos vinculados ao cliente

Não há endpoints independentes em `/veiculos`. O cliente é identificado pela
URL e não pode ser trocado no corpo do cadastro ou edição do veículo. Toda
consulta ou alteração confere o cliente; edição e situação também conferem se
o veículo pertence a ele. Não existe exclusão física nem transferência entre
clientes neste fluxo.

O cadastro adicional recebe `placa` obrigatória, `modelo` (opcional, até 100
caracteres) e `cor` (opcional, até 40). A placa aceita os padrões `ABC1234` e
`ABC1D23`, é convertida para maiúsculas e gravada sem espaços ou hífen. A placa
é única inclusive entre veículos inativos. O veículo começa ativo e registra
o criador autenticado. Modelo e cor vazios são gravados como `NULL`.

O cliente deve estar ativo para receber um veículo ou para reativá-lo. Modelo,
cor e placa podem ser editados parcialmente pelo PATCH. Movimentação em aberto
impede mudança de placa e inativação, mas permite corrigir modelo e cor. A
situação recebe `{ "ativo": true }` ou `{ "ativo": false }`, com booleanos
estritos, e exige administrador ou gerente.

As respostas de veículos contêm `id`, `cliente_id`, `cliente_nome`,
`cliente_ativo`, `placa`, `modelo`, `cor` e `ativo`. A listagem inclui inativos.
Erros seguem o padrão do módulo: 400 para dados inválidos, 401 para sessão,
403 para situação sem permissão, 404 para cliente ou veículo não pertencente
ao cliente e 409 para placa duplicada (`PLACA_DUPLICADA`), cliente inativo
(`CLIENTE_INATIVO`) ou movimentação em aberto (`VEICULO_COM_MOVIMENTACAO`).

As gravações adicionais bloqueiam o cliente antes do veículo. O módulo de
movimentações segue a ordem vaga, cliente e veículo e confere se ambos os
cadastros estão ativos. Alterações cadastrais não reescrevem as
movimentações ou sua `placa_registrada`. O esquema do banco permanece o mesmo.

## Movimentações: entradas

Todos os perfis autenticados podem consultar e registrar entradas. As respostas
usam `Cache-Control: no-store`.

- `GET /movimentacoes/consulta-entrada?placa=ABC1D23`: normaliza e consulta a
  placa cadastrada; retorna `veiculo`, `cliente`, `vagas_permitidas` e `valor_hora`.
- `POST /movimentacoes/entradas`: recebe somente `{ "veiculo_id": 5, "vaga_id": 2 }`
  e retorna a movimentação com status 201. Outros campos no corpo são rejeitados.
- `GET /movimentacoes/em-aberto`: lista entradas sem saída, em ordem decrescente
  de horário e ID, com dados do veículo, cliente, vaga e operador.

Horistas e mensalistas sem vaga cativa utilizam somente vagas comuns ativas e
desocupadas. Mensalistas com vaga cativa utilizam exclusivamente a própria vaga.
Qualquer vínculo cativo impede o uso por outros clientes, mesmo quando ela está
vazia. A consulta retorna uma lista vazia se não houver vagas permitidas livres.
Cliente e veículo devem estar ativos e o veículo não pode ter outra entrada em
aberto. Placa desconhecida exige cadastro na ficha de um cliente, sem criação
automática de clientes ou veículos durante a entrada.

O POST busca novamente os dados dos cadastros e define cliente, placa registrada,
tipo, operador e horário de entrada. O horário é gerado pelo banco; a API retorna
datas em ISO 8601 e o frontend exibe data/hora local. Horistas exigem tarifa
configurada, inclusive quando o valor for zero. A tarifa é lida novamente com
bloqueio compartilhado e copiada como decimal para `valor_hora_aplicado`.
Mensalistas ficam com esse campo `NULL`, sem gerar cobrança mensal. Os campos
`saida_em`, `valor_total` e `usuario_saida_id` começam como `NULL`.

A consulta por placa é uma prévia. A confirmação ocorre em uma única transação,
bloqueando vaga, cliente e veículo, nessa ordem. A primeira leitura consistente
das ocupações ocorre somente depois desses bloqueios, para enxergar uma entrada
concorrente já confirmada. Os bloqueios nos cadastros serializam tentativas para
a mesma vaga ou veículo, sem bloquear lacunas na tabela de movimentações.
A saída respeita a mesma ordem de bloqueios. A aplicação não
altera o esquema SQL nem cria índices ou registros ao iniciar.

Consultas retornam 200; entrada confirmada, 201. Dados inválidos retornam 400;
sessão inválida, 401; placa/veículo/vaga inexistentes, 404. Conflitos retornam 409:
`CLIENTE_INATIVO`, `VEICULO_INATIVO`, `VEICULO_JA_ESTACIONADO`, `VAGA_INATIVA`,
`VAGA_OCUPADA`, `VAGA_NAO_PERMITIDA` ou `TARIFA_NAO_CONFIGURADA`.
O histórico permite consultar movimentações abertas e encerradas, conforme descrito abaixo.

## Movimentações: saída e cobrança

Todos os perfis autenticados podem consultar e confirmar saídas:

- `GET /movimentacoes/:id/previa-saida`: retorna `movimentacao`, `saida_prevista_em`,
  `tempo_total_segundos`, `horas_cobradas` e `valor_total`, com status 200. A tarifa
  aplicada está em `movimentacao.valor_hora_aplicado`. A consulta não altera dados.
- `POST /movimentacoes/:id/saida`: confirma a saída e retorna a movimentação
  encerrada com status 200, incluindo a duração, horas cobradas, valor final,
  horário e identificação do operador da saída. Não exige corpo; um objeto vazio
  também é aceito. Qualquer valor, horário ou outro dado no corpo é rejeitado.

A cobrança usa exclusivamente o tipo e a tarifa registrados na entrada. Para
horistas, as horas são `ceil(max(0, segundos - 300) / 3600)`: até 5 minutos é
gratuito; de 5min01s até 1h05min cobra uma hora; de 1h05min01s até 2h05min cobra
duas horas, e assim por diante. A tarifa decimal é convertida para centavos
inteiros com `BigInt`, multiplicada pelas horas e devolvida como string com duas
casas decimais. Tarifa zero continua válida. Mensalistas têm zero horas cobradas
e `valor_total = "0.00"`, independentemente da tarifa atual.

Prévia e confirmação utilizam o relógio do banco para medir a permanência. O POST
captura o horário novamente após adquirir os bloqueios, calcula e grava o mesmo
instante em `saida_em`, junto com `valor_total` e `usuario_saida_id` da sessão.
Os dados da entrada são preservados. O valor final pode mudar em relação à prévia
se o tempo ultrapassar uma faixa de cobrança.

A transação bloqueia vaga, cliente, veículo e movimentação, nessa ordem. Depois
confere novamente se a movimentação está aberta; o UPDATE também exige
`saida_em IS NULL`. Duas confirmações simultâneas não encerram o mesmo registro
duas vezes. Não é exigido que os cadastros estejam ativos para encerrar uma
permanência já iniciada. Após o commit, a movimentação deixa a listagem em aberto;
a vaga comum fica livre e a vaga cativa permanece reservada ao cliente.

ID ou corpo inválidos retornam 400; sessão inválida, 401; movimentação inexistente,
404; saída já registrada, 409 (`SAIDA_JA_REGISTRADA`). Dados inconsistentes de
horário ou tarifa e cobrança acima do limite `DECIMAL(10,2)` também retornam 409,
sem gravar a saída (`TEMPO_ESTACIONADO_INVALIDO`, `TARIFA_ENTRADA_INVALIDA`,
`VALOR_COBRANCA_EXCEDIDO`). A aplicação não altera o esquema do banco.

## Histórico de movimentações

Todos os perfis autenticados possuem acesso somente de consulta:

- `GET /movimentacoes/historico`: recebe os filtros opcionais `data_inicio`,
  `data_fim`, `placa`, `cliente_id`, `situacao` e `pagina`.
- `GET /movimentacoes/:id`: retorna os dados da movimentação, sua `situacao`,
  o instante `consultado_em` e `tempo_total_segundos`.

Datas usam `YYYY-MM-DD` e filtram a entrada pelo calendário de
`America/Sao_Paulo`. A data inicial começa no início do dia local; a final inclui
o dia completo, usando o início do dia seguinte como limite exclusivo. A
conversão considera inclusive o antigo horário de verão. Datas impossíveis e
intervalo invertido retornam 400 (`PERIODO_INVALIDO`). Um único limite também
é permitido. Sem datas, não há restrição de período.

Placa é normalizada e comparada exatamente com `placa_registrada`, preservando
a identificação utilizada na entrada mesmo após uma alteração no cadastro do
veículo. Cliente é filtrado pelo ID registrado na movimentação, inclusive para
clientes inativos. A situação aceita `ABERTA` ou `ENCERRADA`; ausente inclui
ambas. Cliente sem movimentações retorna uma consulta vazia.

A página começa em 1 e tem tamanho fixo de 20 registros. A resposta contém
`itens`, `pagina`, `por_pagina`, `total` e `total_paginas`. A ordenação é por
`entrada_em DESC, id DESC`. Página além dos resultados retorna itens vazios;
sem resultados, `total_paginas` é zero. Contagem e listagem usam a mesma transação
de leitura, para manter coerência durante registros de entrada ou saída.
Todos os valores de filtros são enviados por parâmetros SQL.

Os itens incluem os dados públicos já utilizados nas movimentações e `situacao`.
Nos detalhes, a duração é medida da entrada até a saída gravada; se ainda aberta,
até o relógio do banco no instante da consulta. O cálculo não chama a rotina de
cobrança, não consulta tarifas atuais e não grava alterações. `valor_total` e
`valor_hora_aplicado` são os valores armazenados, inclusive zero e `NULL`.
Dados textuais vinculados, como nome do cliente, modelo e nome do operador,
são consultados nos respectivos cadastros; placa, tipo e valores são os gravados
na movimentação. Nenhum campo novo é necessário no banco.

Consultas retornam 200, inclusive para listas vazias; filtros/IDs inválidos,
400; sessão inválida, 401; ID inexistente na consulta de detalhes, 404.
Os endpoints mantêm `Cache-Control: no-store`.
