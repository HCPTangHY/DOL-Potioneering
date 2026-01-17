if (!setup.Pot) setup.Pot = {};
setup.Pot.EventSystem = {};

/**
 * 独立事件注册系统
 */
setup.Pot.EventSystem = {
    events: new Map(),

    /**
     * 注册一个或多个事件
     * @param {Object|Array} data 事件数据或事件数据数组
     */
    register(data) {
        if (Array.isArray(data)) {
            data.forEach(item => this.register(item));
            return;
        }

        if (!data.passage || !data.pool) {
            console.error("[Pot] Event registration failed: Missing passage or pool.", data);
            return;
        }

        this.events.set(data.passage, {
            pool: data.pool,
            weight: data.weight || 10,
            chance: data.chance ?? 100, // 触发概率 (0-100)
            condition: data.condition || null,
            run: data.run || null,
            frequency: data.frequency || null // [type/days, limit]
        });
    },

    /**
     * 检查事件频率限制
     * @param {string} passage 事件段落名
     * @param {Array} freq 频率设置 [类型或天数, 限制值]
     * @returns {boolean} 是否允许触发
     */
    checkFrequency(passage, freq) {
        if (!freq) return true;
        if (!V.Pot || !V.Pot.eventHistory) return true;

        const [type, limit] = freq;
        const history = V.Pot.eventHistory[passage] || {};
        const currentDay = Time.days; // 使用 DOL 标准累计天数

        if (typeof type === "number") {
            if (history.lastDay !== undefined && currentDay < history.lastDay + type) return false;
            return true;
        }

        if (type === "daily") {
            if (history.day === currentDay && history.count >= limit) return false;
        } else if (type === "once") {
            if (history.triggered) return false;
        } else if (type === "session") {
            if (V.Pot.sessionEvents && V.Pot.sessionEvents[passage] >= limit) return false;
        }
        return true;
    },

    /**
     * 记录事件触发
     * @param {string} passage 事件段落名
     */
    recordEvent(passage) {
        const data = this.events.get(passage);
        if (!data || !data.frequency) return;

        V.Pot.eventHistory = V.Pot.eventHistory || {};
        const [type] = data.frequency;
        const history = V.Pot.eventHistory[passage] || {};
        const currentDay = Time.days;

        if (typeof type === "number") {
            history.lastDay = currentDay;
        } else if (type === "daily") {
            if (history.day === currentDay) {
                history.count++;
            } else {
                history.day = currentDay;
                history.count = 1;
            }
        } else if (type === "once") {
            history.triggered = true;
        } else if (type === "session") {
            V.Pot.sessionEvents = V.Pot.sessionEvents || {};
            V.Pot.sessionEvents[passage] = (V.Pot.sessionEvents[passage] || 0) + 1;
        }
        V.Pot.eventHistory[passage] = history;
    },

    /**
     * 从指定池中获取随机事件
     * @param {string} poolName 池名称
     */
    getEvent(poolName) {
        const availableEvents = [];
        this.events.forEach((data, passage) => {
            if (data.pool === poolName) {
                if (!this.checkFrequency(passage, data.frequency)) return;
                if (data.condition && !data.condition()) return;
                if (data.chance < 100 && Math.random() * 100 > data.chance) return;
                availableEvents.push({ passage, weight: data.weight });
            }
        });

        if (availableEvents.length === 0) return null;

        const totalWeight = availableEvents.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;

        for (const event of availableEvents) {
            if (random < event.weight) {
                this.recordEvent(event.passage);
                const eventData = this.events.get(event.passage);
                if (eventData.run) eventData.run();
                return event.passage;
            }
            random -= event.weight;
        }
        
        const fallback = availableEvents[0].passage;
        this.recordEvent(fallback);
        const fallbackData = this.events.get(fallback);
        if (fallbackData.run) fallbackData.run();
        return fallback;
    },

    resetSession() {
        if (V.Pot) {
            V.Pot.sessionEvents = {};
        }
    }
};
