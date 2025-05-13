import './index.scss';
import stores from '@/stores';
import { observer } from 'mobx-react'

const AnswerLeft = observer(() => {
  const { appraise } = stores.AnswerStore;

  return (
    <div className='anlt'>
      <div className='anltContent'>{appraise || '待批阅'}</div>
    </div>
  )
})

export default AnswerLeft;