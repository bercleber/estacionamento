# Estacionamento

Projeto escolar com backend Node.js/Fastify, frontend React/Vite e banco MariaDB.

## Requisitos

Tenha **Node.js 24**, **pnpm 12** e **MariaDB** instalados. Para instalar o pnpm:

```bash
npm install -g pnpm@12.15.0
```

## Instalação

Na raiz do projeto:

```bash
cd backend
pnpm install --frozen-lockfile
cp -n .env.example .env
cd ../frontend
pnpm install --frozen-lockfile
cp -n .env.example .env
cd ..
```

Em `backend/.env`, configure `DB_HOST`, `DB_PORT`, `DB_NAME=estacionamento`,
`DB_USER` e `DB_PASSWORD`. Gere um segredo com o comando abaixo e copie o
resultado para `JWT_SECRET` no mesmo arquivo:

```bash
node --input-type=module -e 'import { randomBytes } from "node:crypto"; console.log(randomBytes(48).toString("base64url"));'
```

Mantenha as demais configurações dos arquivos de exemplo para uso local.
O `cp -n` preserva arquivos `.env` existentes; não publique suas credenciais.

Com o MariaDB em execução, importe o SQL **somente em uma instalação nova**.
Na raiz, substitua `SEU_USUARIO` pelo usuário do MariaDB com permissão de criação:

```bash
mariadb -h localhost -u SEU_USUARIO -p < docs/database.sql
```

Se o banco já estiver preparado, pule a importação.

## Criar o primeiro administrador — necessário para acessar o sistema

**Não existe login ou senha padrão.** Após preparar o banco e o `.env`, execute
em um terminal interativo, a partir da raiz:

```bash
cd backend
pnpm criar-admin
```

Esse comando executa [criar-admin.js](backend/scripts/criar-admin.js).
Também pode ser executado diretamente, na pasta `backend`:

```bash
node --env-file=.env scripts/criar-admin.js
```

Informe **nome, login, senha de 8 a 128 caracteres e confirmação da senha**.
Após a mensagem `Administrador criado com sucesso.`, use o login e a senha
informados para entrar no sistema. A API não precisa estar iniciada nesta etapa.

Execute apenas para criar o primeiro administrador. Se já existir um, o script
recusa outra criação e não redefine sua senha. Os demais usuários são cadastrados
pela página **Usuários**, acessível ao administrador.

## Executar

Abra dois terminais na raiz do projeto.

**Backend:**

```bash
cd backend
pnpm dev
```

**Frontend:**

```bash
cd frontend
pnpm dev
```

Acesse **http://127.0.0.1:5173** e entre com o administrador criado pelo script.
Para começar a operar, cadastre as vagas, configure as tarifas e cadastre os
clientes com seus veículos.
