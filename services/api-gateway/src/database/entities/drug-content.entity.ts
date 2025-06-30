import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DrugEntity } from './drug.entity';

@Entity('drug_content')
export class DrugContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'drug_id' })
  drugId: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  indications?: string[];

  @Column({ type: 'jsonb', nullable: true })
  contraindications?: string[];

  @Column({ type: 'jsonb', nullable: true })
  dosage?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  warnings?: string[];

  @Column({ type: 'jsonb', nullable: true })
  sideEffects?: string[];

  @Column({ type: 'jsonb', nullable: true })
  enhancedContent?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => DrugEntity, drug => drug.aiContent)
  @JoinColumn({ name: 'drug_id' })
  drug: DrugEntity;
}