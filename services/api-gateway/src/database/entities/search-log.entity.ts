import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('search_logs')
export class SearchLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_search_logs_query')
  @Column({ type: 'text' })
  query: string;

  @Column({ name: 'result_count', type: 'int' })
  resultCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
