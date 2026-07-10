import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureFlagService {
  isEnabled(flag: string, defaultValue = false): boolean {
    const value = process.env[`FEATURE_${flag.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`];
    if (value === undefined) return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
}
