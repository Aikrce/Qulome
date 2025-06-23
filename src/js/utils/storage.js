/**
 * localStorage 存储管理模块
 * 提供统一的JSON数据存取接口，并包含错误处理
 */
export const Storage = {
    /**
     * 将JSON数据保存到localStorage
     * @param {string} key - 存储的键名
     * @param {any} data - 需要存储的数据
     * @returns {{success: boolean, error?: string}} 操作结果
     */
    saveJSON(key, data) {
        try {
            const jsonString = JSON.stringify(data);
            localStorage.setItem(key, jsonString);
            return { success: true };
        } catch (error) {
            console.error(`保存数据到localStorage失败 (key: ${key}):`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 从localStorage读取JSON数据
     * @param {string} key - 读取的键名
     * @param {any} defaultValue - 读取失败时的默认值
     * @returns {any} 读取到的数据或默认值
     */
    loadJSON(key, defaultValue = null) {
        try {
            const jsonString = localStorage.getItem(key);
            if (jsonString === null) {
                return defaultValue;
            }
            return JSON.parse(jsonString);
        } catch (error) {
            console.error(`从localStorage读取数据失败 (key: ${key}):`, error);
            return defaultValue;
        }
    },

    /**
     * 从localStorage中移除数据
     * @param {string} key - 要移除的键名
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`从localStorage移除数据失败 (key: ${key}):`, error);
        }
    }
}; 