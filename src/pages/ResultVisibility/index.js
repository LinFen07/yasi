import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, message, Modal, Spin, Table, Tag } from 'antd';
import { UnlockOutlined } from '@ant-design/icons';
import {
    getHiddenPaperIds,
    getPaperPage,
    getRequestErrorMessage,
    replaceHiddenPaperIds,
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
    };
};

const ResultVisibility = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [papers, setPapers] = useState([]);
    const [hiddenPaperIds, setHiddenPaperIds] = useState([]);
    const [selectedPaperIds, setSelectedPaperIds] = useState([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loadError, setLoadError] = useState('');

    const loadPage = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const [page, hiddenIds] = await Promise.all([
                getPaperPage(pageIndex - 1, pageSize),
                getHiddenPaperIds(),
            ]);
            const normalizedPapers = page.list
                .map(normalizePaper)
                .filter((paper) => Number.isFinite(paper.paperId));
            setPapers(normalizedPapers);
            setTotal(page.total);
            setHiddenPaperIds(hiddenIds);
            setSelectedPaperIds((current) => current.filter((id) => hiddenIds.includes(id)));
        } catch (error) {
            setLoadError(getRequestErrorMessage(error, '加载成绩开放配置失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize]);

    useEffect(() => {
        loadPage();
    }, [loadPage]);

    const hiddenIdSet = useMemo(() => new Set(hiddenPaperIds), [hiddenPaperIds]);
    const selectedIdSet = useMemo(() => new Set(selectedPaperIds), [selectedPaperIds]);

    const openSelected = async () => {
        const idsToOpen = selectedPaperIds.filter((id) => hiddenIdSet.has(id));
        if (!idsToOpen.length) {
            message.info('请先选择未开放的试卷');
            return;
        }

        const nextHiddenIds = hiddenPaperIds.filter((id) => !selectedIdSet.has(id));
        setSaving(true);
        try {
            await replaceHiddenPaperIds(nextHiddenIds);
            const refreshedHiddenIds = await getHiddenPaperIds();
            setHiddenPaperIds(refreshedHiddenIds);
            setSelectedPaperIds([]);
            message.success(`已开放 ${idsToOpen.length} 份试卷的成绩报告`);
        } catch (error) {
            message.error(getRequestErrorMessage(error, '开放成绩报告失败，请重试'));
        } finally {
            setSaving(false);
        }
    };

    const confirmOpenSelected = () => {
        if (!selectedPaperIds.length) {
            message.info('请先选择未开放的试卷');
            return;
        }

        Modal.confirm({
            title: '开放所选试卷的成绩报告？',
            content: `将开放 ${selectedPaperIds.length} 份试卷，学生刷新成绩报告后即可查看。`,
            okText: '确认开放',
            cancelText: '取消',
            onOk: openSelected,
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
                hiddenIdSet.has(paper.paperId)
                    ? <Tag color="orange">未开放</Tag>
                    : <Tag color="green">已开放</Tag>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys: selectedPaperIds,
        preserveSelectedRowKeys: true,
        onChange: (keys) => {
            setSelectedPaperIds([...new Set(keys.map(Number).filter(Number.isFinite))]);
        },
        getCheckboxProps: (paper) => ({ disabled: !hiddenIdSet.has(paper.paperId) }),
    };

    return (
        <Spin spinning={loading || saving}>
            <section className="result-visibility-page">
                <header className="result-visibility-page__header">
                    <div>
                        <h1>成绩开放</h1>
                        <p>选择未开放的试卷，开放后学生即可查看成绩报告。</p>
                    </div>
                    <div className="result-visibility-page__summary">
                        <span>试卷 <strong>{total}</strong></span>
                        <span>未开放 <strong>{hiddenPaperIds.length}</strong></span>
                    </div>
                </header>

                <div className="result-visibility-page__panel">
                    <div className="result-visibility-page__toolbar">
                        <span>勾选未开放试卷后，可一次开放多份成绩报告。</span>
                        <Button
                            type="primary"
                            icon={<UnlockOutlined />}
                            disabled={!selectedPaperIds.length || loading || saving}
                            onClick={confirmOpenSelected}
                        >
                            开放选中（{selectedPaperIds.length}）
                        </Button>
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
