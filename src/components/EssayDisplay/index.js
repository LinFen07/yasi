import React from 'react';
import { Card } from 'antd';

const EssayDisplay = ({ paperData = {} }) => {
  return (
    <div style={{ flex: 1 }}>
      <Card
        title="试卷批阅"
        style={{ boxShadow: 'none' }}
      >
        <div style={{ padding: 16 }}>
          <h3>考生姓名：{paperData?.studentName || '未知'}</h3>
        </div>
      </Card>

      {/* 显示作文内容 */}
      <div style={{ marginTop: '16px', border: '1px solid #f0f0f0', padding: '16px' }}>
        {paperData?.paperImage && (
          <img
            src={paperData.paperImage}
            alt="学生作文"
            style={{ maxWidth: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default EssayDisplay;
