// Gera o OpenAPI sem subir o servidor nem o Mongo.
// O modo preview do Nest monta o grafo de modulos e le os decorators, mas nao instancia
// providers: o MongooseModule nunca conecta. O Swagger so precisa desses metadados.
//
// Uso (em rpg-backend):
//   npx ts-node -r tsconfig-paths/register --transpile-only scripts/export-openapi.ts openapi.json
// Depois (em rpg-frontend):
//   npx openapi-typescript ../rpg-backend/openapi.json -o src/api/schema.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { writeFileSync } from 'fs';
import { AppModule } from '../src/app.module';

async function main() {
  const out = process.argv[2] ?? 'openapi.json';
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  const config = new DocumentBuilder()
    .setTitle('Life RPG API')
    .setDescription('Documentação da API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  writeFileSync(out, JSON.stringify(doc, null, 2));
  console.log(`OpenAPI com ${Object.keys(doc.paths).length} rotas gravado em ${out}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
