import { makeAutoObservable } from 'mobx';

import { IBoundingBox } from './AnnotationStore/interfaces/annotation.interfaces';
import AnnotationStore from './AnnotationStore/AnnotationStore';
import mockBoxes from '../mockBoundingBoxes.json';

export default class RootStore {
  annotationStore: AnnotationStore;

  constructor() {
    makeAutoObservable(this);

    this.annotationStore = new AnnotationStore(mockBoxes as IBoundingBox[], this);
  }
}

export const rootStore = new RootStore();