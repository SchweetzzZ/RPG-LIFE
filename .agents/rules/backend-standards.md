# Regras de Desenvolvimento Backend (rpg-backend)

## Estrutura de Módulos
Cada nova feature no backend deve seguir rigorosamente a estrutura modular do NestJS:
```
src/modules/<feature-name>/
├── dto/
│   └── <feature>-dto.ts          # Zod Schemas e DTOs via createZodDto
├── schema/
│   └── <feature>-schema.ts       # Mongoose Schemas via @nestjs/mongoose
├── <feature>.controller.ts       # Rotas, Decorators HTTP, Swagger
├── <feature>.service.ts          # Regras de negócio e acesso ao Model
└── <feature>.module.ts           # Registro de MongooseModule e Providers
```

## Diretrizes de Implementação
1. **DTOs**:
   - Sempre declare o Zod Schema com `z.object({...})`.
   - Crie a classe DTO herdando de `createZodDto(Schema)`.
   - Se houver atualização parcial, utilize `Schema.partial()`.

2. **Mongoose**:
   - Exporte a factory: `export const XSchema = SchemaFactory.createForClass(X)`.
   - Registre no Module: `MongooseModule.forFeature([{ name: X.name, schema: XSchema }])`.
   - No Service, injete com `@InjectModel(X.name) private xModel: Model<XDocument>`.

3. **Segurança**:
   - Rotas privadas devem conter `@UseGuards(JwtAuthGuard)`.
   - Respostas nunca devem expor campos internos do Mongoose (como `__v`) ou campos sensíveis (`password`). Mapeie os retornos para objetos explícitos.
   - Utilize exceções HTTP padronizadas do NestJS (`BadRequestException`, `NotFoundException`, `ConflictException`, `UnauthorizedException`).
