import React, { useCallback, useEffect, useState } from 'react';
import { Button, Empty, message, Modal, Spin, Table, Tag } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import {
    getPaperPage,
    getRequestErrorMessage,
    setPaperScoreReportVisibility,
} from '../../utils/resultVisibility';
import './index.scss';

const PAPER_TYPE_LABELS = {
    1: '固定试卷',
    4: '时段试卷',
    6: '任务试卷',
};

const getPaperId = (paper) => Number(paper.id ?? paper.paperId);

const normalizePaper = (paper) => {
    const id = getPaperId(paper);
    return {
        ...paper,
        paperId: id,
        paperName: paper.name || paper.paperName || paper.paperTitle || paper.title || '未命名试卷',
        normalizedPaperType: paper.paperType ?? paper.type,
        scoreReportOpen: paper.scoreReportOpen === true,
    };
};

const ResultVisibility = () => {
    const [loading, setLoading] = useState(true);
    const [savingPaperId, setSavingPaperId] = useState(null);
    const [papers, setPapers] = useState([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loadError, setLoadError] = useState('');

    const loadPage = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const page = await getPaperPage(pageIndex, pageSize);
            const normalizedPapers = page.list
                .map(normalizePaper)
                .filter((paper) => Number.isFinite(paper.paperId));
            setPapers(normalizedPapers);
            setTotal(page.total);
        } catch (error) {
            setLoadError(getRequestErrorMessage(error, '加载试卷列表失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize]);

    useEffect(() => {
        loadPage();
    }, [loadPage]);

    const updatePaperVisibility = async (paper) => {
        const scoreReportOpen = !paper.scoreReportOpen;
        const action = scoreReportOpen ? '开放' : '关闭';
        setSavingPaperId(paper.paperId);
        try {
            const serverScoreReportOpen = await setPaperScoreReportVisibility(
                paper.paperId,
                scoreReportOpen,
            );
            setPapers((current) => current.map((currentPaper) => (
                currentPaper.paperId === paper.paperId
                    ? { ...currentPaper, scoreReportOpen: serverScoreReportOpen }
                    : currentPaper
            )));
            message.success(`已${action}「${paper.paperName}」的成绩报告`);
        } catch (error) {
            message.error(getRequestErrorMessage(error, `${action}成绩报告失败，请重试`));
        } finally {
            setSavingPaperId(null);
        }
    };

    const confirmVisibilityChange = (paper) => {
        const scoreReportOpen = !paper.scoreReportOpen;
        const action = scoreReportOpen ? '开放' : '关闭';
        Modal.confirm({
            title: `${action}「${paper.paperName}」的成绩报告？`,
            content: scoreReportOpen
                ? '开放后，学生刷新成绩报告即可查看。'
                : '关闭后，学生将无法继续查看这份试卷的成绩报告。',
            okText: `确认${action}`,
            cancelText: '取消',
            okButtonProps: scoreReportOpen ? {} : { danger: true },
            onOk: () => updatePaperVisibility(paper),
        });
    };

    const columns = [
        {
            title: '试卷名称',
            dataIndex: 'paperName',
            key: 'paperName',
            ellipsis: true,
        },
        {
            title: '试卷类型',
            dataIndex: 'normalizedPaperType',
            key: 'paperType',
            width: 140,
            render: (type) => PAPER_TYPE_LABELS[type] || (type ? `类型 ${type}` : '—'),
        },
        {
            title: '成绩报告',
            key: 'visibility',
            width: 140,
            render: (_, paper) => (
                paper.scoreReportOpen
                    ? <Tag color="green">已开放</Tag>
                    : <Tag color="orange">未开放</Tag>
            ),
        },
        {
            title: '操作',
            key: 'operation',
            width: 150,
            render: (_, paper) => (
                <Button
                    type={paper.scoreReportOpen ? 'default' : 'primary'}
                    danger={paper.scoreReportOpen}
                    icon={paper.scoreReportOpen ? <LockOutlined /> : <UnlockOutlined />}
                    loading={savingPaperId === paper.paperId}
                    disabled={savingPaperId !== null && savingPaperId !== paper.paperId}
                    onClick={() => confirmVisibilityChange(paper)}
                >
                    {paper.scoreReportOpen ? '关闭成绩报告' : '开放成绩报告'}
                </Button>
            ),
        },
    ];

    return (
        <Spin spinning={loading}>
            <section className="result-visibility-page">
                <header className="result-visibility-page__header">
                    <div>
                        <h1>成绩开放</h1>
                        <p>按试卷查看并切换成绩报告的开放状态。</p>
                    </div>
                    <div className="result-visibility-page__summary">
                        <span>试卷 <strong>{total}</strong></span>
                        <span>本页未开放 <strong>{papers.filter((paper) => !paper.scoreReportOpen).length}</strong></span>
                    </div>
                </header>

                <div className="result-visibility-page__panel">
                    {loadError ? (
                        <div className="result-visibility-page__error">
                            <p>{loadError}</p>
                            <Button onClick={loadPage}>重新加载</Button>
                        </div>
                    ) : (
                        <Table
                            rowKey="paperId"
                            columns={columns}
                            dataSource={papers}
                            locale={{ emptyText: <Empty description="暂无试卷" /> }}
                            pagination={{
                                current: pageIndex,
                                pageSize,
                                total,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                showTotal: (count) => `共 ${count} 份试卷`,
                                onChange: (page, size) => {
                                    setPageIndex(page);
                                    setPageSize(size);
                                },
                            }}
                        />
                    )}
                </div>
            </section>
        </Spin>
    );
};

export default ResultVisibility;
