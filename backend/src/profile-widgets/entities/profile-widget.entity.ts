import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('profile_widgets')
export class ProfileWidget {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'user_id' }) userId: string;
  @Column({ name: 'widget_key' }) widgetKey: string;
  @Column({ type: 'int', default: 0 }) position: number;
  @Column({ type: 'jsonb', default: {} }) config: Record<string, any>;
  @Column({ name: 'is_visible', default: true }) isVisible: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
