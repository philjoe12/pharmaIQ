import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DrugEntity } from './drug.entity';

@Entity('processing_logs')
export class ProcessingLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'drug_id', nullable: true })
  drugId: string;

  @Column({ name: 'task_type', length: 100 })
  taskType: string;

  @Column({ type: 'enum', enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => DrugEntity)
  @JoinColumn({ name: 'drug_id' })
  drug: DrugEntity;
}