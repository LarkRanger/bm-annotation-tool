import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react';
import { Button, Dropdown, Menu } from 'antd';

import AnnotationItem from '../../../stores/AnnotationStore/AnnotationItem';
import { useStores } from '../../../hooks/useStores';

interface ListItemProps {
  annotation: AnnotationItem;
}

const ListItem: FC<ListItemProps> = observer(({ annotation }) => {
  const { annotationStore }                     = useStores();
  const [relabelIsVisible, setRelabelIsVisible] = useState<boolean>(false);

  const onRelabel = (newLabel: string) => {
    annotation.label = newLabel;
    setRelabelIsVisible(false);
  };

  const handleClick = () => {
    annotation.isDraggable && annotation.select();
  };

  return (
    annotation.exists ?
      <Container
        className={`${annotation.isSelected ? 'selected' : ''}`}
        annotation={annotation}
        onClick={handleClick}
      >
        <Dropdown
          trigger={["click"]}
          visible={relabelIsVisible}
          onVisibleChange={(flag) => setRelabelIsVisible(flag)}
          overlay={
            <Menu>
              {annotationStore.labels.map((label, index) => (
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
                  style={{ color: annotation.color }}>{annotation.label}</Button>
        </Dropdown>
        <span className="buttons">
          <Button
            onClick={annotation.isVisible ? annotation.hide : annotation.show}>{annotation.isVisible ? 'Hide' : 'Show'}</Button>
          <Button danger onClick={annotation.remove}>Remove</Button>

        </span>
      </Container> :
      <div/>
  );
});

const Container = styled.div<{ annotation: AnnotationItem }>`
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
    color: ${({ annotation }) => annotation.color};
  }

  .buttons {
    display: flex;
    gap: 1rem;
  }
`;

export default ListItem;