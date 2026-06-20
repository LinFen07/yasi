import React, { useState } from "react";
import { Table, Tag, Button, Input, Form, AutoComplete, Tooltip, Select } from "antd";
import "../../components/Table/index.scss"

export const STATUS_GRADED = '已评阅';
export const STATUS_PENDING = '未评阅';
const REVIEW_PREVIEW_LENGTH = 25;

const stripHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
};

const renderReviewCell = (review) => {
    const text = stripHtml(review);
    if (!text) return '-';
    if (text.length <= REVIEW_PREVIEW_LENGTH) return text;
    return (
        <Tooltip title={text}>
            <span style={{ cursor: 'default' }}>{`${text.slice(0, REVIEW_PREVIEW_LENGTH)}...`}</span>
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

    const handleStudentSearchChange = (e) => {
        setSearchName(e.target.value);
    };

    const handleSearch = () => {
        onSearch?.(searchText, searchName, searchStatus);
    };

    return (
        <>
            <Form>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <AutoComplete
                        style={{ width: 200 }}
                        placeholder="输入试卷名称筛选"
                        value={searchText}
                        onChange={handlePaperSearchChange}
                        options={
                            paperName && paperName.length > 0
                                ? paperName.map(opt => ({
                                    value: opt.name,
                                    label: opt.name
                                }))
                                : []
                        }
                        filterOption={(inputValue, option) =>
                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                        dropdownStyle={{
                            zIndex: 9999,
                            minWidth: 200,
                            maxHeight: 250,
                            overflow: 'auto'
                        }}
                        defaultActiveFirstOption={false}
                    />
                    <Input
                        style={{ width: 200 }}
                        placeholder="请输入考生真实姓名"
                        value={searchName}
                        onChange={handleStudentSearchChange}
                        onPressEnter={handleSearch}
                        allowClear
                    />
                    <Select
                        style={{ width: 140 }}
                        placeholder="选择状态"
                        value={searchStatus}
                        onChange={setSearchStatus}
                        allowClear
                        options={[
                            { value: STATUS_GRADED, label: STATUS_GRADED },
                            { value: STATUS_PENDING, label: STATUS_PENDING },
                        ]}
                    />
                    <Button
                        type="primary"
                        onClick={handleSearch}
                    >
                        筛选
                    </Button>
                </div>
            </Form>
            <Table
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
                        render: (_, record) => record.paperName,
                    },
                    {
                        title: '状态',
                        dataIndex: 'status',
                        key: 'status',
                        width: 96,
                        render: status => (
                            <Tag color={status === '已阅' ? 'green' : 'orange'}>
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
                            record.status === '已阅' && score !== null && score !== undefined
                                ? score
                                : '-'
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
                        width: 80,
                        align: 'center',
                        render: (_, record) => (
                            <Button
                                type="link"
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
                        setTimeout(() => {
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        }, 100);
                    },
                }}
                dataSource={papers.map(item => ({
                    ...item,
                    key: `${item.paperId}-${item.studentId}-${item.id}`
                }))}
            />
        </>
    );
};

export default TaskTable;
