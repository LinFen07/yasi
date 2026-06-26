
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import './index.scss'
import Answer from '@/components/basic/answerBox';

export default function testOver() {
  const closeTest = () => {
    window.location.href = '/layout/dashboard'
  }

  return (
    <div className='testOver'>
      <header className='testOver-head'>
        <div className="testOver-head-logo">
          <img
            src='http://111.230.5.159:9000/yasi/image/logo/logo-04.webp'
            className='testOver-navImg'
            alt="logo"
          />
        </div>
        <Button className='testOver-close' icon={<ArrowLeftOutlined />} onClick={closeTest}>
          返回试卷中心
        </Button>
      </header>

      <div className="testOver-bg" aria-hidden="true" />
      <div className="testOver-grid" aria-hidden="true" />

      <main className='testOver-content'>
        <Answer />
      </main>
    </div>
  );
}
