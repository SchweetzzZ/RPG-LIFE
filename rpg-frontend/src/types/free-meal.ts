import type { components } from "../api/schema"

type Schemas = components["schemas"]

export type FreeMealTemplate = Schemas["FreeMealTemplateResponseDto"]
export type FreeMealTemplateItem = FreeMealTemplate["items"][number]
export type FreeMealPresetName = keyof FreeMealTemplate["presets"]

export type FreeMeal = Schemas["FreeMealResponseDto"]
export type FreeMealScope = FreeMeal["scope"]

export type NextFreeMeals = Schemas["NextFreeMealResponseDto"]
/** Uma refeição ativa com a situação dela contra o saldo de agora (item de `week` ou `day`). */
export type FreeMealPlan = NextFreeMeals["week"][number]

export type CreateFreeMealInput = Schemas["CreateFreeMealDto"]
export type RedeemFreeMealInput = Schemas["RedeemFreeMealDto"]
export type RedeemFreeMealResult = Schemas["RedeemFreeMealResponseDto"]

/** Item avulso enviado ao agendar (extraItems) ou ao resgatar (actualItems). */
export type FreeMealItemInput = NonNullable<CreateFreeMealInput["extraItems"]>[number]

export type FoodResult = Schemas["FoodResultDto"]
