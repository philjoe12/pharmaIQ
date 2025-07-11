import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Drug Information';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface Props {
  params: {
    slug: string;
  };
}

export default async function Image({ params }: Props) {
  const apiUrl = process.env.API_GATEWAY_URL || 'http://api:3001';
  let drugName = params.slug.replace(/-/g, ' ').toUpperCase();
  let manufacturer = '';

  try {
    const res = await fetch(`${apiUrl}/drugs/${params.slug}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      drugName = (data.drugName || drugName).toUpperCase();
      manufacturer = data.manufacturer || '';
    }
  } catch (e) {
    console.error('Failed to fetch drug data for OG image', e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #3b82f6, #1e40af)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
      <div style={{ fontSize: 48, marginBottom: 20 }}>PharmaIQ</div>
      <div style={{ fontSize: 72, fontWeight: 'bold', textAlign: 'center' }}>
        {drugName}
      </div>
      {manufacturer && (
        <div style={{ fontSize: 36, marginTop: 20 }}>{manufacturer}</div>
      )}
      <div style={{ fontSize: 32, marginTop: 10 }}>Drug Information</div>
      </div>
    ),
    {
      ...size,
    }
  );
}