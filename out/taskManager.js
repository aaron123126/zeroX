"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const uuid_1 = require("uuid");
class TaskManager {
    constructor() {
        this.tasks = [];
    }
    setUpdateCallback(callback) {
        this.onUpdateCallback = callback;
    }
    createTask(description) {
        const task = {
            id: (0, uuid_1.v4)(),
            description,
            status: 'pending',
        };
        this.tasks.push(task);
        this.notify();
        return task;
    }
    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.notify();
        }
    }
    getTasks() {
        return [...this.tasks];
    }
    clearTasks() {
        this.tasks = [];
        this.notify();
    }
    notify() {
        if (this.onUpdateCallback) {
            this.onUpdateCallback(this.getTasks());
        }
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=taskManager.js.map