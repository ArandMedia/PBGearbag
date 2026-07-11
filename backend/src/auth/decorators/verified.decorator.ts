import { SetMetadata } from '@nestjs/common';
export const VERIFIED_KEY='verified-account'; export const Verified=()=>SetMetadata(VERIFIED_KEY,true);
