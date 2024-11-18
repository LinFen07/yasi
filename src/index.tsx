import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/scss/index.scss';
import App from './App';
import { BrowserRouter } from 'react-router-dom'
import  zhCN  from 'antd/locale/zh_CN'
import { ConfigProvider } from 'antd';
import { Provider } from "mobx-react";
import stores from './stores';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN} >
        <Provider {...stores}>
        <App/>
        </Provider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
