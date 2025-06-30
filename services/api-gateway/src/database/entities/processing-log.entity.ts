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

  @Column()
  drugId: string;

  @Column()
  stage: string;

  @Column()
  status: 'started' | 'completed' | 'failed';

  @Column('text', { nullable: true })
  message: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('text', { nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => DrugEntity)
  @JoinColumn({ name: 'drugId' })
  drug: DrugEntity;
}