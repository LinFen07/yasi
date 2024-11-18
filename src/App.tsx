import '@/scss/App.scss';
import routes from './routes/index'
import { useRoutes } from 'react-router-dom'
import { Suspense } from'react'

import { Spin } from 'antd';

function App() {
  const routeView = useRoutes(routes)
  return (
    <div className="App">
      <Suspense fallback={<Spin/>}>
        {routeView}
      </Suspense>
    </div>
  );
}

export default App;
