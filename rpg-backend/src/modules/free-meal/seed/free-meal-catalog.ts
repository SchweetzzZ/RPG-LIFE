// Catalogo inicial do montador de refeicao livre (PLANO_PROXIMOS_LOTES.md, secao 7.1).
//
// Cada numero de kcal vem de uma fonte publica, registrada no proprio item (fonte, URL e data de consulta):
//   - USDA FoodData Central, FNDDS 2021-2023 (Survey Foods): kcal/100 g x peso da porcao publicada pelo USDA.
//     Consultado no pacote oficial "FoodData_Central_survey_food_csv_2024-10-31.zip" (download em
//     https://fdc.nal.usda.gov/download-datasets) e na pagina de cada alimento (URL do item).
//   - TACO 4a edicao (NEPA/UNICAMP, 2011): kcal por 100 g; por isso a unidade desses itens e "100 g".
// TBCA (USP) NAO e usada (licenca CC BY-NC-ND).
// Quando o alimento brasileiro nao existe na fonte, usa-se o equivalente mais proximo e isso fica em `note`.
//
// O seed (`npm run seed:free-meals`) faz upsert por `slug`; rodar de novo atualiza os numeros.

export const CATALOG_ACCESSED_AT = '2026-10-10';

const TACO_URL = 'https://www.cfn.org.br/wp-content/uploads/2017/03/taco_4_edicao_ampliada_e_revisada.pdf';

export interface CatalogItemSource {
    name: string;
    url: string;
    accessedAt: string;
    /** Como o numero foi obtido (codigo do alimento, kcal/100 g e porcao). */
    reference: string;
    /** Equivalencia ou ressalva, quando houver. */
    note?: string;
}

export interface CatalogItem {
    key: string;
    name: string;
    unit: string;
    kcalPerUnit: number;
    /** Quantidade sugerida ao montar sem atalho (igual ao preset "medium"; 0 = item opcional). */
    defaultQty: number;
    source: CatalogItemSource;
}

export type PresetName = 'light' | 'medium' | 'heavy';

export interface CatalogMeal {
    slug: string;
    name: string;
    category: string;
    icon: string;
    items: CatalogItem[];
    /** Quantidade por `key` de item. Itens fora do preset ficam com 0. */
    presets: Record<PresetName, Record<string, number>>;
}

// ── Construtores de item ──────────────────────────────────────────────────────

interface UsdaInput {
    key: string;
    name: string;
    unit: string;
    fdcId: number;
    description: string;
    portion: string;
    grams: number;
    kcalPer100g: number;
    note?: string;
}

function usda(input: UsdaInput): Omit<CatalogItem, 'defaultQty'> {
    return {
        key: input.key,
        name: input.name,
        unit: input.unit,
        kcalPerUnit: Math.round((input.kcalPer100g * input.grams) / 100),
        source: {
            name: 'USDA FoodData Central (FNDDS 2021-2023)',
            url: `https://fdc.nal.usda.gov/food-details/${input.fdcId}/nutrients`,
            accessedAt: CATALOG_ACCESSED_AT,
            reference: `FDC ${input.fdcId} "${input.description}": ${input.kcalPer100g} kcal/100 g x porcao "${input.portion}" (${input.grams} g)`,
            ...(input.note ? { note: input.note } : {}),
        },
    };
}

interface TacoInput {
    key: string;
    name: string;
    number: number;
    description: string;
    kcalPer100g: number;
    note?: string;
}

function taco(input: TacoInput): Omit<CatalogItem, 'defaultQty'> {
    return {
        key: input.key,
        name: input.name,
        unit: '100 g',
        kcalPerUnit: input.kcalPer100g,
        source: {
            name: 'TACO 4a edicao (NEPA/UNICAMP, 2011)',
            url: TACO_URL,
            accessedAt: CATALOG_ACCESSED_AT,
            reference: `TACO item ${input.number} "${input.description}": ${input.kcalPer100g} kcal/100 g`,
            ...(input.note ? { note: input.note } : {}),
        },
    };
}

// ── Itens que se repetem em varias refeicoes ─────────────────────────────────

const REFRI_LATA = usda({
    key: 'refrigerante-lata',
    name: 'Refrigerante (cola)',
    unit: 'lata (~350 ml)',
    fdcId: 2710541,
    description: 'Soft drink, cola',
    portion: '1 can (12 fl oz)',
    grams: 372,
    kcalPer100g: 42,
    note: 'Lata americana de 12 fl oz (355 ml); a lata brasileira tem 350 ml.',
});

const CERVEJA_LATA = usda({
    key: 'cerveja-lata',
    name: 'Cerveja',
    unit: 'lata (~350 ml)',
    fdcId: 2710616,
    description: 'Beer',
    portion: '1 can or bottle (12 fl oz)',
    grams: 360,
    kcalPer100g: 43,
    note: 'Lata americana de 12 fl oz (355 ml); a lata brasileira tem 350 ml.',
});

const ARROZ = taco({ key: 'arroz', name: 'Arroz branco cozido', number: 3, description: 'Arroz, tipo 1, cozido', kcalPer100g: 128 });
const FAROFA = taco({ key: 'farofa', name: 'Farofa', number: 131, description: 'Mandioca, farofa, temperada', kcalPer100g: 406 });

const PAO_DE_ALHO = usda({
    key: 'pao-de-alho',
    name: 'Pão de alho',
    unit: 'pedaço pequeno (37 g)',
    fdcId: 2707627,
    description: 'Garlic bread, from fast food / restaurant',
    portion: '1 small slice',
    grams: 37,
    kcalPer100g: 349,
});

/** Junta o item com a quantidade padrao (= preset medium). */
function withDefaults(items: Omit<CatalogItem, 'defaultQty'>[], medium: Record<string, number>): CatalogItem[] {
    return items.map((item) => ({ ...item, defaultQty: medium[item.key] ?? 0 }));
}

function meal(
    base: Omit<CatalogMeal, 'items'> & { items: Omit<CatalogItem, 'defaultQty'>[] },
): CatalogMeal {
    return { ...base, items: withDefaults(base.items, base.presets.medium) };
}

// ── As 15 refeicoes ──────────────────────────────────────────────────────────

export const FREE_MEAL_CATALOG: CatalogMeal[] = [
    meal({
        slug: 'rodizio-sushi',
        name: 'Rodízio de sushi',
        category: 'japonesa',
        icon: '🍣',
        items: [
            usda({ key: 'niguiri-salmao', name: 'Niguiri de salmão', unit: 'peça (35 g)', fdcId: 2708969, description: 'Sushi, topped with salmon', portion: '1 piece', grams: 35, kcalPer100g: 107 }),
            usda({ key: 'uramaki-salmao', name: 'Uramaki / hossomaki de salmão', unit: 'peça (30 g)', fdcId: 2708963, description: 'Sushi roll, salmon', portion: '1 piece', grams: 30, kcalPer100g: 103 }),
            usda({ key: 'california', name: 'Califórnia', unit: 'peça (30 g)', fdcId: 2708961, description: 'Sushi roll, California', portion: '1 piece', grams: 30, kcalPer100g: 94 }),
            taco({ key: 'sashimi-salmao', name: 'Sashimi de salmão', number: 316, description: 'Salmão, sem pele, fresco, cru', kcalPer100g: 170 }),
            usda({ key: 'harumaki', name: 'Harumaki (rolinho primavera)', unit: 'unidade (64 g)', fdcId: 2708700, description: 'Egg roll, meatless', portion: '1 egg roll', grams: 64, kcalPer100g: 270, note: 'Equivalente: egg roll americano sem carne.' }),
            usda({ key: 'guioza-frito', name: 'Guioza frito', unit: 'unidade (25 g)', fdcId: 2708705, description: 'Wonton, dumpling or pot sticker, fried', portion: '1 item, any size', grams: 25, kcalPer100g: 192 }),
        ],
        presets: {
            light: { 'niguiri-salmao': 4, 'uramaki-salmao': 6, california: 5 },
            medium: { 'niguiri-salmao': 8, 'uramaki-salmao': 10, california: 7, 'sashimi-salmao': 1, harumaki: 1 },
            heavy: { 'niguiri-salmao': 12, 'uramaki-salmao': 16, california: 12, 'sashimi-salmao': 1.5, harumaki: 2, 'guioza-frito': 4 },
        },
    }),
    meal({
        slug: 'rodizio-pizza',
        name: 'Rodízio de pizza',
        category: 'pizza',
        icon: '🍕',
        items: [
            usda({ key: 'pizza-mussarela', name: 'Pizza de mussarela', unit: 'fatia pequena (80 g)', fdcId: 2708616, description: 'Pizza, cheese, from restaurant or fast food, medium crust', portion: '1 piece, small pizza', grams: 80, kcalPer100g: 266 }),
            usda({ key: 'pizza-calabresa', name: 'Pizza de calabresa', unit: 'fatia pequena (86 g)', fdcId: 2708640, description: 'Pizza with pepperoni, from restaurant or fast food,  medium crust', portion: '1 piece, small pizza', grams: 86, kcalPer100g: 282, note: 'Equivalente: pizza de pepperoni.' }),
            usda({ key: 'pizza-carne', name: 'Pizza de carne / frango', unit: 'fatia pequena (92 g)', fdcId: 2708651, description: 'Pizza with meat other than pepperoni, from restaurant or fast food, medium crust', portion: '1 piece, small pizza', grams: 92, kcalPer100g: 280 }),
            REFRI_LATA,
        ],
        presets: {
            light: { 'pizza-mussarela': 2, 'pizza-calabresa': 2 },
            medium: { 'pizza-mussarela': 3, 'pizza-calabresa': 2, 'pizza-carne': 2, 'refrigerante-lata': 1 },
            heavy: { 'pizza-mussarela': 4, 'pizza-calabresa': 4, 'pizza-carne': 3, 'refrigerante-lata': 2 },
        },
    }),
    meal({
        slug: 'hamburguer-artesanal',
        name: 'Hambúrguer artesanal',
        category: 'lanche',
        icon: '🍔',
        items: [
            usda({ key: 'burger', name: 'Cheeseburger (1 carne grande)', unit: 'sanduíche (210 g)', fdcId: 2706903, description: 'Cheeseburger, on white bun, 1 large patty', portion: '1 cheeseburger', grams: 210, kcalPer100g: 299 }),
            usda({ key: 'burger-duplo', name: 'Cheeseburger duplo (2 carnes grandes)', unit: 'sanduíche (330 g)', fdcId: 2706910, description: 'Double cheeseburger, on white bun, 2 large patties', portion: '1 double cheeseburger', grams: 330, kcalPer100g: 299 }),
            usda({ key: 'fritas', name: 'Batata frita', unit: 'porção média (145 g)', fdcId: 2709462, description: 'Potato, french fries, restaurant', portion: '1 medium fast food order', grams: 145, kcalPer100g: 289 }),
            usda({ key: 'onion-rings', name: 'Onion rings', unit: 'porção (120 g)', fdcId: 2710055, description: 'Fried onion rings', portion: '1 fast food order', grams: 120, kcalPer100g: 352 }),
            usda({ key: 'milkshake', name: 'Milkshake de chocolate', unit: 'copo pequeno (405 g)', fdcId: 2705508, description: 'Milk shake, fast food, chocolate', portion: '1 small', grams: 405, kcalPer100g: 150 }),
            REFRI_LATA,
        ],
        presets: {
            light: { burger: 1 },
            medium: { burger: 1, fritas: 1, 'refrigerante-lata': 1 },
            heavy: { 'burger-duplo': 1, fritas: 1, 'onion-rings': 1, milkshake: 1 },
        },
    }),
    meal({
        slug: 'acai',
        name: 'Açaí na tigela',
        category: 'sobremesa',
        icon: '🫐',
        items: [
            taco({ key: 'acai', name: 'Açaí (polpa com xarope de guaraná)', number: 167, description: 'Açaí, polpa, com xarope de guaraná e glucose', kcalPer100g: 110 }),
            usda({ key: 'banana', name: 'Banana', unit: 'unidade (126 g)', fdcId: 2709224, description: 'Banana, raw', portion: '1 banana', grams: 126, kcalPer100g: 97 }),
            usda({ key: 'leite-condensado', name: 'Leite condensado', unit: 'dose de 30 ml (38 g)', fdcId: 2705402, description: 'Milk, condensed, sweetened', portion: '1 fl oz', grams: 38, kcalPer100g: 321 }),
            usda({ key: 'creme-avela', name: 'Creme de avelã', unit: 'colher de sopa (20 g)', fdcId: 2710289, description: 'Chocolate hazelnut spread', portion: '1 tablespoon', grams: 20, kcalPer100g: 539 }),
        ],
        presets: {
            light: { acai: 3, banana: 1 },
            medium: { acai: 5, banana: 1, 'leite-condensado': 1 },
            heavy: { acai: 7, banana: 1, 'leite-condensado': 2, 'creme-avela': 2 },
        },
    }),
    meal({
        slug: 'churrascaria',
        name: 'Churrascaria (rodízio de carnes)',
        category: 'churrasco',
        icon: '🥩',
        items: [
            taco({ key: 'picanha', name: 'Picanha com gordura (grelhada)', number: 381, description: 'Carne, bovina, picanha, com gordura, grelhada', kcalPer100g: 289 }),
            usda({ key: 'linguica', name: 'Linguiça de porco', unit: 'gomo (75 g)', fdcId: 2706191, description: 'Pork sausage', portion: '1 bun-size or griller link', grams: 75, kcalPer100g: 325, note: 'Equivalente: linguiça de porco americana (pork sausage).' }),
            taco({ key: 'coracao-frango', name: 'Coração de frango (grelhado)', number: 395, description: 'Frango, coração, grelhado', kcalPer100g: 207 }),
            PAO_DE_ALHO,
            ARROZ,
            FAROFA,
            taco({ key: 'maionese', name: 'Salada de maionese', number: 545, description: 'Salada, de legumes, com maionese', kcalPer100g: 96 }),
            CERVEJA_LATA,
        ],
        presets: {
            light: { picanha: 1.5, 'coracao-frango': 0.5, arroz: 1, maionese: 1 },
            medium: { picanha: 2.5, linguica: 1, 'coracao-frango': 1, 'pao-de-alho': 1, arroz: 1, farofa: 0.5, maionese: 1 },
            heavy: { picanha: 4, linguica: 2, 'coracao-frango': 1.5, 'pao-de-alho': 2, arroz: 1.5, farofa: 1, maionese: 1.5, 'cerveja-lata': 2 },
        },
    }),
    meal({
        slug: 'feijoada',
        name: 'Feijoada completa',
        category: 'brasileira',
        icon: '🍲',
        items: [
            taco({ key: 'feijoada', name: 'Feijoada', number: 540, description: 'Feijoada', kcalPer100g: 117 }),
            ARROZ,
            taco({ key: 'couve', name: 'Couve refogada', number: 116, description: 'Couve, manteiga, refogada', kcalPer100g: 90 }),
            FAROFA,
            taco({ key: 'torresmo', name: 'Torresmo', number: 445, description: 'Toucinho, frito', kcalPer100g: 697, note: 'Equivalente: toucinho frito (a TACO não tem torresmo).' }),
            taco({ key: 'laranja', name: 'Laranja', number: 214, description: 'Laranja, pêra, crua', kcalPer100g: 37 }),
            CERVEJA_LATA,
        ],
        presets: {
            light: { feijoada: 2.5, arroz: 1, couve: 0.5, laranja: 1 },
            medium: { feijoada: 3.5, arroz: 1.5, couve: 0.5, farofa: 0.5, torresmo: 0.3, laranja: 1 },
            heavy: { feijoada: 5, arroz: 2, couve: 1, farofa: 1, torresmo: 0.5, laranja: 1, 'cerveja-lata': 2 },
        },
    }),
    meal({
        slug: 'fast-food',
        name: 'Combo de fast-food',
        category: 'fast-food',
        icon: '🍟',
        items: [
            usda({ key: 'big-mac', name: 'Big Mac', unit: 'sanduíche (205 g)', fdcId: 2706916, description: 'Big Mac (McDonalds)', portion: "1 McDonald's Big Mac", grams: 205, kcalPer100g: 261, note: 'Receita americana (USDA); a versão brasileira pode variar um pouco.' }),
            usda({ key: 'quarteirao', name: 'Quarteirão com queijo', unit: 'sanduíche (200 g)', fdcId: 2706900, description: 'Quarter Pounder with cheese (McDonalds)', portion: '1 cheeseburger', grams: 200, kcalPer100g: 269, note: 'Receita americana (USDA); a versão brasileira pode variar um pouco.' }),
            usda({ key: 'nuggets', name: 'Nuggets de frango', unit: 'unidade (16 g)', fdcId: 2706093, description: 'Chicken nuggets, from fast food', portion: '1 nugget', grams: 16, kcalPer100g: 307 }),
            usda({ key: 'fritas-media', name: 'Batata frita média', unit: 'porção média (145 g)', fdcId: 2709461, description: 'Potato, french fries, fast food', portion: '1 medium fast food order', grams: 145, kcalPer100g: 312 }),
            usda({ key: 'refrigerante-medio', name: 'Refrigerante médio (cola)', unit: 'copo médio (~500 ml)', fdcId: 2710541, description: 'Soft drink, cola', portion: '1 medium drink', grams: 512, kcalPer100g: 42 }),
            usda({ key: 'sundae', name: 'Sundae de chocolate', unit: 'unidade (180 g)', fdcId: 2705661, description: 'Ice cream sundae, hot fudge topping', portion: '1 sundae', grams: 180, kcalPer100g: 243 }),
        ],
        presets: {
            light: { 'big-mac': 1, 'fritas-media': 1 },
            medium: { 'big-mac': 1, 'fritas-media': 1, 'refrigerante-medio': 1 },
            heavy: { 'big-mac': 1, nuggets: 4, 'fritas-media': 1, 'refrigerante-medio': 1, sundae: 1 },
        },
    }),
    meal({
        slug: 'lasanha',
        name: 'Lasanha à bolonhesa',
        category: 'italiana',
        icon: '🍝',
        items: [
            usda({ key: 'lasanha', name: 'Lasanha com carne', unit: 'pedaço (232 g)', fdcId: 2708752, description: 'Lasagna with meat, from restaurant', portion: '1 piece (1/8 of 7" x 12", approx 3-1/2" x 3")', grams: 232, kcalPer100g: 185 }),
            PAO_DE_ALHO,
            usda({ key: 'vinho-tinto', name: 'Vinho tinto', unit: 'taça (180 g)', fdcId: 2710688, description: 'Wine, red', portion: '1 glass', grams: 180, kcalPer100g: 85 }),
            REFRI_LATA,
            usda({ key: 'pudim', name: 'Pudim de leite', unit: 'porção (130 g)', fdcId: 2705683, description: 'Flan', portion: 'Quantity not specified', grams: 130, kcalPer100g: 178, note: 'Equivalente: flan.' }),
        ],
        presets: {
            light: { lasanha: 1 },
            medium: { lasanha: 1.5, 'pao-de-alho': 1, 'vinho-tinto': 1 },
            heavy: { lasanha: 2, 'pao-de-alho': 2, 'vinho-tinto': 2, pudim: 1 },
        },
    }),
    meal({
        slug: 'pastel-de-feira',
        name: 'Pastel de feira com caldo de cana',
        category: 'brasileira',
        icon: '🥟',
        items: [
            taco({ key: 'pastel-carne', name: 'Pastel de carne (frito)', number: 56, description: 'Pastel, de carne, frito', kcalPer100g: 388, note: 'Valor por 100 g: um pastel grande de feira costuma pesar mais que isso.' }),
            taco({ key: 'pastel-queijo', name: 'Pastel de queijo (frito)', number: 58, description: 'Pastel, de queijo, frito', kcalPer100g: 422, note: 'Valor por 100 g: um pastel grande de feira costuma pesar mais que isso.' }),
            taco({ key: 'caldo-de-cana', name: 'Caldo de cana', number: 473, description: 'Cana, caldo de', kcalPer100g: 65, note: '100 g de caldo equivalem a cerca de 100 ml.' }),
        ],
        presets: {
            light: { 'pastel-carne': 1.5, 'caldo-de-cana': 3 },
            medium: { 'pastel-carne': 1.5, 'pastel-queijo': 1, 'caldo-de-cana': 4 },
            heavy: { 'pastel-carne': 2, 'pastel-queijo': 2, 'caldo-de-cana': 5 },
        },
    }),
    meal({
        slug: 'salgados',
        name: 'Salgados de lanchonete',
        category: 'brasileira',
        icon: '🥐',
        items: [
            taco({ key: 'coxinha', name: 'Coxinha de frango', number: 386, description: 'Coxinha de frango, frita', kcalPer100g: 283 }),
            taco({ key: 'quibe', name: 'Quibe frito', number: 442, description: 'Quibe, frito', kcalPer100g: 254 }),
            taco({ key: 'empada', name: 'Empada de frango', number: 389, description: 'Empada de frango, pré-cozida, assada', kcalPer100g: 358 }),
            taco({ key: 'pao-de-queijo', name: 'Pão de queijo', number: 140, description: 'Pão, de queijo, assado', kcalPer100g: 363 }),
            REFRI_LATA,
        ],
        presets: {
            light: { coxinha: 1, quibe: 1 },
            medium: { coxinha: 1.5, quibe: 1, 'pao-de-queijo': 0.5, 'refrigerante-lata': 1 },
            heavy: { coxinha: 2, quibe: 1.5, empada: 1, 'pao-de-queijo': 1, 'refrigerante-lata': 2 },
        },
    }),
    meal({
        slug: 'comida-mexicana',
        name: 'Comida mexicana',
        category: 'mexicana',
        icon: '🌯',
        items: [
            usda({ key: 'burrito', name: 'Burrito de carne (feijão, arroz e queijo)', unit: 'unidade (220 g)', fdcId: 2708538, description: 'Burrito, beef, with beans and rice, cheese', portion: '1 small/regular', grams: 220, kcalPer100g: 225 }),
            usda({ key: 'taco', name: 'Taco de carne (tortilha de trigo)', unit: 'unidade (105 g)', fdcId: 2708522, description: 'Taco, flour tortilla, beef, cheese', portion: '1 small/regular', grams: 105, kcalPer100g: 257 }),
            usda({ key: 'nachos', name: 'Nachos com carne', unit: 'porção (250 g)', fdcId: 2708578, description: 'Nachos, beef or pork', portion: '1 order', grams: 250, kcalPer100g: 265 }),
            usda({ key: 'guacamole', name: 'Guacamole', unit: 'potinho (70 g)', fdcId: 2709307, description: 'Guacamole, NFS', portion: '1 individual container', grams: 70, kcalPer100g: 155 }),
            CERVEJA_LATA,
        ],
        presets: {
            light: { burrito: 1 },
            medium: { burrito: 1, taco: 1, guacamole: 1 },
            heavy: { burrito: 1, taco: 2, nachos: 1, guacamole: 1, 'cerveja-lata': 2 },
        },
    }),
    meal({
        slug: 'comida-chinesa',
        name: 'Comida chinesa (yakisoba)',
        category: 'chinesa',
        icon: '🥡',
        items: [
            usda({ key: 'yakisoba', name: 'Yakisoba misto', unit: 'xícara (220 g)', fdcId: 2706724, description: 'Chow mein or chop suey, various types of meat, with noodles', portion: '1 cup', grams: 220, kcalPer100g: 134, note: 'Equivalente: chow mein com macarrão e carnes variadas.' }),
            usda({ key: 'frango-agridoce', name: 'Frango agridoce', unit: 'xícara (252 g)', fdcId: 2706435, description: 'Sweet and sour chicken or turkey', portion: '1 cup', grams: 252, kcalPer100g: 250 }),
            usda({ key: 'arroz-frito', name: 'Arroz frito (chop suey)', unit: 'xícara (198 g)', fdcId: 2708952, description: 'Rice, fried, NFS', portion: '1 cup', grams: 198, kcalPer100g: 174 }),
            usda({ key: 'rolinho', name: 'Rolinho primavera (carne)', unit: 'unidade (64 g)', fdcId: 2708702, description: 'Egg roll, with beef and/or pork', portion: '1 egg roll', grams: 64, kcalPer100g: 272 }),
            REFRI_LATA,
        ],
        presets: {
            light: { yakisoba: 1.5 },
            medium: { yakisoba: 2, rolinho: 1, 'refrigerante-lata': 1 },
            heavy: { yakisoba: 2, 'frango-agridoce': 1, rolinho: 2, 'refrigerante-lata': 1 },
        },
    }),
    meal({
        slug: 'sorvete-sobremesas',
        name: 'Sorvete e sobremesas',
        category: 'sobremesa',
        icon: '🍨',
        items: [
            usda({ key: 'sorvete', name: 'Sorvete de creme', unit: 'bola (120 g)', fdcId: 2705630, description: 'Ice cream, vanilla', portion: '1 scoop', grams: 120, kcalPer100g: 207 }),
            usda({ key: 'brownie', name: 'Brownie', unit: 'unidade média (50 g)', fdcId: 2707904, description: 'Cookie, brownie, without icing', portion: '1 medium', grams: 50, kcalPer100g: 405 }),
            usda({ key: 'sundae', name: 'Sundae com calda de chocolate', unit: 'unidade (180 g)', fdcId: 2705661, description: 'Ice cream sundae, hot fudge topping', portion: '1 sundae', grams: 180, kcalPer100g: 243 }),
            usda({ key: 'pudim', name: 'Pudim de leite', unit: 'porção (130 g)', fdcId: 2705683, description: 'Flan', portion: 'Quantity not specified', grams: 130, kcalPer100g: 178, note: 'Equivalente: flan.' }),
        ],
        presets: {
            light: { sorvete: 1 },
            medium: { sorvete: 2, brownie: 1 },
            heavy: { sorvete: 2, brownie: 1, sundae: 1, pudim: 1 },
        },
    }),
    meal({
        slug: 'cachorro-quente',
        name: 'Cachorro-quente',
        category: 'lanche',
        icon: '🌭',
        items: [
            usda({ key: 'hot-dog', name: 'Cachorro-quente simples', unit: 'unidade (102 g)', fdcId: 2707060, description: 'Hot dog sandwich, beef, on white bun', portion: '1 sandwich', grams: 102, kcalPer100g: 296, note: 'Pão + salsicha; o "dogão" brasileiro com purê e molhos pesa mais.' }),
            usda({ key: 'batata-palha', name: 'Batata palha', unit: 'pacotinho (28 g)', fdcId: 2709444, description: 'Potato sticks, plain', portion: '1 small single serving bag', grams: 28, kcalPer100g: 522 }),
            REFRI_LATA,
        ],
        presets: {
            light: { 'hot-dog': 1, 'batata-palha': 0.5 },
            medium: { 'hot-dog': 2, 'batata-palha': 1, 'refrigerante-lata': 1 },
            heavy: { 'hot-dog': 3, 'batata-palha': 2, 'refrigerante-lata': 2 },
        },
    }),
    meal({
        slug: 'parmegiana',
        name: 'Parmegiana com arroz e fritas',
        category: 'brasileira',
        icon: '🍛',
        items: [
            usda({ key: 'parmegiana', name: 'Filé de frango à parmegiana', unit: 'filé (182 g)', fdcId: 2706442, description: 'Chicken or turkey parmigiana', portion: '1 patty with sauce and cheese', grams: 182, kcalPer100g: 174 }),
            ARROZ,
            taco({ key: 'feijao', name: 'Feijão carioca cozido', number: 561, description: 'Feijão, carioca, cozido', kcalPer100g: 76 }),
            taco({ key: 'batata-frita', name: 'Batata frita', number: 93, description: 'Batata, inglesa, frita', kcalPer100g: 267 }),
            REFRI_LATA,
        ],
        presets: {
            light: { parmegiana: 1, arroz: 1, feijao: 1 },
            medium: { parmegiana: 1.5, arroz: 1.5, 'batata-frita': 1, 'refrigerante-lata': 1 },
            heavy: { parmegiana: 2, arroz: 2, feijao: 1, 'batata-frita': 1.5, 'refrigerante-lata': 2 },
        },
    }),
];
