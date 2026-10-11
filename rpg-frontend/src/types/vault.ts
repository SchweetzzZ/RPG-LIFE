import type { components } from "../api/schema"

export type Vault = components["schemas"]["VaultResponseDto"]
export type VaultEntry = Vault["entries"][number]
export type Coins = components["schemas"]["CoinsResponseDto"]
