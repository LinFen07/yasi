import { useState } from "react";
import './index.scss';
import { Button, Card, Modal, QRCode, Space  } from 'antd';

import { useNavigate } from "react-router";
import { select } from "@/api/examPaper";

import stores from '@/stores';

const { Meta } = Card;

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(0);
  const [text, setText] = useState('https://ant.design/');
  const navigate = useNavigate()
  const examList = [
    {
      id: 1,
      title: '2024雅思模拟真题',
    },
    {
      id: 2,
      title: '2024雅思模拟真题',
    },
    {
      id: 3,
      title: '2024雅思模拟真题',
    },
  ];

  const handleConfirm = async(id: number) => {
    setOpen(false);
    const res = await select(id);
    console.log(res);
    //@ts-ignore
    if(res.code == 1) {
      //@ts-ignore
      stores.ExamStore.addExam(res.response.titleItems[0].questionItems);
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
              <Button type="primary" onClick={() => {
                setOpen(true);
                setId(item.id);
                }}>
                预约考试
              </Button>
              <Modal
                title="确认预约"
                cancelText="取消预约"
                okText="前往支付"
                centered
                open={open}
                onOk={() => handleConfirm(id)}
                onCancel={() => setOpen(false)}
                width={320}
              >
                <Space direction="vertical" align="center">
                  <QRCode value={text || '-'} />
                </Space>
              </Modal>
            </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;