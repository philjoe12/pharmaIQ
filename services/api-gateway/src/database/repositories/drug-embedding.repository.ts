import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DrugEmbeddingEntity } from '../entities/drug-embedding.entity';

@Injectable()
export class DrugEmbeddingRepository {
  constructor(
    @InjectRepository(DrugEmbeddingEntity)
    private repository: Repository<DrugEmbeddingEntity>
  ) {}

  async create(embedding: Partial<DrugEmbeddingEntity>): Promise<DrugEmbeddingEntity> {
    // Use raw SQL to insert with vector type
    const query = `
      INSERT INTO drug_embeddings (drug_id, field_name, embedding, metadata)
      VALUES ($1, $2, $3::vector, $4)
      RETURNING *
    `;
    
    const result = await this.repository.query(query, [
      embedding.drugId,
      embedding.fieldName,
      JSON.stringify(embedding.embedding),
      embedding.metadata || {}
    ]);
    
    return result[0];
  }

  async findByDrugId(drugId: string): Promise<DrugEmbeddingEntity[]> {
    return this.repository.find({
      where: { drugId },
      relations: ['drug']
    });
  }

  async findByFieldName(fieldName: string): Promise<DrugEmbeddingEntity[]> {
    return this.repository.find({
      where: { fieldName },
      relations: ['drug']
    });
  }

  async upsert(embedding: Partial<DrugEmbeddingEntity>): Promise<DrugEmbeddingEntity> {
    // Use raw SQL for upsert with vector type
    const query = `
      INSERT INTO drug_embeddings (drug_id, field_name, embedding, metadata)
      VALUES ($1, $2, $3::vector, $4)
      ON CONFLICT (drug_id, field_name) 
      DO UPDATE SET 
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await this.repository.query(query, [
      embedding.drugId,
      embedding.fieldName,
      JSON.stringify(embedding.embedding),
      embedding.metadata || {}
    ]);
    
    return result[0];
  }

  async semanticSearch(
    queryEmbedding: number[], 
    fieldName: string, 
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<{ embedding: DrugEmbeddingEntity; similarity: number }[]> {
    // Use cosine similarity for semantic search with pgvector
    const query = `
      SELECT 
        de.id,
        de.drug_id,
        de.field_name,
        de.metadata,
        de.created_at,
        d.set_id,
        d.drug_name,
        d.generic_name,
        d.manufacturer,
        d.slug,
        d.label_data,
        1 - (de.embedding <=> $1::vector) as similarity
      FROM drug_embeddings de
      INNER JOIN drugs d ON de.drug_id = d.id
      WHERE de.field_name = $2 
        AND de.embedding IS NOT NULL
        AND 1 - (de.embedding <=> $1::vector) >= $3
      ORDER BY de.embedding <=> $1::vector
      LIMIT $4
    `;

    const results = await this.repository.query(query, [
      JSON.stringify(queryEmbedding),
      fieldName,
      threshold,
      limit
    ]);

    return results.map((row: any) => ({
      embedding: {
        id: row.id,
        drugId: row.drug_id,
        fieldName: row.field_name,
        embedding: row.embedding,
        metadata: row.metadata,
        createdAt: row.created_at,
        drug: {
          setId: row.set_id,
          drugName: row.drug_name,
          genericName: row.generic_name,
          manufacturer: row.manufacturer,
          slug: row.slug,
          labelData: row.label_data
        }
      } as DrugEmbeddingEntity,
      similarity: parseFloat(row.similarity)
    }));
  }

  async deleteByDrugId(drugId: string): Promise<void> {
    await this.repository.delete({ drugId });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }
}