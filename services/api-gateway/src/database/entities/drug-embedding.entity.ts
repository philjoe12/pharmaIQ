import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { DrugEntity } from './drug.entity';

@Entity('drug_embeddings')
@Unique(['drugId', 'fieldName'])
export class DrugEmbeddingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'drug_id' })
  drugId: string;

  @ManyToOne(() => DrugEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drug_id' })
  drug: DrugEntity;

  @Column({ name: 'field_name', length: 100 })
  fieldName: string;


  @Column({ type: 'simple-array', nullable: true })
  embedding: number[];

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}