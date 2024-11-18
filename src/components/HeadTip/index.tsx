import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router';

import { Button, Space, Avatar, Slider, Modal } from 'antd'
import { FieldTimeOutlined, SoundOutlined } from '@ant-design/icons'

import './index.scss'
import store from '@/stores'

type propType = {
    type: string;
};

function HeadTip(props: propType) {

  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [minutes, setMintnue] = useState<number>(30);
  const [timerVisible, setTimerVisible] = useState<boolean>(false);

  useEffect(() => {
    if (minutes === 0 && seconds == 0) {
      return;
    } else if (seconds < 0) {
      setSeconds(59);
      setMintnue(minutes - 1);
    }

    const intervalId = setInterval(() => {
      if(!isModalOpen) {
        setSeconds((prevCount) => prevCount - 1);
      }
    }, 1000);

    return () => clearInterval(intervalId); 
  }, [seconds, isModalOpen]);
  
  const navigate = useNavigate();

  const finish = (type: string) => {
    if(type === 'listen'){
      // navigate('/writtenExam');
    };
  };
  
  return(
    <div className='head'>
      <div className='headLeft'>
        <Space>
          <Avatar size={40} className='Avatar'/>
        <h3>{store.UserStore.name}</h3>
        </Space>
      </div>
      <div className='headMid'>
          <Space style={{cursor: 'pointer'}} onMouseEnter={() => setTimerVisible(true)} onMouseLeave={() => setTimerVisible(false)}>
          <FieldTimeOutlined style={{fontSize: '28px'}}/>
          {
            timerVisible
            ? <p>{minutes}：{seconds.toString().padStart(2, '0')}</p>
            : <p>{minutes}minutes left</p>
          }
        </Space>
      <div className='empty'></div>
        {
          props.type === 'listen' 
          ? <Space>
             <SoundOutlined style={{fontSize: '28px'}}/>  
             <Slider defaultValue={30} className='slider'/>
            </Space>
          : <></>
        }
      </div>
      <div className='headRight'>
        <Space size={24}>
          <Button size='large' onClick={() => setModalOpen(true)}>Finish Text</Button>
          <Button size='large' onClick={() => setModalOpen(true)}>Pause</Button>
        </Space>
      </div>
      <Modal title="Basic Modal" open={isModalOpen} onOk={() => finish(props.type)} onCancel={() => {setModalOpen(false)}}>
      <p>You have selected to end this section of the test, click OK to progress to the next section or Cancel to return to the test.
      This function is not available in the real computer-delivered lELTs test</p>
    </Modal>
    </div>
  );
};

export default HeadTip;