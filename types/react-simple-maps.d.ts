declare module 'react-simple-maps' {
  import { FC } from 'react';
  export const ComposableMap: FC<{
    projection?: string;
    projectionConfig?: { scale?: number };
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }>;
  export const Geographies: FC<{
    geography: string | object;
    children: (args: { geographies: { rsmKey: string; [k: string]: unknown }[] }) => React.ReactNode;
  }>;
  export const Geography: FC<{
    geography: { rsmKey: string; [k: string]: unknown };
    fill?: string;
    stroke?: string;
    [k: string]: unknown;
  }>;
  export const Marker: FC<{
    coordinates: [number, number];
    onClick?: () => void;
    children?: React.ReactNode;
  }>;
  export const ZoomableGroup: FC<{
    center?: [number, number];
    zoom?: number;
    children?: React.ReactNode;
  }>;
}
