import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const alt = 'Drug Information';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';
export default async function Image({ params }) {
    // TODO: Fetch drug data
    const drugName = params.slug.replace(/-/g, ' ').toUpperCase();
    return new ImageResponse((<div style={{
            fontSize: 128,
            background: 'linear-gradient(to bottom right, #3b82f6, #1e40af)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
        }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>PharmaIQ</div>
        <div style={{ fontSize: 72, fontWeight: 'bold', textAlign: 'center' }}>
          {drugName}
        </div>
        <div style={{ fontSize: 36, marginTop: 20 }}>Drug Information</div>
      </div>), {
        ...size,
    });
}
