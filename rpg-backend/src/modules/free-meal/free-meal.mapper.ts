import { FreeMealDocument } from './schema/free-meal.schema';
import { FreeMealItem } from './schema/free-meal-item.schema';
import { FreeMealTemplateDocument } from './schema/free-meal-template.schema';
import { FreeMealItemResponse, FreeMealResponse, FreeMealTemplateResponse } from './dto/free-meal-dto';
import { FreeMealPreset, itemKcal, quantitiesKcal } from './free-meal-math';

const PRESETS: FreeMealPreset[] = ['light', 'medium', 'heavy'];

export function toFreeMealTemplateResponse(template: FreeMealTemplateDocument): FreeMealTemplateResponse {
    const items = template.items.map((i) => ({
        key: i.key,
        name: i.name,
        unit: i.unit,
        kcalPerUnit: i.kcalPerUnit,
        defaultQty: i.defaultQty,
        source: {
            name: i.source.name,
            url: i.source.url,
            accessedAt: i.source.accessedAt,
            reference: i.source.reference,
            note: i.source.note ?? null,
        },
    }));

    const presetOf = (name: FreeMealPreset) => {
        const quantities = { ...(template.presets?.[name] ?? {}) };
        return { quantities, kcal: quantitiesKcal(items, quantities) };
    };
    const [light, medium, heavy] = PRESETS.map(presetOf);

    return {
        id: String(template._id),
        slug: template.slug,
        name: template.name,
        category: template.category,
        icon: template.icon,
        items,
        presets: { light, medium, heavy },
        defaultKcal: quantitiesKcal(items, Object.fromEntries(items.map((i) => [i.key, i.defaultQty]))),
    };
}

export function toFreeMealItemResponse(item: FreeMealItem): FreeMealItemResponse {
    return {
        key: item.key ?? null,
        name: item.name,
        unit: item.unit,
        kcalPerUnit: item.kcalPerUnit,
        qty: item.qty,
        kcal: itemKcal(item),
        source: {
            kind: item.source.kind,
            refId: item.source.refId ?? null,
            name: item.source.name ?? null,
            url: item.source.url ?? null,
            accessedAt: item.source.accessedAt ?? null,
        },
    };
}

export function toFreeMealResponse(meal: FreeMealDocument): FreeMealResponse {
    return {
        id: String(meal._id),
        scope: meal.scope,
        templateSlug: meal.templateSlug ?? null,
        title: meal.title,
        scheduledFor: meal.scheduledFor,
        plannedItems: meal.plannedItems.map(toFreeMealItemResponse),
        estimatedKcal: meal.estimatedKcal,
        actualItems: meal.actualKcal != null && meal.actualItems.length > 0
            ? meal.actualItems.map(toFreeMealItemResponse)
            : null,
        actualKcal: meal.actualKcal ?? null,
        exceededKcal: meal.exceededKcal ?? null,
        vaultDebitKcal: meal.vaultDebitKcal ?? null,
        ticketCost: meal.ticketCost,
        cycleId: String(meal.cycle),
        status: meal.status,
        cancelReason: meal.cancelReason ?? null,
        redeemedAt: meal.redeemedAt ? meal.redeemedAt.toISOString() : null,
        cancelledAt: meal.cancelledAt ? meal.cancelledAt.toISOString() : null,
        createdAt: meal.createdAt.toISOString(),
    };
}
