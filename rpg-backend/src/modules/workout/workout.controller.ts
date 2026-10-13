import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import { WorkoutService } from "./workout.service";
import {
    CreateWorkoutDtoClass,
    UpdateWorkoutDtoClass,
    LogWorkoutDto,
    CreateWorkoutLogDto,
    WorkoutResponseDto,
    WorkoutLogResponseDto,
    LogWorkoutSessionResponseDto,
    ProgressionResponseDto,
    ExercisePerformanceResponseDto,
    WorkoutDeletedResponseDto,
    ExerciseCatalogItemResponseDto,
    RenameExerciseDto,
    ExerciseRenamedResponseDto,
    ExerciseDeletedResponseDto,
} from "./dto/workout-dto";
import { toWorkoutLogResponse, toWorkoutResponse } from "./workout.mapper";
import { JwtAuthGuard } from "../common/guards/jwt-guard";
import { RoleGuard } from "../common/guards/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { UserRole } from "../user/schema/user-schema";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags('Workout')
@ApiBearerAuth()
@Controller("workout")
@UseGuards(JwtAuthGuard)
export class WorkoutController {
    constructor(private readonly workoutService: WorkoutService) { }

    // ── Routine CRUD ─────────────────────────────────────────────────────────

    @Post()
    @ApiCreatedResponse({ type: WorkoutResponseDto, description: 'Rotina criada' })
    async createWorkout(
        @CurrentUser('sub') userId: string,
        @Body() dto: CreateWorkoutDtoClass,
    ): Promise<WorkoutResponseDto> {
        const workout = await this.workoutService.createWorkout(userId, dto);
        return toWorkoutResponse(workout);
    }

    @Put(':id')
    @ApiOkResponse({ type: WorkoutResponseDto, description: 'Rotina atualizada' })
    async updateWorkout(
        @CurrentUser('sub') userId: string,
        @Param('id') workoutId: string,
        @Body() dto: UpdateWorkoutDtoClass,
    ): Promise<WorkoutResponseDto> {
        const workout = await this.workoutService.updateWorkout(userId, workoutId, dto);
        return toWorkoutResponse(workout);
    }

    // NOTE: 'exercises' DELETE precisa vir antes de ':id'
    @Delete('exercises')
    @ApiQuery({ name: 'name', required: true, description: 'Nome do exercicio' })
    @ApiOkResponse({ type: ExerciseDeletedResponseDto, description: 'Exercicio apagado das rotinas e do historico' })
    async deleteExercise(
        @CurrentUser('sub') userId: string,
        @Query('name') name: string,
    ): Promise<ExerciseDeletedResponseDto> {
        if (!name?.trim()) throw new BadRequestException('Informe o nome do exercício');
        return this.workoutService.deleteExercise(userId, name);
    }

    @Delete(':id')
    @ApiOkResponse({ type: WorkoutDeletedResponseDto, description: 'Rotina removida' })
    async deleteWorkout(
        @CurrentUser('sub') userId: string,
        @Param('id') workoutId: string,
    ): Promise<WorkoutDeletedResponseDto> {
        await this.workoutService.deleteWorkout(userId, workoutId);
        return { message: 'Rotina removida com sucesso' };
    }

    @Get()
    @ApiOkResponse({ type: WorkoutResponseDto, isArray: true, description: 'Rotinas do usuario' })
    async getUserWorkouts(@CurrentUser('sub') userId: string): Promise<WorkoutResponseDto[]> {
        const workouts = await this.workoutService.getUserWorkouts(userId);
        return workouts.map((w) => toWorkoutResponse(w));
    }

    // Lista rotinas de TODOS os usuarios: restrito a administradores
    @Get('all')
    @UseGuards(RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOkResponse({ type: WorkoutResponseDto, isArray: true, description: 'Todas as rotinas (somente admin)' })
    async getAllWorkouts(): Promise<WorkoutResponseDto[]> {
        const workouts = await this.workoutService.getAllWorkouts();
        return workouts.map((w) => toWorkoutResponse(w));
    }

    // NOTE: 'logs', 'session', 'progression' routes MUST be declared before ':id' to avoid route conflicts
    @Post('logs')
    @ApiCreatedResponse({ type: WorkoutLogResponseDto, description: 'Log de treino registrado' })
    async createWorkoutLog(
        @CurrentUser('sub') userId: string,
        @Body() dto: CreateWorkoutLogDto,
    ): Promise<WorkoutLogResponseDto> {
        const log = await this.workoutService.createWorkoutLog(userId, dto);
        return toWorkoutLogResponse(log);
    }

    @Get('logs/user')
    @ApiOkResponse({ type: WorkoutLogResponseDto, isArray: true, description: 'Historico de treinos do usuario' })
    async getUserWorkoutLogs(@CurrentUser('sub') userId: string): Promise<WorkoutLogResponseDto[]> {
        const logs = await this.workoutService.getUserWorkoutLogs(userId);
        return logs.map((l) => toWorkoutLogResponse(l));
    }

    @Post('session')
    @ApiCreatedResponse({ type: LogWorkoutSessionResponseDto, description: 'Treino concluido (kcal, moedas e XP)' })
    async logWorkoutSession(
        @CurrentUser('sub') userId: string,
        @Body() dto: LogWorkoutDto,
    ): Promise<LogWorkoutSessionResponseDto> {
        const result = await this.workoutService.logWorkoutSession(userId, dto);
        return {
            ...result,
            workoutLog: toWorkoutLogResponse(result.workoutLog),
        };
    }

    @Get('exercises')
    @ApiOkResponse({ type: ExerciseCatalogItemResponseDto, isArray: true, description: 'Catalogo de exercicios (rotinas + registros)' })
    async getExerciseCatalog(@CurrentUser('sub') userId: string): Promise<ExerciseCatalogItemResponseDto[]> {
        return this.workoutService.getExerciseCatalog(userId);
    }

    @Patch('exercises/rename')
    @ApiOkResponse({ type: ExerciseRenamedResponseDto, description: 'Exercicio renomeado nas rotinas e no historico (409 se o nome ja existe)' })
    async renameExercise(
        @CurrentUser('sub') userId: string,
        @Body() dto: RenameExerciseDto,
    ): Promise<ExerciseRenamedResponseDto> {
        return this.workoutService.renameExercise(userId, dto.from, dto.to);
    }

    @Get('last-performance')
    @ApiOkResponse({ type: ExercisePerformanceResponseDto, isArray: true, description: 'Ultima carga de cada exercicio' })
    async getLastPerformance(@CurrentUser('sub') userId: string): Promise<ExercisePerformanceResponseDto[]> {
        return this.workoutService.getLastPerformance(userId);
    }

    @Get('progression/:exerciseName')
    @ApiOkResponse({ type: ProgressionResponseDto, description: 'Evolucao de carga de um exercicio' })
    async getProgression(
        @CurrentUser('sub') userId: string,
        @Param('exerciseName') exerciseName: string,
    ): Promise<ProgressionResponseDto> {
        return this.workoutService.getProgression(userId, exerciseName);
    }

    @Get(':id')
    @ApiOkResponse({ type: WorkoutResponseDto, description: 'Rotina do usuario' })
    async getWorkoutById(
        @CurrentUser('sub') userId: string,
        @Param('id') workoutId: string,
    ): Promise<WorkoutResponseDto> {
        const workout = await this.workoutService.getWorkoutById(userId, workoutId);
        return toWorkoutResponse(workout);
    }
}
