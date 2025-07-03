/**
 * Notification Utility Module
 * 
 * 统一的通知和弹窗管理
 * - 成功/错误消息通知
 * - 确认弹窗
 * - 保持与原有交互逻辑一致
 */
window.NotificationUtils = {
    /**
     * 显示成功消息
     */
    showSuccess: (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    },

    /**
     * 显示错误消息
     */
    showError: (message) => {
        // 可以扩展为更复杂的通知系统
        alert(message);
    },

    /**
     * 统一确认弹窗
     */
    showConfirmationModal: (message, subMessage, onConfirm) => {
        // 移除已有弹窗
        const existing = document.getElementById('confirmation-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'confirmation-modal';
        modal.style.cssText = `
            position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 10001;
            background: rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center;
        `;
        modal.innerHTML = `
            <div style="background: #fff; border-radius: 10px; min-width: 320px; max-width: 90vw; box-shadow: 0 4px 24px rgba(0,0,0,0.12); padding: 32px 24px; text-align: center;">
                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 12px;">${window.ThemeUtils.escapeHtml(message)}</div>
                <div style="color: #888; margin-bottom: 24px;">${subMessage ? window.ThemeUtils.escapeHtml(subMessage) : ''}</div>
                <button id="confirm-btn" class="btn btn-danger" style="margin-right: 16px;">确认</button>
                <button id="cancel-btn" class="btn btn-secondary">取消</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#confirm-btn').onclick = () => {
            modal.remove();
            if (typeof onConfirm === 'function') onConfirm();
        };
        modal.querySelector('#cancel-btn').onclick = () => {
            modal.remove();
        };
        
        // 点击背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
        
        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
}; 