import React, { FC } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react';
import { Button, Radio } from 'antd';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { useStores } from '../../hooks/useStores';
import ListItem from './Components/ListItem';
import Annotation from './Components/Annotation';
import Origin from './Components/Origin';

interface AnnotationToolProps {
}

const AnnotationTool: FC<AnnotationToolProps> = observer(() => {
  const { annotationStore } = useStores();

  const onZoomHandler = (r: ReactZoomPanPinchRef) => {
    console.log(r.state);
    annotationStore.scale = 1 / r.state.scale;
  };

  const onPanStop = (r: ReactZoomPanPinchRef) => {
    console.log(r.state);
    annotationStore.position = [r.state.positionX, r.state.positionY];
  };

  return (
    <Container>
      <TransformWrapper
        disabled={annotationStore.isPanDisabled}
        onZoomStop={onZoomHandler}
        onPanningStop={onPanStop}
        wheel={{ step: 0.05 }}
        alignmentAnimation={{ disabled: true }}
      >
        <TransformComponent wrapperClass="annotation-wrapper">
          <div id="image-wrapper" onContextMenu={(e) => e.preventDefault()}>
            <img
              src="https://images.pexels.com/photos/1458377/pexels-photo-1458377.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260"
              alt="input"
              style={{ verticalAlign: "middle" }}
            />
            {annotationStore.origins.map(origin => (
              <Origin key={origin.id} origin={origin}/>
            ))}
            {annotationStore.annotations.map(annotation => (
              <Annotation
                key={annotation.id}
                annotation={annotation}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <div className="annotation-list">
        {annotationStore.annotations.map(annotation => (
          <ListItem
            key={annotation.id}
            annotation={annotation}
          />
        ))}

        <div className="tool-buttons">
          <Radio.Group value={annotationStore.tool}>
            <Radio.Button value="pan" onClick={() => annotationStore.tool = 'pan'}>Pan / Zoom</Radio.Button>
            <Radio.Button value="drag" onClick={() => annotationStore.tool = 'drag'}>Drag / Resize</Radio.Button>
            <Radio.Button value="annotate" onClick={() => annotationStore.tool = 'annotate'}>Annotate</Radio.Button>
          </Radio.Group>
        </div>
        <div className="tool-buttons">
          <Button onClick={annotationStore.isOriginShown ? annotationStore.hideOrigin : annotationStore.showOrigin}>
            {annotationStore.isOriginShown ? 'Hide Predictions' : 'Show Predictions'}
          </Button>
          <Button onClick={annotationStore.areLabelsShown ? annotationStore.hideLabels : annotationStore.showLabels}>
            {annotationStore.areLabelsShown ? 'Hide Labels' : 'Show Labels'}
          </Button>
        </div>
      </div>
    </Container>
  );
});

const Container = styled.div`
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

export default AnnotationTool;