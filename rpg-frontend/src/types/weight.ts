import type { components } from "../api/schema"

export type WeightData = components["schemas"]["WeightResponseDto"]
export type WeightEntry = WeightData["entries"][number]
export type WeightSummary = WeightData["summary"]
export type WeightMutationResult = components["schemas"]["WeightMutationResponseDto"]
