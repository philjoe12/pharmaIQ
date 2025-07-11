import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('search_logs')
export class SearchLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  query: string;

  @Column({ name: 'result_count', type: 'int' })
  resultCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
