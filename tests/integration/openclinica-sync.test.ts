import axios from 'axios';
import { OpenClinicaService, OpenClinicaStudy } from '../../services/api-gateway/src/modules/edc/services/openclinica.service';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { EdcStudyEntity } from '../../services/api-gateway/src/database/entities/edc-study.entity';

jest.mock('axios');

describe('OpenClinicaService syncStudies', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  const config = {
    get: (key: string) => {
      if (key === 'edc.openClinicaUrl') return 'http://localhost';
      if (key === 'edc.openClinicaToken') return 'token';
      return undefined;
    },
  } as unknown as ConfigService;

  function createRepo() {
    return {
      findOne: jest.fn(),
      save: jest.fn(entity => Promise.resolve(entity)),
      create: (e: Partial<EdcStudyEntity>) => ({ ...e } as EdcStudyEntity),
    } as unknown as Repository<EdcStudyEntity>;
  }

  test('stores studies from API', async () => {
    const repo = createRepo();
    const service = new OpenClinicaService(config, repo);
    const apiData: { studies: OpenClinicaStudy[] } = {
      studies: [{ studyOID: 'S1', name: 'Study One', status: 'active' }],
    };
    mockedAxios.get.mockResolvedValue({ data: apiData });

    const result = await service.syncStudies();

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result[0].ocStudyId).toBe('S1');
    expect(result[0].name).toBe('Study One');
  });
});
