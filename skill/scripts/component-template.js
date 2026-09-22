#!/usr/bin/env node
/**
 * 组件模板生成脚本
 * 用法：node component-template.js ComponentName [needs-store]
 *
 * 示例：
 *   node component-template.js ExamCard true   // 需要连接 Store
 *   node component-template.js PureComponent    // 不需要连接 Store
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('用法：node component-template.js <组件名> [needs-store]');
  console.error('示例：node component-template.js ExamCard true');
  process.exit(1);
}

const componentName = args[0];
const needsStore = args[1] === 'true' || args[1] === '1';

// 转换组件名为 kebab-case 作为文件夹名
const kebabName = componentName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// 确定输出路径
const outputDir = path.join(__dirname, '..', '..', 'src', 'components', 'basic', kebabName);
const outputFile = path.join(outputDir, 'index.tsx');
const scssFile = path.join(outputDir, 'index.scss');

// 确保目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成组件代码
let componentCode = '';

if (needsStore) {
  componentCode = `import { observer } from 'mobx-react';
import stores from '@/stores';
import './index.scss';

function ${componentName}() {
  return (
    <div className="${kebabName}">
      {/* TODO: 实现组件 */}
    </div>
  );
}

export default observer(${componentName});
`;
} else {
  componentCode = `import './index.scss';

function ${componentName}() {
  return (
    <div className="${kebabName}">
      {/* TODO: 实现组件 */}
    </div>
  );
}

export default ${componentName};
`;
}

// 生成 SCSS 代码
const scssCode = `.${kebabName} {
  // 组件样式
}
`;

// 写入文件
fs.writeFileSync(outputFile, componentCode);
fs.writeFileSync(scssFile, scssCode);

console.log(`✅ 组件已生成：`);
console.log(`   - ${outputFile}`);
console.log(`   - ${scssFile}`);
console.log('');
console.log('下一步：');
console.log(`   1. 实现组件逻辑`);
console.log(`   2. 如需添加样式，编辑 ${kebabName}/index.scss`);
