#!/bin/bash

# 📝 Qulome 项目变更跟踪工具
# 用于记录每次细节修改

echo "📝 Qulome 项目变更跟踪工具"
echo "================================"

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo "📊 检测到以下文件有更改:"
    git status --short
    echo ""
    
    # 显示详细的更改内容
    echo "🔍 详细更改内容:"
    git diff --stat
    echo ""
    
    # 询问用户是否要提交这些更改
    read -p "是否要提交这些更改? (y/n): " commit_choice
    
    if [[ $commit_choice == "y" || $commit_choice == "Y" ]]; then
        echo ""
        echo "📝 请填写变更信息:"
        
        # 变更类型
        echo "选择变更类型:"
        echo "1. feat - 新功能"
        echo "2. fix - 修复问题"
        echo "3. style - 样式调整"
        echo "4. refactor - 代码重构"
        echo "5. docs - 文档更新"
        echo "6. test - 测试相关"
        read -p "请选择 (1-6): " type_choice
        
        case $type_choice in
            1) commit_type="feat" ;;
            2) commit_type="fix" ;;
            3) commit_type="style" ;;
            4) commit_type="refactor" ;;
            5) commit_type="docs" ;;
            6) commit_type="test" ;;
            *) commit_type="chore" ;;
        esac
        
        # 变更描述
        read -p "简短描述这次变更: " description
        
        # 详细说明
        read -p "详细说明 (可选): " details
        
        # 构建提交信息
        if [[ -n $details ]]; then
            commit_msg="$commit_type: $description

$details

Files changed: $(git diff --name-only | tr '\n' ', ' | sed 's/,$//')"
        else
            commit_msg="$commit_type: $description

Files changed: $(git diff --name-only | tr '\n' ', ' | sed 's/,$//')"
        fi
        
        # 提交更改
        git add .
        git commit -m "$commit_msg"
        
        echo ""
        echo "✅ 变更已提交"
        echo "📋 提交信息: $commit_type: $description"
        echo "🔗 提交哈希: $(git rev-parse --short HEAD)"
        
        # 更新变更日志
        current_date=$(date +"%Y-%m-%d")
        current_time=$(date +"%H:%M:%S")
        commit_hash=$(git rev-parse --short HEAD)
        
        # 在CHANGELOG.md中添加记录
        temp_file=$(mktemp)
        cat > "$temp_file" << EOF

### [$commit_hash] - $current_date $current_time - $description
**变更类型**: $commit_type  
**影响文件**: $(git diff --name-only HEAD~1 HEAD | tr '\n' ', ' | sed 's/,$//')  
**变更原因**: $description  
**变更内容**: $details  
**测试结果**: 待验证  
**回滚方案**: \`git reset --hard HEAD~1\`

EOF
        
        # 在CHANGELOG.md的变更记录模板前插入新记录
        if [[ -f "CHANGELOG.md" ]]; then
            sed '/## 📝 变更记录模板/r '"$temp_file" CHANGELOG.md > CHANGELOG.md.tmp
            mv CHANGELOG.md.tmp CHANGELOG.md
            rm "$temp_file"
            echo "📋 变更日志已更新"
        fi
        
    else
        echo "❌ 取消提交"
    fi
else
    echo "✅ 没有检测到未提交的更改"
fi

echo ""
echo "🎯 当前状态:"
echo "最新提交: $(git log --oneline -1)"
echo "工作目录: $(git status --short | wc -l) 个文件有更改"
echo ""
echo "💡 提示:"
echo "- 使用 './scripts/rollback.sh' 可以快速回滚"
echo "- 使用 'git log --oneline' 查看提交历史"
echo "- 使用 'git diff' 查看当前更改" 