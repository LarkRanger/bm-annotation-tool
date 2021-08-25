import { makeAutoObservable, reaction } from 'mobx';

import { IBoundingBox } from './interfaces/annotation.interfaces';
import AnnotationStore from './AnnotationStore';
import { toColor } from '../../utils/toColor';

export default class AnnotationItem {
  private annotationTool: AnnotationStore;

  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  private _exists: boolean;
  private _creationEvent?: MouseEvent;
  private _label: string;
  private _color: string;
  private _selected: boolean;
  private _visible: boolean;
  private _context: boolean;

  constructor(annotationTool: AnnotationStore, box: IBoundingBox, creationEvent?: MouseEvent) {
    makeAutoObservable(this);

    this.annotationTool = annotationTool;

    this.id             = 'A' + box.id; // HTML element ID must begin with letter
    this.x              = box.label.topLeftX;
    this.y              = box.label.topLeftY;
    this.width          = box.label.width;
    this.height         = box.label.height;
    this._exists        = true;
    this._creationEvent = creationEvent;
    this._label         = box.label.value;
    this._color         = toColor(box.label.value);
    this._selected      = false;
    this._visible       = true;
    this._context       = false;

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