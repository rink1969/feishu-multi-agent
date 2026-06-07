#!/usr/bin/bash
# lark-cli base records 各字段类型写入示例
# 基于 Bitable v3 API 字段类型映射

#!/usr/bin/bash
# lark-cli base records 各字段类型写入示例
# 基于 Bitable v3 API 字段类型映射

set -e

LARK_CLI="${LARK_CLI:-lark-cli}"
APP_TOKEN="${APP_TOKEN:-xxxxxxxxxxxxxxxx}"
TABLE_ID="${TABLE_ID:-tblxxxxxxxxxxxx}"

echo "=== lark-cli Base Records 字段写入示例 ==="
echo ""
echo "使用前请设置环境变量："
echo "  export APP_TOKEN=你的多维表格AppToken"
echo "  export TABLE_ID=你的多维表格TableID"
echo ""

# 1. 文本字段 (type=1)
echo "[1] 文本字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "文本字段": "这是一段文本内容"
  }'

# 2. 数字字段 (type=2)
echo "[2] 数字字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "数字字段": 42,
    "数字字段_小数": 3.14
  }'

# 3. 单选字段 (type=3)
echo "[3] 单选字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "状态": "进行中"
  }'

# 4. 多选字段 (type=4)
echo "[4] 多选字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "标签": ["标签A", "标签B", "标签C"]
  }'

# 5. 日期字段 (type=5)
echo "[5] 日期字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "截止日期": 1717200000000
  }'
# 注：日期用毫秒时间戳；或用 ISO 格式字符串（取决于字段配置）

# 6. 复选框字段 (type=7)
echo "[6] 复选框字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "已完成": true
  }'

# 7. 人员字段 (type=11)
echo "[7] 人员字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "负责人": ["ou_xxxxxxxxxxxxxxxx"]
  }'
# 注：人员字段值为 open_id 数组

# 8. 电话字段 (type=13)
echo "[8] 电话字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "联系电话": "13800138000"
  }'

# 9. 超链接字段 (type=15)
echo "[9] 超链接字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "文档链接": {
      "text": "点击查看文档",
      "link": "https://xxx.feishu.cn/docx/xxx"
    }
  }'

# 10. 地理位置字段 (type=22)
echo "[10] 地理位置字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "位置": {
      "location": "北京市海淀区",
      "lng": 116.397428,
      "lat": 39.90923
    }
  }'

# 11. 群组字段 (type=23)
echo "[11] 群组字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "关联群": "oc_xxxxxxxxxxxxxxxx"
  }'

# 12. 单向关联字段 (type=18)
echo "[12] 单向关联字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "关联记录": ["rec_xxxxxxxxxxxxxxxx"]
  }'
# 注：关联字段值为 record_id 数组

# 13. 双向关联字段 (type=21)
echo "[13] 双向关联字段"
$LARK_CLI base records create \
  --app-token "$APP_TOKEN" \
  --table-id "$TABLE_ID" \
  --fields '{
    "双向关联": ["rec_xxxxxxxxxxxxxxxx"]
  }'

# 14. 附件字段 (type=17) - 特殊处理
echo "[14] 附件字段（需先上传）"
# 附件不能直接在 records create 中写入
# 需使用专用命令：
# lark-cli base +record-upload-attachment \
#   --app-token "$APP_TOKEN" \
#   --table-id "$TABLE_ID" \
#   --record-id "rec_xxx" \
#   --field-name "附件" \
#   --file "/path/to/file.pdf"

echo ""
echo "=== 示例完成 ==="
echo ""
echo "系统字段（只读，不可写）："
echo "  - 创建时间 (type=1001)"
echo "  - 更新时间 (type=1002)"
echo "  - 创建人 (type=1003)"
echo "  - 修改人 (type=1004)"
echo "  - 自动编号 (type=1005)"
echo ""
echo "公式字段 (type=20) 和 查找引用 (type=19) 只读"
