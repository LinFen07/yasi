import './index.scss';
import ScoreLie from '@/components/basic/scoreLie';
import { Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import stores from '@/stores';
import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import { getAnswerList } from '@/api/studentAnswer';
import { createQuestionNumberMapping, getQuestionModuleType } from '../../../utils/questionNumbering';

interface DataType {
  key: string;
  questionId: number;
  displayNumber: number; // 考试顺序题号
  module: string; // 听力/阅读/写作
  answer: string;
  isCorrect: number;
  studentAnswer: string;
}

// 轻量 HTML 白名单清洗，移除危险标签与属性，保留常用格式标签
function sanitizeHtml(input: string) {
  if (!input) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');

    const allowedTags = new Set([
      'b', 'strong', 'i', 'em', 'u',
      'p', 'br', 'ul', 'ol', 'li',
      'span'
    ]);
    const blockedTags = new Set([
      'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'
    ]);

    // 移除不安全标签
    blockedTags.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // 遍历所有元素，保留白名单标签，移除不安全属性
    doc.body.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        // 非白名单标签，用纯文本替换其内容
        const textNode = doc.createTextNode(el.textContent || '');
        el.replaceWith(textNode);
        return;
      }
      // 清除所有属性：事件(on*), href/src 等，仅保留安全的无属性标签
      Array.from(el.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        if (
          name.startsWith('on') || // 事件属性
          name === 'href' ||
          name === 'src' ||
          name === 'style' || // 简化：去除内联样式，避免样式注入
          name === 'class' || // 去除 class，保守处理，避免样式侧通道
          name === 'id'
        ) {
          el.removeAttribute(attr.name);
        } else {
          // 非白名单属性，一律移除
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch {
    // 解析失败时回退为纯文本
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: '题号',
    dataIndex: 'displayNumber',
    key: '题号',
    width: 80,
  },
  {
    title: '模块',
    dataIndex: 'module',
    key: '模块',
    width: 100,
    render: (module: string) => {
      const color = module === '听力' ? 'geekblue' : module === '阅读' ? 'green' : module === '写作' ? 'gold' : 'default';
      return <Tag color={color}>{module}</Tag>;
    }
  },
  {
    title: '正确答案',
    key: '正确答案',
    render: (_, record) => {
      const safeHtml = sanitizeHtml(record.answer);
      return (
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '240px',
            whiteSpace: 'nowrap',
          }}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      );
    },
  },
  {
    title: '作答情况',
    key: '作答情况',
    dataIndex: 'tags',
    render: (_, { isCorrect }) => (
      <Tag color={isCorrect === 1 ? 'green' : 'volcano'} key={isCorrect}>
        {isCorrect === 1 ? 'TRUE' : 'FALSE'}
      </Tag>
    ),
  },
  {
    title: '我的答案',
    key: '我的答案',
    render: (_, record) => (
      <Space size="middle">
        <p
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px',
            whiteSpace: 'nowrap',
          }}
        >
          {record.studentAnswer}
        </p>
      </Space>
    ),
  },
];


function AnswerRight() {
  const [data, setData] = useState<DataType[]>([]);
  const [totalData, setTotalData] = useState<DataType[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [pageSize, setPageSize] = useState(5); // 每页显示的条数
  const [total, setTotal] = useState(0); // 总题目数

  const AnsewerData = {
    paperId: stores.ExamStore.paperId,
    studentId: stores.UserStore.userId,
  };

  // 计算试卷真实题量（按 correctArray 展开小题）
  function countQuestions(exams: Array<{ questionItems: Array<{ correctArray?: string[] }> }>): number {
    if (!exams || exams.length === 0) return 0;
    return exams.reduce((sum, exam) => {
      const items = exam?.questionItems || [];
      const cnt = items.reduce((s, qi) => s + (Array.isArray(qi.correctArray) && qi.correctArray.length > 0 ? qi.correctArray.length : 1), 0);
      return sum + cnt;
    }, 0);
  }

  async function fetchAnswerList() {
    const res = await getAnswerList(1, 75, AnsewerData);
    //@ts-ignore
    setTotal(res.response.counts); // 设置总题目数
    
    // 为每个模块生成题号映射（各自从 1 开始）
    const listenMap = createQuestionNumberMapping(stores.ExamStore.listenExam);
    const readMap = createQuestionNumberMapping(stores.ExamStore.readExam);
    const writeMap = createQuestionNumberMapping(stores.ExamStore.wirrteExam);

    // 各模块真实题量（按 correctArray 展开，用于基于 questionOrder 的判定）
    const listenCount = countQuestions(stores.ExamStore.listenExam);
    const readCount = countQuestions(stores.ExamStore.readExam);
    const writeCount = countQuestions(stores.ExamStore.wirrteExam);

    // questionType 规范化
    const normalizeQuestionType = (qt: any): string => {
      // 数值型类型码映射（根据后端定义调整）
      const num = Number(qt);
      if (!Number.isNaN(num) && qt !== null && qt !== undefined) {
        const typeMap: Record<number, string> = {
          // 先覆盖已出现的类型码
          6: '听力',
          // 如有其它类型码，请补充：示例
          // 1: '听力', 2: '听力', 3: '听力',
          // 4: '阅读', 5: '阅读', 7: '阅读',
          // 8: '写作', 9: '写作', 10: '写作',
        };
        if (typeMap[num]) return typeMap[num];
      }
      // 字符串型关键词映射
      const s = String(qt || '').toLowerCase();
      if (!s) return '';
      if (s.includes('listen') || s.includes('听')) return '听力';
      if (s.includes('read') || s.includes('阅')) return '阅读';
      if (s.includes('writ') || s.includes('作')) return '写作';
      return '';
    };

    // 模块判定优先级：questionOrder 边界 -> ID 匹配 -> questionType
    const decideModule = (item: any): string => {
      const qo = Number(item.questionOrder || 0);
      if (qo > 0) {
        if (qo <= listenCount) return '听力';
        if (qo <= listenCount + readCount) return '阅读';
        if (qo <= listenCount + readCount + writeCount) return '写作';
      }

      const byId = getQuestionModuleType(
        item.questionId,
        stores.ExamStore.listenExam,
        stores.ExamStore.readExam,
        stores.ExamStore.wirrteExam
      );
      if (byId !== '未知') return byId;

      const byType = normalizeQuestionType(item.questionType);
      if (byType) return byType;

      return '未知';
    };

    const moduleOrder: Record<string, number> = { '听力': 0, '阅读': 1, '写作': 2 };

    // 映射并按模块顺序排序
    const mapped = 
      //@ts-ignore
      res.response.items.map((item: any, index: number) => {
        const module = decideModule(item);
        if (module === '未知') {
          const byId = getQuestionModuleType(
            item.questionId,
            stores.ExamStore.listenExam,
            stores.ExamStore.readExam,
            stores.ExamStore.wirrteExam
          );
          console.warn('[AnswerRight] 未知模块项', {
            itemSummary: {
              id: item.id,
              questionId: item.questionId,
              questionOrder: item.questionOrder,
              questionType: item.questionType
            },
            byId,
            listenCount,
            readCount,
            writeCount
          });
        }

        // 计算模块内题号：优先用 questionOrder 边界；否则再用各模块映射；最后兜底索引
        const qo = Number(item.questionOrder || 0);
        let displayNumber = 0;
        if (qo > 0) {
          if (module === '听力') {
            displayNumber = qo;
          } else if (module === '阅读') {
            displayNumber = Math.max(1, qo - listenCount);
          } else if (module === '写作') {
            displayNumber = Math.max(1, qo - listenCount - readCount);
          }
        } else {
          if (module === '听力') {
            displayNumber = listenMap[item.questionId] ?? (index + 1);
          } else if (module === '阅读') {
            displayNumber = readMap[item.questionId] ?? (index + 1);
          } else if (module === '写作') {
            displayNumber = writeMap[item.questionId] ?? (index + 1);
          } else {
            displayNumber = index + 1; // 未知模块兜底
          }
        }

        return {
          key: item.id,
          questionId: item.questionId,
          displayNumber,
          module,
          isCorrect: item.isCorrect,
          studentAnswer: item.studentAnswer,
          score: item.score,
          answer: stores.AnswerStore.correct[index]?.correct ?? ''
        };
      })
      .sort((a: any, b: any) => {
        const ao = moduleOrder[a.module] ?? 99;
        const bo = moduleOrder[b.module] ?? 99;
        if (ao !== bo) return ao - bo;
        // 同模块内按题号升序
        return (a.displayNumber ?? 0) - (b.displayNumber ?? 0);
      });

    setTotalData(mapped);
  }

  const changePageData = () => {
    setData(totalData.slice((currentPage - 1) * pageSize, currentPage * pageSize));
  }

  useEffect(() => {
    fetchAnswerList();
  },[])

  useEffect(() => {
    changePageData();
  }, [currentPage, pageSize, totalData]);

  return (
    <div className="anrt">
      <div className="anrtHead">
        <button className="act">我的答案</button>
        {/* <button>答案解析</button> */}
      </div>
      <div className="anrtContent">
        <ScoreLie />
        <div>
          <p
            style={{
              textAlign: 'left',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            答题情况
          </p>
          <div>
            <Table<DataType>
              size="small"
              columns={columns}
              dataSource={data}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true, // 允许用户调整每页显示条数
                onChange: (page, pageSize) => {
                  setCurrentPage(page); // 更新当前页码
                  setPageSize(pageSize); // 更新每页显示条数
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default observer(AnswerRight);