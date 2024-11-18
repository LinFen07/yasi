
import { Layout } from 'antd';
import FooterNav from '@/components/FooterNav';
import './index.scss';
import HeadTip from '@/components/HeadTip';
import PageContent from '@/components/examContent';

import store from '@/stores';

const {Header, Content} = Layout;

export default function listeningExam() {
  // const exam = examStore.getExam();
  // //@ts-ignore
  // console.log(exam[0].analyze);

  return (
    <div className='examBox'>
      <Layout>
        <Header className='examHeader'>
          <HeadTip type='listen'></HeadTip>
        </Header>
        <Content className='examContent'>
          <PageContent></PageContent>
        </Content>
        <div className='footer'>
          <FooterNav></FooterNav>
        </div>
      </Layout>
    </div>
  )
}