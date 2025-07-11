import { NestFactory } from '@nestjs/core';
import { AppModule } from '../services/api-gateway/src/modules/app.module';
import { DrugService } from '../services/api-gateway/src/modules/drugs/services/drug.service';

const OPENFDA_URL = process.env.OPENFDA_URL || 'https://api.fda.gov/drug/label.json';
const DEFAULT_TOTAL = parseInt(process.env.OPENFDA_TOTAL || '1000', 10);
const BATCH_SIZE = parseInt(process.env.OPENFDA_BATCH_SIZE || '100', 10);

async function fetchWithRetry(url: string, attempts = 3, delay = 1000): Promise<any> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`openFDA request failed: ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i === attempts - 1) throw err;
      const backoff = delay * Math.pow(2, i);
      console.warn(`Request failed, retrying in ${backoff}ms...`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchBatch(limit: number, skip: number) {
  const url = `${OPENFDA_URL}?limit=${limit}&skip=${skip}`;
  const json = await fetchWithRetry(url, 5);
  return json.results || [];
}

function convertRecord(record: any) {
  const brand = record.openfda?.brand_name?.[0];
  const generic = record.openfda?.generic_name?.[0];
  const manufacturer = record.openfda?.manufacturer_name?.[0];
  const name = brand || generic || 'unknown-drug';
  if (!brand && !generic) return null;
  if (!manufacturer) return null;
  return {
    drugName: name,
    setId: record.set_id,
    slug: buildSlug(name),
    labeler: manufacturer || 'Unknown',
    label: {
      genericName: generic,
      labelerName: manufacturer,
      productType: record.openfda?.product_type?.[0],
      effectiveTime: record.effective_time,
      title: name,
      indicationsAndUsage: record.indications_and_usage,
      dosageAndAdministration: record.dosage_and_administration,
      dosageFormsAndStrengths: record.dosage_forms_and_strengths,
      warningsAndPrecautions: record.warnings_and_precautions,
      adverseReactions: record.adverse_reactions,
      clinicalPharmacology: record.clinical_pharmacology,
      clinicalStudies: record.clinical_studies,
      howSupplied: record.how_supplied,
      useInSpecificPopulations: record.use_in_specific_populations,
      description: record.description,
      nonclinicalToxicology: record.nonclinical_toxicology,
      instructionsForUse: record.instructions_for_use,
      mechanismOfAction: record.mechanism_of_action,
      contraindications: record.contraindications,
      boxedWarning: record.boxed_warning,
      drugInteractions: record.drug_interactions,
    },
  };
}

async function run() {
  const totalArg = process.argv[2];
  const total = parseInt(totalArg || String(DEFAULT_TOTAL), 10);
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'log'],
  });
  const drugService = app.get(DrugService);
  let fetched = 0;
  let skip = 0;

  while (fetched < total) {
    const batch = await fetchBatch(Math.min(BATCH_SIZE, total - fetched), skip);
    if (batch.length === 0) {
      break;
    }
    for (const item of batch) {
      const label = convertRecord(item);
      if (!label) {
        console.warn(`Skipping incomplete record ${item.set_id}`);
        continue;
      }
      try {
        await drugService.importDrug({
          setId: label.setId,
          drugName: label.drugName,
          manufacturer: label.labeler,
          labelData: label,
        });
        console.log(`Imported ${label.drugName}`);
      } catch (err: any) {
        console.error(`Failed to import ${label.setId}: ${err.message}`);
      }
      fetched += 1;
      if (fetched >= total) break;
    }
    skip += batch.length;
  }

  await app.close();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

