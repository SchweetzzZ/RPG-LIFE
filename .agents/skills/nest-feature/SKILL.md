---
name: nest-feature
description: Procedimento padronizado para criar ou estender módulos e features no backend NestJS com Mongoose e Zod.
---

# Procedimento: Criação de Nova Feature no NestJS

Siga esta sequência obrigatória ao criar uma nova funcionalidade no `rpg-backend`:

## 1. Schema do Mongoose
- Crie o arquivo em `src/modules/<feature>/schema/<feature>-schema.ts`.
- Use os decorators `@Schema({ timestamps: true, collection: '<nome>' })` e `@Prop()`.
- Se houver objetos embutidos complexos compartilhados, extraia para um arquivo separado para evitar dependência circular.
- Gere a factory: `export const FeatureSchema = SchemaFactory.createForClass(Feature);`.
- Exporte o tipo do documento: `export type FeatureDocument = Feature & Document;`.

## 2. Validações e DTOs com Zod
- Crie o arquivo em `src/modules/<feature>/dto/<feature>-dto.ts`.
- Defina o schema Zod com `z.object({...})`.
- Crie o DTO: `export class CreateFeatureDto extends createZodDto(CreateFeatureSchema) {}`.
- Para atualização: `export class UpdateFeatureDto extends createZodDto(CreateFeatureSchema.partial()) {}`.

## 3. Service
- Injetar o model no construtor:
  ```typescript
  @InjectModel(Feature.name) private readonly featureModel: Model<FeatureDocument>
  ```
- Implemente os métodos de negócio tratando erros com exceções do NestJS (`NotFoundException`, `ConflictException`, etc.).
- Nunca retorne documentos Mongoose brutos com dados sensíveis.

## 4. Controller
- Decore a classe com `@ApiTags('<Feature>')` e `@Controller('<feature>')`.
- Proteja com `@UseGuards(JwtAuthGuard)` se a rota exigir autenticação.
- Use `@CurrentUser('sub') userId: string` para identificar o autor da requisição.
- Documente com Swagger (`@ApiBearerAuth()`, `@ApiOkResponse()`, etc.).

## 5. Module e AppModule
- Registre o model no `MongooseModule.forFeature([{ name: Feature.name, schema: FeatureSchema }])`.
- Declare Controllers, Providers e Exports necessários.
- Importe o módulo recém-criado no `AppModule` (`src/app.module.ts`).

## 6. Verificação Obrigatória
- Execute:
  ```bash
  npm run build
  ```
  no diretório `rpg-backend` e assegure que o build termine com código 0.
