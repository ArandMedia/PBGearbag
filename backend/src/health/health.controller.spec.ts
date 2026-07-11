import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness without external dependencies', () => {
    const controller = new HealthController({} as never);
    expect(controller.live()).toMatchObject({ status: 'ok', service: 'pbg-api' });
  });

  it('reports readiness after PostgreSQL responds', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = new HealthController({ query } as never);
    await expect(controller.ready()).resolves.toMatchObject({ status: 'ready', database: 'ok' });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('fails readiness when PostgreSQL is unavailable', async () => {
    const controller = new HealthController({ query: jest.fn().mockRejectedValue(new Error('offline')) } as never);
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
