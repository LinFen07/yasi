import '@/scss/App.scss';
import routes from './routes/index'
import { useLocation, useRoutes } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { Spin } from 'antd';
import stores from './stores';
import { observer } from 'mobx-react';
import { handleSessionExpired } from '@/utils/auth';

const TOKEN_CHECK_INTERVAL = 30 * 1000;

function App() {
  const routeView = useRoutes(routes)
  const [audioSrc, setAudioSrc] = useState('');
  const location = useLocation();

  useEffect(() => {
    const checkToken = () => {
      if (stores.UserStore.token && stores.UserStore.isTokenExpired()) {
        handleSessionExpired();
      }
    };

    checkToken();
    const timer = window.setInterval(checkToken, TOKEN_CHECK_INTERVAL);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkToken();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', checkToken);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', checkToken);
    };
  }, []);

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
