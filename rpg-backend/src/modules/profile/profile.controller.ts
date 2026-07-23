import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile-dto';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    async getProfile(@CurrentUser('sub') userId: string) {
        return this.profileService.getProfile(userId);
    }

    @Patch()
    async updateProfile(
        @CurrentUser('sub') userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.profileService.updateProfile(userId, dto);
    }

    @Get('recommendations')
    async getRecommendations(@CurrentUser('sub') userId: string) {
        return this.profileService.getRecommendations(userId);
    }

    @Patch('nutrition')
    async updateNutrition(
        @CurrentUser('sub') userId: string,
        @Body() dto: any,
    ) {
        return this.profileService.calculateNutritionByUser(userId, dto);
    }
}
