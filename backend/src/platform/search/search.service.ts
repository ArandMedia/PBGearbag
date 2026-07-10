import { Injectable } from '@nestjs/common';

export interface SearchQuery {
  index: string;
  query: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  async search<T>(_query: SearchQuery): Promise<{ hits: T[]; total: number }> {
    return { hits: [], total: 0 };
  }
}
