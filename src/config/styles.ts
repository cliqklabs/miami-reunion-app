// Generic style structure for the Miami Reunion app
export const STYLE_COUNT = 4;

export const STYLES = {
  style1: {
    id: 'style1',
    displayName: 'Style 1',
    order: 1
  },
  style2: {
    id: 'style2',
    displayName: 'Style 2',
    order: 2
  },
  style3: {
    id: 'style3',
    displayName: 'Style 3',
    order: 3
  },
  style4: {
    id: 'style4',
    displayName: 'Style 4',
    order: 4
  }
};

export type StyleKey = keyof typeof STYLES;
