import { Card, Form, Input, Button, message } from "antd";
import "../Login/retrieve.scss";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

const Retrieve = () => {
  const navigate = useNavigate();

  const Back = (e) => {
    e.preventDefault();
    navigate('/login');
  }

  const onFinish = async (values) => {
    message.success('密码修改成功');
    navigate('/login')
    // try {
    // 1. 验证账号和邮箱
    // const validation = await axios.post('/api/validate-account', {
    //     username: values.username,
    //     email: values.email
    // });

    // if (!validation.data.isValid) {
    //     message.error('账号不存在或邮箱不匹配');
    //     return;
    // }

    // 2. 更新密码
    // const update = await axios.post('/api/update-password', {
    //     username: values.username,
    //     newPassword: values.newPassword
    // });

    //     if (update.data.success) {
    //         message.success('密码修改成功');
    //         navigate('/login');
    //     } else {
    //         message.error('密码修改失败');
    //     }
    // } catch (error) {
    //     if (error.response) {
    //         // 请求成功但服务器返回错误状态码
    //         message.error(error.response.data.message || '操作失败');
    //     } else {
    //         // 网络错误
    //         message.error('网络异常，请检查连接');
    //     }
    // }
  };

  const validatePassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('newPassword') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('两次输入的密码不一致!'));
    },
  });

  return (
    <Card className="contain" title="忘记密码">
      <Form onFinish={onFinish} validateTrigger="onBlur">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: 8 }} />
          <span>账号</span>
        </div>
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入您的账号!' },
          ]}
        >
          <Input placeholder="请输入账号" />
        </Form.Item>


        <div style={{ display: 'flex', alignItems: 'center' }}>
          <MailOutlined style={{ marginRight: 8 }} />
          <span>邮箱</span>
        </div>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入您的邮箱!' },
            { type: 'email', message: '请输入有效的邮箱地址!' }
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LockOutlined style={{ marginRight: 8 }} />
          <span>新密码</span>
        </div>
        <Form.Item
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码!' },
            { min: 8, message: '密码长度至少8个字符!' },
            { max: 20, message: '密码长度不能超过20个字符!' },
            {
              pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/,
              message: '密码必须包含字母和数字!'
            }
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SafetyOutlined style={{ marginRight: 8 }} />
          <span>确认新密码</span>
        </div>
        <Form.Item
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码!' },
            validatePassword
          ]}
        >
          <Input.Password placeholder="请确认新密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            修改
          </Button>
        </Form.Item>
      </Form>
      <div className="go_back">已找回密码? <a href="#" onClick={e => Back(e)}>返回</a></div>
    </Card>
  )
}

export default Retrieve;
