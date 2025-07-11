import { registerAs } from '@nestjs/config';

export default registerAs('edc', () => ({
  openClinicaUrl: process.env.OPENCLINICA_BASE_URL || 'http://localhost:8080/OpenClinica',
  openClinicaToken: process.env.OPENCLINICA_API_TOKEN || '',
}));
