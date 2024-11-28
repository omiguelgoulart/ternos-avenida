# Ternos Avenida - Sistema de Gestão

Este repositório contém o sistema de gestão para a loja Ternos Avenida, desenvolvido em Node.js com TypeScript e Prisma. O objetivo do sistema é gerenciar usuários, produtos e fornecer uma interface segura para autenticação e operações administrativas.

## ⚙️ Funcionalidades

### Autenticação e Autorização:
- Login com sistema de bloqueio após tentativas inválidas.
- Recuperação de senha via e-mail.
- Tokens JWT para autenticação.

### Gestão de Produtos:
- Cadastro, listagem, atualização e exclusão de produtos.

### Gestão de Usuários:
- Cadastro e gerenciamento de usuários.

### Validações:
- Validação de senhas fortes.
- Verificação de bloqueio de usuários.

## 📂 Estrutura do Projeto

```
src/
├── middlewares/
│   ├── verificaBloqueio.ts          # Middleware para verificar se o usuário está bloqueado
│   ├── verificaCodigoRecuperacao.ts # Middleware para verificar códigos de recuperação de senha
│   └── verificaToken.ts             # Middleware para autenticação via JWT
├── prisma/
│   ├── schema.prisma                # Esquema do Prisma para o banco de dados
│   └── migrations/                  # Migrations geradas automaticamente
├── routes/
│   ├── login.ts                     # Rotas de autenticação e login
│   ├── produtos.ts                  # Rotas para produtos
│   └── usuarios.ts                  # Rotas para usuários
├── utils/
│   ├── bloqueiaSenha.ts             # Função de bloqueio após tentativas inválidas
│   ├── enviaEmail.ts                # Função para envio de e-mails
│   ├── formataData.ts               # Formatação de datas
│   ├── geraCodigo.ts                # Geração de código aleatório
│   ├── mensagem.ts                  # Mensagens personalizadas
│   └── validaSenha.ts               # Validação de senhas
├── .env                             # Configurações de ambiente (não incluso no repositório)
├── .env.example                     # Exemplo das configurações de ambiente
├── dados.sql                        # Script para popular o banco de dados
├── index.ts                         # Inicialização do servidor
├── README.md                        # Documentação do projeto
└── tsconfig.json                    # Configuração do TypeScript
```

## 🚀 Tecnologias Utilizadas
- **Linguagem:** Node.js com TypeScript
- **Banco de Dados:** MySQL gerenciado pelo Prisma ORM
- **Autenticação:** JWT
- **Envio de E-mails:** Nodemailer e Mailtrap
- **Validações:** Zod e funções customizadas

## 🛠️ Configuração do Ambiente

### 1. Instalar Dependências
Certifique-se de que você tenha o Node.js instalado. Em seguida, execute:

```bash
npm install
```

### 2. Configurar o Banco de Dados
Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example`, e configure sua conexão MySQL:

```env
DATABASE_URL="mysql://user:password@localhost:3306/ternos_avenida"
JWT_KEY="sua_chave_secreta"
EMAIL_USER="seu_email"
EMAIL_PASS="sua_senha_email"
```

### 3. Executar Migrations
Para criar as tabelas no banco de dados, execute:

```bash
npx prisma migrate dev
```

### 4. Iniciar o Servidor
```bash
npm run dev
```
O servidor estará rodando em http://localhost:3000.

## 📋 Rotas Disponíveis

### Autenticação
- `POST /login`: Autenticação do usuário com bloqueio após tentativas inválidas.
- `PATCH /login/recupera-senha`: Alteração de senha com código de recuperação.

### Usuários
- `POST /usuarios`: Cadastro de usuários.
- `GET /usuarios`: Listagem de usuários.

### Produtos
- `GET /produtos`: Listagem de produtos.
- `POST /produtos`: Cadastro de novos produtos.
- `PATCH /produtos/:id`: Atualização de produtos.
- `DELETE /produtos/:id`: Exclusão de produtos.

## 🔐 Segurança
- **JWT:** Tokens expirados em 1 hora para autenticação.
- **Bloqueio:** Usuários são bloqueados por 60 minutos após 3 tentativas inválidas de login.
- **Validação de Senha:** Senhas devem ser fortes, seguindo regras configuradas no sistema.

## 🛡️ Boas Práticas
- Use o `.env.example` como referência para configurar suas variáveis de ambiente.
- Não exponha o arquivo `.env` no repositório público.
- Certifique-se de rodar o projeto em um ambiente seguro com conexões HTTPS em produção.

## 👥 Contribuidores
- <a href="https://github.com/omiguelgoulart"><img src="https://github.com/omiguelgoulart.png" width="45" height="45"></a> &nbsp;

-<a href="https://github.com/JoaoAANgr"><img src="https://github.com/JoaoAANgr.png" width="45" height="45"></a> &nbsp;

## 📄 Licença
Este projeto está licenciado sob a MIT License.




























































































































