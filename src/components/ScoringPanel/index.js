import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Form, Card, Button } from 'antd';
import ScoreInput from '../ScoreInput';
import { useDispatch } from 'react-redux';
import { getOriginalTitel } from '../../store/tasks';
import { isAuthError } from '../../utils';
import './index.scss';

const stripHtmlTags = (html) => {
    if (!html) return '无标题';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

const toCompositionHtml = (content) => {
    if (!content || content === '暂无') {
        return '<span class="scoring-panel__empty">暂无作答</span>';
    }
    const trimmed = String(content).trim();
    if (!trimmed) {
        return '<span class="scoring-panel__empty">暂无作答</span>';
    }
    if (/<[^>]+>/.test(trimmed)) {
        return trimmed;
    }
    return trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
};

const ScoringPanel = ({
    paperData,
}) => {
    const [count, setCount] = useState(1);
    const [essayTitle, setEssayTitle] = useState('');
    const dispatch = useDispatch();

    const compositionCount = Array.isArray(paperData?.composition)
        ? paperData.composition.length
        : 0;

    const currentEssay = paperData?.composition?.[count - 1] || {};
    const studentAnswer = currentEssay.studentAnswer || '';

    const rawScore = paperData?.score;
    const scoreValue = !isNaN(Number(rawScore)) && rawScore !== null ? Number(rawScore) : 0;
    const scoreDisplayText = !isNaN(Number(rawScore)) && rawScore !== null ? Number(rawScore) : '未评分';

    const fetchTitle = useCallback(async () => {
        if (!currentEssay?.questionId) {
            setEssayTitle('无标题');
            return;
        }
        try {
            const titleRes = await dispatch(getOriginalTitel(currentEssay.questionId));
            setEssayTitle(titleRes?.title || titleRes?.content || '无标题');
        } catch (error) {
            if (isAuthError(error)) {
                return;
            }
            console.error('获取作文标题失败:', error);
            setEssayTitle('无标题');
        }
    }, [dispatch, currentEssay.questionId]);

    useEffect(() => {
        fetchTitle();
    }, [fetchTitle, count]);

    const handleSwitchEssay = (newCount) => {
        if (newCount < 1 || newCount > compositionCount) return;
        setCount(newCount);
    };

    return (
        <div className="scoring-panel">
            <Card className="scoring-panel__essay" title="写作题">
                {compositionCount === 0 ? (
                    <div className="scoring-panel__empty-block">考生未答题</div>
                ) : (
                    <>
                        <div className="scoring-panel__section">
                            <h3 className="scoring-panel__label">作文标题</h3>
                            <div className="scoring-panel__title-box">
                                {stripHtmlTags(essayTitle)}
                            </div>
                        </div>
                        <div className="scoring-panel__section">
                            <h3 className="scoring-panel__label">作文内容</h3>
                            <div
                                className="scoring-panel__content"
                                dangerouslySetInnerHTML={{
                                    __html: toCompositionHtml(studentAnswer)
                                }}
                            />
                        </div>
                        {compositionCount > 1 && (
                            <div className="scoring-panel__switch">
                                <Button
                                    onClick={() => handleSwitchEssay(count - 1)}
                                    disabled={count <= 1}
                                >
                                    上一篇
                                </Button>
                                <span>{count} / {compositionCount}</span>
                                <Button
                                    onClick={() => handleSwitchEssay(count + 1)}
                                    disabled={count >= compositionCount}
                                >
                                    下一篇
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Card>

            <Card className="scoring-panel__score" title="考生信息与评分">
                <div className="scoring-panel__meta">
                    <div><strong>姓名：</strong>{paperData?.studentName || '未知'}</div>
                    <div>
                        <strong>原评分：</strong>
                        <ScoreInput
                            value={scoreValue}
                            placeholder={scoreDisplayText}
                            disabled
                            className="scoring-panel__old-score"
                        />
                    </div>
                </div>
                <Form.Item
                    name="score1"
                    label="评分"
                    hidden={count !== 1}
                    rules={count === 1 ? [
                        { required: true, message: '请输入评分' },
                        { type: 'number', min: 0, max: 100, message: '评分必须为0-100的数字' }
                    ] : []}
                >
                    <ScoreInput style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    name="score2"
                    label="评分"
                    hidden={count !== 2}
                    rules={count === 2 ? [
                        { required: true, message: '请输入评分' },
                        { type: 'number', min: 0, max: 100, message: '评分必须为0-100的数字' }
                    ] : []}
                >
                    <ScoreInput style={{ width: '100%' }} />
                </Form.Item>
            </Card>
        </div>
    );
};

ScoringPanel.propTypes = {
    paperData: PropTypes.object
};

ScoringPanel.defaultProps = {
    paperData: {}
};

export default ScoringPanel;
