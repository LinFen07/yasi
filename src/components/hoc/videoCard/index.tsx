import ExamExplainVideo from "@/components/basic/examExpainVideo";
import { CheckOutlined } from "@ant-design/icons";
import "./index.scss";

const expainVideoCard = 
  (
    { 
      type, 
      isCompeleted,
      isShowVideo
    }: {
      type: string,
      isCompeleted: boolean,
      isShowVideo: boolean
    }
  ) => {
    const time = type === 'listen' ? 30 : 60;
    const title = 
      type == 'listen' 
      ? 'Listening'
      : type == 'read'
      ? 'Reading'
      : 'Writting'
    return(
      <div className="video-card-container">
          <div className="video-card-title">{title}</div>
          <div className='exam-compelete' style={isCompeleted ? {color: '#aebe36'}: undefined} >{isCompeleted ? 'completed' : 'Not completed'}</div>
          <div className="video-time">Timing: {time} minutes</div>
          {
            isShowVideo
            ? <ExamExplainVideo type={type}></ExamExplainVideo>
            : <></>
          }
          {
            isCompeleted 
            ? <CheckOutlined className='video-complete-icon'/>
            : <></>
          }
        </div>
    )
}
export default expainVideoCard;