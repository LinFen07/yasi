#!/usr/bin/env node
/**
 * Store 模板生成脚本
 * 用法：node store-template.js StoreName [persist-fields]
 *
 * 示例：
 *   node store-template.js ExamStore "paperId,currentExamIndex"  // 需要持久化
 *   node store-template.js TempStore                              // 不需要持久化
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('用法：node store-template.js <Store名> [持久化字段列表]');
  console.error('示例：node store-template.js ExamStore "paperId,currentExamIndex"');
  process.exit(1);
}

const storeName = args[0];
const persistFields = args[1] ? args[1].split(',') : [];

// Store 类名（PascalCase）
const className = storeName.endsWith('Store') ? storeName : `${storeName}Store`;
// localStorage key（camelCase）
const storageKey = className.charAt(0).toLowerCase() + className.slice(1).replace('Store', '') + 'Store';

// 生成持久化相关代码
let persistCode = '';
if (persistFields.length > 0) {
  const persistFieldsStr = persistFields.map(f => `      ${f}: this.${f}`).join(',\n');
  persistCode = `    reaction(
      () => JSON.stringify(this),
      () => this.saveToLocalStorage()
    );`;
} else {
  persistCode = '    // 无需持久化';
}

// 生成 saveToLocalStorage 方法
let saveMethod = '';
if (persistFields.length > 0) {
  saveMethod = `  saveToLocalStorage() {
    const data = {
${persistFields.map(f => `      ${f}: this.${f}`).join(',\n')}
    };
    localStorage.setItem('${storageKey}', JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem('${storageKey}');
    if (data) {
      const parsed = JSON.parse(data);
${persistFields.map(f => `      this.${f} = parsed.${f} ?? this.${f};`).join('\n')}
    }
  }`;
} else {
  saveMethod = `  // 无需持久化`;
}

// 生成 Store 代码
const storeCode = `import { makeAutoObservable, reaction } from 'mobx';

class ${className} {
  // observable 状态
  // TODO: 添加你的字段

  constructor() {
    makeAutoObservable(this);
${persistFields.length > 0 ? '    this.loadFromLocalStorage();' : ''}

${persistCode}
  }

${saveMethod}

  // actions
  // TODO: 添加你的方法
}

export default new ${className}();
`;

// 确定输出路径
const outputFile = path.join(__dirname, '..', '..', 'src', 'stores', `${className}.ts`);

// 写入文件
fs.writeFileSync(outputFile, storeCode);

console.log(`✅ Store 已生成：`);
console.log(`   - ${outputFile}`);
console.log('');
console.log('下一步：');
console.log(`   1. 在 stores/index.ts 中导入并导出`);
console.log(`   2. 实现你的业务逻辑`);
console.log(`   3. 如需修改持久化字段，编辑 ${className}.ts`);
