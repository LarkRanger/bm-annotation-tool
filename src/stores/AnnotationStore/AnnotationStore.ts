import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import mockLabels from '../../mockLabels.json';
import AnnotationItem from './AnnotationItem';
import { IBoundingBox, TTool } from './interfaces/annotation.interfaces';
import OriginItem from './OriginItem';
import RootStore from '../RootStore';

export default class AnnotationStore {
  readonly rootStore: RootStore;

  private _annotations: AnnotationItem[];
  private _origins: OriginItem[];

  readonly labels: string[];
  private _selectedId?: string;
  private _scale: number;
  private _pan: boolean;
  private _drag: boolean;
  private _tool: TTool;
  private _originShown: boolean;
  private _labelsShown: boolean;
  private _handleMouseDown?: (e: MouseEvent) => void;

  constructor(boxes: IBoundingBox[], rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore    = rootStore;
    this.labels       = mockLabels;
    this._annotations = boxes.map(box => new AnnotationItem(this, box));
    this._origins     = boxes.map(box => new OriginItem(box));
    this._scale       = 1;
    this._pan         = true;
    this._drag        = false;
    this._tool        = 'pan';
    this._originShown = false;
    this._labelsShown = true;

    reaction(() => this._tool,
      tool => {
        this.disableToolbarOptions();
        switch (tool) {
          case 'pan':
            return this.enablePan();
          case 'drag':
            return this.enableDrag();
          case 'annotate':
            return this.add();
        }
      });
  }

  get annotations(): AnnotationItem[] {
    return this._annotations;
  };

  get origins(): OriginItem[] {
    return this._origins;
  };

  set scale(newScale: number) {
    this._scale = 1 / newScale;
  };

  get scale(): number {
    return this._scale;
  };

  get isPanDisabled(): boolean {
    return !this._pan;
  };

  get isDragDisabled(): boolean {
    return !this._drag;
  };

  get isOriginShown(): boolean {
    return this._originShown;
  };

  get areLabelsShown(): boolean {
    return this._labelsShown;
  };

  set tool(newTool: TTool) {
    if (newTool !== this._tool) this._tool = newTool;
  };

  get tool(): TTool {
    return this._tool;
  };

  get selectedId(): string | undefined {
    return this._selectedId;
  };

  showLabels = () => this._labelsShown = true;

  hideLabels = () => this._labelsShown = false;

  enablePan = () => this._pan = true;

  disablePan = () => this._pan = false;

  enableDrag = () => this._drag = true;

  disableDrag = () => this._drag = false;

  selectAnnotation = (id: string) => this._selectedId = id;

  deselect = () => this._selectedId = undefined;

  showOrigin = () => this._originShown = true;

  hideOrigin = () => this._originShown = false;

  add = () => {
    const wrapper       = document.getElementById('image-wrapper') as HTMLElement;
    const { left, top } = wrapper.getBoundingClientRect();

    const addNewAnnotation = (creationEvent: MouseEvent) => {
      console.log({mouseLeft: creationEvent.clientX, mouseTop: creationEvent.clientY, left, top, scale: this.scale});

      const newBox: IBoundingBox = {
        id: uuid(),
        type: 'defect_detection',
        confidence: 0,
        label: {
          topLeftX: (creationEvent.clientX + left / this.scale) * this.scale,
          topLeftY: (creationEvent.clientY + top / this.scale) * this.scale,
          height: 0,
          width: 0,
          value: 'Choose label...'
        }
      };

      const newAnnotation = new AnnotationItem(this, newBox, creationEvent);

      runInAction(() => {
        this.hideLabels();
        this._annotations.push(newAnnotation);
      });
      wrapper.removeEventListener('mousedown', addNewAnnotation);

      const reEnablePan = () => {
        runInAction(() => {
          this.showLabels();
          this.tool = 'drag';
        });
        wrapper.removeEventListener('mouseup', reEnablePan);
      };

      wrapper.addEventListener('mouseup', reEnablePan);
    };

    this.disablePan();
    this._handleMouseDown = addNewAnnotation;
    wrapper.addEventListener('mousedown', this._handleMouseDown);
  };

  private disableToolbarOptions = () => {
    this.deselect();
    this.disablePan();
    this.disableDrag();
    if (this._handleMouseDown) {
      document.getElementById('image-wrapper')?.removeEventListener('mousedown', this._handleMouseDown);
      this._handleMouseDown = undefined;
    }
  };

  reset = () => {
    this._annotations = [];
    this._origins     = [];
    this._scale       = 1;
    this.disableToolbarOptions();
  };
}