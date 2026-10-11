import { request } from './request';

const unwrapResponse = (response, fallbackMessage) => {
    const body = response?.data;
    if (body?.response === undefined || body?.response === null) {
        throw new Error(body?.message || fallbackMessage);
    }
    return body.response;
};

export const getPaperPage = async (pageIndex, pageSize) => {
    const response = await request.post('/api/teacher/exam/paper/pageList', {
        pageIndex,
        pageSize,
    });
    const page = unwrapResponse(response, '获取试卷列表失败');

    return {
        list: Array.isArray(page.list) ? page.list : [],
        total: Number(page.total) || 0,
    };
};

export const setPaperScoreReportVisibility = async (paperId, scoreReportOpen) => {
    const id = Number(paperId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('试卷 ID 无效');
    }
    if (typeof scoreReportOpen !== 'boolean') {
        throw new Error('成绩报告开放状态无效');
    }

    const response = await request.put(
        `/api/teacher/exam/paper/${id}/score-report-visibility`,
        { scoreReportOpen },
    );
    const result = unwrapResponse(response, '更新成绩报告开放状态失败');
    if (result.scoreReportOpen !== scoreReportOpen) {
        throw new Error('后端返回的成绩报告状态与请求不一致');
    }
    return result.scoreReportOpen;
};

export const getRequestErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.message || error?.message || fallbackMessage;
