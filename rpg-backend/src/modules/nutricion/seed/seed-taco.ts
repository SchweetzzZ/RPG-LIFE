// Seed da Tabela Brasileira de Composicao de Alimentos (TACO): `npm run seed:taco` (dentro de rpg-backend).
// Idempotente: upsert por `description` + `category` (rodar de novo atualiza os valores, sem duplicar).
// Dados em ./taco-foods.json (valores por 100 g), derivados de github.com/marcelosanto/tabela_taco (MIT).
// `npm run seed:taco -- --dry-run` so valida o arquivo, sem ler o .env nem conectar no banco.

import 'reflect-metadata';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { Taco, TacoSchema } from '../schema/tacoLod-dto';
import { normalizeSearch } from '../search-key';

interface TacoFood {
    description: string;
    category: string;
    energyKcal: number;
    protein: number;
    carbohydrates: number;
    lipids: number;
    fiber: number;
}

function loadFoods(): TacoFood[] {
    return JSON.parse(readFileSync(join(__dirname, 'taco-foods.json'), 'utf8')) as TacoFood[];
}

function validate(foods: TacoFood[]): string[] {
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const food of foods) {
        if (!food.description) errors.push('alimento sem descricao');
        const id = `${food.description}|${food.category}`;
        if (seen.has(id)) errors.push(`alimento repetido: ${id}`);
        seen.add(id);
        for (const key of ['energyKcal', 'protein', 'carbohydrates', 'lipids', 'fiber'] as const) {
            if (!(food[key] >= 0)) errors.push(`${food.description}: ${key} invalido`);
        }
    }
    return errors;
}

async function main(): Promise<void> {
    const foods = loadFoods();
    const errors = validate(foods);
    if (errors.length > 0) {
        console.error('TACO invalida:\n- ' + errors.join('\n- '));
        process.exitCode = 1;
        return;
    }
    console.log(`${foods.length} alimentos validos.`);
    if (process.argv.includes('--dry-run')) {
        console.log('--dry-run: nada foi gravado.');
        return;
    }

    dotenv.config({ path: ['.env', '../.env'] });
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI nao definido (.env)');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(uri);
    try {
        const model = mongoose.model(Taco.name, TacoSchema);
        await model.createIndexes();
        const result = await model.bulkWrite(
            foods.map((food) => ({
                updateOne: {
                    filter: { description: food.description, category: food.category },
                    update: { $set: { ...food, searchKey: normalizeSearch(food.description) } },
                    upsert: true,
                },
            })),
        );
        console.log(
            `TACO gravada: ${result.upsertedCount} novos, ${result.modifiedCount} atualizados, ` +
            `${foods.length - result.upsertedCount - result.modifiedCount} sem mudanca.`,
        );
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
