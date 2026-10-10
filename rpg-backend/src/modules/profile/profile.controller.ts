import { Controller, Get, Patch, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ProfileResponseDto, UpdateNutritionResponseDto, UpdateProfileDto } from './dto/profile-dto';
import { toProfileResponse } from './profile.mapper';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    @ApiOkResponse({ type: ProfileResponseDto, description: 'Perfil do usuario' })
    async getProfile(@CurrentUser('sub') userId: string): Promise<ProfileResponseDto> {
        const profile = await this.profileService.getProfile(userId);
        return toProfileResponse(profile);
    }

    @Patch()
    @ApiOkResponse({ type: ProfileResponseDto, description: 'Perfil atualizado' })
    async updateProfile(
        @CurrentUser('sub') userId: string,
        @Body() dto: UpdateProfileDto,
    ): Promise<ProfileResponseDto> {
        const profile = await this.profileService.updateProfile(userId, dto);
        return toProfileResponse(profile);
    }

    @Patch('nutrition')
    @ApiOkResponse({ type: UpdateNutritionResponseDto, description: 'Perfil atualizado com as novas metas de calorias e macros' })
    async updateNutrition(
        @CurrentUser('sub') userId: string,
        @Body() dto: UpdateProfileDto,
    ): Promise<UpdateNutritionResponseDto> {
        const { profile, targets } = await this.profileService.calculateNutritionByUser(userId, dto);
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }
        return { profile: toProfileResponse(profile), targets };
    }
}
