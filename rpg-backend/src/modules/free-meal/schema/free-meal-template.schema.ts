import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import type { FreeMealPreset } from '../free-meal-math';

export type FreeMealTemplateDocument = FreeMealTemplate & Document;

// Fonte do numero de kcal de um item do catalogo (obrigatoria; PLANO_PROXIMOS_LOTES.md 7.1)
@Schema({ _id: false })
export class FreeMealTemplateItemSource {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    url: string;

    // Data de consulta (YYYY-MM-DD)
    @Prop({ required: true })
    accessedAt: string;

    // Como o numero foi obtido (codigo do alimento, kcal/100 g, porcao)
    @Prop({ required: true })
    reference: string;

    // Equivalencia ou ressalva
    @Prop({ type: String, required: false, default: null })
    note: string | null;
}

export const FreeMealTemplateItemSourceSchema = SchemaFactory.createForClass(FreeMealTemplateItemSource);

@Schema({ _id: false })
export class FreeMealTemplateItem {
    @Prop({ required: true })
    key: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    unit: string;

    @Prop({ type: Number, required: true, min: 0 })
    kcalPerUnit: number;

    // Quantidade sugerida ao montar sem atalho (= preset medium; 0 = item opcional)
    @Prop({ type: Number, required: true, min: 0 })
    defaultQty: number;

    @Prop({ type: FreeMealTemplateItemSourceSchema, required: true })
    source: FreeMealTemplateItemSource;
}

export const FreeMealTemplateItemSchema = SchemaFactory.createForClass(FreeMealTemplateItem);

// Catalogo global do montador (nao pertence a usuario). Populado por `npm run seed:free-meals`.
@Schema({ timestamps: true, collection: 'free_meal_templates' })
export class FreeMealTemplate {
    @Prop({ required: true })
    slug: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    icon: string;

    @Prop({ type: [FreeMealTemplateItemSchema], default: [] })
    items: FreeMealTemplateItem[];

    // Atalhos leve/media/pesada: quantidade por `key` de item (itens ausentes = 0)
    @Prop({ type: SchemaTypes.Mixed, required: true })
    presets: Record<FreeMealPreset, Record<string, number>>;

    createdAt: Date;
    updatedAt: Date;
}

export const FreeMealTemplateSchema = SchemaFactory.createForClass(FreeMealTemplate);
FreeMealTemplateSchema.index({ slug: 1 }, { unique: true });
