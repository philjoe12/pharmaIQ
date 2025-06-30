import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DrugEntity } from './drug.entity';

@Entity('seo_metadata')
export class SEOMetadataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'drug_id' })
  drugId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  metaDescription?: string;

  @Column({ type: 'jsonb', nullable: true })
  keywords?: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug?: string;

  @Column({ type: 'jsonb', nullable: true })
  structuredData?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => DrugEntity, drug => drug.seoMetadata)
  @JoinColumn({ name: 'drug_id' })
  drug: DrugEntity;
}