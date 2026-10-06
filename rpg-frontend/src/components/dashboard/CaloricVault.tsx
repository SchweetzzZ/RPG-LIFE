import React from "react"
import type { WeeklyBudgetResponse } from "@/src/types/dashboard";

interface CaloricVaultProps {
    data: WeeklyBudgetResponse
}

export function CaloricVault({ data }: CaloricVaultProps) {
    const { } = data
    return (
        <div className="flex flex-col justify-between border border-neutral-800 bg-neutral-900 rounded-xl p-3">
            <div>
                <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Cofre Semanal</div>
                <div className="text-lg font-bold text-neutral-100 mt-1">
                    {data.accumulatedWeekDeficit.toLocaleString()}<span className="text-xs font-normal text-neutral-400">kcal</span>
                </div>
            </div>
            <div className="text-xs text-neutral-400 mt-3 pt-2 border-t border-neutral-800">
                Buffer Fim de semana: <span className="text-esmerald-400 font-medium">+{data.weekendBufferTotal} kcal</span>
            </div>
        </div >
    )
}