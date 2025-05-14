import React, { useState } from "react";
import { Table, Tag, Button, Select } from "antd";
import "../../components/Table/index.scss"
const TaskTable = ({
    papers,
    selectedPaper,
    paperOptions,
    handleSelectChange,
    paperName,
    handleStartGrading,
    pageNow,
    handleChange,
    filterPendingPapers,
    setEssayLoading,
    setCurrentPaper,
    setViewMode,
    setIsEditingMode
}) => {
    return (
        <>
            <div style={{ display: 'flex', gap: '16px' }}>
                {selectedPaper !== null && (
                    <Select
                        style={{ width: 200 }}
                        value={selectedPaper?.value || paperName[0].name}
                        options={paperOptions}
                        onChange={handleSelectChange}
                    />
                )}
                {/* <Button
                    type="primary"
                    onClick={handleStartGrading}
                    disabled={!selectedPaper || filterPendingPapers().length === 0}
                >
                    开始批阅
                </Button> */}
            </div>
            <Table
                columns={[
                    {
                        title: '考生',
                        key: 'student',
                        render: (_, record) => record.studentName,
                    },
                    {
                        title: '试卷名称',
                        dataIndex: 'paperName',
                        key: 'paperName',
                        render: (_, record) => record.paperName,
                    },
                    {
                        title: '状态',
                        dataIndex: 'status',
                        key: 'status',
                        render: status => (
                            <Tag color={status === '已阅' ? 'green' : 'orange'}>
                                {status === '已阅' ? '已评阅' : '待评阅'}
                            </Tag>
                        )
                    },
                    {
                        title: '操作',
                        key: 'action',
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
                    current: pageNow[0],
                    pageSize: 10,
                    onChange: handleChange,
                }}
                dataSource={papers
                    .filter(p => p.paperName === selectedPaper?.value)
                    .sort((a, b) => {
                        if (a.status === '待阅' && b.status !== '待阅') return -1;
                        if (a.status !== '待阅' && b.status === '待阅') return 1;
                        return 0;
                    })}
            />
        </>
    );
};

export default TaskTable;