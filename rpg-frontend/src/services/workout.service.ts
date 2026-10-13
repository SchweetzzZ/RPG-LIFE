import { client } from "./api"
import { ApiError, toApiError } from "./http"
import type {
  CreateRoutineInput,
  ExerciseCatalogItem,
  ExercisePerformance,
  LogSessionInput,
  LogSessionResult,
  Progression,
  Routine,
  UpdateRoutineInput,
  WorkoutLog,
} from "../types/workout"

export const workoutService = {
  // Rotinas do usuário (GET /workout)
  async listRoutines(): Promise<Routine[]> {
    const { data, error, response } = await client.GET("/workout")
    if (!data) {
      throw toApiError(response, error, "Falha ao buscar as rotinas")
    }
    return data
  },

  async getRoutine(id: string): Promise<Routine> {
    const { data, error, response } = await client.GET("/workout/{id}", { params: { path: { id } } })
    if (!data) {
      throw toApiError(response, error, "Rotina não encontrada")
    }
    return data
  },

  async createRoutine(body: CreateRoutineInput): Promise<Routine> {
    const { data, error, response } = await client.POST("/workout", { body })
    if (!data) {
      throw toApiError(response, error, "Não foi possível criar a rotina")
    }
    return data
  },

  async updateRoutine(id: string, body: UpdateRoutineInput): Promise<Routine> {
    const { data, error, response } = await client.PUT("/workout/{id}", { params: { path: { id } }, body })
    if (!data) {
      throw toApiError(response, error, "Não foi possível salvar a rotina")
    }
    return data
  },

  async deleteRoutine(id: string): Promise<void> {
    const { data, error, response } = await client.DELETE("/workout/{id}", { params: { path: { id } } })
    if (!data) {
      throw toApiError(response, error, "Não foi possível remover a rotina")
    }
  },

  // Histórico de treinos (GET /workout/logs/user)
  async listLogs(): Promise<WorkoutLog[]> {
    const { data, error, response } = await client.GET("/workout/logs/user")
    if (!data) {
      throw toApiError(response, error, "Falha ao buscar o histórico")
    }
    return data
  },

  // Registra um treino: kcal, moedas e XP vêm calculados do servidor (POST /workout/session)
  async logSession(body: LogSessionInput): Promise<LogSessionResult> {
    const { data, error, response } = await client.POST("/workout/session", { body })
    if (!data) {
      throw toApiError(response, error, "Não foi possível registrar o treino")
    }
    return data
  },

  // Última carga de cada exercício (GET /workout/last-performance)
  async lastPerformance(): Promise<ExercisePerformance[]> {
    const { data, error, response } = await client.GET("/workout/last-performance")
    if (!data) {
      throw toApiError(response, error, "Falha ao buscar as últimas cargas")
    }
    return data
  },

  async progression(exerciseName: string): Promise<Progression> {
    const { data, error, response } = await client.GET("/workout/progression/{exerciseName}", {
      params: { path: { exerciseName } },
    })
    if (!data) {
      throw toApiError(response, error, "Falha ao buscar a evolução")
    }
    return data
  },

  // Catálogo do usuário: exercícios de rotinas e do histórico, sem duplicar (GET /workout/exercises)
  async listExercises(): Promise<ExerciseCatalogItem[]> {
    const { data, error, response } = await client.GET("/workout/exercises")
    if (!data) {
      throw toApiError(response, error, "Falha ao buscar os exercícios")
    }
    return data
  },

  // Renomeia nas rotinas e no histórico (PATCH /workout/exercises/rename); 409 = nome já existe
  async renameExercise(from: string, to: string): Promise<void> {
    const { data, error, response } = await client.PATCH("/workout/exercises/rename", { body: { from, to } })
    if (!data) {
      if (response.status === 409) throw new ApiError("Já existe um exercício com esse nome", 409)
      if (response.status === 404) throw new ApiError("Exercício não encontrado", 404)
      throw toApiError(response, error, "Não foi possível renomear o exercício")
    }
  },

  // Apaga o exercício das rotinas e TODO o histórico dele (DELETE /workout/exercises?name=)
  async deleteExercise(name: string): Promise<void> {
    const { data, error, response } = await client.DELETE("/workout/exercises", { params: { query: { name } } })
    if (!data) {
      throw toApiError(response, error, "Não foi possível apagar o exercício")
    }
  },
}
