
import { Layout } from 'antd';
import './index.scss';
import HeadTip from '@/components/container/HeadTip';
import PageContent from '@/components/container/examContent';
import FooterNav from '@/components/container/FooterNav';

const {Header, Content} = Layout;

export default function ExamPage({type}: {type: string}) {

  return (
    <div className='examBox'>
      <Layout>
        <Header className='examHeader'>
          <HeadTip type={type}></HeadTip>
        </Header>
        <Content className='examContent'>
          <PageContent type={type}></PageContent>
        </Content>
        <div className='footer'>
          <FooterNav type={type}></FooterNav>
        </div>
      </Layout>
    </div>
  )
}