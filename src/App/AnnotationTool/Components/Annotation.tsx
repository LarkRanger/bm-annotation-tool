import React, { FC, useEffect } from 'react';
import styled from 'styled-components';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Dropdown, Menu } from 'antd';

import AnnotationItem from '../../../stores/AnnotationStore/AnnotationItem';
import { useStores } from '../../../hooks/useStores';

gsap.registerPlugin(Draggable);

interface AnnotationProps {
  annotation: AnnotationItem;
}

const Annotation: FC<AnnotationProps> = observer(({ annotation }) => {
  const { annotationStore } = useStores();

  const onClickLabel = (label: string) => {
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
              {annotationStore.labels.map(label => <Menu.Item key={label} onClick={() => onClickLabel(label)}>{label}</Menu.Item>)}
            </Menu.SubMenu>
            <Menu.Item key="hide" onClick={onClickHide}>Hide</Menu.Item>
            <Menu.Divider/>
            <Menu.Item key="delete" onClick={onClickRemove} danger>Remove</Menu.Item>
          </Menu>
        }
      >
        <Container
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
        </Container>
      </Dropdown> :
      <div/>
  );
});

const Container = styled.div<{ annotation: AnnotationItem, scale: number, visible: boolean, draggable: boolean }>`
  position: absolute;
  background: ${({ annotation }) => annotation.color}30;
  border: 1px solid ${({ annotation }) => annotation.color};
  transition: background 0.15s;
  visibility: ${({ visible }) => visible ? 'visible' : 'hidden'};

  &[draggable="true"]:hover {
    background: ${({ annotation }) => annotation.color}50;
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
    border: 1px solid ${({ annotation }) => annotation.color};
    border-radius: 1px;
    z-index: 200;
    visibility: hidden;
  }

  &[draggable="true"].selected {
    background: ${({ annotation }) => annotation.color}50;

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

export default Annotation;