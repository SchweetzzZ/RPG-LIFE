import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiUnauthorizedResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './dto/user.dto';

export function ApiStandardErrors() {
    return applyDecorators(
        ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Dados de entrada inválidos / Erro de Validação' }),
        ApiConflictResponse({ type: ErrorResponseDto, description: 'Conflito (Ex: Registro duplicado)' }),
        ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Não autorizado / Credenciais inválidas' }),
        ApiInternalServerErrorResponse({ type: ErrorResponseDto, description: 'Erro interno do servidor' })
    );
}