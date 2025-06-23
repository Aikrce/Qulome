#!/bin/bash

# 🔄 Qulome 项目快速回滚脚本
# 用于在出现问题时快速恢复到稳定版本

echo "🔄 Qulome 项目快速回滚工具"
echo "================================"

# 显示当前状态
echo "📊 当前Git状态:"
git status --short

echo ""
echo "📅 最近的提交记录:"
git log --oneline -5

echo ""
echo "⚠️  回滚选项:"
echo "1. 回滚到最近的稳定版本 (75828fe - 模块化重构完成)"
echo "2. 撤销未提交的更改"
echo "3. 查看详细的变更历史"
echo "4. 退出"

read -p "请选择操作 (1-4): " choice

case $choice in
    1)
        echo "🔄 回滚到稳定版本 75828fe..."
        git reset --hard 75828fe
        echo "✅ 已回滚到稳定版本"
        echo "🌐 请重启服务器: python3 -m http.server 8080"
        ;;
    2)
        echo "🔄 撤销未提交的更改..."
        git checkout -- .
        git clean -fd
        echo "✅ 已撤销所有未提交的更改"
        ;;
    3)
        echo "📜 详细变更历史:"
        git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit -10
        ;;
    4)
        echo "👋 退出回滚工具"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎯 当前状态:"
git status --short
echo ""
echo "✅ 回滚操作完成" 