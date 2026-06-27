import React, { useState } from "react";
import { Table, Tag, Button, Input, AutoComplete, Tooltip, Select } from "antd";
import { SearchOutlined } from '@ant-design/icons';
import "./index.scss";

export const STATUS_GRADED = '已评阅';
export const STATUS_PENDING = '未评阅';
const REVIEW_PREVIEW_LENGTH = 25;

const stripHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
};

const formatSubmitTime = (value) => {
    if (!value) return '-';
    const text = String(value).trim();
    if (!text) return '-';

    const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (matched) {
        return `${matched[1]}年${matched[2]}月${matched[3]}日 ${matched[4]}:${matched[5]}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}年${month}月${day}日 ${hour}:${minute}`;
};

const renderReviewCell = (review) => {
    const text = stripHtml(review);
    if (!text) return '-';
    if (text.length <= REVIEW_PREVIEW_LENGTH) return text;
    return (
        <Tooltip title={text}>
            <span className="task-table__review-text">{`${text.slice(0, REVIEW_PREVIEW_LENGTH)}...`}</span>
        </Tooltip>
    );
};

const TaskTable = ({
    papers,
    paperName,
    pageNow,
    pageSize,
    total,
    handleChange,
    onSearch,
    setEssayLoading,
    setCurrentPaper,
    setViewMode,
    setIsEditingMode
}) => {
    const [searchText, setSearchText] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchStatus, setSearchStatus] = useState(undefined);

    const handlePaperSearchChange = (value) => {
        const finalValue = typeof value === 'string'
            ? value
            : value?.value || value?.target?.value || '';
        setSearchText(finalValue);
    };

    const handleSearch = () => {
        onSearch?.(searchText, searchName, searchStatus);
    };

    return (
        <div className="task-table">
            <div className="task-table__toolbar">
                <div className="task-table__field-wrap">
                    <AutoComplete
                        className="task-table__field"
                        placeholder="试卷名称"
                        value={searchText}
                        onChange={handlePaperSearchChange}
                        options={
                            paperName?.length > 0
                                ? paperName.map(opt => ({ value: opt.name, label: opt.name }))
                                : []
                        }
                        filterOption={(inputValue, option) =>
                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                        defaultActiveFirstOption={false}
                    />
                </div>
                <div className="task-table__field-wrap">
                    <Input
                        className="task-table__field"
                        placeholder="考生姓名"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                    />
                </div>
                <div className="task-table__field-wrap task-table__field-wrap--status">
                    <Select
                        className="task-table__field"
                        placeholder="状态"
                        value={searchStatus}
                        onChange={setSearchStatus}
                        allowClear
                        options={[
                            { value: STATUS_GRADED, label: STATUS_GRADED },
                            { value: STATUS_PENDING, label: STATUS_PENDING },
                        ]}
                    />
                </div>
                <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    className="task-table__search-btn"
                >
                    筛选
                </Button>
            </div>

            <Table
                className="task-table__table"
                tableLayout="fixed"
                columns={[
                    {
                        title: '序号',
                        key: 'index',
                        width: 64,
                        align: 'center',
                        render: (_, __, index) => (pageNow - 1) * (pageSize || 10) + index + 1,
                    },
                    {
                        title: '考生',
                        key: 'student',
                        width: 100,
                        ellipsis: true,
                        render: (_, record) => record.studentName,
                    },
                    {
                        title: '试卷名称',
                        dataIndex: 'paperName',
                        key: 'paperName',
                        width: 130,
                        ellipsis: true,
                    },
                    {
                        title: '提交时间',
                        dataIndex: 'createTime',
                        key: 'createTime',
                        width: 168,
                        align: 'center',
                        render: (createTime) => (
                            <span className="task-table__submit-time">{formatSubmitTime(createTime)}</span>
                        )
                    },
                    {
                        title: '状态',
                        dataIndex: 'status',
                        key: 'status',
                        width: 96,
                        align: 'center',
                        render: status => (
                            <Tag
                                className={`task-table__tag ${status === '已阅' ? 'task-table__tag--done' : 'task-table__tag--pending'}`}
                            >
                                {status === '已阅' ? '已评阅' : '待评阅'}
                            </Tag>
                        )
                    },
                    {
                        title: '评分',
                        dataIndex: 'score',
                        key: 'score',
                        width: 72,
                        align: 'center',
                        render: (score, record) => (
                            <span className={record.status === '已阅' ? 'task-table__score' : 'task-table__score--empty'}>
                                {record.status === '已阅' && score !== null && score !== undefined ? score : '-'}
                            </span>
                        )
                    },
                    {
                        title: '评价',
                        dataIndex: 'review',
                        key: 'review',
                        width: 300,
                        align: 'center',
                        ellipsis: true,
                        render: (review) => renderReviewCell(review)
                    },
                    {
                        title: '操作',
                        key: 'action',
                        width: 88,
                        align: 'center',
                        render: (_, record) => (
                            <Button
                                type="link"
                                className="task-table__action"
                                onClick={() => {
                                    setEssayLoading(true);
                                    try {
                                        setCurrentPaper(record);
                                        setViewMode('grade');
                                        setIsEditingMode(record.status === '已阅');
                                    } finally {
                                        setEssayLoading(false);
                                    }
                                }}
                            >
                                {record.status === '已阅' ? '修改' : '评阅'}
                            </Button>
                        ),
                    },
                ]}
                pagination={{
                    current: pageNow,
                    pageSize: pageSize || 10,
                    total: total || 0,
                    showTotal: (count) => `共 ${count} 条`,
                    showSizeChanger: false,
                    onChange: (page) => {
                        handleChange(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    },
                }}
                dataSource={papers.map(item => ({
                    ...item,
                    key: `${item.paperId}-${item.studentId}-${item.id}`
                }))}
            />
        </div>
    );
};

export default TaskTable;
