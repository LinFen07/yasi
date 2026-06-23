import '@/scss/App.scss';
import routes from './routes/index'
import { useLocation, useRoutes } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { Spin } from 'antd';
import stores from './stores';
import { observer } from 'mobx-react';

function App() {
  const routeView = useRoutes(routes)
  const [audioSrc, setAudioSrc] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (stores.ExamStore.paperId === 0) return;
    if (location.pathname.startsWith('/listeningExam')) {
      setAudioSrc(stores.ExamStore.getListenAudioSrc());
    } else {
      setAudioSrc('');
    }
  }, [stores.ExamStore.paperId, location.pathname]);

  useEffect(() => {
    const audioRef = document.getElementById('exam-listen-audio') as HTMLAudioElement | null;
    if (!audioRef) return;
    if (!location.pathname.startsWith('/listeningExam')) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
  }, [location.pathname]);

  useEffect(() => {
    const audioRef = document.getElementById('exam-listen-audio') as HTMLAudioElement | null;
    if (audioRef)
      audioRef.volume = stores.ExamStore.audioVolume / 100;
  }, [stores.ExamStore.audioVolume])

  return (
    <div className="App">
      <audio id="exam-listen-audio" src={audioSrc || undefined} preload="auto" />
      <Suspense fallback={<Spin />}>
        {routeView}
      </Suspense>
    </div>
  );
}

export default observer(App);
