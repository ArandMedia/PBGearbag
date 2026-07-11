import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  @Public()
  live() {
    return { status: 'ok', service: 'pbg-api', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @Public()
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ready', database: 'ok', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException('Database is not ready');
    }
  }
}
