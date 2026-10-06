import React from "react"
import type { EnergyDailySummaryResponse } from "@/src/types/dashboard"

interface EnergyBalance {
    data: EnergyDailySummaryResponse
}

export function EnergyBalance({ data }: EnergyBalance) {
    const { summary, breakdown } = data

    return (
        <div className="w-full flex flex-col gap-4 border border-neutral-800 bg-neutral-900 rounded-xl p-4 ">
            <div className="flex justify-between items-center text-xs text-neutral-400 border b border-neutral-800 pb-2">
                <span className="font-semibold uppercase tracking-wider">Balanço Calórico</span>
                <span className="text-cyan-400 font-medium">Meta: {summary.tdee} kcal</span>
            </div>

            {/* Mostrador Central de Saldo Calórico Restante */}
            <div className="flex flex-col items-center justify-center py-4 border border-neutral-800 bg-neutral-950 rounded-lg">
                <span className="text-3xl font-extrabold text-neutral-100">{summary.remainingCalorieBudget}</span>
                <span className="text-xs text-neutral-400 uppercase mt-1 tracking-wider">kcal restantes</span>
                <span className="text-xs text-neutral-500 mt-2">({summary.activityCaloriesBurned}) kcal queimadas em atividades</span>
            </div>

            {/* Grid de 3 Métricas: TMB, Treino, Passos */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
                    <div className="text-neutral-400">TMB(BASAL)</div>
                    <div className="font-bold text-neutral-200 mt-1">{summary.bmr} kcal</div>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
                    <div className="text-neutral-400">Treinos</div>
                    <div className="font-bold text-neutral-200 mt-1">
                        {breakdown.workouts.totalCalories} kcal
                    </div>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
                    <div className="text-neutral-400">Passos</div>
                    <div className="font-bold text-neutral-200 mt-1">
                        {breakdown.steps.caloriesBurned} kcal
                    </div>
                </div>
            </div>
        </div>
    )
}