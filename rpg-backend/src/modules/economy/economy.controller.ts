import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CoinService } from './economy.service';
import { CoinsResponseDto } from './dto/coins-dto';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Economy')
@ApiBearerAuth()
@Controller('coins')
@UseGuards(JwtAuthGuard)
export class EconomyController {
    constructor(private readonly coinService: CoinService) { }

    // GET /coins -> saldo atual + ultimas 50 entradas do livro-razao
    @Get()
    @ApiOkResponse({ type: CoinsResponseDto, description: 'Saldo de moedas e extrato recente' })
    async getCoins(@CurrentUser('sub') userId: string): Promise<CoinsResponseDto> {
        const [balance, entries] = await Promise.all([
            this.coinService.balance(userId),
            this.coinService.history(userId, 50),
        ]);

        return {
            balance,
            entries: entries.map((e) => ({
                id: String(e._id),
                amount: e.amount,
                reason: e.reason,
                ...(e.refId !== undefined && e.refId !== null ? { refId: e.refId } : {}),
                createdAt: e.createdAt.toISOString(),
            })),
        };
    }
}
