import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Table,
  message,
} from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { getAnswerPage } from '../../utils/scoreReport';
import { getToken, isAuthError } from '../../utils';
import './index.scss';

const { RangePicker } = DatePicker;

const PAPER_TYPE_OPTIONS = [
  { label: '固定试卷', value: 1 },
  { label: '时段试卷', value: 4 },
  { label: '任务试卷', value: 6 },
];

const STATUS_OPTIONS = [
  { label: '待批改', value: 1 },
  { label: '完成', value: 2 },
];

const ScoreReport = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const loadList = useCallback(async () => {
    if (!getToken()) {
      return;
    }
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const [startTime, endTime] = values.submitRange || [];
      const params = {
        pageIndex,
        pageSize,
        paperName: values.paperName?.trim() || undefined,
        userName: values.userName?.trim() || undefined,
        paperType: values.paperType ?? undefined,
        status: values.status ?? undefined,
        startTime: startTime ? startTime.format('YYYY-MM-DD') : undefined,
        endTime: endTime ? endTime.format('YYYY-MM-DD') : undefined,
        userScoreMin:
          values.userScoreMin !== undefined && values.userScoreMin !== null
            ? String(values.userScoreMin)
            : undefined,
        userScoreMax:
          values.userScoreMax !== undefined && values.userScoreMax !== null
            ? String(values.userScoreMax)
            : undefined,
      };
      const result = await getAnswerPage(params);
      setList(result.list);
      setTotal(result.total);
    } catch (error) {
      if (isAuthError(error)) {
        return;
      }
      message.error(error.message || '查询成绩报告失败');
    } finally {
      setLoading(false);
    }
  }, [form, pageIndex, pageSize]);

  useEffect(() => {
    loadList();
  }, [loadList, refreshFlag]);

  const handleSearch = () => {
    setPageIndex(1);
    setRefreshFlag((prev) => !prev);
  };

  const handleReset = () => {
    form.resetFields();
    setPageIndex(1);
    setRefreshFlag((prev) => !prev);
  };

  const openReport = (row) => {
    if (!row?.id) {
      message.warning('该记录缺少答卷 ID，无法查看成绩报告');
      return;
    }
    navigate(`/app/report/${row.id}`, { state: { row } });
  };

  const columns = [
    {
      title: '考生',
      key: 'student',
      width: 140,
      render: (_, row) => row.realName || row.userName || '-',
    },
    {
      title: '试卷名称',
      dataIndex: 'paperName',
      ellipsis: true,
    },
    {
      title: '提交时间',
      dataIndex: 'createTime',
      width: 170,
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_, row) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openReport(row)}
        >
          查看报告
        </Button>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="score-report-page">
        <div className="score-report-page__header">
          <div>
            <h1 className="score-report-page__title">成绩报告</h1>
            <p className="score-report-page__desc">按考生、试卷与得分筛选答卷，查看分项成绩报告</p>
          </div>
          <div className="score-report-page__stats">
            <span className="score-report-page__stat">
              共 <strong>{total}</strong> 份答卷
            </span>
          </div>
        </div>

        <div className="score-report-page__panel">
          <Form
            form={form}
            layout="inline"
            className="score-report-page__filters"
            onFinish={handleSearch}
          >
            <Form.Item name="paperName" label="试卷名称">
              <Input placeholder="模糊搜索试卷名称" allowClear style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="userName" label="考生">
              <Input placeholder="用户名 / 真实姓名" allowClear style={{ width: 170 }} />
            </Form.Item>
            <Form.Item name="paperType" label="试卷类型">
              <Select
                placeholder="全部"
                allowClear
                options={PAPER_TYPE_OPTIONS}
                style={{ width: 130 }}
              />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select
                placeholder="全部"
                allowClear
                options={STATUS_OPTIONS}
                style={{ width: 110 }}
              />
            </Form.Item>
            <Form.Item name="submitRange" label="提交时间">
              <RangePicker style={{ width: 250 }} />
            </Form.Item>
            <Form.Item name="userScoreMin" label="得分区间">
              <InputNumber placeholder="最低" min={0} style={{ width: 90 }} />
            </Form.Item>
            <Form.Item name="userScoreMax" label="">
              <InputNumber placeholder="最高" min={0} style={{ width: 90 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={handleReset}>
                重置
              </Button>
            </Form.Item>
          </Form>

          <Table
            className="score-report-page__table"
            rowKey="id"
            columns={columns}
            dataSource={list}
            scroll={{ x: 800 }}
            onRow={(row) => ({
              onClick: () => openReport(row),
              style: { cursor: 'pointer' },
            })}
            pagination={{
              current: pageIndex,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (t) => `共 ${t} 条`,
              onChange: (page, size) => {
                setPageIndex(page);
                setPageSize(size);
                setRefreshFlag((prev) => !prev);
              },
            }}
          />
        </div>
      </div>
    </Spin>
  );
};

export default ScoreReport;
