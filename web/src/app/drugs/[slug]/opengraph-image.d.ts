import { ImageResponse } from 'next/og';
export declare const runtime = "edge";
export declare const alt = "Drug Information";
export declare const size: {
    width: number;
    height: number;
};
export declare const contentType = "image/png";
interface Props {
    params: {
        slug: string;
    };
}
export default function Image({ params }: Props): Promise<ImageResponse>;
export {};
