#!/usr/bin/bash
# Headless 环境 lark-cli 登录脚本
# 适用：无图形界面的服务器、SSH 会话、Docker 容器

set -e

LARK_CLI="${LARK_CLI:-lark-cli}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"
MAX_POLL="${MAX_POLL:-60}"  # 最多轮询 60 次，约 5 分钟

echo "=== lark-cli Headless 登录 ==="
echo ""

# 1. 发起 Device Flow 登录
echo "[1/3] 发起登录请求..."
LOGIN_RESULT=$($LARK_CLI auth login --no-wait --json 2>/dev/null)

if [ -z "$LOGIN_RESULT" ]; then
    echo "错误：无法发起登录，请确认 lark-cli 已安装"
    exit 1
fi

# 解析 JSON（需要 jq）
DEVICE_CODE=$(echo "$LOGIN_RESULT" | jq -r '.device_code // empty')
USER_CODE=$(echo "$LOGIN_RESULT" | jq -r '.user_code // empty')
VERIFICATION_URI=$(echo "$LOGIN_RESULT" | jq -r '.verification_uri // empty')

if [ -z "$DEVICE_CODE" ] || [ -z "$USER_CODE" ] || [ -z "$VERIFICATION_URI" ]; then
    echo "错误：解析登录响应失败"
    echo "原始响应: $LOGIN_RESULT"
    exit 1
fi

echo ""
echo "========================================"
echo "  请用手机或另一台电脑完成授权"
echo "========================================"
echo ""
echo "  1. 打开链接: $VERIFICATION_URI"
echo "  2. 输入验证码: $USER_CODE"
echo "  3. 按提示扫码授权"
echo ""
echo "========================================"
echo ""

# 2. 轮询等待授权完成
echo "[2/3] 等待授权完成（每 ${POLL_INTERVAL} 秒检查一次）..."
echo ""

POLL_COUNT=0
while [ $POLL_COUNT -lt $MAX_POLL ]; do
    sleep $POLL_INTERVAL
    POLL_COUNT=$((POLL_COUNT + 1))
    
    STATUS=$($LARK_CLI auth status --json 2>/dev/null || true)
    
    if echo "$STATUS" | jq -e '.ok' >/dev/null 2>&1; then
        USER_NAME=$(echo "$STATUS" | jq -r '.user.name // "未知"')
        TENANT_NAME=$(echo "$STATUS" | jq -r '.tenant.name // "未知"')
        echo ""
        echo "✅ 登录成功！"
        echo "   用户: $USER_NAME"
        echo "   企业: $TENANT_NAME"
        echo ""
        echo "[3/3] 验证通过，可以开始使用 lark-cli"
        exit 0
    fi
    
    echo "  等待中... ($POLL_COUNT/$MAX_POLL)"
done

echo ""
echo "❌ 登录超时，请检查："
echo "   1. 是否已完成扫码授权"
echo "   2. 验证码 $USER_CODE 是否已过期"
echo ""
echo "如需重试，重新运行本脚本"
exit 1
