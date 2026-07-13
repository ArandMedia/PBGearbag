import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
export class TokenDto { @IsString() @IsNotEmpty() token:string }
export class EmailDto { @IsEmail() email:string }
export class ResetPasswordDto extends TokenDto { @IsString() @MinLength(8) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) password:string }
export class ChangePasswordDto { @IsString() @IsNotEmpty() currentPassword:string; @IsString() @MinLength(8) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) newPassword:string }
export class ChangeEmailDto { @IsString() @IsNotEmpty() password:string; @IsEmail() newEmail:string }
export class ChangeUsernameDto { @IsString() @MinLength(3) @MaxLength(50) @Matches(/^[a-zA-Z0-9_-]+$/,{message:'Username can only contain letters, numbers, underscores and hyphens'}) username:string }
