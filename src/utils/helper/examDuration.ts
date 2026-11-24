/**
 * 各模块考试时长（分钟）—— 全站唯一来源
 *
 * 说明页展示、考试倒计时、超时判定都必须用这里的值，
 * 否则会出现「说明页写 30 分钟、倒计时却按 32 分钟走」
 * 或「阅读才 1 分钟就被判超时」这类不一致。
 */
export const EXAM_DURATION_MINUTES = {
  listen: 32,
  read: 60,
  writte: 60,
} as const;

export type ExamModuleType = keyof typeof EXAM_DURATION_MINUTES;

const isModuleType = (type: string): type is ExamModuleType =>
  type === 'listen' || type === 'read' || type === 'writte';

/** 取某模块的考试时长（分钟）；未知模块按阅读时长兜底 */
export function getExamDurationMinutes(type: string): number {
  return EXAM_DURATION_MINUTES[isModuleType(type) ? type : 'read'];
}

/** 取某模块的考试时长（毫秒），用于计时器与超时判定 */
export function getExamDurationMs(type: string): number {
  return getExamDurationMinutes(type) * 60 * 1000;
}
