import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DrugEntity } from '../entities/drug.entity';

@Injectable()
export class DrugRepository {
  constructor(
    @InjectRepository(DrugEntity)
    private repository: Repository<DrugEntity>
  ) {}

  async findBySlugWithRelations(slug: string): Promise<DrugEntity | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['aiContent', 'seoMetadata']
    });
  }

  async findByDrugName(drugName: string): Promise<DrugEntity[]> {
    return this.repository.find({
      where: { drugName },
      relations: ['aiContent', 'seoMetadata']
    });
  }

  async findBySetId(setId: string): Promise<DrugEntity | null> {
    return this.repository.findOne({
      where: { setId },
      relations: ['aiContent', 'seoMetadata']
    });
  }

  async findByManufacturer(manufacturer: string): Promise<DrugEntity[]> {
    return this.repository.find({
      where: { manufacturer },
      relations: ['aiContent', 'seoMetadata']
    });
  }

  async searchByName(searchTerm: string, limit: number = 20): Promise<DrugEntity[]> {
    return this.repository.createQueryBuilder('drug')
      .leftJoinAndSelect('drug.aiContent', 'aiContent')
      .leftJoinAndSelect('drug.seoMetadata', 'seoMetadata')
      .where('(drug.drug_name ILIKE :searchTerm OR drug.generic_name ILIKE :searchTerm OR drug.label_data::text ILIKE :searchTerm)', {
        searchTerm: `%${searchTerm}%`
      })
      .andWhere('drug.status = :status', { status: 'published' })
      .limit(limit)
      .getMany();
  }

  async findSimilarDrugs(drugId: string, limit: number = 5): Promise<DrugEntity[]> {
    const currentDrug = await this.repository.findOne({ where: { id: drugId } });
    if (!currentDrug) {
      return [];
    }

    return this.repository.createQueryBuilder('drug')
      .leftJoinAndSelect('drug.aiContent', 'aiContent')
      .leftJoinAndSelect('drug.seoMetadata', 'seoMetadata')
      .where('drug.id != :drugId', { drugId })
      .andWhere('drug.manufacturer = :manufacturer', {
        manufacturer: currentDrug.manufacturer
      })
      .limit(limit)
      .getMany();
  }

  async findByStatus(status: string): Promise<DrugEntity[]> {
    return this.repository.find({
      where: { status: status as any },
      relations: ['aiContent', 'seoMetadata']
    });
  }

  async createDrug(drugData: Partial<DrugEntity>): Promise<DrugEntity> {
    const drug = this.repository.create(drugData);
    return this.repository.save(drug);
  }

  async updateDrug(id: string, updateData: Partial<DrugEntity>): Promise<DrugEntity | null> {
    await this.repository.update(id, updateData);
    return this.repository.findOne({ where: { id } });
  }

  // Expose methods for query building
  createQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias);
  }

  async count(conditions?: any): Promise<number> {
    return this.repository.count(conditions);
  }

  async save(entity: DrugEntity): Promise<DrugEntity> {
    return this.repository.save(entity);
  }

  async findOne(options: any): Promise<DrugEntity | null> {
    return this.repository.findOne(options);
  }

  async find(options?: any): Promise<DrugEntity[]> {
    return this.repository.find(options);
  }

  async findBySlug(slug: string): Promise<DrugEntity | null> {
    return this.findBySlugWithRelations(slug);
  }

  // Expose repository for compatibility
  getRepository() {
    return this.repository;
  }
}