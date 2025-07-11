import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DrugEntity } from './drug.entity';

@Entity('drug_content')
export class DrugContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'drug_id' })
  drugId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'page_title' })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  indications?: string;

  @Column({ type: 'text', nullable: true })
  contraindications?: string;

  @Column({ type: 'text', nullable: true })
  dosage?: string;

  @Column({ type: 'text', nullable: true })
  warnings?: string;

  @Column({ type: 'text', nullable: true })
  sideEffects?: string;

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