#!/bin/bash
# ============================================
# 回滚脚本 - 适配宝塔面板
# ============================================

set -e

# ========== 配置区 ==========
SERVER_IP="111.230.5.159"
SERVER_PORT="22"
SERVER_USER="root"
BT_SITE_PATH="/www/wwwroot/yasi"
BACKUP_DIR="/www/wwwroot/backup"
# ============================

echo "========================================"
echo "         开始回滚 yasi 前端"
echo "========================================"

# 1. 列出可用备份
echo ""
echo "[1/4] 📋 查找可用备份..."
BACKUPS=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "ls -1 $BACKUP_DIR/build_* 2>/dev/null | sort -r")

if [ -z "$BACKUPS" ]; then
    echo "❌ 没有找到可用备份"
    exit 1
fi

echo "可用备份："
echo "$BACKUPS"
echo ""

# 2. 选择回滚版本
echo "[2/4] 🔢 选择回滚版本"
echo "输入备份目录名（如 build_20250819_143000）："
read -r SELECTED_BACKUP

if [ -z "$SELECTED_BACKUP" ]; then
    echo "❌ 未选择版本"
    exit 1
fi

# 3. 执行回滚
echo ""
echo "[3/4] 🔄 执行回滚..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << EOF
    cd $BT_SITE_PATH
    rm -rf build
    cp -r $BACKUP_DIR/$SELECTED_BACKUP build
    echo "✅ 回滚成功"
EOF

# 4. 验证
echo ""
echo "[4/4] ✅ 验证回滚..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "ls $BT_SITE_PATH/build/index.html" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 回滚完成！站点已恢复到: $SELECTED_BACKUP"
else
    echo "❌ 回滚失败，请检查"
    exit 1
fi

echo ""
echo "========================================"
echo "         ✅ 回滚完成！"
echo "========================================"
