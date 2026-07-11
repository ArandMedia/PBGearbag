import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  it('preserves a caller request ID and returns it in the response', () => {
    const request = { header: jest.fn().mockReturnValue('trace-123') } as never;
    const response = { locals: {}, setHeader: jest.fn() } as never;
    const next = jest.fn();

    new RequestIdMiddleware().use(request, response, next);

    expect((response as { locals: { requestId: string } }).locals.requestId).toBe('trace-123');
    expect((response as { setHeader: jest.Mock }).setHeader).toHaveBeenCalledWith('x-request-id', 'trace-123');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
