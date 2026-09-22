import React, { useState } from 'react';
import { Input, message } from 'antd';
import { getChineseRestrictionProps } from '@/utils/helper/inputRestriction';

const { TextArea } = Input;

/**
 * 中文输入限制测试组件
 * 用于测试和演示中文输入限制功能
 */
const InputRestrictionTest: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');

  const handleWarning = (msg: string) => {
    message.warning(msg);
  };

  const restrictionProps = getChineseRestrictionProps(handleWarning);

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>中文输入限制测试</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>普通输入框（限制中文）</h3>
        <Input
          placeholder="请尝试输入中文和英文，中文将被自动过滤"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          {...restrictionProps}
          style={{ marginBottom: '10px' }}
        />
        <p>当前值: {inputValue}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>文本域（限制中文）</h3>
        <TextArea
          placeholder="请尝试输入中文和英文，中文将被自动过滤"
          value={textAreaValue}
          onChange={(e) => setTextAreaValue(e.target.value)}
          {...restrictionProps}
          rows={4}
          style={{ marginBottom: '10px' }}
        />
        <p>当前值: {textAreaValue}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>测试说明</h3>
        <ul>
          <li>尝试输入中文字符，它们会被自动过滤掉</li>
          <li>英文字母、数字、标点符号等可以正常输入</li>
          <li>输入中文时会显示警告消息</li>
          <li>支持复制粘贴，粘贴的中文内容也会被过滤</li>
        </ul>
      </div>

      <div>
        <h3>测试用例</h3>
        <p>可以尝试输入以下内容进行测试：</p>
        <ul>
          <li>Hello World 123</li>
          <li>你好世界 Hello</li>
          <li>Test测试123</li>
          <li>English中文Mixed混合</li>
        </ul>
      </div>
    </div>
  );
};

export default InputRestrictionTest;