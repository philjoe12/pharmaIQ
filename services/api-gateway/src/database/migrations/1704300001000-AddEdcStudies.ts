import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEdcStudies1704300001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS edc_studies (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        oc_study_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_edc_studies_oc_study_id ON edc_studies(oc_study_id)`
    );
    await queryRunner.query(`
      CREATE TRIGGER update_edc_studies_updated_at BEFORE UPDATE ON edc_studies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_edc_studies_updated_at ON edc_studies`);
    await queryRunner.query(`DROP TABLE IF EXISTS edc_studies`);
  }
}
