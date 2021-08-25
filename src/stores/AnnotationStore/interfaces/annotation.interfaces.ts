export type TTool = 'pan' | 'drag' | 'annotate';

export interface IBoundingBox {
  id: string;
  type: "defect_detection";
  confidence: number;
  label: {
    value: string;
    topLeftX: number;
    topLeftY: number;
    height: number;
    width: number
  };
}