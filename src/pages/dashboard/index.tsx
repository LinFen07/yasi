
import './index.scss';
import { Button, Card } from 'antd';

import { useNavigate } from "react-router";
import { select, getAdminExam } from "@/api/examPaper";

import stores from '@/stores';
import { useEffect } from 'react';

const { Meta } = Card;

const Dashboard = () => {
  const navigate = useNavigate()
  const examList = [
    {
      id: 2,
      title: '2024雅思模拟真题',
    },
    {
      id: 3,
      title: '2024雅思模拟真题',
    },
    {
      id: 14,
      title: '2024雅思模拟真题',
    },
  ];
  const getExamList = async() => {
    const res = await getAdminExam();
    console.log(res);
  }
  useEffect(() => {
    getExamList()
  },[])

  const handleConfirmExam = async(id: number) => {
    const res = await select(id);
    console.log(res);
    //@ts-ignore
    if(res.code == 1) {
      stores.ExamStore.changePaperId(id);
      //@ts-ignore
      stores.ExamStore.addExam(res.response.titleItems);
      //添加听力录音
      //@ts-ignore
      stores.ExamStore.addListenAudio(res.response.audioFileUrl);
      navigate(`/listeningExam`,{ replace: true });
    }

    // 请求全屏
    // const requestFullscreen = () => {
    //   const element = document.documentElement; // 或者指定某个元素
    //   if (element.requestFullscreen) {
    //     element.requestFullscreen();
    //   }
    // };

    // requestFullscreen();

    // 阻止 F11 键退出全屏
    const preventFullscreenExit = (event: KeyboardEvent) => {
      if (event.key === 'F11' || event.key === 'Escape') {
        event.preventDefault();
        alert('Esc 键无法退出全屏模式。');
      }
    };

    window.addEventListener('keydown', preventFullscreenExit);

    // 监听全屏状态变化
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // 如果退出全屏，移除事件监听器
        window.removeEventListener('keydown', preventFullscreenExit);
        window.removeEventListener('fullscreenchange', handleFullscreenChange);
      }
    };

    window.addEventListener('fullscreenchange', handleFullscreenChange);
  }
  
  return (
    <div>
      <div className="app-item-contain appContent">
        <h3 className="index-title-h3">试卷中心</h3>
        <div style= {{paddingLeft: '15px' , display: 'flex'}}>
          {examList.map((item) => {
            return (
              <Card
              hoverable
              style={{ width: 240 }}
              key={item.id}
            >
              <Meta title={item.title} />
              <p>考试时间：2025.04.08 9:00 ~ 12:00</p>
              <p>总题目·15</p>
              <Button type="primary" onClick={() => handleConfirmExam(item.id)}>
                前往考试
              </Button>
              <Button type="primary" disabled style={{marginLeft: '12px'}} onClick={() => handleConfirmExam(item.id)} >
                查看结果
              </Button>
            </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;