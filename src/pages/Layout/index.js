import { Layout, Menu, Button } from 'antd';
import {
    EditOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import './index.scss';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearUserInfo } from '../../store/user';
const { Header, Sider, Content } = Layout;

// 保存当前路由到localStorage
const saveCurrentRoute = (path) => {
    localStorage.setItem('lastRoute', path);
};

const items = [
    // {
    //     label: '首页',
    //     key: '/app/home',
    //     icon: <HomeOutlined />,
    // },
    {
        label: '试卷评阅',
        key: '/app/evaluation',
        icon: <EditOutlined />,
    },
];

const GeekLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [collapsed, setCollapsed] = useState(false);
    const userInfo = useSelector((state) => state.user.userInfo);
    const displayName = userInfo?.userName || userInfo?.realName || '用户';

    // 初始化时检查保存的路由
    useEffect(() => {
        const lastRoute = localStorage.getItem('lastRoute');
        if (lastRoute && lastRoute !== location.pathname) {
            navigate(lastRoute);
        }
    }, []);

    // 路由变化时保存当前路由
    useEffect(() => {
        saveCurrentRoute(location.pathname);
    }, [location.pathname]);

    // const name = useSelector((state) => state.user.userInfo.name);

    const handleLogout = () => {
        dispatch(clearUserInfo());
        navigate('/login');
    };

    const onMenuClick = (route) => {
        const path = route.key;
        navigate(path);
    };
    // const fetchPage = async () => {
    //     const res = await axios.get('http://120.24.144.113:8668/api/teacher/examassignment/page')
    //     // console.log(res.data.response.items)
    // }
    // fetchPage()



    return (
        <Layout className="layout-container">
            <Sider
                width={210}
                collapsedWidth={80}
                className="sidebar"
                theme="dark"
                collapsible
                collapsed={collapsed}
                trigger={null}
                breakpoint="lg"
                onBreakpoint={(broken) => {
                    if (broken) setCollapsed(true);
                    else setCollapsed(false);
                }}
            >
                <div className="logo">
                    <img src="http://111.230.5.159:9000/yasi/image/logo/logo-07-3.png" alt="logo" style={{ height: '50px', paddingLeft: '0' }} />
                    {!collapsed && (
                        <div style={{ color: '#fff', fontSize: '14px', marginTop: '8px' }}>教师阅卷系统</div>
                    )}
                </div>

                <Menu
                    mode="inline"
                    theme="dark"
                    inlineCollapsed={collapsed}
                    selectedKeys={[location.pathname]}
                    items={items}
                    onClick={onMenuClick}
                />
            </Sider>
            <Layout>
                <Header className="header">
                    <div className="header-left">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                    </div>
                    <div className="header-right">
                        <div className="header-user">
                            <div className="header-user__profile">
                                <span className="header-user__avatar">
                                    {displayName.charAt(0)}
                                </span>
                                <span className="header-user__name">{displayName}</span>
                            </div>
                            <span className="header-user__divider" />
                            <button type="button" className="header-user__logout" onClick={handleLogout}>
                                <LogoutOutlined />
                                <span>退出</span>
                            </button>
                        </div>
                    </div>
                </Header>
                <Content className="content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default GeekLayout;
