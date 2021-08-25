import { makeAutoObservable, reaction } from 'mobx';

import { IBoundingBox } from './interfaces/annotation.interfaces';
import AnnotationStore from './AnnotationStore';
import { toColor } from '../../utils/toColor';

interface IBounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface IFeedback {
  label: string;
  box: [number, number, number, number];
}

export default class AnnotationItem {
  private annotationTool: AnnotationStore;

  readonly id: string;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private _exists: boolean;
  private _label: string;
  private _color: string;
  private _selected: boolean;
  private _visible: boolean;
  private _context: boolean;
  readonly _creationEvent?: MouseEvent;

  constructor(annotationTool: AnnotationStore, box: IBoundingBox, creationEvent?: MouseEvent) {
    makeAutoObservable(this);

    this.annotationTool = annotationTool;

    this.id             = 'A' + box.id; // HTML element ID must begin with letter
    this.x              = box.label.topLeftX;
    this.y              = box.label.topLeftY;
    this.width          = box.label.width;
    this.height         = box.label.height;
    this._exists        = true;
    this._label         = box.label.value;
    this._color         = toColor(box.label.value);
    this._selected      = false;
    this._visible       = true;
    this._context       = false;
    this._creationEvent = creationEvent;

    reaction(() => this.annotationTool.selectedId,
      selectedId => {
        this._selected = this.id === selectedId;
        this.closeContext();
      });

    reaction(() => this._label,
      label => this._color = toColor(label));

    reaction(() => this._selected,
      selected => {
        if (selected) document.addEventListener('keyup', this.handleDelete);
        else document.removeEventListener('keyup', this.handleDelete);
      });
  }

  set label(newLabel: string) {
    this._label = newLabel;
  };

  get label(): string {
    return this._label;
  };

  set box(newBounds: IBounds ) {
    this.x = newBounds.x ?? this.x;
    this.y = newBounds.y ?? this.y;
    this.width = newBounds.width ?? this.width;
    this.height = newBounds.height ?? this.height;
  };

  get box(): IBounds {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  };

  get color(): string {
    return this._color;
  };

  get scale(): number {
    return this.annotationTool.scale;
  };

  get isSelected(): boolean {
    return this._selected;
  };

  get isVisible(): boolean {
    return this._visible;
  };

  get isLabelShown(): boolean {
    return this.annotationTool.areLabelsShown;
  };

  get isDraggable(): boolean {
    return !this.annotationTool.isDragDisabled;
  };

  get isContextVisible(): boolean {
    return this._context;
  };

  get exists(): boolean {
    return this._exists;
  };

  get creationEvent(): MouseEvent | undefined {
    return this._creationEvent;
  };

  get feedback(): IFeedback {
    return {
      label: this.label,
      box: [
        this.x,
        this.y,
        this.width,
        this.height
      ]
    };
  };

  openContext = () => this._context = true;

  closeContext = () => this._context = false;

  select = () => this.annotationTool.selectAnnotation(this.id);

  deselect = () => this.annotationTool.deselect();

  show = () => this._visible = true;

  hide = () => this._visible = false;

  remove = () => this._exists = false;

  private handleDelete = (event: KeyboardEvent) => {
    if (event.key === 'Delete') {
      this.remove();
      document.removeEventListener('keyup', this.handleDelete);
    }
  };
}