import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Item da refeicao livre gravado como SNAPSHOT: nome, unidade, kcal e origem sao copiados,
// assim o historico nao muda quando o catalogo for recalibrado.

export enum FreeMealItemSourceKind {
    CATALOG = 'catalog',                 // item de um FreeMealTemplate
    CUSTOM = 'custom',                   // kcal digitada pelo usuario
    TACO = 'taco',                       // busca de alimentos do modulo nutricion (TACO)
    OPEN_FOOD_FACTS = 'open_food_facts', // busca de alimentos do modulo nutricion (Open Food Facts)
}

@Schema({ _id: false })
export class FreeMealItemSource {
    @Prop({ type: String, enum: FreeMealItemSourceKind, required: true })
    kind: FreeMealItemSourceKind;

    // catalog: slug do template; taco/open_food_facts: id ou codigo de barras do alimento; custom: null
    @Prop({ type: String, required: false, default: null })
    refId: string | null;

    // Fonte do numero de kcal (catalog: copiada do catalogo)
    @Prop({ type: String, required: false, default: null })
    name: string | null;

    @Prop({ type: String, required: false, default: null })
    url: string | null;

    @Prop({ type: String, required: false, default: null })
    accessedAt: string | null;
}

export const FreeMealItemSourceSchema = SchemaFactory.createForClass(FreeMealItemSource);

@Schema({ _id: false })
export class FreeMealItem {
    // key do item no template (so para kind = catalog)
    @Prop({ type: String, required: false, default: null })
    key: string | null;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    unit: string;

    @Prop({ type: Number, required: true, min: 0 })
    kcalPerUnit: number;

    @Prop({ type: Number, required: true, min: 0 })
    qty: number;

    @Prop({ type: FreeMealItemSourceSchema, required: true })
    source: FreeMealItemSource;
}

export const FreeMealItemSchema = SchemaFactory.createForClass(FreeMealItem);
