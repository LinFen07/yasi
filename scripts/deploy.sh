#!/bin/bash
# ============================================
# 部署脚本 - 适配宝塔面板
# ============================================

set -e

# ========== 配置区 ==========
# 服务器信息
SERVER_IP="111.230.5.159"
SERVER_PORT="22"
SERVER_USER="root"

# 宝塔站点路径
BT_SITE_PATH="/www/wwwroot/yasi"

# 备份目录
BACKUP_DIR="/www/wwwroot/backup"
# ============================

echo "========================================"
echo "         开始部署 yasi 前端"
echo "========================================"

# 1. 本地构建
echo ""
echo "[1/5] 📦 本地构建..."
cd "$(dirname "$0")/.."
npm run build

if [ ! -d "build" ]; then
    echo "❌ 构建失败，build 目录不存在"
    exit 1
fi
echo "✅ 构建成功"

# 2. 创建版本包
echo ""
echo "[2/5] 📁 创建部署包..."
VERSION=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="yasi_${VERSION}.tar.gz"

tar -czf "$PACKAGE_NAME" build/
echo "✅ 版本包: $PACKAGE_NAME"

# 3. 备份当前版本
echo ""
echo "[3/5] 💾 备份当前版本..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "mkdir -p $BACKUP_DIR && \
    if [ -d '$BT_SITE_PATH/build' ]; then \
        cp -r $BT_SITE_PATH/build $BACKUP_DIR/build_$(date +%Y%m%d_%H%M%S); \
        echo '✅ 备份成功'; \
    else \
        echo '⚠️  无需备份（首次部署）'; \
    fi"

# 4. 上传新版本
echo ""
echo "[4/5] 🚀 上传到服务器..."
scp -P $SERVER_PORT "$PACKAGE_NAME" $SERVER_USER@$SERVER_IP:$BT_SITE_PATH/

# 5. 解压并更新
echo ""
echo "[5/5] 🔄 更新站点..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'EOF'
    cd $BT_SITE_PATH
    rm -rf build
    tar -xzf yasi_*.tar.gz
    rm -f yasi_*.tar.gz
    echo "✅ 更新完成"
EOF

# 清理本地包
rm -f "$PACKAGE_NAME"

echo ""
echo "========================================"
echo "         ✅ 部署完成！"
echo "========================================"
