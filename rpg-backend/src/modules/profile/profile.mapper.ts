import { BiologicalSex, UserProfile } from "./schema/profile.schema";
import { ProfileResponse } from "./dto/profile-dto";
import { resolveTimezone } from "../common/utils/user-date";

// Os tipos das classes de schema nao declaram `_id`, mas o Mongo sempre o devolve
type WithId<T> = T & { _id?: unknown };

// Valor fora do enum (ex.: um 'other' antigo no banco) volta como null: o usuario escolhe de novo
const toBiologicalSex = (value: string | null | undefined): ProfileResponse['biologicalSex'] =>
    Object.values(BiologicalSex).find((s) => s === value) ?? null;

export function toProfileResponse(doc: WithId<UserProfile>): ProfileResponse {
    return {
        id: String(doc._id),
        weightKg: doc.weightKg ?? null,
        heightCm: doc.heightCm ?? null,
        age: doc.age ?? null,
        biologicalSex: toBiologicalSex(doc.biologicalSex),
        activityLevel: doc.activityLevel ?? null,
        primaryGoal: doc.primaryGoal ?? null,
        timezone: resolveTimezone(doc.timezone),
        targetCalories: doc.targetCalories ?? null,
        targetProteinGrams: doc.targetProteinGrams ?? null,
        targetCarbGrams: doc.targetCarbGrams ?? null,
        targetFatGrams: doc.targetFatGrams ?? null,
    };
}
