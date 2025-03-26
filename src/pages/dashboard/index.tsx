
import './index.scss';
import { Button, Card } from 'antd';

import { useNavigate } from "react-router";
import { select } from "@/api/examPaper";

import stores from '@/stores';

const { Meta } = Card;

const Dashboard = () => {
  const navigate = useNavigate()
  const examList = [
    {
      id: 2,
      title: '2024雅思模拟真题',
    },
  ];

  const handleConfirmExam = async(id: number) => {
    const res = await select(id);
    console.log(res);
    //@ts-ignore
    if(res.code == 1) {
      //@ts-ignore
      stores.ExamStore.addExam(res.response.titleItems);
      navigate(`/listeningExam`);
    }
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
              <p>总分·150</p>
              <p>总题目·15</p>
              <Button type="primary" onClick={() => handleConfirmExam(item.id)}>
                前往考试
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