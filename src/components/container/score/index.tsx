
import './index.scss'
import stores from '@/stores';

export default function Score() {

  return(
    <div className='contentHead'>
          <div className='lt'>
            <h3 style={{fontSize: '20px'}}>你的模考分数</h3>
            <ul style={{display: 'flex'}}>
              <li className='box'>
                <p>听力</p>
                <p>20</p>
              </li>
              <li className='box'>
                <p>阅读</p>
                <p>20</p>
              </li>
              <li className='box'>
                <p>写作</p>
                <p>20</p>
              </li>
            </ul>
            <ul>
            <button className='btn active'>考试报告</button>
            </ul>
          </div>
          <div className='rt'>
            <h3 style={{fontSize: '20px'}}>你的正确率</h3>
            <ul>
              <div className='rtBox'>
                <p>听力</p>
                <p>正确率 0%</p>
                <p>正确数量 0/40</p>
              </div>
              <div className='rtBox'>
                <p>阅读</p>
                <p>正确率 0%</p>
                <p>正确数量 0/40</p>
              </div>
            </ul>
          </div>
    </div>
  )
}