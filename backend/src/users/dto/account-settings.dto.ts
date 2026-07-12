import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MessagePermission } from '../entities/user.entity';

export class UpdateAccountSettingsDto {
  @IsEnum(MessagePermission)
  messagePermission: MessagePermission;
}

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
