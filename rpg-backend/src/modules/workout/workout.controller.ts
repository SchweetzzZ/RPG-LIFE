import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { WorkoutService } from "./workout.service";
import { CreateWorkoutDtoClass, UpdateWorkoutDtoClass } from "./dto/workout-dto";
import { JwtAuthGuard } from "../common/guards/jwt-guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("workout")
@UseGuards(JwtAuthGuard)
export class WorkoutController {
    constructor(private readonly workoutService: WorkoutService) { }

    // ── Routine CRUD ─────────────────────────────────────────────────────────

    @Post()
    async createWorkout(
        @CurrentUser('sub') userId: string,
        @Body() dto: CreateWorkoutDtoClass,
    ) {
        return this.workoutService.createWorkout(userId, dto);
    }

    @Put(':id')
    async updateWorkout(
        @CurrentUser('sub') userId: string,
        @Param('id') workoutId: string,
        @Body() dto: UpdateWorkoutDtoClass,
    ) {
        return this.workoutService.updateWorkout(userId, workoutId, dto);
    }

    @Delete(':id')
    async deleteWorkout(
        @CurrentUser('sub') userId: string,
        @Param('id') workoutId: string,
    ) {
        return this.workoutService.deleteWorkout(userId, workoutId);
    }

    @Get()
    async getUserWorkouts(@CurrentUser('sub') userId: string) {
        return this.workoutService.getUserWorkouts(userId);
    }

    @Get('all')
    async getAllWorkouts() {
        return this.workoutService.getAllWorkouts();
    }

    // NOTE: 'logs' routes MUST be declared before ':id' to avoid route conflicts
    @Post('logs')
    async createWorkoutLog(
        @CurrentUser('sub') userId: string,
        @Body() body: any,
    ) {
        return this.workoutService.createWorkoutLog(userId, body);
    }

    @Get('logs/user')
    async getUserWorkoutLogs(@CurrentUser('sub') userId: string) {
        return this.workoutService.getUserWorkoutLogs(userId);
    }

    @Get(':id')
    async getWorkoutById(@Param('id') workoutId: string) {
        return this.workoutService.getWorkoutById(workoutId);
    }
}