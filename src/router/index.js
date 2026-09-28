import Layout from "../pages/Layout";
import Login from "../pages/Login";
import Evaluation from "../pages/Evaluation";
import ScoreReport from "../pages/ScoreReport";
import ScoreReportDetail from "../pages/ScoreReport/detail";
import Home from "../pages/Home"
import { createBrowserRouter, Navigate } from 'react-router-dom'

const ErrorBoundary = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>出错了</h1>
            <p style={{ color: '#666' }}>页面加载失败，请刷新重试</p>
            <button
                onClick={() => window.location.reload()}
                style={{
                    marginTop: '24px',
                    padding: '12px 24px',
                    background: '#1890ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                刷新页面
            </button>
        </div>
    );
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <Login />,
    },
    {
        path: '/app',
        element: <Layout />,
        children: [
            {
                index: true,
                element: <Navigate to="/app/evaluation" replace />
            },
            // {
            //     path: '/app/home',
            //     element: <Home />
            // },
            {
                path: '/app/evaluation',
                element: <Evaluation />,
                errorElement: <ErrorBoundary />
            },
            {
                path: '/app/report',
                element: <ScoreReport />,
                errorElement: <ErrorBoundary />
            },
            {
                path: '/app/report/:id',
                element: <ScoreReportDetail />,
                errorElement: <ErrorBoundary />
            }
        ]
    },
    {
        path: '/login',
        element: <Login />
    }
])

export default router