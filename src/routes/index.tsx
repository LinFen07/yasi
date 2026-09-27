
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import Login from '@/pages/Login';
import Layout from "@/layout";
import Dashboard from "@/pages/dashboard";
import stores from "@/stores";
import type { Router } from "@/typings/router";
import Video from "@/pages/video";
import { invalidateSession } from "@/utils/auth";
const ExamPage = lazy(() => import('@/pages/examPage'));
const TextOver = lazy(() => import('@/pages/testOver'));

// 路由鉴权组件
const Appraisal = ({ children }: any) => {
  const token = localStorage.getItem(stores.UserStore.key);
  if (!token) {
    return <Navigate to="/login" />;
  }
  if (stores.UserStore.isTokenExpired()) {
    invalidateSession();
    return <Navigate to="/login" />;
  }
  return children;
};

const routes: Array<Router> = [
  //路由重定向
  {
    path: '/',
    element: <Navigate to="/layout/dashboard" replace />
  },
  {
    path: '/login',
    element: <Login data={'login'}/>
  },
  {
    path: '/register',
    element: <Login data={'register'} />
  },
  {
    path: '/layout',
    element: <Appraisal><Layout /></Appraisal>,
    children:[
      {
        path: 'dashboard',
        element: <Dashboard/>
      },
      {
        path: '',
        element: <Dashboard/>
      }
    ]
  },
  {
    path: '/listeningExam',
    element: <Appraisal><ExamPage type="listen" /></Appraisal>
  },
  {
    path: '/readnExam',
    element: <Appraisal><ExamPage type="read" /></Appraisal>
  },
  {
    path: '/writteExam',
    element: <Appraisal><ExamPage type="writte" /></Appraisal>
  },
  {
    path: '/testOver',
    element: <Appraisal><TextOver/></Appraisal>
  },
  {
    path: '/video',
    element: <Appraisal><Video /></Appraisal>
  }
]

export default routes
