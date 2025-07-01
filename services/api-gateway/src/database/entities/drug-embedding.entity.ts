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
@Unique(['drugId', 'contentType'])
export class DrugEmbeddingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'drug_id' })
  drugId: string;

  @ManyToOne(() => DrugEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drug_id' })
  drug: DrugEntity;

  @Column({ name: 'content_type', length: 50 })
  contentType: 'summary' | 'indications' | 'full_label';

  @Column({ name: 'content_text', type: 'text' })
  contentText: string;

  @Column({
    type: 'text', // We'll handle vector conversion in the repository
    nullable: true,
    transformer: {
      to: (value: number[]) => value ? JSON.stringify(value) : null,
      from: (value: string) => value ? JSON.parse(value) : null
    }
  })
  embedding: number[];

  @Column({ 
    name: 'model_name', 
    length: 100, 
    default: 'text-embedding-3-small' 
  })
  modelName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}