import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { Form, Input, Spin } from 'antd';
import type { CascaderProps } from 'antd/es/cascader';
import type { SelectProps } from 'antd/es/select';

/**
 * 注册第 3 步（资料填写）表单。
 *
 * 该步骤使用 `Cascader` 与 `Select`，两者合计约 90KB（未压缩）。
 * 它们只在这个步骤才会渲染，而注册属于低频路径（绝大多数考生直接登录），
 * 因此拆成独立 chunk 懒加载，避免拖慢登录首屏。
 *
 * 注意：antd 的 Form.Item 需要能拿到子组件的受控能力，
 * 所以这里用 lazy 包裹后仍然直接放在 Form.Item 内（受控组件语义不变）。
 */

const Cascader = lazy(() =>
  import('antd/es/cascader').then((m) => ({
    default: m.default as ComponentType<CascaderProps<any>>,
  })),
);
const Select = lazy(() =>
  import('antd/es/select').then((m) => ({
    default: m.default as ComponentType<SelectProps<any>>,
  })),
);
const SelectOption = lazy(() =>
  import('antd/es/select').then((m) => ({
    default: (m.default as any).Option as ComponentType<any>,
  })),
);

type Props = {
  cityOptions: any[];
  examMeal: any[];
};

export default function RegisterProfileFields({ cityOptions, examMeal }: Props) {
  return (
    <Suspense fallback={<Spin size="small" />}>
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
          {examMeal?.map((item: any, index: number) => (
            <SelectOption value={item.id} key={index}>
              {item.dictValue}: {item.description}
            </SelectOption>
          ))}
        </Select>
      </Form.Item>
    </Suspense>
  );
}
