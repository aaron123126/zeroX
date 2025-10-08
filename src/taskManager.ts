import { Task } from './types';
import { v4 as uuidv4 } from 'uuid';

export class TaskManager {
  private tasks: Task[] = [];
  private onUpdateCallback?: (tasks: Task[]) => void;

  setUpdateCallback(callback: (tasks: Task[]) => void) {
    this.onUpdateCallback = callback;
  }

  createTask(description: string): Task {
    const task: Task = {
      id: uuidv4(),
      description,
      status: 'pending',
    };
    this.tasks.push(task);
    this.notify();
    return task;
  }

  updateTask(id: string, updates: Partial<Task>) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      this.notify();
    }
  }

  getTasks(): Task[] {
    return [...this.tasks];
  }

  clearTasks() {
    this.tasks = [];
    this.notify();
  }

  private notify() {
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getTasks());
    }
  }
}