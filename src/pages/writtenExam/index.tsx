import React from 'react';
import { Flex, Typography, Layout, Splitter } from 'antd';
import FooterNav from '@/components/FooterNav';
import './index.scss';
import HeadTip from '@/components/HeadTip';

const Desc: React.FC<Readonly<{ text?: string | number }>> = (props) => (
  <Flex justify="center" align="center" style={{ height: '100%' }}>
    <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
      { props.text }
    </Typography.Title>
  </Flex>
);

const {Header, Content, Footer} = Layout;


export default function writtenExam() {

  return (
    <div className='examBox'>
      <Layout>
        <Header className='examHeader'>
          <HeadTip type='wirtten'></HeadTip>
        </Header>
        <Content className='examContent'>
          <Splitter >
            <Splitter.Panel defaultSize="50%" resizable={false}>
              <Desc text="First" />
            </Splitter.Panel>
            <Splitter.Panel>
              <Desc text="Second" />
            </Splitter.Panel>
          </Splitter>
        </Content>
        <Footer className='footerNav'>
          <FooterNav ></FooterNav>
        </Footer>
      </Layout>
    </div>
  )
}