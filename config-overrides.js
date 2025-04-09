const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
// const express = require('express');

// const app = express();

// // 创建代理中间件
// const proxyMiddleware = createProxyMiddleware({
//   target: 'http://120.24.144.113:8668', // 目标服务器的地址
//   changeOrigin: true, // 修改请求头中的 Host 字段为目标服务器的地址
//   pathRewrite: {
//     '^/api': '' // 将本地的 /api 路径映射为目标服务器的根路径
//   }
// });

// // 将代理中间件挂载到 /api 路径
// app.use('/api', proxyMiddleware);

// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

module.exports = override(
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
  }),
    function (config, env) {
        config.devServer = {
          ...config.devServer,
          open: true,
          host: 'localhost',
          port: 8002,
          https: false,
          hotOnly: false,
          proxy: {
            '/api': {
              target: 'http://120.24.144.113:8668',
              changeOrigin: true, // 确保设置为 true
              pathRewrite: { '^/api': '' },
              secure: false, // 如果使用 HTTP，确保设置为 false
              withCredentials: true, // 启用跨域携带凭证
            },
          },
        };
      return config;
    }
);