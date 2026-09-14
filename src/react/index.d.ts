import type { ImgHTMLAttributes, ReactElement, ReactNode } from 'react';
import type { TextGraphInitializeOptions, TextGraphRenderPngOptions } from '../index.js';

/** Keep options stable (module constant or useMemo); replacing them replaces the runtime. */
export interface TextGraphProviderProps {
  options?: TextGraphInitializeOptions;
  children?: ReactNode;
}

/** The component owns its image source and cancellation; other image attributes pass through. */
export interface TextGraphProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'children' | 'loading'> {
  source: string;
  alt?: string;
  /** Defaults to scale 1; the image displays at logical size. */
  renderOptions?: Omit<TextGraphRenderPngOptions, 'encoding' | 'signal'>;
  loading?: ReactNode;
}

export declare function TextGraphProvider(props: TextGraphProviderProps): ReactElement;
export declare function TextGraph(props: TextGraphProps): ReactElement;
