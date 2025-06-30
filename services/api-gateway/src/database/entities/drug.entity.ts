import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { DrugStatus } from '@pharmaiq/types';
import { DrugContentEntity } from './drug-content.entity';
import { SEOMetadataEntity } from './seo-metadata.entity';
import { ProcessingLogEntity } from './processing-log.entity';

@Entity('drugs')
export class DrugEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'set_id', unique: true })
  @Index()
  setId: string;

  @Column({ name: 'drug_name' })
  @Index()
  drugName: string;

  @Column({ name: 'generic_name', nullable: true })
  @Index()
  genericName: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column()
  @Index()
  manufacturer: string;

  @Column({
    type: 'enum',
    enum: DrugStatus,
    default: DrugStatus.PENDING,
  })
  @Index()
  status: DrugStatus;

  @Column('jsonb', { name: 'label_data' })
  labelData: any;

  @Column('jsonb', { name: 'processed_data', nullable: true })
  processedData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => DrugContentEntity, content => content.drug, {
    cascade: true,
  })
  aiContent: DrugContentEntity[];

  @OneToOne(() => SEOMetadataEntity, seo => seo.drug, {
    cascade: true,
  })
  seoMetadata: SEOMetadataEntity;

  @OneToMany(() => ProcessingLogEntity, log => log.drug)
  processingLogs: ProcessingLogEntity[];
}