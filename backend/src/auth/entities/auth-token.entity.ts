import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
export enum AuthTokenType { VERIFY='verify_email', RESET='password_reset' }
@Entity('auth_tokens')
export class AuthToken { @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'user_id'}) userId:string; @Index({unique:true}) @Column({name:'token_hash'}) tokenHash:string; @Column({type:'enum',enum:AuthTokenType}) type:AuthTokenType; @Column({name:'expires_at',type:'timestamptz'}) expiresAt:Date; @Column({name:'used_at',type:'timestamptz',nullable:true}) usedAt?:Date; @CreateDateColumn({name:'created_at'}) createdAt:Date }
