import React, { FC, MouseEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef
} from "react-zoom-pan-pinch";
import styled from "styled-components";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { on } from 'cluster';

gsap.registerPlugin(Draggable);

interface IBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
}

interface BoundingBoxLabelProps {
  box: IBoundingBox;
  scale: number;
}

const StyledLabel = styled.div<BoundingBoxLabelProps>`
  position: absolute;
  z-index: 500;
  top: 1rem;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 0 0.2rem 0.2rem 0;
  transform: scale(${({ scale }) => scale});
  transition: all 0.25s ease;
  transform-origin: left top;
`;

const BoundingBoxLabel: FC<BoundingBoxLabelProps> = ({ box, scale }) => {
  return (
    <StyledLabel box={box} scale={scale}>
      {box.label}
    </StyledLabel>
  );
};

interface BoundingBoxProps {
  box: IAnnotation;
  scale: number;
  remove?: () => void;
  relabel?: (newLabel: string) => void;
}

const StyledBox = styled.div<BoundingBoxProps>`
  position: absolute;
  z-index: 100;
  left: ${({ box }) => box.x}px;
  top: ${({ box }) => box.y}px;
  width: ${({ box }) => box.width}px;
  height: ${({ box }) => box.height}px;
  background: ${({ box }) => box.color}30;
  border: ${({ scale }) => 0.05 * scale}rem solid ${({ box }) => box.color};
  transition: background 0.15s;

  &:hover {
    background: ${({ box }) => box.color}50;

    .drag {
      visibility: visible;
    }
  }

  .drag {
    position: absolute;
    width: 5px;
    height: 5px;
    background: white;
    border: 2px solid darkgray;
    border-radius: 1px;
    z-index: 200;
    visibility: hidden;
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

const BoundingBox: FC<BoundingBoxProps> = ({
  scale,
  box,
  remove = () => {
  },
  relabel = () => {
  }
}) => {
  const [[context, x, y], setContext] = useState<[boolean, number, number]>([false, 0, 0]);

  useEffect(() => {
    const boxId = `box-${box.label}-${box.x}-${box.y}`;

    const draggable = new Draggable(`#${boxId}`, {
      cursor: "move",
      bounds: "#image-wrapper",
      type: "x,y"
    });

    const $right         = document.createElement("div");
    let rightLastX       = 0;
    const rightDraggable = new Draggable($right, {
      trigger: `#${boxId} .right, #${boxId} .topRight, #${boxId} .bottomRight`,
      onDrag: function () {
        const scale = Number(document.getElementById(boxId)?.getAttribute('scale'));
        const diff  = this.x - rightLastX;
        gsap.set(`#${boxId}`, { width: `+=${diff * scale}` });
        rightLastX = this.x;
      },
      onPress: function () {
        rightLastX = this.x;
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });

    const $top         = document.createElement("div");
    let topLastY       = 0;
    const topDraggable = new Draggable($top, {
      trigger: `#${boxId} .top, #${boxId} .topRight, #${boxId} .topLeft`,
      onDrag: function () {
        const scale = Number(document.getElementById(boxId)?.getAttribute('scale'));
        const diff  = this.y - topLastY;
        gsap.set(`#${boxId}`, { height: `-=${diff * scale}`, y: `+=${diff * scale}` });
        topLastY = this.y;
      },
      onPress: function () {
        topLastY = this.y;
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });

    const $bottom         = document.createElement("div");
    let bottomLastY       = 0;
    const bottomDraggable = new Draggable($bottom, {
      trigger: `#${boxId} .bottom, #${boxId} .bottomRight, #${boxId} .bottomLeft`,
      onDrag: function () {
        const scale = Number(document.getElementById(boxId)?.getAttribute('scale'));
        const diff  = this.y - bottomLastY;
        gsap.set(`#${boxId}`, { height: `+=${diff * scale}` });
        bottomLastY = this.y;
      },
      onPress: function () {
        bottomLastY = this.y;
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });

    const $left         = document.createElement("div");
    let leftLastX       = 0;
    const leftDraggable = new Draggable($left, {
      trigger: `#${boxId} .left, #${boxId} .bottomLeft, #${boxId} .topLeft`,
      onDrag: function () {
        const scale = Number(document.getElementById(boxId)?.getAttribute('scale'));
        const diff  = this.x - leftLastX;
        gsap.set(`#${boxId}`, { width: `-=${diff * scale}`, x: `+=${diff * scale}` });
        leftLastX = this.x;
      },
      onPress: function () {
        this.leftLastX = this.x;
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });

    return () => {
      draggable.kill();
      rightDraggable.kill();
      topDraggable.kill();
      bottomDraggable.kill();
      leftDraggable.kill();
    };
  }, []);

  const onContextMenuCapture = (event: any) => {
    setContext([!context, event.clientX, event.clientY]);
  };

  return (
    box.exist
      ? <StyledBox
          id={`box-${box.label}-${box.x}-${box.y}`}
          scale={scale}
          box={box}
          onContextMenuCapture={onContextMenuCapture}
        >
          <BoundingBoxLabel box={box} scale={scale}/>
          <div className="drag right"/>
          <div className="drag bottom"/>
          <div className="drag top"/>
          <div className="drag left"/>
          <div className="drag bottomRight"/>
          <div className="drag topLeft"/>
          <div className="drag topRight"/>
          <div className="drag bottomLeft"/>
          {context && <ContextMenu remove={remove} relabel={relabel} close={() => setContext([false, 0, 0])} x={x} y={y}/>}
        </StyledBox>
        : <div/>
  );
};

interface ContextMenuProps {
  remove: () => void;
  relabel: (newLabel: string) => void;
  close: () => void;
  x: number;
  y: number;
}

const StyledContextMenu = styled.div<{ x: number, y: number }>`
  position: fixed;
  top: ${({ y }) => y}px;
  left: ${({ x }) => x}px;
  
  div {
    display: flex;
    flex-direction: column;
  }
`;

const ContextMenu: FC<ContextMenuProps> = ({ remove, relabel, close, x, y }) => {
  const [menu, setMenu] = useState<'main' | 'relabel'>('main');

  return (
    <StyledContextMenu y={y} x={x}>
      {menu === 'main' ?
        <div>
          <button onClick={remove}>
            remove
          </button>
          <button onClick={() => setMenu('relabel')}>
            relabel
          </button>
        </div> :
        <div>
          {
            labels.map(label => (
              <button key={label} onClick={() => {
                relabel(label);
                close();
                setMenu('main');
              }}>
                {label}
              </button>
            ))
          }
          <button onClick={() => setMenu('main')}>
            back
          </button>
        </div>}
    </StyledContextMenu>
  );
};

const labels = [
  'pylon',
  'farm',
  'gold_mine'
];

const initialBoxes = [
  {
    x: 100,
    y: 265,
    width: 270,
    height: 200,
    label: "pylon",
    color: "#0000FF"
  },
  {
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    label: "farm",
    color: "#FF0000"
  },
  {
    x: 60,
    y: 60,
    height: 70,
    width: 70,
    label: "gold_mine",
    color: "#FFFF00"
  }
];

type IAnnotation = IBoundingBox & { exist: boolean };

const App = () => {
  const [scale, setScale]            = useState<number>(1);
  const [annotations, setAnnotation] = useState<IAnnotation[]>([]);

  const onZoomHandler = (r: ReactZoomPanPinchRef) => {
    setScale(1 / r.state.scale);
  };

  const deleteAnnotationFactory = (index: number) => {
    return () => {
      const newAnnotations  = [...annotations];
      newAnnotations[index] = { ...annotations[index], exist: false };
      setAnnotation(newAnnotations);
    };
  };

  const relabelFactory = (index: number) => {
    return (newLabel: string) => {
      const newAnnotations  = [...annotations];
      newAnnotations[index] = { ...annotations[index], label: newLabel };
      setAnnotation(newAnnotations);
    };
  };

  useEffect(() => {
    const newAnnotations = initialBoxes.map(box => {
      const newAnnotations = { ...box, exist: true };
      return newAnnotations;
    });
    setAnnotation(newAnnotations);
  }, []);

  return (
    <div>
      <TransformWrapper onZoomStop={onZoomHandler} wheel={{ step: 0.05 }}>
        <TransformComponent>
          <div id="image-wrapper">
            <img
              src="https://images.pexels.com/photos/1458377/pexels-photo-1458377.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260"
              alt="input"
              style={{ verticalAlign: "middle" }}
            />
            {annotations.map((annotation, index) => (
              <BoundingBox
                key={index}
                box={annotation}
                scale={scale}
                remove={deleteAnnotationFactory(index)}
                relabel={relabelFactory(index)}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default App;
