import type { components } from "../api/schema"

export type ProfileData = components["schemas"]["ProfileResponseDto"]
export type UpdateProfileInput = components["schemas"]["UpdateProfileDto"]
export type NutritionUpdateResult = components["schemas"]["UpdateNutritionResponseDto"]

export type BiologicalSex = NonNullable<UpdateProfileInput["biologicalSex"]>
export type ActivityLevel = NonNullable<UpdateProfileInput["activityLevel"]>
export type PrimaryGoal = NonNullable<UpdateProfileInput["primaryGoal"]>
