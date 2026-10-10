import { CycleDocument } from './schema/cycle.schema';
import { VaultEntryDocument } from './schema/vault-entry.schema';
import { CycleResponse, VaultEntryResponse } from './dto/vault-dto';

export function toCycleResponse(cycle: CycleDocument): CycleResponse {
    return {
        id: String(cycle._id),
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
        hasFreeMeal: cycle.freeMeal != null,
    };
}

export function toVaultEntryResponse(entry: VaultEntryDocument): VaultEntryResponse {
    return {
        id: String(entry._id),
        date: entry.date,
        kcal: entry.kcal,
        type: entry.type,
        createdAt: entry.createdAt.toISOString(),
    };
}
