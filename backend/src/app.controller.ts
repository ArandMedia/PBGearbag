import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  getHealth(): object {
    return this.appService.getHealth();
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Detailed health check' })
  getDetailedHealth(): object {
    return this.appService.getHealth();
  }
}
