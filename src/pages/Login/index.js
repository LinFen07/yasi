import { Card, Form, Input, Button, message } from "antd"
import { fetchLogin } from "../../store/user"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.jpg"
import './index.scss'
const Login = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const onFinish = async (values) => {
        const result = await dispatch(fetchLogin(values))
        if (result.success) {
            navigate('/app/evaluation')
            message.success(result.message)
        } else {
            message.error(result.message || "登录失败")
        }

    }
    const logo = 'http://120.24.144.113:8002/static/img/logo.d99ccfc3.png'
    return (<>
        <div className="login">
            <div style={{ height: '1px' }}></div>
            <Card className="login-container">
                <img className="login-logo" src={logo} alt="#" ></img>
                <div style={{
                    fontSize: '30px',
                    textAlign: 'center',
                    marginBottom: '10px',
                }}>教师登录</div>
                <Form validateTrigger="onBlur" onFinish={onFinish}>
                    <Form.Item
                        name="userName"
                        rules={[
                            {
                                required: true,
                                message: '请输入用户名',
                            }
                        ]}
                    >
                        <Input size="large" placeholder="请输入用户名"></Input>
                    </Form.Item>
                    <Form.Item
                        name="code"
                        rules={[
                            {
                                required: true,
                                message: '请输入密码',
                            },
                            {
                                pattern: /^\d{6}$/,
                                message: '密码为六位'
                            }
                        ]}
                    >
                        <Input.Password size="large" placeholder="请输入密码" visibilityToggle></Input.Password>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block>登录</Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    </>
    )
}
export default Login