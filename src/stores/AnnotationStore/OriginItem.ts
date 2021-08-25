import { makeAutoObservable } from 'mobx';
import numeral from 'numeral';

import { IBoundingBox } from './interfaces/annotation.interfaces';
import { toColor } from '../../utils/toColor';

export default class OriginItem {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly confidence: number;
  readonly color: string;

  constructor(box: IBoundingBox) {
    makeAutoObservable(this);

    this.id         = box.id;
    this.label      = box.label.value;
    this.x          = box.label.topLeftX;
    this.y          = box.label.topLeftY;
    this.width      = box.label.width;
    this.height     = box.label.height;
    this.confidence = box.confidence;
    this.color      = toColor(box.label.value);
  }

  get confidenceFormatted(): string {
    return numeral(this.confidence).format('0.0%');
  };
}