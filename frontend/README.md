# Frontend do estacionamento

React, React Router, Vite, Tailwind CSS e Fetch, com JavaScript e ES Modules.
Node.js e pnpm seguem as versões do backend, fixadas em `mise.toml`.

## Preparação

Execute a partir da pasta `frontend`:

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
cp .env.example .env
```

Se o `.env` já existir, preserve sua configuração. As variáveis `VITE_*`
ficam disponíveis no navegador e devem conter somente configurações públicas.

## Desenvolvimento

```bash
mise exec -- pnpm dev
```

Acesse `http://127.0.0.1:5173`. É necessário fazer login para acessar a página
inicial e todas as demais páginas internas. Apenas `/login` é pública.
O primeiro administrador deve ser criado com o comando documentado no backend.
Administradores têm acesso ao item **Usuários** no menu, em `/usuarios`.

Para consumir a API local, execute também o backend em outro terminal:

```bash
cd ../backend
mise exec -- pnpm dev
```

O módulo `src/services/api.js` usa Fetch e recebe o caminho e as opções da
requisição. O campo `body`, quando informado, é serializado como JSON.
Respostas HTTP de erro geram um erro com `message` e `status`.
As chamadas autenticadas enviam o JWT no header `Authorization`. Ao receber
401, o módulo tenta renovar a sessão e repetir a chamada uma única vez.
Erros 403 não provocam renovação nem encerram a sessão.

No ambiente local, `VITE_API_URL=/api` direciona as chamadas ao proxy do Vite.
`API_PROXY_TARGET` define o endereço do backend, por padrão
`http://127.0.0.1:3000`. O proxy remove o prefixo `/api` antes de encaminhar
a requisição: `/api/health` acessa `/health` no backend.

## Build

```bash
mise exec -- pnpm build
mise exec -- pnpm preview
```

O build é gerado em `dist/`. A prévia local atende em `http://127.0.0.1:4173`
e usa o mesmo proxy de desenvolvimento. A hospedagem final deve encaminhar
`/api` ao backend e servir `index.html` para as rotas do React Router.
O frontend e a API devem ser acessados pela mesma origem para que o fluxo
de cookies funcione. Inclua a origem pública em `AUTH_ORIGINS` no backend.
`VITE_API_URL` é lida durante o build; mantenha `/api` quando usar esse proxy.

## Organização

- `src/components/layout/`: menu, cabeçalho e estrutura compartilhada das páginas.
- `src/components/ui/`: componentes visuais reutilizáveis, conforme necessário.
- `src/pages/`: telas da aplicação.
- `src/routes/`: caminhos e proteção por sessão e perfil.
- `src/contexts/` e `src/hooks/`: contexto de autenticação e hook `useAuth`.
- `src/services/`: acesso centralizado à API e serviços de cada funcionalidade.
- `src/styles/index.css`: Tailwind, tema e estilos globais.
- `src/assets/`, `public/` e `src/utils/`: recursos e funções auxiliares.

Use `import` e `export`, componentes em `.jsx` e funções em `.js`.
Estados de formulários e listagens ficam nas páginas. O `AuthContext` expõe
`usuario`, `entrar`, `sair`, `atualizarUsuario`, `limparSessao` e `alterarSenha`.
Esses métodos mantêm o contexto sincronizado com a sessão e as alterações da
própria conta. As permissões de cada operação devem ser verificadas também pelo backend.

## Sessão

O JWT e os dados do usuário ficam somente em memória. O refresh token fica em
um cookie HttpOnly gerenciado pelo backend. Tokens não são armazenados em
`localStorage` nem em `sessionStorage`.

Na inicialização, o contexto tenta restaurar a sessão pelo endpoint de refresh.
Sem sessão válida, o usuário é enviado ao login. Durante a verificação, nenhuma
página interna é exibida. Falhas de conexão mostram uma opção para tentar
novamente. O perfil retornado no login e refresh é exibido no cabeçalho.

As renovações são agrupadas por aba. Quando Web Locks está disponível, as
operações de autenticação também são serializadas entre abas para evitar
disputas pelo cookie rotativo. Respostas antigas não restauram o estado da
sessão depois de um logout ou de um novo login na mesma aba.

`RotaProtegida` aceita uma lista opcional `perfis`, como
`['ADMINISTRADOR', 'GERENTE']`, para restringir uma página. O backend é a
autoridade final sobre as permissões.

## Painel inicial

A página inicial `/` consulta `GET /painel` ao abrir e oferece **Atualizar**, com
horário da última consulta no fuso de São Paulo. Há estados de carregamento e
erro com nova tentativa; os indicadores não são atualizados automaticamente.

Todos os perfis veem vagas comuns livres, ocupadas e cativas desocupadas, além
de entradas e saídas de hoje. Gerente e administrador também veem vagas
inativas, clientes ativos por tipo e valor cobrado hoje. Administrador vê ainda
usuários ativos e inativos. O backend omite os grupos não permitidos e o frontend
também condiciona sua exibição ao perfil autenticado.

Vagas cativas desocupadas são apresentadas como reservadas. O valor cobrado usa
as saídas de horistas de hoje, com os valores já gravados; o texto informa que
o sistema não controla recebimentos. Contagens e valores zero são exibidos.

Os cartões se adaptam à largura da tela. Atalhos para movimentações, histórico e
clientes aparecem para todos; vagas e tarifas, também para gerente; usuários,
somente para administrador. As permissões nas demais páginas são preservadas.
Não há gráficos nem filtros de período nesta versão.

## Usuários

A página `/usuarios` lista nome, login, perfil e situação. O botão **Novo usuário**
abre o formulário em uma modal com o elemento nativo `<dialog>`, que controla
o foco e bloqueia a interação com o restante da página. O formulário permite
selecionar os três perfis, começando com operador, e exige confirmação da senha.

A modal pode ser fechada por **Fechar**, **Cancelar** ou Escape. Durante o envio,
os campos e o fechamento ficam bloqueados. Ao concluir, a modal é fechada,
os dados do formulário são descartados e a listagem é atualizada. Erros de login
duplicado são exibidos no formulário. A modal devolve o foco ao botão que a abriu.

O menu e a rota são restritos ao administrador, assim como os endpoints no backend.

Cada linha oferece **Editar** e **Ativar/Inativar**. A edição reaproveita a modal
de cadastro, preenchendo nome, login e perfil e preservando a senha.
A ativação/inativação abre uma modal de confirmação. Falhas, incluindo a
proteção do último administrador ativo e login duplicado, são exibidas na modal.
Durante o envio, os controles e o fechamento ficam bloqueados.

Após salvar, a listagem é recarregada. Alterar o próprio nome ou login atualiza
também os dados do usuário no contexto e no cabeçalho. Alterar o próprio perfil
ou inativar a própria conta limpa a sessão local e redireciona ao login;
as modais avisam sobre esse encerramento antes de confirmar a operação.

## Alteração da própria senha

O botão **Alterar senha** fica no cabeçalho para administrador, gerente e operador.
Ele abre uma modal com senha atual, nova senha e confirmação. A nova senha deve
ter entre 8 e 128 caracteres; a confirmação é conferida no frontend. As senhas
são enviadas sem remoção de espaços e não são persistidas no navegador.

Durante o envio, o formulário e o fechamento ficam bloqueados. Uma senha atual
incorreta é informada dentro da modal e preserva a sessão. Ao salvar com sucesso,
o backend revoga a sessão e remove o cookie; o frontend limpa o estado local e
volta ao login com uma mensagem de confirmação.

## Vagas

O item **Vagas**, em `/vagas`, é acessível a todos os perfis autenticados. A
listagem mostra o número e a disponibilidade: livre, ocupada, cativa ou inativa.
Administrador e gerente também veem **Nova vaga**, **Editar** e **Ativar/Inativar**.

Cadastro e edição usam uma modal com número obrigatório de até 10 caracteres.
O envio remove espaços nas extremidades e converte letras para maiúsculas.
A ativação/inativação exige confirmação em outra modal. Os controles e o
fechamento ficam bloqueados durante o envio; erros são exibidos na própria
modal e, ao concluir, a listagem é recarregada.

O backend verifica as permissões e impede números duplicados, mesmo em vagas
inativas, e a inativação de vagas com movimentação em aberto ou cliente vinculado.

## Tarifas

O item **Tarifas**, em `/tarifas`, permite a todos os perfis autenticados consultar
os valores por hora e por mês, exibidos em reais. Sem configuração, a página
informa que nenhuma tarifa foi cadastrada. Administrador e gerente têm acesso
a **Cadastrar tarifas** ou **Alterar tarifas**, conforme o estado atual.

O formulário abre em modal e permite editar os dois valores juntos, preenchidos
com a configuração existente. Aceita vírgula ou ponto decimal, com até duas
casas, entre zero e R$ 99.999.999,99. Não se usam separadores de milhar. O frontend
envia strings decimais com ponto e duas casas para o `PUT /tarifas`.

Durante o envio, os campos e o fechamento ficam bloqueados. Erros aparecem na
modal. Ao salvar, ela fecha, os valores retornados pela API atualizam a página
e uma mensagem confirma a operação. O operador possui acesso somente à consulta;
as permissões também são verificadas pelo backend.

## Clientes, veículos e endereços

O item **Clientes**, em `/clientes`, fica disponível para todos os perfis e lista
nome, CPF, telefone, tipo, vaga cativa e situação, incluindo clientes inativos.
O botão **Novo cliente** abre uma modal com duas seções: dados do cliente e
primeiro veículo obrigatório. Em telas maiores, as seções ficam lado a lado;
em telas menores, ficam empilhadas. O envio usa um único `POST /clientes`, com
o objeto `veiculo`. Cliente e veículo são cadastrados juntos; uma falha mantém
o formulário preenchido e não deixa um cliente parcialmente cadastrado.

Cada linha oferece **Abrir ficha**, em `/clientes/:id`. A ficha reúne dados,
situação, vaga cativa e veículos do cliente, com acesso às modais de edição e
endereços. Administrador e gerente também podem ativar/inativar com confirmação
e gerenciar a vaga cativa de mensalistas. Após o cadastro conjunto, a aplicação
abre a ficha do novo cliente com uma confirmação.

CPF e telefone são opcionais. CPF pode ser informado com ou sem máscara. O
backend valida o documento e sua unicidade, inclusive entre inativos. Erros de
validação e conflitos aparecem na modal; o formulário permanece preenchido.
Ao concluir uma alteração na ficha, seus dados são recarregados. A listagem
também consulta os dados novamente quando o usuário retorna a `/clientes`.

Veículos são gerenciados exclusivamente na ficha, sem página ou seleção de
proprietário separadas. Todos os perfis podem adicionar e editar veículos em
modal. Ativação/inativação é exclusiva de administrador e gerente, com
confirmação. Placa é obrigatória e única; modelo e cor são opcionais. A ficha
exibe todos os veículos vinculados, inclusive inativos. Cliente inativo não
recebe novos veículos e seus veículos não podem ser reativados; as demais
edições continuam disponíveis. O backend aplica os bloqueios por movimentação.

A modal **Endereços** permite adicionar, editar, escolher o principal e remover
endereços com confirmação. O formulário e a confirmação são exibidos dentro da
mesma modal, sem sobrepor diálogos. O primeiro endereço é principal; ao remover
o principal, o mais antigo entre os restantes assume essa condição. A lista é
recarregada depois de cada alteração.

A modal **Vaga cativa** consulta os dados atuais do cliente e as vagas. Oferece
vagas livres e o vínculo atual, além de **Sem vaga cativa** para remoção. O backend
confere novamente disponibilidade, tipo, situação e movimentações em aberto
antes de salvar. A atribuição é exclusiva de mensalistas ativos.

Durante as gravações, os controles e o fechamento das modais ficam bloqueados.
As telas de consulta possuem estados de carregamento, erro, lista vazia e uma
opção de tentar novamente. Endereços são carregados pela consulta individual
`GET /clientes/:id`; as chamadas ficam em `src/services/clientes.service.js`.

## Movimentações e entrada

O item **Movimentações**, em `/movimentacoes`, fica disponível para todos os
perfis autenticados. Lista veículos estacionados com placa, modelo, cor, cliente,
tipo, vaga, horário de entrada e operador, em ordem de entrada mais recente.
O botão **Atualizar** permite consultar entradas feitas por outros operadores.

**Registrar entrada** abre uma modal com busca pela placa. A consulta exibe os
dados do cliente e veículo, a tarifa prevista para horistas e as vagas permitidas.
Mensalistas com vaga cativa recebem somente a própria vaga; os demais recebem
vagas comuns livres. Se houver apenas uma opção, ela é selecionada. Sem opções,
a confirmação fica bloqueada. Placas desconhecidas mostram uma orientação e um
link para clientes, onde o veículo deve ser cadastrado.

Alterar a placa descarta a consulta anterior. A busca pode ser cancelada ao fechar
a modal; a requisição é abortada. Durante a confirmação, campos e fechamento
ficam bloqueados. O envio contém somente os IDs do veículo e da vaga. O backend
revalida tudo e fixa a tarifa vigente na confirmação, sem aceitar preços ou
horários fornecidos pelo frontend. Conflitos descartam a prévia e pedem nova
consulta. Ao concluir, a modal fecha, uma mensagem identifica placa e vaga e a
listagem é recarregada.

O serviço fica em `src/services/movimentacoes.service.js`. Há estados de
carregamento, erro com nova tentativa e lista vazia. Movimentações registradas
podem ser consultadas no histórico; não há edição dos registros.

## Saída e prévia da cobrança

Cada veículo estacionado oferece **Registrar saída**, para todos os perfis. A
modal mostra cliente, vaga, tipo e tarifa registrados na entrada, horários de
entrada e saída prevista, tempo estacionado em horas/minutos/segundos, horas
cobradas e valor previsto em reais.

Horistas usam hora iniciada com tolerância de cinco minutos na virada de cada
hora, incluindo gratuidade nos primeiros cinco minutos. Mensalistas encerram
com valor zero. O cálculo é feito somente no backend; o frontend apenas exibe a
prévia e envia um POST sem corpo para confirmar.

**Atualizar prévia** refaz a consulta. A modal avisa que o valor será recalculado
ao confirmar e pode mudar ao ultrapassar uma faixa. Durante a confirmação, o
fechamento e os controles ficam bloqueados. A consulta pode ser cancelada ao
fechar a modal. Se outro operador já encerrou a movimentação, a modal informa o
conflito e impede nova confirmação. Ao fechar, a lista é atualizada.

Após a saída, a modal fecha, a lista é recarregada e uma mensagem apresenta a
placa e o valor final retornado pelo backend. O sistema preserva o cadastro da
vaga e sua reserva cativa; a disponibilidade decorre das movimentações abertas.

## Histórico

A opção **Histórico** na área de movimentações abre `/movimentacoes/historico`,
para todos os perfis autenticados. O período inicial é o mês atual no calendário
de São Paulo. Os filtros permitem período de entrada, placa exata, cliente
(incluindo inativos) e situação: todas, abertas ou encerradas.

**Aplicar filtros** consulta a primeira página; **Limpar filtros** remove todas
as restrições, inclusive o período. A listagem usa 20 registros por página, com
contagem e navegação anterior/próxima, mantendo os filtros aplicados. A seleção
de clientes é carregada independentemente da listagem; falha nela oferece nova
tentativa sem impedir os demais filtros.

A tabela apresenta placa registrada, cliente, tipo, vaga, horários, situação e
valor final. Registros abertos mostram saída e valor pendentes; encerrados mostram
o valor salvo, inclusive zero. Os horários exibidos usam São Paulo, assim como
os limites de data enviados à consulta.

**Detalhes** abre uma modal somente para leitura, com modelo, cor, cliente, vaga,
tipo, horários, duração, tarifa aplicada, valor gravado e operadores de entrada
e saída. Para registros abertos, a duração é válida até o instante da consulta;
**Atualizar consulta** permite renová-la. O histórico não apresenta estimativa
de cobrança nem recalcula os valores de saídas encerradas. Fechar a modal
atualiza a listagem, preservando filtros e página.

As consultas possuem estados de carregamento, erro com nova tentativa e lista
vazia. Abrir ou atualizar o histórico não altera registros no banco.
