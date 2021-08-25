import React, { FC } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react';

import OriginItem from '../../../stores/AnnotationStore/OriginItem';
import { useStores } from '../../../hooks/useStores';

interface OriginalProps {
  origin: OriginItem;
}

const Origin: FC<OriginalProps> = observer(({ origin }) => {
  const { annotationStore } = useStores();

  return (
    annotationStore.isOriginShown ?
      <Container annotation={origin} scale={annotationStore.scale}>
        {annotationStore.areLabelsShown && <span>{origin.label} ({origin.confidenceFormatted})</span>}
      </Container> :
      <div/>
  );
});

const Container = styled.div<{ annotation: OriginItem, scale: number }>`
  position: absolute;
  z-index: 50;
  top: ${({ annotation }) => annotation.y}px;
  left: ${({ annotation }) => annotation.x}px;
  width: ${({ annotation }) => annotation.width}px;
  height: ${({ annotation }) => annotation.height}px;
  background: ${({ annotation }) => annotation.color}30;
  border: 1px solid ${({ annotation }) => annotation.color};

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

export default Origin;