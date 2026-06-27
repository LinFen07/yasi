import { Form, Input, Button, message } from "antd"
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { fetchLogin } from "../../store/user"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import './index.scss'

const LOGO_URL = 'http://111.230.5.159:9000/yasi/image/logo/logo-07-3.png'

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

    return (
        <div className="login-page">
            <div className="login-page__scene" aria-hidden="true">
                <div className="login-page__glow login-page__glow--1" />
                <div className="login-page__glow login-page__glow--2" />
                <div className="login-page__glow login-page__glow--3" />
                <svg className="login-page__wave login-page__wave--back" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                </svg>
                <svg className="login-page__wave login-page__wave--front" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path d="M0,256L48,240C96,224,192,192,288,186.7C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                </svg>
            </div>

            <div className="login-card">
                <div className="login-card__header">
                    <img className="login-card__logo" src={LOGO_URL} alt="logo" />
                    <div className="login-card__titles">
                        <h1 className="login-card__system">教师阅卷系统</h1>
                        <p className="login-card__hint">教师登录</p>
                    </div>
                </div>

                <Form
                    className="login-card__form"
                    validateTrigger="onBlur"
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                >
                    <Form.Item
                        name="userName"
                        label="用户名"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input
                            className="login-card__input"
                            placeholder="请输入用户名"
                            prefix={<UserOutlined />}
                        />
                    </Form.Item>
                    <Form.Item
                        name="code"
                        label="密码"
                        rules={[
                            { required: true, message: '请输入密码' }
                        ]}
                    >
                        <Input.Password
                            className="login-card__input"
                            placeholder="请输入密码"
                            prefix={<LockOutlined />}
                        />
                    </Form.Item>
                    <Form.Item className="login-card__submit">
                        <Button type="primary" htmlType="submit" block>
                            登录
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}

export default Login
