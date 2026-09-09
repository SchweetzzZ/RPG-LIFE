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

    const getGoalInfo = (goal: string | null) => {
        switch (goal) {
            case 'lose_weight':
                return { label: 'perca_de_gordura', color: "text-amber-500 border-amber-500/30 bg-amber-500/10" }
            case 'gain_muscle':
                return { label: 'ganho de músculo', color: "text-amber-500 border-amber-500/30 bg-amber-500/10" }
            case 'maintain':
                return { label: 'manuntenção', color: "text-amber-500 border-amber-500/30 bg-amber-500/10" }
        }
    }

    //const goal = getGoalInfo(profile?.primaryGoal)
    return (
        <div className="">

        </div>
    )
}

