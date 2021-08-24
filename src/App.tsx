import React, { FC, useEffect, useState } from "react";
import 'antd/dist/antd.css';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef
} from "react-zoom-pan-pinch";
import styled from "styled-components";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Menu, Dropdown, Button, Radio } from 'antd';
import { v4 as uuid } from 'uuid';
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import numeral from 'numeral';
import { observer } from 'mobx-react';

gsap.registerPlugin(Draggable);

// interfaces
type TLabel = 'Choose label...' | 'pylon' | 'farm' | 'gold_mine';

type TTool = 'pan' | 'drag' | 'annotate';

interface IBoundingBox {
  id: string;
  type: 'defect_detection';
  confidence: number;
  label: {
    value: TLabel;
    topLeftX: number;
    topLeftY: number;
    height: number;
    width: number
  };
}

// globals
const labels: TLabel[] = [
  'pylon',
  'farm',
  'gold_mine'
];

const colors = {
  'Choose label...': "#888888",
  pylon: "#0000FF",
  farm: "#FF0000",
  gold_mine: "#9d9d00"
};

const initialBoxes: IBoundingBox[] = [
  {
    id: 'cd77111d-1fc7-4291-b05d-4c1c69c04637',
    type: 'defect_detection',
    confidence: .7,
    label: {
      topLeftX: 100,
      topLeftY: 265,
      width: 270,
      height: 200,
      value: "pylon"
    }
  },
  {
    id: '94d699f7-779e-49e7-90cc-99c8dc28cffc',
    type: 'defect_detection',
    confidence: .8,
    label: {
      topLeftX: 50,
      topLeftY: 50,
      width: 100,
      height: 100,
      value: "farm"
    }
  },
  {
    id: '60bee2ac-1936-4af7-8cb6-f5ab15ecb40e',
    type: 'defect_detection',
    confidence: .9,
    label: {
      topLeftX: 60,
      topLeftY: 60,
      height: 70,
      width: 70,
      value: 'gold_mine'
    }
  }
];

// stores
class AnnotationSubStore {
  private annotationTool: AnnotationToolStore;

  id: string;
  private _label: TLabel;
  x: number;
  y: number;
  width: number;
  height: number;
  private _selected: boolean;
  exists: boolean;
  creationEvent?: MouseEvent;
  private _visible: boolean;
  private _context: boolean;

  constructor(annotationTool: AnnotationToolStore, box: IBoundingBox, creationEvent?: MouseEvent) {
    makeAutoObservable(this);

    this.annotationTool = annotationTool;

    this.id            = 'A' + box.id;
    this._label        = box.label.value;
    this.x             = box.label.topLeftX;
    this.y             = box.label.topLeftY;
    this.width         = box.label.width;
    this.height        = box.label.height;
    this._selected     = false;
    this.exists        = true;
    this.creationEvent = creationEvent;
    this._visible      = true;
    this._context      = false;

    reaction(() => this.annotationTool.selectedId,
      selectedId => {
        this._selected = this.id === selectedId;
        this.closeContext();
      });
  }

  set label(newLabel: TLabel) {
    this._label = newLabel;
  };

  get label(): TLabel {
    return this._label;
  }

  get scale(): number {
    return this.annotationTool.scale;
  }

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

  openContext = () => this._context = true;

  closeContext = () => this._context = false;

  select = () => this.annotationTool.selectAnnotation(this.id);

  show = () => this._visible = true;

  hide = () => this._visible = false;

  remove = () => this.exists = false;
}

class OriginalSubStore {
  id: string;
  label: TLabel;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;

  constructor(box: IBoundingBox) {
    makeAutoObservable(this);

    this.id         = box.id;
    this.label      = box.label.value;
    this.x          = box.label.topLeftX;
    this.y          = box.label.topLeftY;
    this.width      = box.label.width;
    this.height     = box.label.height;
    this.confidence = box.confidence;
  }

  get confidenceFormatted(): string {
    return numeral(this.confidence).format('0.0%');
  };
}

class AnnotationToolStore {
  annotations: AnnotationSubStore[];
  originals: OriginalSubStore[];

  private _scale: number;
  private _pan: boolean;
  private _drag: boolean;
  selectedId?: string;
  private originShown: boolean;
  private labelsShown: boolean;
  private handleMouseDown?: (e: MouseEvent) => void;
  private _tool: TTool;

  constructor(boxes: IBoundingBox[]) {
    makeAutoObservable(this);

    this.annotations = boxes.map(box => new AnnotationSubStore(this, box));
    this.originals   = boxes.map(box => new OriginalSubStore(box));
    this._scale      = 1;
    this._pan        = true;
    this._drag       = false;
    this._tool       = 'pan';
    this.originShown = false;
    this.labelsShown = true;

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

  set scale(newScale: number) {
    this._scale = 1 / newScale;
  };

  get scale(): number {
    return this._scale;
  }

  get isPanDisabled(): boolean {
    return !this._pan;
  };

  get isDragDisabled(): boolean {
    return !this._drag;
  };

  get isOriginShown(): boolean {
    return this.originShown;
  };

  get areLabelsShown(): boolean {
    return this.labelsShown;
  };

  get tool(): TTool {
    return this._tool;
  };

  set tool(newTool: TTool) {
    if (newTool !== this._tool) this._tool = newTool;
  };

  showLabels = () => this.labelsShown = true;

  hideLabels = () => this.labelsShown = false;

  enablePan = () => this._pan = true;

  disablePan = () => this._pan = false;

  selectAnnotation = (id: string) => this.selectedId = id;

  deselect = () => this.selectedId = undefined;

  showOrigin = () => this.originShown = true;

  hideOrigin = () => this.originShown = false;

  enableDrag = () => this._drag = true;

  disableDrag = () => this._drag = false;

  add = () => {
    const wrapper = document.getElementById('image-wrapper') as HTMLElement;

    const addNewAnnotation = (creationEvent: MouseEvent) => {
      const newBox: IBoundingBox = {
        id: uuid(),
        type: 'defect_detection',
        confidence: 0,
        label: {
          topLeftX: creationEvent.clientX,
          topLeftY: creationEvent.clientY,
          height: 0,
          width: 0,
          value: 'Choose label...'
        }
      };
      const newAnnotation        = new AnnotationSubStore(this, newBox, creationEvent);

      runInAction(() => {
        this.hideLabels();
        this.annotations.push(newAnnotation);
        this.handleMouseDown = addNewAnnotation;
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
    wrapper.addEventListener('mousedown', addNewAnnotation);
  };

  private disableToolbarOptions = () => {
    this.disablePan();
    this.disableDrag();
    if (this.handleMouseDown) {
      document.getElementById('image-wrapper')?.removeEventListener('mousedown', this.handleMouseDown);
      this.handleMouseDown = undefined;
    }
  };
}

class RootStore {
  annotationTool: AnnotationToolStore;

  constructor() {
    makeAutoObservable(this);

    this.annotationTool = new AnnotationToolStore(initialBoxes);
  }
}

const rootStore = new RootStore();

const useStores = (): RootStore => rootStore;

// annotation
interface AnnotationProps {
  annotation: AnnotationSubStore;
}

const StyledAnnotation = styled.div<{ annotation: AnnotationSubStore, scale: number, visible: boolean, draggable: boolean }>`
  position: absolute;
  background: ${({ annotation }) => colors[annotation.label]}30;
  border: 1px solid ${({ annotation }) => colors[annotation.label]};
  transition: background 0.15s;
  visibility: ${({ visible }) => visible ? 'visible' : 'hidden'};

  &[draggable="true"]:hover {
    background: ${({ annotation }) => colors[annotation.label]}50;
  }

  span {
    position: absolute;
    z-index: 500;
    left: 0;
    top: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0 0.2rem;
    border-radius: 0 0.2rem 0.2rem 0;
    transform: scale(${({ annotation }) => 1 / annotation.scale});
    transition: all 0.25s ease;
    transform-origin: left top;
  }

  .drag {
    position: absolute;
    width: 8px;
    height: 8px;
    background: white;
    border: 1px solid ${({ annotation }) => colors[annotation.label]};
    border-radius: 1px;
    z-index: 200;
    visibility: hidden;
  }

  &[draggable="true"].selected {
    background: ${({ annotation }) => colors[annotation.label]}50;

    .drag {
      visibility: ${({ visible }) => visible ? 'visible' : 'hidden'};
    }
  }

  .left {
    left: 0;
    top: 50%;
    transform: translate(-50%, -50%);
    cursor: ew-resize !important;
  }

  .topLeft {
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    cursor: nwse-resize !important;
  }

  .bottomLeft {
    left: 0;
    bottom: 0;
    transform: translate(-50%, 50%);
    cursor: nesw-resize !important;
  }

  .right {
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
    cursor: ew-resize !important;
  }

  .topRight {
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    cursor: nesw-resize !important;
  }

  .bottomRight {
    bottom: 0;
    right: 0;
    transform: translate(50%, 50%);
    cursor: nwse-resize !important;
  }

  .top {
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: ns-resize !important;
  }

  .bottom {
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 50%);
    cursor: ns-resize !important;
  }
`;

const Annotation: FC<AnnotationProps> = observer(({ annotation }) => {
  const onClickLabel = (label: TLabel) => {
    annotation.label = label;
    annotation.closeContext();
  };

  const onClickRemove = () => {
    annotation.remove();
    annotation.closeContext();
  };

  const onClickHide = () => {
    annotation.hide();
    annotation.closeContext();
  };

  const handleVisibleChange = (flag: boolean) => {
    flag ? annotation.openContext() : annotation.closeContext();
  };

  useEffect(() => {
    gsap.set(`#${annotation.id}`,
      { width: annotation.width, height: annotation.height, left: annotation.x, top: annotation.y });

    const { width: wWidth, height: wHeight, x: wLeft, y: wTop } = (document.getElementById(
      "image-wrapper") as HTMLElement).getBoundingClientRect();

    const draggable = new Draggable(`#${annotation.id}`, {
      cursor: "move",
      bounds: "#image-wrapper",
      type: "x,y",
      allowContextMenu: true,
      onPress: function () {
        annotation.select();
        annotation.closeContext();
      }
    });

    draggable.disable();
    reaction(() => annotation.isDraggable,
      isDraggable => isDraggable ? draggable.enable() : draggable.disable());

    const $right  = document.createElement("div");
    const $top    = document.createElement("div");
    const $bottom = document.createElement("div");
    const $left   = document.createElement("div");

    const rightDraggable  = new Draggable($right, {
      trigger: `#${annotation.id} .right, #${annotation.id} .topRight, #${annotation.id} .bottomRight`,
      onDrag: function (event: PointerEvent) {
        const div             = document.getElementById(annotation.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.min(event.clientX, wWidth + wLeft);
        const { left, right } = div.getBoundingClientRect();

        if (mouse < left) {
          const diff = (mouse - left) * scale;
          gsap.set(`#${annotation.id}`, { left: `=${mouse}`, width: `=${diff}` });
          rightDraggable.endDrag(event);
          leftDraggable.startDrag(event);
        } else {
          const diff = (right - mouse) * scale;
          gsap.set(`#${annotation.id}`, { width: `-=${diff}` });
        }
      },
      onPress: function () {
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });
    const topDraggable    = new Draggable($top, {
      trigger: `#${annotation.id} .top, #${annotation.id} .topRight, #${annotation.id} .topLeft`,
      onDrag: function (event) {
        const div             = document.getElementById(annotation.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.max(event.clientY, wTop);
        const { top, bottom } = div.getBoundingClientRect();

        if (mouse > bottom) {
          const diff = (mouse - bottom) * scale;
          gsap.set(`#${annotation.id}`, { top: `=${bottom}`, height: `=${diff}` });
          topDraggable.endDrag(event);
          bottomDraggable.startDrag(event);
        } else {
          const diff = (mouse - top) * scale;
          gsap.set(`#${annotation.id}`, { height: `-=${diff}`, top: `+=${diff}` });
        }
      },
      onPress: function () {
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });
    const bottomDraggable = new Draggable($bottom, {
      trigger: `#${annotation.id} .bottom, #${annotation.id} .bottomRight, #${annotation.id} .bottomLeft`,
      onDrag: function (event) {
        const div             = document.getElementById(annotation.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.min(event.clientY, wTop + wHeight);
        const { top, bottom } = div.getBoundingClientRect();

        if (mouse < top) {
          const diff = (mouse - top) * scale;
          gsap.set(`#${annotation.id}`, { top: `=${mouse}`, height: `=${diff}` });
          bottomDraggable.endDrag(event);
          topDraggable.startDrag(event);
        } else {
          const diff = (bottom - mouse) * scale;
          gsap.set(`#${annotation.id}`, { height: `-=${diff}` });
        }
      },
      onPress: function () {
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });
    const leftDraggable   = new Draggable($left, {
      trigger: `#${annotation.id} .left, #${annotation.id} .bottomLeft, #${annotation.id} .topLeft`,
      onDrag: function (event: PointerEvent) {
        const div             = document.getElementById(annotation.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.max(event.clientX, wLeft);
        const { left, right } = div.getBoundingClientRect();

        if (mouse > right) {
          const diff = (mouse - right) * scale;
          gsap.set(`#${annotation.id}`, { left: `=${right}`, width: `=${diff}` });
          leftDraggable.endDrag(event);
          rightDraggable.startDrag(event);
        } else {
          const diff = (mouse - left) * scale;
          gsap.set(`#${annotation.id}`, { width: `-=${diff}`, left: `+=${diff}` });
        }
      },
      onPress: function () {
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });

    if (annotation.creationEvent) {
      rightDraggable.startDrag(annotation.creationEvent);
      bottomDraggable.startDrag(annotation.creationEvent);
      annotation.select();
    }

    return () => {
      draggable.kill();
      rightDraggable.kill();
      topDraggable.kill();
      bottomDraggable.kill();
      leftDraggable.kill();
    };
    // @ts-ignore
  }, []);

  return (
    annotation.exists ?
      <Dropdown
        visible={annotation.isContextVisible}
        onVisibleChange={handleVisibleChange}
        trigger={annotation.isDraggable ? ['contextMenu'] : []}
        overlay={
          <Menu>
            <Menu.SubMenu title="Relabel" key="relabel-menu">
              {labels.map(label => <Menu.Item key={label} onClick={() => onClickLabel(label)}>{label}</Menu.Item>)}
            </Menu.SubMenu>
            <Menu.Item key="hide" onClick={onClickHide}>Hide</Menu.Item>
            <Menu.Divider/>
            <Menu.Item key="delete" onClick={onClickRemove} danger>Remove</Menu.Item>
          </Menu>
        }
      >
        <StyledAnnotation
          id={annotation.id}
          className={`${annotation.isSelected ? 'selected' : ''}`}
          scale={annotation.scale}
          annotation={annotation}
          visible={annotation.isVisible}
          draggable={annotation.isDraggable}
        >
          {annotation.isLabelShown && <span>{annotation.label}</span>}
          <div className="drag right"/>
          <div className="drag bottom"/>
          <div className="drag top"/>
          <div className="drag left"/>
          <div className="drag bottomRight"/>
          <div className="drag topLeft"/>
          <div className="drag topRight"/>
          <div className="drag bottomLeft"/>
        </StyledAnnotation>
      </Dropdown> :
      <div/>
  );
});

// annotation list item
interface AnnotationItemProps {
  annotation: AnnotationSubStore;
}

const StyledAnnotationItem = styled.div<{ annotation: AnnotationSubStore }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  box-shadow: 5px 5px 15px black;
  width: 40vw;
  height: 40px;
  margin: 15px;
  padding: 15px;
  border: 2px solid white;
  transition: border-color .25s;

  &.selected {
    border-color: purple;
  }

  > span {
    color: ${({ annotation }) => colors[annotation.label]};
  }

  .buttons {
    display: flex;
    gap: 1rem;
  }
`;

const AnnotationItem: FC<AnnotationItemProps> = observer(({ annotation }) => {
  const [relabelIsVisible, setRelabelIsVisible] = useState<boolean>(false);

  const onRelabel = (newLabel: TLabel) => {
    annotation.label = newLabel;
    setRelabelIsVisible(false);
  };

  return (
    annotation.exists ?
      <StyledAnnotationItem
        className={`${annotation.isSelected ? 'selected' : ''}`}
        annotation={annotation}
        onClick={annotation.select}
      >
        <Dropdown
          trigger={["click"]}
          visible={relabelIsVisible}
          onVisibleChange={(flag) => setRelabelIsVisible(flag)}
          overlay={
            <Menu>
              {labels.map((label, index) => (
                <Menu.Item
                  key={index}
                  onClick={() => onRelabel(label)}
                >
                  {label}
                </Menu.Item>
              ))}
            </Menu>
          }>
          <Button onClick={() => setRelabelIsVisible(true)}
                  style={{ color: colors[annotation.label] }}>{annotation.label}</Button>
        </Dropdown>
        <span className="buttons">
          <Button
            onClick={annotation.isVisible ? annotation.hide : annotation.show}>{annotation.isVisible ? 'Hide' : 'Show'}</Button>
          <Button danger onClick={annotation.remove}>Remove</Button>

        </span>
      </StyledAnnotationItem> :
      <div/>
  );
});

// original layer sub component
interface OriginalProps {
  origin: OriginalSubStore;
}

const StyledOrigin = styled.div<{ annotation: OriginalSubStore, scale: number }>`
  position: absolute;
  z-index: 50;
  top: ${({ annotation }) => annotation.y}px;
  left: ${({ annotation }) => annotation.x}px;
  width: ${({ annotation }) => annotation.width}px;
  height: ${({ annotation }) => annotation.height}px;
  background: ${({ annotation }) => colors[annotation.label]}30;
  border: 1px solid ${({ annotation }) => colors[annotation.label]};

  span {
    position: absolute;
    z-index: 75;
    left: 0;
    bottom: 0;
    color: black;
    background: rgba(255, 255, 255, .7);
    padding: 0 0.2rem;
    border-radius: 0 0.2rem 0.2rem 0;
    transform: scale(${({ scale }) => 1 / scale});
    transition: all 0.25s ease;
    transform-origin: left top;
    white-space: nowrap;
  }
`;

const Original: FC<OriginalProps> = observer(({ origin }) => {
  const { annotationTool } = useStores();

  return (
    annotationTool.isOriginShown ?
      <StyledOrigin annotation={origin} scale={annotationTool.scale}>
        {annotationTool.areLabelsShown && <span>{origin.label} ({origin.confidenceFormatted})</span>}
      </StyledOrigin> :
      <div/>
  );
});

// app
const StyledApp = styled.div`
  display: flex;

  #image-wrapper {
    position: relative;
  }

  .annotation-list {
    display: flex;
    flex-direction: column;
    align-items: center;

    .tool-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
  }
`;

const App = observer(() => {
  const { annotationTool } = useStores();

  const onZoomHandler = (r: ReactZoomPanPinchRef) => {
    annotationTool.scale = 1 / r.state.scale;
  };

  return (
    <StyledApp>
      <TransformWrapper
        disabled={annotationTool.isPanDisabled}
        onZoomStop={onZoomHandler}
        wheel={{ step: 0.05 }}
      >
        <TransformComponent>
          <div id="image-wrapper" onContextMenu={(e) => e.preventDefault()}>
            <img
              src="https://images.pexels.com/photos/1458377/pexels-photo-1458377.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260"
              alt="input"
              style={{ verticalAlign: "middle" }}
            />
            {annotationTool.originals.map(origin => (
              <Original key={origin.id} origin={origin}/>
            ))}
            {annotationTool.annotations.map(annotation => (
              <Annotation
                key={annotation.id}
                annotation={annotation}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <div className="annotation-list">
        {annotationTool.annotations.map(annotation => (
          <AnnotationItem
            key={annotation.id}
            annotation={annotation}
          />
        ))}

        <div className="tool-buttons">
          <Radio.Group value={annotationTool.tool}>
            <Radio.Button value="pan" onClick={() => annotationTool.tool = 'pan'}>Pan / Zoom</Radio.Button>
            <Radio.Button value="drag" onClick={() => annotationTool.tool = 'drag'}>Drag / Resize</Radio.Button>
            <Radio.Button value="annotate" onClick={() => annotationTool.tool = 'annotate'}>Annotate</Radio.Button>
          </Radio.Group>
        </div>
        <div className="tool-buttons">
          <Button onClick={annotationTool.isOriginShown ? annotationTool.hideOrigin : annotationTool.showOrigin}>
            {annotationTool.isOriginShown ? 'Hide Predictions' : 'Show Predictions'}
          </Button>
          <Button onClick={annotationTool.areLabelsShown ? annotationTool.hideLabels : annotationTool.showLabels}>
            {annotationTool.areLabelsShown ? 'Hide Labels' : 'Show Labels'}
          </Button>
        </div>
      </div>
    </StyledApp>
  );
});

(window as any).rootStore = rootStore;

export default App;
