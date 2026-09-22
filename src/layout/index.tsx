import * as React from "react";
import { Outlet } from 'react-router-dom';
import type { MenuProps} from 'antd';
import { Layout, Dropdown, Avatar } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { fetchLogout } from "@/api/login";
import { observer } from "mobx-react";
import store from '@/stores/user'
import './index.scss'

const { Header, Content, Footer } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const dropdownItems: MenuItem[] = [
  {
    label: '退出登录',
    key: 'logout',
    onClick: () => {
      fetchLogout();
      store.logout()
      window.location.href = '/login';
    },
  }
]

const Index: React.FC = observer(() => {
  const displayName = store.name || store.userName || '考生';
  const avatarText = displayName.trim().charAt(0).toUpperCase();

  return (
    <Layout>
      <Header className='headNav' >
        <div className="headNav-logo">
          <img src='http://111.230.5.159:9000/yasi/image/logo/logo-04.webp' className='navImg' alt="logo" />
        </div>

        <div className="headNav-right">
          <div className="headNav-page-title">
            <FileTextOutlined />
            <span>试卷中心</span>
          </div>

          <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="bottomRight">
            <button type="button" className="headNav-user" onClick={(e) => e.preventDefault()}>
              <Avatar size={38} className="headNav-avatar">
                {avatarText}
              </Avatar>
              <span className="headNav-user-name">{displayName}</span>
            </button>
          </Dropdown>
        </div>
      </Header>
      <Content>
        <Outlet/>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        <div className="foot-copyright">
          <span>仲恺农业工程学院 北京燕兴国际教育咨询有限公司 版权所有</span>
        </div>
      </Footer>
    </Layout>
  );
})

export default Index;
