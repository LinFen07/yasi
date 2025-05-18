import '@/scss/App.scss';
import routes from './routes/index'
import { useRoutes } from 'react-router-dom'
import { Suspense, useEffect, useState } from'react'

import { Spin } from 'antd';
import stores from './stores';

function App() {
  const routeView = useRoutes(routes)
  const [audioSrc, setAudioSrc] = useState('')
  // useEffect(() => {
  //   setAudioSrc(stores.ExamStore.listenAudio);
  //   console.log(document.querySelector("audio")?.src)
  // },[stores.ExamStore.listenAudio])

  return (
    <div className="App">
      <audio></audio>
      <Suspense fallback={<Spin/>}>
        {routeView}
      </Suspense>
    </div>
  );
}

export default App;
