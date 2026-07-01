
import { Layout } from 'antd';
import './index.scss';
import HeadTip from '@/components/container/HeadTip';
import PageContent from '@/components/container/examContent';
import FooterNav from '@/components/container/FooterNav';
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react'
import { runInAction } from 'mobx'
import stores from '@/stores';
import { select } from '@/api/examPaper';
import { AddCorrect } from '@/utils/browser/getCorrect';
import { prepareExamModuleStart, shouldStartFreshExam } from '@/utils/helper/examDataManager';
import { persistReportPaperId } from '@/utils/helper/reportPaperId';

const {Header, Content} = Layout;

function ExamPage({type}: {type: string}) {

  const [scale, setFontSize] = useState(1)
  const [examReady, setExamReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paperId = params.get('id');
    if (!paperId) {
      setExamReady(true);
      return;
    }

    const id = +paperId;
    stores.ExamStore.changePaperId(id);
    persistReportPaperId(id);

    if (shouldStartFreshExam()) {
      prepareExamModuleStart(id, type as 'listen' | 'read' | 'writte');
      params.set('shouldReset', 'false');
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }

    const moduleExam =
      type === 'listen'
        ? stores.ExamStore.getListenExam()
        : type === 'read'
        ? stores.ExamStore.getReadExam()
        : stores.ExamStore.getWritteExam();

    const loadExamData = async () => {
      if (moduleExam.length > 0 && stores.ExamStore.paperId === id) {
        setExamReady(true);
        return;
      }

      try {
        const res = await select(id);
        // @ts-ignore
        if (res.code === 1) {
          // @ts-ignore
          const response = res.response;
          stores.ExamStore.addExam(response.titleItems);
          stores.ExamStore.addListenAudio(response.audioFileUrl);
          AddCorrect(response.titleItems);
        }
      } catch (error) {
        console.error('获取考试数据失败:', error);
      } finally {
        setExamReady(true);
      }
    };

    loadExamData();
  }, [type]);
  useEffect(() => {
    setFontSize(stores.ExamStore.FontSize / 18);
    console.log(stores.ExamStore.FontSize)

    // 保存当前页面类型到localStorage
    stores.ExamStore.changeCurrentPageType(type);

    // 新开考试时不恢复旧进度；仅 shouldReset=false 时恢复
    runInAction(() => {
      if (!shouldStartFreshExam()) {
        try {
          const savedState = localStorage.getItem('examPageState');
          if (savedState) {
            const state = JSON.parse(savedState);
            if (state.paperId === stores.ExamStore.paperId && state.currentPageType === type) {
              stores.ExamStore.changeCurrent(state.currentExamIndex);
              stores.ExamStore.changeCurrentTitle(state.currentExamTitle);
              return;
            }
          }
        } catch (error) {
          console.warn('恢复页面状态失败:', error);
        }
      }

      stores.ExamStore.changeCurrent(1);
      stores.ExamStore.changeCurrentTitle('Part1');
    });
  },[stores.ExamStore.FontSize, type, examReady])

  if (!examReady) {
    return null;
  }

  return (
    <div className='examBox' style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      <Layout style={{ width: '100%', height: '100%' }}>
        <Header className='examHeader'>
          <HeadTip type={type}></HeadTip>
        </Header>
        <Content className={`examContent ${type === 'read' || type === 'writte' ? 'examContent-read-scroll' : ''}`}>
          <PageContent type={type}></PageContent>
        </Content>
        <div className='footer'>
          <FooterNav type={type}></FooterNav>
        </div>
      </Layout>
    </div>
  )
}

export default observer(ExamPage);