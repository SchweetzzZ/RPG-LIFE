import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProfileService } from '../profile/profile.service';
import { toUserDate } from '../common/utils/user-date';
import { VaultService } from './vault.service';
import { VaultResponseDto } from './dto/vault-dto';

@ApiTags('Vault')
@ApiBearerAuth()
@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
    constructor(
        private readonly vaultService: VaultService,
        private readonly profileService: ProfileService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Cofre de kcal do ciclo atual: saldo, datas do ciclo e extrato' })
    @ApiOkResponse({ type: VaultResponseDto, description: 'Cofre do ciclo atual' })
    async getVault(@CurrentUser('sub') userId: string): Promise<VaultResponseDto> {
        const today = toUserDate(await this.profileService.getTimezone(userId));
        return this.vaultService.getSummary(userId, today);
    }
}
