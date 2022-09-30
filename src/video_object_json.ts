interface VideoObjectClipPart {
  '@type': string;
  name: string;
  offset: string;
  duration: number;
}

interface VideoObjectLapsePart {
  '@type': string;
  name: string;
  startOffset: string;
  endOffset: string;
  startDuration: number;
  endDuration: number;
}

export const defaultHasPart: [VideoObjectClipPart | VideoObjectLapsePart] = [
  {
    '@type': 'Clip',
    name: '前言',
    offset: '00:00:00.000',
    duration: 0,
  },
];

export const endPart = {
  '@type': 'Clip',
  name: '结束语',
  offset: '00:00:00.000',
  duration: -1,
};

export const lapsePart = {
  '@type': 'Lapse',
  name: '',
  startOffset: '00:00:00.000',
  startDuration: 0,
  endOffset: '00:00:00.000',
  endDuration: 0,
};

export const videoObjectTemplate = {
  '@context': 'https://schema.org/',
  '@type': 'VideoObject',
  name: 'codetour video',
  hasPart: defaultHasPart,
};
