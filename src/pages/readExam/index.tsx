
import { Layout } from 'antd';
import FooterNav from '@/components/container/FooterNav';
import './index.scss';
import HeadTip from '@/components/container/HeadTip';
import PageContent from '@/components/container/examContent';

const {Header, Content, Footer} = Layout;


export default function readnExam() {
  return (
    <div className='examBox'>
      <Layout>
        <Header className='examHeader'>
          <HeadTip type='read'></HeadTip>
        </Header>
        <Content className='examContent'>
          <PageContent type='read'></PageContent>
        </Content>
        <div className='footer'>
          <FooterNav type='read'></FooterNav>
        </div>
      </Layout>
    </div>
  )
}