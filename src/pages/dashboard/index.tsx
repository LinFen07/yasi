import "./index.scss";
import {
  BarChartOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReadOutlined,
  SoundOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Button, Modal, Spin } from "antd";
import { useNavigate } from "react-router";
import { getExam } from "@/api/examPaper";
import { useEffect, useState } from "react";
import stores from "@/stores";
import { getStudentId } from "@/api/login";
import {
  getExamProgress,
  initExamProgress,
  clearAllExamData,
  clearExamProgress,
} from "@/utils/helper/examDataManager";
import { persistReportPaperId } from "@/utils/helper/reportPaperId";

type ExamStatus = "upcoming" | "active" | "ended";

const STATUS_LABEL: Record<ExamStatus, string> = {
  upcoming: "未开始",
  active: "进行中",
  ended: "已截止",
};

const getExamStatus = (startTime: string, endTime: string): ExamStatus => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
};

const Dashboard = () => {
  const [examList, setExamList] = useState([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [ongoingModalVisible, setOngoingModalVisible] = useState(false);
  const [pendingExamId, setPendingExamId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchGetStudentId = async () => {
    const res = await getStudentId(stores.UserStore.userName);
    // @ts-ignore
    stores.UserStore.setUserId(res.response.value);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetchGetStudentId();
        if (cancelled) return;

        const res = await getExam(stores.UserStore.userId);
        if (cancelled) return;

        const items =
          res?.response?.items ??
          res?.data?.response?.items ??
          res?.data?.items ??
          [];
        setExamList(items);
      } catch (error) {
        console.log(error);
      } finally {
        if (!cancelled) {
          setListLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirmExam = async (id: number) => {
    const progress = getExamProgress(id);

    if (progress) {
      const allCompleted =
        progress.listen.status === "completed" &&
        progress.read.status === "completed" &&
        progress.writte.status === "completed";

      if (allCompleted) {
        startNewExam(id);
      } else {
        const hasProgress =
          progress.listen.status !== "not_started" ||
          progress.read.status !== "not_started" ||
          progress.writte.status !== "not_started";

        if (hasProgress) {
          setPendingExamId(id);
          setOngoingModalVisible(true);
        } else {
          startNewExam(id);
        }
      }
    } else {
      startNewExam(id);
    }
  };

  const startNewExam = (id: number) => {
    clearAllExamData();
    clearExamProgress(id);
    initExamProgress(id);
    stores.AnswerStore.fullReset();
    stores.ExamStore.fullReset();
    window.open(`/video?id=${id}&type=listen`, "_blank");
  };

  const continueExam = (id: number) => {
    const progress = getExamProgress(id);
    let targetType = "listen";

    if (progress?.listen.status !== "completed") {
      targetType = "listen";
    } else if (progress?.read.status !== "completed") {
      targetType = "read";
    } else if (progress?.writte.status !== "completed") {
      targetType = "writte";
    }

    setOngoingModalVisible(false);
    setPendingExamId(null);
    window.open(`/video?id=${id}&type=${targetType}`, "_blank");
  };

  const handleSreachTestResult = (
    id: number,
    isAppraise: number,
    appraise: string
  ) => {
    persistReportPaperId(id);
    if (isAppraise) stores.AnswerStore.appraise = appraise;
    navigate(`/testOver?id=${id}`);
  };

  const displayName =
    stores.UserStore.name || stores.UserStore.userName || "同学";

  return (
    <div className="exam-center-page">
      <div className="exam-center-bg" aria-hidden="true" />
      <div className="exam-center-grid" aria-hidden="true" />

      <div className="exam-center-inner">
        <header className="exam-center-hero">
          <span className="exam-center-badge">EXAM CENTER</span>
          <h1>试卷中心</h1>
          {listLoaded && examList.length > 0 && (
            <div className="exam-center-meta">
              <span>共 {examList.length} 套试卷</span>
              <span className="exam-center-meta-dot" />
              <span>欢迎，{displayName}</span>
            </div>
          )}
        </header>

        <section className="exam-center-body">
          {!listLoaded ? (
            <div className="exam-center-loading">
              <Spin size="large" />
              <p>正在加载试卷列表…</p>
            </div>
          ) : examList.length === 0 ? (
            <div className="exam-center-empty">
              <FileTextOutlined className="exam-center-empty-icon" />
              <h3>暂无可用试卷</h3>
              <p>需等待老师授权派发后，试卷将显示在此处</p>
            </div>
          ) : (
            <div
              className="exam-center-grid-cards"
              data-count={Math.min(examList.length, 4)}
            >
              {examList.map((item: any) => {
                const status = getExamStatus(item.startTime, item.endTime);

                return (
                  <article className="exam-card" key={item.examPaperId}>
                    <div className="exam-card-accent" />
                    <div className="exam-card-head">
                      <span className={`exam-card-status exam-card-status--${status}`}>
                        {STATUS_LABEL[status]}
                      </span>
                      <FileTextOutlined className="exam-card-head-icon" />
                    </div>

                    <h3 className="exam-card-title">{item.examPaperName}</h3>

                    <div className="exam-card-subjects">
                      <span className="exam-card-subjects-label">考试科目</span>
                      <div className="exam-card-subjects-list">
                        <span className="exam-card-subject-item">
                          <SoundOutlined /> 听力
                        </span>
                        <span className="exam-card-subject-sep" aria-hidden="true">·</span>
                        <span className="exam-card-subject-item">
                          <ReadOutlined /> 阅读
                        </span>
                        <span className="exam-card-subject-sep" aria-hidden="true">·</span>
                        <span className="exam-card-subject-item">
                          <EditOutlined /> 写作
                        </span>
                      </div>
                    </div>

                    <div className="exam-card-time">
                      <div className="exam-card-time-label">
                        <ClockCircleOutlined />
                        <span>考试时间</span>
                      </div>
                      <p>{item.startTime}</p>
                      <p className="exam-card-time-sep">至 {item.endTime}</p>
                    </div>

                    <div className="exam-card-actions">
                      <Button
                        type="primary"
                        size="large"
                        disabled={status === "ended"}
                        onClick={() => handleConfirmExam(item.examPaperId)}
                      >
                        前往考试
                      </Button>
                      <Button
                        size="large"
                        icon={<BarChartOutlined />}
                        onClick={() =>
                          handleSreachTestResult(
                            item.examPaperId,
                            item.isAppraise,
                            item.appraise
                          )
                        }
                      >
                        查看结果
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Modal
        title="考试未完成"
        open={ongoingModalVisible}
        onCancel={() => setOngoingModalVisible(false)}
        footer={[
          <Button
            key="continue"
            type="primary"
            onClick={() => pendingExamId && continueExam(pendingExamId)}
          >
            继续考试
          </Button>,
          <Button
            key="restart"
            onClick={() => pendingExamId && startNewExam(pendingExamId)}
          >
            开始新考试
          </Button>,
        ]}
      >
        <p>您有未完成的考试，是否继续？</p>
      </Modal>
    </div>
  );
};

export default Dashboard;
