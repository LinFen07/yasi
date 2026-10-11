import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    const [saving, setSaving] = useState(false);
    const [papers, setPapers] = useState([]);
    const [selectedPaperIds, setSelectedPaperIds] = useState([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loadError, setLoadError] = useState('');

    const loadPage = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const page = await getPaperPage(pageIndex - 1, pageSize);
            const normalizedPapers = page.list
                .map(normalizePaper)
                .filter((paper) => Number.isFinite(paper.paperId));
            setPapers(normalizedPapers);
            setTotal(page.total);
            setSelectedPaperIds([]);
        } catch (error) {
            setLoadError(getRequestErrorMessage(error, '加载试卷列表失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize]);

    useEffect(() => {
        loadPage();
    }, [loadPage]);

    const selectedIdSet = useMemo(() => new Set(selectedPaperIds), [selectedPaperIds]);
    const selectedPapers = useMemo(
        () => papers.filter((paper) => selectedIdSet.has(paper.paperId)),
        [papers, selectedIdSet],
    );
    const papersToOpen = useMemo(
        () => selectedPapers.filter((paper) => !paper.scoreReportOpen),
        [selectedPapers],
    );
    const papersToClose = useMemo(
        () => selectedPapers.filter((paper) => paper.scoreReportOpen),
        [selectedPapers],
    );

    const updateSelectedVisibility = async (scoreReportOpen, targetPapers) => {
        if (!targetPapers.length) {
            message.info(`所选试卷均已${scoreReportOpen ? '开放' : '关闭'}`);
            return;
        }

        setSaving(true);
        try {
            const results = await Promise.allSettled(
                targetPapers.map((paper) =>
                    setPaperScoreReportVisibility(paper.paperId, scoreReportOpen),
                ),
            );
            const successfulIds = new Set();
            const failures = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulIds.add(targetPapers[index].paperId);
                } else {
                    failures.push(result.reason);
                }
            });

            setPapers((current) => current.map((paper) => (
                successfulIds.has(paper.paperId)
                    ? { ...paper, scoreReportOpen }
                    : paper
            )));
            setSelectedPaperIds((current) => current.filter((id) => !successfulIds.has(id)));

            const action = scoreReportOpen ? '开放' : '关闭';
            if (failures.length) {
                const detail = getRequestErrorMessage(
                    failures[0],
                    `${action}成绩报告失败，请重试`,
                );
                message.error(`成功${action} ${successfulIds.size} 份，${failures.length} 份失败：${detail}`);
            } else {
                message.success(`已${action} ${successfulIds.size} 份试卷的成绩报告`);
            }
        } finally {
            setSaving(false);
        }
    };

    const confirmVisibilityChange = (scoreReportOpen, targetPapers) => {
        if (!targetPapers.length) {
            message.info(`请先选择${scoreReportOpen ? '未开放' : '已开放'}的试卷`);
            return;
        }

        const action = scoreReportOpen ? '开放' : '关闭';
        Modal.confirm({
            title: `${action}所选试卷的成绩报告？`,
            content: scoreReportOpen
                ? `将开放 ${targetPapers.length} 份试卷，学生刷新成绩报告后即可查看。`
                : `将关闭 ${targetPapers.length} 份试卷的成绩报告，学生将无法继续查看。`,
            okText: `确认${action}`,
            cancelText: '取消',
            okButtonProps: scoreReportOpen ? {} : { danger: true },
            onOk: () => updateSelectedVisibility(scoreReportOpen, targetPapers),
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
    ];

    const rowSelection = {
        selectedRowKeys: selectedPaperIds,
        onChange: (keys) => {
            setSelectedPaperIds([...new Set(keys.map(Number).filter(Number.isFinite))]);
        },
    };

    return (
        <Spin spinning={loading || saving}>
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
                    <div className="result-visibility-page__toolbar">
                        <span>勾选试卷后，可批量开放或关闭成绩报告。</span>
                        <div className="result-visibility-page__actions">
                            <Button
                                type="primary"
                                icon={<UnlockOutlined />}
                                disabled={!papersToOpen.length || loading || saving}
                                onClick={() => confirmVisibilityChange(true, papersToOpen)}
                            >
                                开放选中（{papersToOpen.length}）
                            </Button>
                            <Button
                                danger
                                icon={<LockOutlined />}
                                disabled={!papersToClose.length || loading || saving}
                                onClick={() => confirmVisibilityChange(false, papersToClose)}
                            >
                                关闭选中（{papersToClose.length}）
                            </Button>
                        </div>
                    </div>

                    {loadError ? (
                        <div className="result-visibility-page__error">
                            <p>{loadError}</p>
                            <Button onClick={loadPage}>重新加载</Button>
                        </div>
                    ) : (
                        <Table
                            rowKey="paperId"
                            rowSelection={rowSelection}
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
                                    setSelectedPaperIds([]);
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
