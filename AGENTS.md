# RPG-LIFE Workspace Guidelines & Agent Rules

Este documento define os padrões arquiteturais, de segurança e de desenvolvimento para qualquer agente ou sub-agente trabalhando neste repositório.

---

## 1. Padrões do Backend (NestJS + MongoDB + Zod)

### Validação com Zod (`nestjs-zod`)
- Todos os DTOs de entrada e saída DEVEM ser criados usando `zod` e `createZodDto` de `nestjs-zod`.
- **NUNCA** misture bibliotecas legadas como `class-validator` ou `class-transformer`.
- Toda rota pública de criação (ex: registro) deve blindar campos sensíveis como `role` e permissões com valores padrão seguros (`UserRole.PLAYER`).

### Mongoose e Schemas
- Modelos embutidos/subdocumentos compartilhados (ex: `Stats`, `XpModifiers`) DEVEM ficar em arquivos isolados (ex: `stats-schema.ts`) para evitar dependências circulares.
- Ao registrar schemas em módulos de feature, utilize SEMPRE a factory compilada:
  ```typescript
  MongooseModule.forFeature([{ name: Entidade.name, schema: EntidadeSchemaFactory }])
  ```
- Para relacionamentos entre coleções (`ref`), utilize o nome do modelo registrado como string (ex: `ref: 'CharacterClassSchema'`) para evitar imports circulares entre arquivos de schema.

### Segurança e Autenticação
- **NUNCA** retorne senhas, hashes de senhas (`password: hash`) ou tokens internos no payload de resposta de requisições (`register`, `login`, `getMe`, etc.).
- Toda rota autenticada DEVE ser protegida com `@UseGuards(JwtAuthGuard)` e decorada com `@ApiBearerAuth()` para o Swagger.
- Para extrair o ID do usuário autenticado no controller, utilize o decorator `@CurrentUser('sub') userId: string`.
- Erros de validação e exceções globais são tratados pelo `AllExceptionsFilter`, impedindo vazamento de stack traces e detalhes internos do banco de dados para o cliente.

### Documentação Swagger e Contratos OpenAPI
- Todo endpoint em controllers DEVE ser decorado com `@ApiOkResponse({ type: ResponseDto })` (ou `@ApiCreatedResponse`) utilizando DTOs derivados de Zod com `createZodDto`.
- **NUNCA** deixe rotas sem DTO de resposta tipado no Swagger, pois isso impede a geração de contratos no front-end (`schema.ts`).

### Verificação Obrigatória
- Antes de considerar qualquer tarefa concluída, o agente DEVE executar:
  ```bash
  npm run build
  ```
  no diretório `rpg-backend` para garantir zero erros de tipagem e compilação.

---

## 2. Padrões do Frontend (React + Vite + TanStack)

### Tipagem Estrita e Proibição de `any`
- **TOLERÂNCIA ZERO PARA `any` E `unknown`:** É terminantemente proibido o uso de `as any`, `as unknown`, ou type casting forçado para burlar a checagem do compilador.
- Toda chamada à API DEVE utilizar os tipos inferidos automaticamente do OpenAPI (`client` do `openapi-fetch` alimentado por `schema.ts`).
- Execute sempre `npm run lint` (`tsc --noEmit`) no diretório `rpg-frontend` para validar 100% de type-safety.

### Contract-Driven & Integração Real (Sem Mocks Desconectados)
- **O FRONT-END NUNCA DEVE USAR MOCKS ISOLADOS OU `localStorage` COMO BANCO FAKE:** Toda tela deve ser desenvolvida conectada aos endpoints e serviços reais da API NestJS.
- Se uma tela necessitar de dados ou campos que ainda não existem na API, o agente DEVE primeiro criar/estender o DTO e endpoint no back-end, rodar o build do backend e atualizar o `schema.ts` do front antes de prosseguir.
- Armazene tokens ou credenciais de forma segura (via cookies HTTP-only ou headers de autorização via interceptors).

