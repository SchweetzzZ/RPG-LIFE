import React from "react";
import type { UserMeResponse } from "@/src/types/dashboard";

interface UserHudProps {
    data: UserMeResponse,
    targetMeal?: {
        name: string,
        targetCoins: number
    }
}

export function UserHUD({
    data, targetMeal = { name: "Refeição livre do sábado", targetCoins: 200 }
}: UserHudProps) {
    const { user, profile } = data
    const coins = profile?.coins ?? 0
    const cheatProgress = Math.min(100, Math.round((coins / targetMeal.targetCoins * 100)))

    const getGoalInfo = (goal: string | null | undefined) => {
        switch (goal) {
            case 'lose_weight':
                return { label: 'perca_de_gordura', color: "text-amber-500 border-amber-500/30 bg-amber-500/10" }
            case 'gain_muscle':
                return { label: 'ganho de músculo', color: "text-amber-500 border-amber-500/30 bg-amber-500/10" }
            case 'maintain':
                return { label: 'manuntenção', color: "text-amber-500 border-amber-500/30 bg-amber-500/10" }
        }
    }

    const goal = getGoalInfo(profile?.primaryGoal)
    return (
        <div className="flex flex-col w-full border border-neutral-800 bg-neutral-900 rounded-xl p-4 gap-3.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 bg-neutral-800 border 
                    border-neutral-700 rounded-lg font-bold text-neutral-200 text-lg">
                        {user.username.charAt(1).toUpperCase()}
                    </div>
                </div>
                <h1 className="text-base font-bold text-neutral-100 leading-tight">
                    {user.username}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block border px-2 py-0.5 rounded text-[11px] font-semibold ${goal?.color}`}>
                        🎯{goal?.label}
                    </span>

                </div>

            </div>

        </div>
    )
}

