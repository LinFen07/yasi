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

export const getHiddenPaperIds = async () => {
    const response = await request.get('/api/teacher/exam/settings/result-visibility');
    const settings = unwrapResponse(response, '获取成绩开放配置失败');
    return Array.isArray(settings.hiddenPaperIds)
        ? [...new Set(settings.hiddenPaperIds.map(Number).filter(Number.isFinite))]
        : [];
};

export const replaceHiddenPaperIds = async (hiddenPaperIds) => {
    await request.put('/api/teacher/exam/settings/result-visibility', {
        hiddenPaperIds,
    });
};

export const getRequestErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.message || error?.message || fallbackMessage;
