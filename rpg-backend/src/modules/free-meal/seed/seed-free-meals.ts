// Seed do catalogo de refeicoes livres: `npm run seed:free-meals` (dentro de rpg-backend).
// Idempotente: upsert por `slug` (rodar de novo atualiza nomes, kcal, fontes e atalhos).
// Conecta no MONGO_URI do .env, como o app.
// `npm run seed:free-meals -- --dry-run` so valida e mostra o catalogo, sem ler o .env nem conectar no banco.

import 'reflect-metadata';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { FreeMealTemplate, FreeMealTemplateSchema } from '../schema/free-meal-template.schema';
import { CatalogMeal, FREE_MEAL_CATALOG, PresetName } from './free-meal-catalog';

const PRESETS: PresetName[] = ['light', 'medium', 'heavy'];

function presetKcal(meal: CatalogMeal, preset: PresetName): number {
    return Math.round(
        meal.items.reduce((acc, item) => acc + item.kcalPerUnit * (meal.presets[preset][item.key] ?? 0), 0),
    );
}

/** Confere o catalogo antes de gravar: slugs e keys unicos, presets validos, toda kcal com fonte. */
function validateCatalog(catalog: CatalogMeal[]): string[] {
    const errors: string[] = [];
    const slugs = new Set<string>();
    for (const meal of catalog) {
        if (slugs.has(meal.slug)) errors.push(`slug repetido: ${meal.slug}`);
        slugs.add(meal.slug);

        const keys = new Set<string>();
        for (const item of meal.items) {
            if (keys.has(item.key)) errors.push(`${meal.slug}: key repetida ${item.key}`);
            keys.add(item.key);
            if (!(item.kcalPerUnit > 0)) errors.push(`${meal.slug}/${item.key}: kcalPerUnit invalido`);
            const s = item.source;
            if (!s.name || !s.url.startsWith('https://') || !/^\d{4}-\d{2}-\d{2}$/.test(s.accessedAt) || !s.reference) {
                errors.push(`${meal.slug}/${item.key}: fonte incompleta`);
            }
        }
        for (const preset of PRESETS) {
            for (const [key, qty] of Object.entries(meal.presets[preset])) {
                if (!keys.has(key)) errors.push(`${meal.slug}: preset ${preset} usa key inexistente ${key}`);
                if (!(qty > 0)) errors.push(`${meal.slug}: preset ${preset} com quantidade invalida em ${key}`);
            }
            if (presetKcal(meal, preset) <= 0) errors.push(`${meal.slug}: preset ${preset} sem kcal`);
        }
    }
    return errors;
}

function printSummary(catalog: CatalogMeal[]): void {
    for (const meal of catalog) {
        const kcal = PRESETS.map((p) => `${p} ${presetKcal(meal, p)}`).join(' | ');
        console.log(`${meal.icon} ${meal.slug.padEnd(22)} ${String(meal.items.length).padStart(2)} itens  ${kcal} kcal`);
    }
}

async function main(): Promise<void> {
    const dryRun = process.argv.includes('--dry-run');

    const errors = validateCatalog(FREE_MEAL_CATALOG);
    if (errors.length > 0) {
        console.error('Catalogo invalido:\n- ' + errors.join('\n- '));
        process.exitCode = 1;
        return;
    }
    printSummary(FREE_MEAL_CATALOG);
    if (dryRun) {
        console.log(`\n--dry-run: ${FREE_MEAL_CATALOG.length} refeicoes validas; nada foi gravado.`);
        return;
    }

    // Mesmos arquivos que o ConfigModule do app (rodando de dentro de rpg-backend)
    dotenv.config({ path: ['.env', '../.env'] });
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI nao definido (.env)');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(uri);
    try {
        const model = mongoose.model(FreeMealTemplate.name, FreeMealTemplateSchema);
        await model.createIndexes();

        const result = await model.bulkWrite(
            FREE_MEAL_CATALOG.map((meal) => ({
                updateOne: {
                    filter: { slug: meal.slug },
                    update: {
                        $set: {
                            name: meal.name,
                            category: meal.category,
                            icon: meal.icon,
                            items: meal.items.map((item) => ({
                                ...item,
                                source: { ...item.source, note: item.source.note ?? null },
                            })),
                            presets: meal.presets,
                        },
                    },
                    upsert: true,
                },
            })),
        );
        console.log(
            `\nCatalogo gravado: ${result.upsertedCount} novas, ${result.modifiedCount} atualizadas, ` +
            `${FREE_MEAL_CATALOG.length - result.upsertedCount - result.modifiedCount} sem mudanca.`,
        );
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
