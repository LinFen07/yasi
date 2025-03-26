
import { Layout } from 'antd';
import FooterNav from '@/components/container/FooterNav';
import './index.scss';
import HeadTip from '@/components/container/HeadTip';
import store from '@/stores'
import PageContent from '@/components/container/examContent';

const {Header, Content, Footer} = Layout;


export default function writteExam() {
  const exam = store.ExamStore.getWritteExam();
  console.log(exam);
  return (
    <div className='examBox'>
      <Layout>
        <Header className='examHeader'>
          <HeadTip type='writte'></HeadTip>
        </Header>
        <Content className='examContent'>
          <PageContent type='writte'></PageContent>
        </Content>
        <div className='footer'>
          <FooterNav type='writte'></FooterNav>
        </div>
      </Layout>
    </div>
  )
}