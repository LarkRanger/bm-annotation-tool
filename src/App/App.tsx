import { FC } from 'react';
import { observer } from 'mobx-react-lite';

import AnnotationTool from './AnnotationTool/AnnotationTool';
import styled from 'styled-components';

interface AppProps {
}

const App: FC<AppProps> = observer(() => {
  return (
    <Container>
      <AnnotationTool />
    </Container>
  );
});

const Container = styled.div`
`;

export default App;