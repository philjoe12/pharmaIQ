import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('edc_studies')
export class EdcStudyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'oc_study_id', unique: true })
  @Index()
  ocStudyId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
