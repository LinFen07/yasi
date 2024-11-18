
import { useNavigate } from "react-router";

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Flex, message, Select  } from 'antd';

import { fetchRegister } from "@/api/register";
import { fetchLogin } from '@/api/login'

import stores from "@/stores";

import './index.scss'
//@ts-ignore
import img from '@/assets/logo2.png'

const { Option } = Select;

type Props = {
  data: string;
};

function LoginRoute(props: Props) {

  const navigate = useNavigate();

  const onFinish = async(values: any) => {
    let res, mess, nav;
    if(props.data == 'login') {
      res = await fetchLogin(values);
      mess = '登录成功';
      nav = '/layout/dashboard';
    } else {
      res = await fetchRegister(values);
      mess = '注册成功';
      nav = '/';
    };

    //@ts-ignore
    if(res.code == 1) {
      stores.UserStore.login(values.userName);
      message.success(mess);
      navigate(nav);
    };
  };

  return (
    <div className="lowin  lowin-blue">
      <div className ="lowin-brand">
        <img src={img} alt="logo" style={{marginTop: '12px'}} />
      </div>
      <div className="lowin-wrapper">
        <div className="lowin-box lowin-login">
          <div className="lowin-box-inner">
            <Form
              name="login"
              style={{ maxWidth: 360 }}
              onFinish={onFinish}
            >
              <p style={{fontSize: '16px'}}>考试系统</p>
              <div className="lowin-group">
                <label>用户名</label>
                <Form.Item
                  name="userName"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名"
                  size="large"
                  className="lowin-input"
                  />
                </Form.Item>
              </div>
              <div className="lowin-group password-group">
                <label>密码</label>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input 
                  prefix={<LockOutlined />} 
                  type="password" 
                  placeholder="密码"
                  size="large"
                  className="lowin-input"
                  />
                </Form.Item>
              </div>
              {
                props.data == 'register'
                ? <div>
                    <label>年级</label>
                    <Form.Item
                      name="userLevel"
                      rules={[{ required: true, message: '请选择年级' }]}
                    >
                      <Select placeholder="选择年级">
                        <Option value="1">一年级</Option>
                        <Option value="2">二年级</Option>
                        <Option value="3">三年级</Option>
                        <Option value="4">四年级</Option>
                      </Select>
                    </Form.Item>
                  </div>
                : <div style={{height: '40px'}}>
                    <Form.Item wrapperCol={{ span: 25, offset: 1 }}>
                      <Flex>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                          <Checkbox></Checkbox><label className="rememberCheck">记住我</label>
                        </Form.Item>
                        <label><a href="#"><b>忘记密码？</b></a></label>
                      </Flex>
                    </Form.Item>
                  </div>
              }
              <Form.Item>
                <Button block type="primary" htmlType="submit" className="lowin-btn">
                  {props.data == 'register' ? '注册' : '登录'}
                </Button>
                <div style={{height: '5px'}}></div>
                {
                  props.data == 'register' 
                  ? <div>已有账号？ <a href="/login" className="login-link"><b>登录</b></a> </div>
                  : <div>还没有账号？ <a href="/register" className="register-link"><b>注册</b></a></div>
                }
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
      <div className="account-foot-copyright">
        <span>Copyright ©2019-2024 XXXX科技有限公司 版权所有</span>
      </div>
    </div>
  );
};

export default LoginRoute;
