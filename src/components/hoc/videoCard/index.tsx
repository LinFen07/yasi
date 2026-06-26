import ExamExplainVideo from "@/components/basic/examExpainVideo";
import { CheckOutlined } from "@ant-design/icons";
import stores from "@/stores";
import { observer } from "mobx-react";
import "./index.scss";

const expainVideoCard = observer(
  ({
    type,
    isCompeleted,
    isAvailable = true,
    shouldReset = true
  }: {
    type: string,
    isCompeleted: boolean,
    isAvailable?: boolean,
    shouldReset?: boolean
  }) => {
    const time = type === 'listen' ? 30 : 60;
    const title =
      type == 'listen'
        ? 'Listening'
        : type == 'read'
          ? 'Reading'
          : 'Writting';
    const hasWritteExam = type !== 'writte' || stores.ExamStore.getWritteExam().length > 0;

    return (
      <div className="video-card-container">
        <div className="video-card-title">{title}</div>
        <div className='exam-compelete' style={isCompeleted ? { color: '#aebe36' } : undefined} >{isCompeleted ? 'completed' : 'Not completed'}</div>
        <div className="video-time">Timing: {time} minutes</div>
        {
          isCompeleted
            ? <CheckOutlined className='video-complete-icon' />
            : hasWritteExam
              ? <ExamExplainVideo type={type} isAvailable={isAvailable && !isCompeleted} shouldReset={shouldReset}></ExamExplainVideo>
              : <p className="video-card-empty-tip">该试卷暂无写作部分</p>
        }
      </div>
    )
  }
);

export default expainVideoCard;