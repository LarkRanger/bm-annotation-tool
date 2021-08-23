import React, { FC, useEffect, useState } from "react";
import "./App.css";
import 'antd/dist/antd.css';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef
} from "react-zoom-pan-pinch";
import styled from "styled-components";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Menu, Dropdown, Button } from 'antd';
import { v4 as uuid } from 'uuid';

gsap.registerPlugin(Draggable);

type TLabel = 'unlabeled' | 'pylon' | 'farm' | 'gold_mine';

interface IBoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: TLabel;
}

interface BoundingBoxLabelProps {
  box: IBoundingBox;
  scale: number;
}

const StyledLabel = styled.div<BoundingBoxLabelProps>`
  position: absolute;
  z-index: 500;
  left: 0;
  top: 1rem;
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
  relabel?: (newLabel: TLabel) => void;
}

const StyledBox = styled.div<BoundingBoxProps>`
  position: absolute;
  z-index: 100;
    // left: ${({ box }) => box.x}px;
    // top: ${({ box }) => box.y}px;
    // width: ${({ box }) => box.width}px;
    // height: ${({ box }) => box.height}px;
  background: ${({ box }) => colors[box.label]}30;
  border: ${({ scale }) => 0.05 * scale}rem solid ${({ box }) => colors[box.label]};
  transition: background 0.15s;

  &:hover {
    background: ${({ box }) => colors[box.label]}50;

    .drag {
      visibility: visible;
    }
  }

  .drag {
    position: absolute;
    width: 8px;
    height: 8px;
    background: white;
    border: 1px solid darkgray;
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
  const [isContextVisible, setIsContextVisible] = useState<boolean>(false);

  const onClickLabel = (label: TLabel) => {
    relabel(label);
    setIsContextVisible(false);
  };

  const onClickDelete = () => {
    remove();
    setIsContextVisible(false);
  };

  const handleVisibleChange = (flag: boolean) => {
    setIsContextVisible(flag);
  };

  useEffect(() => {
    gsap.set(`#${box.id}`, { width: box.width, height: box.height, left: box.x, top: box.y });

    const { width: wWidth, height: wHeight, x: wLeft, y: wTop } = (document.getElementById(
      "image-wrapper") as HTMLElement).getBoundingClientRect();

    const draggable = new Draggable(`#${box.id}`, {
      cursor: "move",
      bounds: "#image-wrapper",
      type: "x,y",
      allowContextMenu: true
    });

    const $right  = document.createElement("div");
    const $top    = document.createElement("div");
    const $bottom = document.createElement("div");
    const $left   = document.createElement("div");

    const rightDraggable  = new Draggable($right, {
      trigger: `#${box.id} .right, #${box.id} .topRight, #${box.id} .bottomRight`,
      onDrag: function (event: PointerEvent) {
        const div             = document.getElementById(box.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.min(event.clientX, wWidth + wLeft);
        const { left, right } = div.getBoundingClientRect();

        if (mouse < left) {
          const diff = (mouse - left) * scale;
          gsap.set(`#${box.id}`, { left: `=${mouse}`, width: `=${diff}` });
          rightDraggable.endDrag(event);
          leftDraggable.startDrag(event);
        } else {
          const diff = (right - mouse) * scale;
          gsap.set(`#${box.id}`, { width: `-=${diff}` });
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
      trigger: `#${box.id} .top, #${box.id} .topRight, #${box.id} .topLeft`,
      onDrag: function (event) {
        const div             = document.getElementById(box.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.max(event.clientY, wTop);
        const { top, bottom } = div.getBoundingClientRect();

        if (mouse > bottom) {
          const diff = (mouse - bottom) * scale;
          gsap.set(`#${box.id}`, { top: `=${bottom}`, height: `=${diff}` });
          topDraggable.endDrag(event);
          bottomDraggable.startDrag(event);
        } else {
          const diff = (mouse - top) * scale;
          gsap.set(`#${box.id}`, { height: `-=${diff}`, top: `+=${diff}` });
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
      trigger: `#${box.id} .bottom, #${box.id} .bottomRight, #${box.id} .bottomLeft`,
      onDrag: function (event) {
        const div             = document.getElementById(box.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.min(event.clientY, wTop + wHeight);
        const { top, bottom } = div.getBoundingClientRect();

        if (mouse < top) {
          const diff = (mouse - top) * scale;
          gsap.set(`#${box.id}`, { top: `=${mouse}`, height: `=${diff}` });
          bottomDraggable.endDrag(event);
          topDraggable.startDrag(event);
        } else {
          const diff = (bottom - mouse) * scale;
          gsap.set(`#${box.id}`, { height: `-=${diff}` });
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
      trigger: `#${box.id} .left, #${box.id} .bottomLeft, #${box.id} .topLeft`,
      onDrag: function (event: PointerEvent) {
        const div             = document.getElementById(box.id) as HTMLElement;
        const scale           = Number(div.getAttribute('scale'));
        const mouse           = Math.max(event.clientX, wLeft);
        const { left, right } = div.getBoundingClientRect();

        if (mouse > right) {
          const diff = (mouse - right) * scale;
          gsap.set(`#${box.id}`, { left: `=${right}`, width: `=${diff}` });
          leftDraggable.endDrag(event);
          rightDraggable.startDrag(event);
        } else {
          const diff = (mouse - left) * scale;
          gsap.set(`#${box.id}`, { width: `-=${diff}`, left: `+=${diff}` });
        }
      },
      onPress: function () {
        draggable.disable();
      },
      onRelease: function () {
        draggable.enable();
      }
    });

    if (box.creationEvent) {
      rightDraggable.startDrag(box.creationEvent);
      bottomDraggable.startDrag(box.creationEvent);
    }

    return () => {
      draggable.kill();
      rightDraggable.kill();
      topDraggable.kill();
      bottomDraggable.kill();
      leftDraggable.kill();
    };
  }, []);

  return (
    box.exist ?
      <Dropdown
        visible={isContextVisible}
        onVisibleChange={handleVisibleChange}
        trigger={['contextMenu']}
        overlay={
          <Menu>
            <Menu.SubMenu title="Relabel" key="relabel-menu">
              {labels.map(label => <Menu.Item key={label} onClick={() => onClickLabel(label)}>{label}</Menu.Item>)}
            </Menu.SubMenu>
            <Menu.Divider/>
            <Menu.Item key="delete" onClick={onClickDelete} danger>Delete</Menu.Item>
          </Menu>
        }
      >
        <StyledBox
          id={box.id}
          scale={scale}
          box={box}
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
        </StyledBox>
      </Dropdown> :
      <div/>
  );
};

interface AnnotationItemProps {
  annotation: IAnnotation;
  index: number;
  remove: () => void;
  relabel: (newLabel: TLabel) => void;
}

const StyledAnnotationItem = styled.div<{ annotation: IAnnotation }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  box-shadow: 5px 5px 15px black;
  width: 40vw;
  height: 40px;
  margin: 15px;
  padding: 15px;
  background-color: ${({ annotation }) => colors[annotation.label]}80;

  .buttons {
    display: flex;
    gap: 1rem;
  }
`;

const labels: TLabel[] = [
  'pylon',
  'farm',
  'gold_mine'
];

const AnnotationItem: FC<AnnotationItemProps> = ({ annotation, index, remove, relabel }) => {
  const [relabelIsVisible, setRelabelIsVisible] = useState<boolean>(false);

  const onRelable = (newLabel: TLabel) => {
    relabel(newLabel);
    setRelabelIsVisible(false);
  };

  return (
    annotation.exist ?
      <StyledAnnotationItem annotation={annotation}>
        <span className="text">{index} {annotation.label}</span>
        <span className="buttons">
        <Button danger onClick={remove}>Delete</Button>
        <Dropdown
          trigger={["click"]}
          visible={relabelIsVisible}
          onVisibleChange={(flag) => setRelabelIsVisible(flag)}
          overlay={
            <Menu>
              {labels.map((label, index) => (
                <Menu.Item
                  key={index}
                  onClick={() => onRelable(label)}
                >
                  {label}
                </Menu.Item>
              ))}
            </Menu>
          }>
          <Button onClick={() => setRelabelIsVisible(true)}>Relabel</Button>
        </Dropdown>
      </span>
      </StyledAnnotationItem> :
      <div/>
  );
};

const colors = {
  unlabeled: "#888888",
  pylon: "#0000FF",
  farm: "#FF0000",
  gold_mine: "#FFFF00"
};

const initialBoxes: IBoundingBox[] = [
  {
    id: 'Acd77111d-1fc7-4291-b05d-4c1c69c04637',
    x: 100,
    y: 265,
    width: 270,
    height: 200,
    label: "pylon"
  },
  {
    id: 'A94d699f7-779e-49e7-90cc-99c8dc28cffc',
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    label: "farm"
  },
  {
    id: 'A60bee2ac-1936-4af7-8cb6-f5ab15ecb40e',
    x: 60,
    y: 60,
    height: 70,
    width: 70,
    label: "gold_mine"
  }
];

type IAnnotation = IBoundingBox & { exist: boolean, id: string, creationEvent?: MouseEvent };

const App = () => {
  const [scale, setScale]             = useState<number>(1);
  const [annotations, setAnnotations] = useState<IAnnotation[]>([]);
  const [panDisabled, setPanDisabled] = useState<boolean>(false);

  const onZoomHandler = (r: ReactZoomPanPinchRef) => {
    setScale(1 / r.state.scale);
  };

  const deleteAnnotationFactory = (index: number) => {
    return () => {
      const newAnnotations  = [...annotations];
      newAnnotations[index] = { ...annotations[index], exist: false };
      setAnnotations(newAnnotations);
    };
  };

  const relabelFactory = (index: number) => {
    return (newLabel: TLabel) => {
      const newAnnotations  = [...annotations];
      newAnnotations[index] = { ...annotations[index], label: newLabel };
      setAnnotations(newAnnotations);
    };
  };

  const onAddNew = () => {
    const wrapper = document.getElementById('image-wrapper') as HTMLElement;

    const addNewAnnotation = (event: MouseEvent) => {
      const newAnnotation: IAnnotation = {
        y: event.clientY,
        x: event.clientX,
        height: 0,
        width: 0,
        label: 'unlabeled',
        id: 'A' + uuid(),
        exist: true,
        creationEvent: event
      };
      const newAnnotations             = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      wrapper.removeEventListener('mousedown', addNewAnnotation);

      const reenablePan = () => {
        setPanDisabled(false);
        wrapper.removeEventListener('mouseup', reenablePan);
      }

      wrapper.addEventListener('mouseup', reenablePan);
    };

    wrapper.addEventListener('mousedown', addNewAnnotation);
    setPanDisabled(true);
  };

  useEffect(() => {
    const newAnnotations = initialBoxes.map(box => {
      const newAnnotation = { ...box, exist: true };
      return newAnnotation;
    });
    setAnnotations(newAnnotations);
  }, []);

  return (
    <StyledApp>
      <TransformWrapper disabled={panDisabled} onZoomStop={onZoomHandler} wheel={{ step: 0.05 }}>
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

      <div className="annotation-list">
        {annotations.map((annotation, index) =>
          (
            <AnnotationItem
              key={index}
              index={index}
              annotation={annotation}
              remove={deleteAnnotationFactory(index)}
              relabel={relabelFactory(index)}
            />
          )
        )}

        <Button onClick={onAddNew}>New Annotation</Button>
      </div>
    </StyledApp>
  );
};

const StyledApp = styled.div`
  display: flex;

  .annotation-list {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

export default App;
