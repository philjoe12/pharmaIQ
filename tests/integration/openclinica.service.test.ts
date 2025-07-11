import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import edcConfig from '../../services/api-gateway/src/config/edc.config';
import { OpenClinicaService } from '../../services/api-gateway/src/modules/edc/services/openclinica.service';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenClinicaService', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    process.env.OPENCLINICA_BASE_URL = 'http://test-oc';
    process.env.OPENCLINICA_API_TOKEN = 'token';
  });

  async function createService(): Promise<OpenClinicaService> {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [edcConfig] })],
      providers: [OpenClinicaService],
    }).compile();
    return module.get(OpenClinicaService);
  }

  test('should fetch studies', async () => {
    const mockData = [{ oid: 'S1' }];
    mockedAxios.get.mockResolvedValue({ data: mockData });
    const service = await createService();
    const result = await service.getStudies();

    expect(mockedAxios.get).toHaveBeenCalledWith('http://test-oc/studies', expect.any(Object));
    expect(result).toEqual(mockData);
  });

  test('should fetch study events', async () => {
    const mockData = [{ name: 'Visit 1' }];
    mockedAxios.get.mockResolvedValue({ data: mockData });
    const service = await createService();
    const result = await service.getStudyEvents('S1');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://test-oc/studies/S1/events', expect.any(Object));
    expect(result).toEqual(mockData);
  });

  test('should throw on error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network')); 
    const service = await createService();
    await expect(service.getStudies()).rejects.toThrow('OpenClinica API request failed');
  });
});
