import { useNavigate } from "react-router";
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message, Select, Cascader } from 'antd';
import { fetchRegister, getExamMeal } from "@/api/register";
import { fetchLogin } from '@/api/login'
import stores from "@/stores";
import './index.scss'

import { citys } from '@/utils/contants/ChinaCitys2025'
import { useEffect, useMemo, useState } from "react";

const { Option } = Select;

const REGISTER_STEPS = [
  {
    title: '账号',
    hint: '设置登录用的用户名和密码',
    fields: ['userName', 'password', 'confirmPassword'],
  },
  {
    title: '联系',
    hint: '填写姓名与联系方式，便于接收考试通知',
    fields: ['realName', 'email', 'phone'],
  },
  {
    title: '资料',
    hint: '完善身份信息并选择考试套餐',
    fields: ['identity', 'address', 'examPackage'],
  },
] as const;

type Props = {
  data: string;
};

function LoginRoute(props: Props) {
  const isRegister = props.data === 'register';
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [ExamMeal, setExamMeal] = useState<any>([]);
  const [registerStep, setRegisterStep] = useState(0);

  const cityOptions = citys.map((city: any) => {
    return {
      value: city.value, label: city.value, children: city.children.map((item: any) => {
        return { value: item.value, label: item.value }
      })
    }
  })

  const currentStep = REGISTER_STEPS[registerStep];
  const isLastRegisterStep = registerStep === REGISTER_STEPS.length - 1;

  const registerProgress = useMemo(
    () => Math.round(((registerStep + 1) / REGISTER_STEPS.length) * 100),
    [registerStep],
  );

  const fetchGetExamMeal = async (pageSize: number, pageNum: number) => {
    try {
      const res = await getExamMeal(pageSize, pageNum);
      // @ts-ignore
      setExamMeal(res.response?.items ?? []);
    } catch (error) {
      console.warn('获取套餐列表失败:', error);
    }
  }

  useEffect(() => {
    if (isRegister) {
      fetchGetExamMeal(10, 1);
    }
  }, [isRegister])

  useEffect(() => {
    if (!isRegister) return;
    const fieldNames = REGISTER_STEPS.flatMap((step) => [...step.fields]);
    form.setFields(fieldNames.map((name) => ({ name, errors: [] })));
  }, [registerStep, isRegister, form]);

  const submitRegister = async (values: Record<string, any>) => {
    const payload = { ...values };
    if (payload.address?.length) {
      payload.address = payload.address[0] + payload.address[1];
    }
    const res = await fetchRegister(payload);
    // @ts-ignore
    if (res.code == 1) {
      message.success('注册成功');
      navigate('/login');
    }
    else {
      // @ts-ignore
      message.error(res.message);
    }
  };

  const onFinish = async (values: any) => {
    if (isRegister) return;

    const va = { ...values, remember: false }
    const res = await fetchLogin(va);
    //@ts-ignore
    if (res.code == 1) {
      //@ts-ignore
      stores.UserStore.login(res.response);
      message.success('登录成功');
      navigate('/layout/dashboard');
    }
    else {
      // @ts-ignore
      message.error(res.message);
    }
  };

  const handleRegisterNext = async () => {
    try {
      await form.validateFields([...currentStep.fields]);
      setRegisterStep((step) => step + 1);
    } catch {
      // 校验未通过时保持当前步骤
    }
  };

  const handleRegisterSubmit = async () => {
    const allFields = REGISTER_STEPS.flatMap((step) => [...step.fields]);
    try {
      await form.validateFields(allFields);
      const values = form.getFieldsValue(allFields);
      await submitRegister(values);
    } catch {
      // 仅在校验失败时展示错误
    }
  };

  const handleRegisterPrev = () => {
    setRegisterStep((step) => Math.max(0, step - 1));
  };

  return (
    <div className={`login-page ${isRegister ? 'login-page--register' : 'login-page--login'}`}>
      <div className="login-page-bg" aria-hidden="true" />
      <div className="login-page-grid" aria-hidden="true" />

      <div className="login-page-shell">
        <section className="login-page-card">
          <div className="login-page-logo">
            <img
              src="http://111.230.5.159:9000/yasi/image/logo/logo-03.webp"
              alt="logo"
            />
          </div>

          <div className="login-page-card-head">
            <h2>{isRegister ? '学生注册' : '学生登录'}</h2>
            <p>
              {isRegister
                ? `第 ${registerStep + 1}/${REGISTER_STEPS.length} 步：${currentStep.hint}`
                : '登录后进入试卷中心开始考试'}
            </p>
          </div>

          {isRegister && (
            <div className="login-register-progress" aria-hidden="true">
              <div className="login-register-progress-track">
                <div
                  className="login-register-progress-fill"
                  style={{ width: `${registerProgress}%` }}
                />
              </div>
              <div className="login-register-progress-steps">
                {REGISTER_STEPS.map((step, index) => (
                  <span
                    key={step.title}
                    className={[
                      'login-register-progress-step',
                      index < registerStep ? 'is-done' : '',
                      index === registerStep ? 'is-active' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <i>{index + 1}</i>
                    <span className="login-register-progress-step-label">{step.title}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Form
            form={form}
            name="login"
            className="login-page-form"
            onFinish={onFinish}
            layout="vertical"
            preserve={isRegister}
            validateTrigger={isRegister ? 'onBlur' : 'onChange'}
          >
            {!isRegister && (
              <>
                <Form.Item
                  label="用户名"
                  name="userName"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="请输入用户名"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="密码"
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入密码"
                    size="large"
                  />
                </Form.Item>

                <div className="login-page-options">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>记住我</Checkbox>
                  </Form.Item>
                  <a className="login-page-forgot" href="#">忘记密码？</a>
                </div>
              </>
            )}

            {isRegister && (
              <div
                key={registerStep}
                className="login-register-step-panel"
              >
                {registerStep === 0 && (
                  <>
                    <Form.Item
                      label="用户名"
                      name="userName"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="请输入用户名"
                        size="large"
                      />
                    </Form.Item>
                    <Form.Item
                      label="密码"
                      name="password"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请输入密码"
                        size="large"
                      />
                    </Form.Item>
                    <Form.Item
                      label="确认密码"
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: '请再次输入密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请再次输入密码"
                        size="large"
                      />
                    </Form.Item>
                  </>
                )}

                {registerStep === 1 && (
                  <>
                    <Form.Item
                      label="真实姓名"
                      name="realName"
                      rules={[{ required: true, message: '请输入真实姓名' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="真实姓名" size="large" />
                    </Form.Item>
                    <Form.Item
                      label="邮箱"
                      name="email"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' },
                      ]}
                    >
                      <Input placeholder="用于接收考试通知" size="large" />
                    </Form.Item>
                    <Form.Item
                      label="电话"
                      name="phone"
                      rules={[{ required: true, message: '请输入电话' }]}
                    >
                      <Input placeholder="手机号码" size="large" />
                    </Form.Item>
                  </>
                )}

                {registerStep === 2 && (
                  <>
                    <Form.Item
                      label="身份证"
                      name="identity"
                      rules={[{ required: true, message: '请输入身份证号码' }]}
                    >
                      <Input placeholder="身份证号" size="large" />
                    </Form.Item>
                    <Form.Item
                      label="居住城市"
                      name="address"
                      rules={[{ required: true, message: '请选择居住城市' }]}
                    >
                      <Cascader options={cityOptions} placeholder="请选择居住城市" />
                    </Form.Item>
                    <Form.Item
                      label="套餐"
                      name="examPackage"
                      rules={[{ required: true, message: '请选择套餐' }]}
                    >
                      <Select placeholder="选择考试套餐">
                        {ExamMeal?.map((item: any, index: number) => (
                          <Option value={item.id} key={index}>
                            {item.dictValue}: {item.description}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                )}
              </div>
            )}

            {isRegister ? (
              <div className="login-register-actions">
                {registerStep > 0 && (
                  <Button size="large" onClick={handleRegisterPrev}>
                    上一步
                  </Button>
                )}
                {!isLastRegisterStep ? (
                  <Button type="primary" size="large" htmlType="button" onClick={handleRegisterNext}>
                    下一步
                  </Button>
                ) : (
                  <Button type="primary" size="large" htmlType="button" onClick={handleRegisterSubmit}>
                    完成注册
                  </Button>
                )}
              </div>
            ) : (
              <Form.Item className="login-page-submit">
                <Button block type="primary" htmlType="submit" size="large">
                  登录
                </Button>
              </Form.Item>
            )}

            <div className="login-page-switch">
              {isRegister ? (
                <span>已有账号？<a href="/login">登录</a></span>
              ) : (
                <span>还没有账号？<a href="/register">注册</a></span>
              )}
            </div>
          </Form>
        </section>
      </div>

      <footer className="login-page-footer">
        仲恺农业工程学院 北京燕兴国际教育咨询有限公司 版权所有
      </footer>
    </div>
  );
};

export default LoginRoute;
