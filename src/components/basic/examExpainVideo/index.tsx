import { Collapse, message } from "antd";
import "./index.scss";
import { CheckOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import stores from "@/stores";
import { observer } from "mobx-react";
import { setModuleStatus } from "@/utils/helper/examDataManager";
import { getExamInstructionMediaUrl } from "@/api/examPaper";

/** 进入页面即预连接说明音频 */
const preloadInstructionMedia = (url: string) => {
  fetch(url, { headers: { Range: "bytes=0-0" } }).catch(() => {});
};

const ExamExplainVideo = observer(({ type, isAvailable = true, shouldReset = true }: { type: string; isAvailable?: boolean; shouldReset?: boolean }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const navigate = useNavigate();
  const title =
    type == "listen" ? "Listening" : type == "read" ? "Reading" : "Writting";

  const audioUrl = useMemo(() => getExamInstructionMediaUrl(type), [type]);

  const paperId = stores.ExamStore.paperId;
  void stores.ExamStore.audioCheckTrigger;
  const audioReady = stores.ExamStore.isAudioReadyForStart(paperId);
  const audioError = stores.ExamStore.getAudioError(paperId);

  useEffect(() => {
    if (!audioUrl) return;
    preloadInstructionMedia(audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    const el = audioRef.current;
    el.preload = "auto";
    el.src = audioUrl;
    el.load();
  }, [audioUrl]);

  useEffect(() => {
    if (type !== "listen" || !paperId) return;
    stores.ExamStore.checkListenStreamAvailable(paperId);
  }, [type, paperId]);

  const handlerStart = () => {
    if (!isAvailable) {
      message.warning("该模块已完成或不可访问");
      return;
    }

    if (type === "listen" && !audioReady) {
      if (audioError) {
        message.error("音频加载失败，请刷新页面重试");
      } else {
        message.warning("音频正在准备中，请稍后...");
      }
      return;
    }

    setModuleStatus(stores.ExamStore.paperId, type as 'listen' | 'read' | 'writte', 'in_progress');

    if (type === "listen") {
      navigate(`/listeningExam?id=${stores.ExamStore.paperId}&shouldReset=${shouldReset}`);
    } else if (type === "read") {
      navigate(`/readnExam?id=${stores.ExamStore.paperId}&shouldReset=${shouldReset}`);
    } else if (type === "writte") {
      if (stores.ExamStore.getWritteExam().length === 0) {
        message.warning('该试卷暂无写作部分');
        return;
      }
      navigate(`/writteExam?id=${stores.ExamStore.paperId}&shouldReset=${shouldReset}`);
    }
  };

  const renderAudioStatus = () => {
    if (type !== "listen") return null;

    if (!paperId) {
      return <p style={{ fontSize: "16px", color: "#666", marginTop: "16px" }}>检查音频状态...</p>;
    }

    if (audioError) {
      return <p style={{ fontSize: "16px", color: "#ff4d4f", marginTop: "16px" }}>❌ 音频加载失败</p>;
    }

    if (audioReady) {
      return <p style={{ fontSize: "16px", color: "#52c41a", marginTop: "16px" }}>✅ 正式考试听力音频已准备就绪</p>;
    }

    return null;
  };

  const listenButtonDisabled = type === "listen" && (!audioReady || !!audioError);

  return (
    <div className="exam-expain-root">
      <Collapse
        size="large"
        items={[
          {
            key: "1",
            forceRender: true,
            label: (
              <>
                <span className="video-information-text">
                  Test information.
                </span>
                <span className="video-iscomplete-text">Not confirmed.</span>
              </>
            ),
            children: (
              <div className="exam-expain-content">
                {audioUrl ? (
                  <audio
                    ref={audioRef}
                    className="exam-expain-audio"
                    controls
                    preload="auto"
                    src={audioUrl}
                  />
                ) : null}
                {renderAudioStatus()}
                {isConfirmed ? (
                  <button
                    className="video-confirm-button"
                    onClick={handlerStart}
                    disabled={!isAvailable || listenButtonDisabled}
                    style={{ marginTop: "16px", opacity: !isAvailable || listenButtonDisabled ? 0.5 : 1, cursor: !isAvailable || listenButtonDisabled ? "not-allowed" : "pointer" }}
                  >
                    <ArrowRightOutlined style={{ marginRight: "12px" }} />
                    {isAvailable ? `Start ${title}` : '已锁定'}
                  </button>
                ) : (
                  <div className="video-confirm-container">
                    <h4 className="video-ready">Ready?</h4>
                    <p style={{ fontSize: "18px" }}>
                      Please confirm that you have understood the instructions
                      above.
                    </p>
                    <button
                      className="video-confirm-button"
                      onClick={() => setIsConfirmed(true)}
                      disabled={!isAvailable}
                      style={{ opacity: !isAvailable ? 0.5 : 1, cursor: !isAvailable ? "not-allowed" : "pointer" }}
                    >
                      <CheckOutlined style={{ marginRight: "12px" }} />I confirm {!isAvailable && '(已锁定)'}
                    </button>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
});

export default ExamExplainVideo;
