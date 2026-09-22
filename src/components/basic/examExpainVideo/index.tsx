import { Collapse, message } from "antd";
import "./index.scss";
import { CheckOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import stores from "@/stores";
import { observer } from "mobx-react";
import { setModuleStatus } from "@/utils/helper/examDataManager";
import { getExamInstructionMediaUrl } from "@/api/examPaper";

const ExamExplainVideo = observer(({ type, isAvailable = true, shouldReset = true }: { type: string; isAvailable?: boolean; shouldReset?: boolean }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const navigate = useNavigate();
  const title =
    type == "listen" ? "Listening" : type == "read" ? "Reading" : "Writting";

  const audioUrl = useMemo(() => getExamInstructionMediaUrl(type), [type]);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    const el = audioRef.current;
    el.preload = "auto";
    el.src = audioUrl;
    el.load();
  }, [audioUrl]);

  const handlerStart = () => {
    if (!isAvailable) {
      message.warning("该模块已完成或不可访问");
      return;
    }

    setModuleStatus(stores.ExamStore.paperId, type as 'listen' | 'read' | 'writte', 'in_progress');

    // 从 URL 获取 shouldReset 参数，继续考试时应该保持 false
    const params = new URLSearchParams(window.location.search);
    const urlShouldReset = params.get('shouldReset');
    const shouldResetFromUrl = urlShouldReset !== 'false';

    if (type === "listen") {
      navigate(`/listeningExam?id=${stores.ExamStore.paperId}&shouldReset=${shouldResetFromUrl}`);
    } else if (type === "read") {
      navigate(`/readnExam?id=${stores.ExamStore.paperId}&shouldReset=${shouldResetFromUrl}`);
    } else if (type === "writte") {
      if (stores.ExamStore.getWritteExam().length === 0) {
        message.warning('该试卷暂无写作部分');
        return;
      }
      navigate(`/writteExam?id=${stores.ExamStore.paperId}&shouldReset=${shouldResetFromUrl}`);
    }
  };

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
                {isConfirmed ? (
                  <button
                    className="video-confirm-button"
                    onClick={handlerStart}
                    disabled={!isAvailable}
                    style={{ marginTop: "16px", opacity: !isAvailable ? 0.5 : 1, cursor: !isAvailable ? "not-allowed" : "pointer" }}
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
                    </p >
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