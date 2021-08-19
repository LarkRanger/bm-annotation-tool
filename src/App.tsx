import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
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
  deleteBox?: () => void;
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

// class BoundingBox extends React.Component<BoundingBoxProps, any> {
//   draggable?: Draggable;
//   rightDraggable?: Draggable;
//   leftDraggable?: Draggable;
//   topDraggable?: Draggable;
//   bottomDraggable?: Draggable;
//
//   constructor(props: BoundingBoxProps) {
//     super(props);
//
//     this.state = {
//       scale: props.scale,
//       box: props.box,
//       deleteBox: props.deleteBox
//     };
//   }
//
//   componentDidMount() {
//     const { box } = this.state;
//     const state   = this.state;
//     const boxId   = `box-${box.label}-${box.x}-${box.y}`;
//     console.log('creating draggables');
//     console.log(state);
//
//     const draggable = new Draggable(`#${boxId}`, {
//       cursor: "move",
//       bounds: "#image-wrapper",
//       type: "x,y"
//     });
//
//     const $right        = document.createElement("div");
//     let rightLastX      = 0;
//     this.rightDraggable = new Draggable($right, {
//       trigger: `#${boxId} .right, #${boxId} .topRight, #${boxId} .bottomRight`,
//       onDrag: function () {
//         const diff = this.x - rightLastX;
//         gsap.set(`#${boxId}`, { width: `+=${diff * this.props.scale}` });
//         rightLastX = this.x;
//       },
//       onPress: function () {
//         rightLastX = this.x;
//         draggable.disable();
//       },
//       onRelease: function () {
//         draggable.enable();
//       }
//     });
//
//     const $top        = document.createElement("div");
//     let topLastY      = 0;
//     this.topDraggable = new Draggable($top, {
//       trigger: `#${boxId} .top, #${boxId} .topRight, #${boxId} .topLeft`,
//       onDrag: function () {
//         const diff = this.y - topLastY;
//         gsap.set(`#${boxId}`, { height: `-=${diff * state.scale}`, y: `+=${diff * state.scale}` });
//         topLastY = this.y;
//       },
//       onPress: function () {
//         topLastY = this.y;
//         draggable.disable();
//       },
//       onRelease: function () {
//         draggable.enable();
//       }
//     });
//
//     const $bottom        = document.createElement("div");
//     let bottomLastY      = 0;
//     this.bottomDraggable = new Draggable($bottom, {
//       trigger: `#${boxId} .bottom, #${boxId} .bottomRight, #${boxId} .bottomLeft`,
//       onDrag: function () {
//         const diff = this.y - bottomLastY;
//         gsap.set(`#${boxId}`, { height: `+=${diff * state.scale}` });
//         bottomLastY = this.y;
//       },
//       onPress: function () {
//         bottomLastY = this.y;
//         draggable.disable();
//       },
//       onRelease: function () {
//         draggable.enable();
//       }
//     });
//
//     const $left        = document.createElement("div");
//     let leftLastX      = 0;
//     this.leftDraggable = new Draggable($left, {
//       trigger: `#${boxId} .left, #${boxId} .bottomLeft, #${boxId} .bottomLeft`,
//       onDrag: function () {
//         const diff = this.x - leftLastX;
//         gsap.set(`#${boxId}`, { width: `-=${diff * state.scale}`, x: `+=${diff * state.scale}` });
//         leftLastX = this.x;
//       },
//       onPress: function () {
//         leftLastX = this.x;
//         draggable.disable();
//       },
//       onRelease: function () {
//         draggable.enable();
//       }
//     });
//   }
//
//   componentWillUnmount() {
//     this.draggable?.kill();
//     this.rightDraggable?.kill();
//     this.topDraggable?.kill();
//     this.bottomDraggable?.kill();
//     this.leftDraggable?.kill();
//   }
//
//   render() {
//     const { box, scale, deleteBox } = this.props;
//
//     return box.exist
//       ? <StyledBox id={`box-${box.label}-${box.x}-${box.y}`} scale={scale} box={box} onContextMenuCapture={deleteBox}>
//         <BoundingBoxLabel box={box} scale={scale}/>
//         <div className="drag right"/>
//         <div className="drag bottom"/>
//         <div className="drag top"/>
//         <div className="drag left"/>
//         <div className="drag bottomRight"/>
//         <div className="drag topLeft"/>
//         <div className="drag topRight"/>
//         <div className="drag bottomLeft"/>
//       </StyledBox>
//       : <div/>;
//   }
// }

const BoundingBox: FC<BoundingBoxProps> = ({
  scale,
  box,
  deleteBox = () => {
  }
}) => {
  const [draggables, setDraggables] = useState<Draggable[]>([]);

  useEffect(() => {
    const boxId = `box-${box.label}-${box.x}-${box.y}`;
    console.log('creating draggables');

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
        const diff = this.x - rightLastX;
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
        const diff = this.y - topLastY;
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
        const currentScale = scale;
        const diff         = this.y - bottomLastY;
        gsap.set(`#${boxId}`, { height: `+=${diff * currentScale}` });
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
    let leftLastX     = 0;
    const leftDraggable = new Draggable($left, {
      trigger: `#${boxId} .left, #${boxId} .bottomLeft, #${boxId} .bottomLeft`,
      onDrag: function () {
        const newScale = document.getElementById()
        const diff = this.x - leftLastX;
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

    setDraggables([draggable, rightDraggable, leftDraggable, topDraggable, bottomDraggable]);

    return () => {
      draggable.kill();
      rightDraggable.kill();
      topDraggable.kill();
      bottomDraggable.kill();
      leftDraggable.kill();
    };
  }, []);

  // useEffect(() => {
  //   if (draggables.length < 5) return;
  //
  //   console.log('in effect' + scale);
  //   const boxId = `box-${box.label}-${box.x}-${box.y}`;
  //
  //   function dragLeft() {
  //     console.log('inside' + scale);
  //     // @ts-ignore
  //     const diff = this.x - this.leftLastX;
  //     // @ts-ignore
  //     gsap.set(`#${boxId}`, { width: `-=${diff * scale}`, x: `+=${diff * scale}` });
  //     // @ts-ignore
  //     this.leftLastX = this.x;
  //   }
  //
  //   draggables[2].removeEventListener('drag', dragLeft);
  //   draggables[2].addEventListener('drag', dragLeft);
  //
  // }, [scale, draggables]);

  return (
    box.exist
      ? <StyledBox id={`box-${box.label}-${box.x}-${box.y}`} scale={scale} box={box} onContextMenuCapture={deleteBox}>
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
      : <div/>
  );
};

const initialBoxes = [
  {
    x: 100,
    y: 265,
    width: 270,
    height: 200,
    label: "blue_box",
    color: "#0000FF"
  },
  {
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    label: "red_box",
    color: "#FF0000"
  },
  {
    x: 60,
    y: 60,
    height: 70,
    width: 70,
    label: "overlapping_box",
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
              <BoundingBox key={index} box={annotation} scale={scale} deleteBox={deleteAnnotationFactory(index)}/>
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default App;
