import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Card, Button } from 'antd';
import CustomReactQuill from '../CustomReactQuill';
import 'react-quill/dist/quill.snow.css';
import './index.scss';

const EvaluationPanel = ({
    editorContent,
    setEditorContent,
    isEditingMode,
    paperData,
}) => {
    const form = Form.useFormInstance();

    useEffect(() => {
        if (isEditingMode && paperData?.review) {
            setEditorContent(paperData.review);
            form.setFieldsValue({ comment: paperData.review });
        } else if (!isEditingMode) {
            setEditorContent('');
            form.setFieldsValue({ comment: '' });
        }
    }, [isEditingMode, paperData?.review, setEditorContent, form]);

    const handleEditorChange = (content) => {
        setEditorContent(content);
        form.setFieldsValue({ comment: content });
    };

    return (
        <div className="evaluation-panel">
            <Card
                title={isEditingMode ? '修改评价' : '撰写评价'}
                className="evaluation-panel__card"
            >
                <div className="evaluation-panel__original">
                    <strong>原评价：</strong>
                    <div
                        className="evaluation-panel__original-content"
                        dangerouslySetInnerHTML={{
                            __html: paperData?.review || '<span style="color:#999">未评价</span>'
                        }}
                    />
                </div>

                <Form.Item
                    name="comment"
                    rules={[
                        {
                            required: !isEditingMode,
                            message: '请输入评价内容'
                        }
                    ]}
                >
                    <CustomReactQuill
                        theme="snow"
                        value={editorContent || ''}
                        onChange={handleEditorChange}
                        modules={{
                            toolbar: {
                                container: [
                                    [{ header: [1, 2, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ color: [] }, { background: [] }],
                                    [{ list: 'ordered' }, { list: 'bullet' }],
                                    ['link'],
                                    ['clean']
                                ]
                            },
                            clipboard: {
                                matchVisual: false
                            }
                        }}
                        placeholder="请输入对作文的评价..."
                        className="evaluation-panel__editor"
                    />
                </Form.Item>

                <div className="evaluation-panel__actions">
                    <Button type="primary" htmlType="submit" size="large">
                        {isEditingMode ? '保存修改' : '提交评价'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

EvaluationPanel.propTypes = {
    editorContent: PropTypes.string,
    setEditorContent: PropTypes.func.isRequired,
    isEditingMode: PropTypes.bool,
    paperData: PropTypes.object,
};

EvaluationPanel.defaultProps = {
    isEditingMode: false,
    paperData: {},
};

export default EvaluationPanel;
