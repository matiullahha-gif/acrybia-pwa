// ============================================
// Acrybia DB Layer — IndexedDB + Supabase Push-Backup
// Version: 1.1.0  |  DB_VERSION: 2
// ============================================

const DB_NAME = 'AcrybiaDB';
const DB_VERSION = 2;

// Supabase Config (HIER DEINE DATEN EINTRAGEN)
const SUPABASE_URL = '';
const SUPABASE_KEY = '';
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY && typeof createClient !== 'undefined') {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

class AcrybiaDB {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('days')) {
          const store = db.createObjectStore('days', { keyPath: 'date' });
          store.createIndex('week', 'weekId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('weekGoals')) {
          const wgStore = db.createObjectStore('weekGoals', { keyPath: 'id', autoIncrement: true });
          wgStore.createIndex('week', 'weekId', { unique: false });
        }
      };
    });
  }

  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  getWeekId(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  // Hydrate: füllt fehlende Felder mit Defaults (für Schema-Migration)
  hydrateDay(raw) {
    if (!raw) return null;
    const day = { ...raw };
    if (!day.tasks) day.tasks = [];
    if (!day.body) day.body = {};
    if (day.body.waist === undefined) day.body.waist = null;
    if (!day.body.meals) day.body.meals = {};
    if (!day.reflection) day.reflection = {};
    if (!day.reflection.shame) day.reflection.shame = { experienced: false, when: '', why: '' };
    if (!day.reflection.fear) day.reflection.fear = { experienced: false, why: '' };
    if (day.completedWithOpenTasks === undefined) day.completedWithOpenTasks = false;
    if (day.completed === undefined) day.completed = false;
    return day;
  }

  createEmptyDay(date) {
    return {
      date,
      weekId: this.getWeekId(date),
      tasks: [],
      reflection: {
        biggestProblem: { category: 'arbeit', text: '' },
        blocker: '',
        blockerWhy: '',
        tags: [],
        mood: 3,
        energy: 3,
        shame: { experienced: false, when: '', why: '' },
        fear: { experienced: false, why: '' }
      },
      body: { weight: null, waist: null, meals: {}, protein: null },
      completed: false,
      completedWithOpenTasks: false
    };
  }

  async getDay(date) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('days', 'readonly');
      const store = tx.objectStore('days');
      const req = store.get(date);
      req.onsuccess = () => {
        const day = req.result ? this.hydrateDay(req.result) : this.createEmptyDay(date);
        resolve(day);
      };
    });
  }

  async saveDay(day) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('days', 'readwrite');
      const store = tx.objectStore('days');
      store.put(day);
      tx.oncomplete = () => {
        this.pushBackupToSupabase(day);
        resolve(day);
      };
    });
  }

  async getSettings(key) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value);
    });
  }

  async saveSettings(key, value) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key, value });
      tx.oncomplete = resolve;
    });
  }

  async getWeekGoals(weekId) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('weekGoals', 'readonly');
      const store = tx.objectStore('weekGoals');
      const idx = store.index('week');
      const req = idx.getAll(weekId);
      req.onsuccess = () => resolve(req.result || []);
    });
  }

  async saveWeekGoal(goal) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('weekGoals', 'readwrite');
      const store = tx.objectStore('weekGoals');
      store.put(goal);
      tx.oncomplete = resolve;
    });
  }

  async deleteWeekGoal(id) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('weekGoals', 'readwrite');
      const store = tx.objectStore('weekGoals');
      store.delete(id);
      tx.oncomplete = resolve;
    });
  }

  async getWeekDays(weekId) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('days', 'readonly');
      const store = tx.objectStore('days');
      const idx = store.index('week');
      const req = idx.getAll(weekId);
      req.onsuccess = () => {
        const days = (req.result || []).map(d => this.hydrateDay(d));
        const result = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - d.getDay() + 1 + i);
          const ds = d.toISOString().split('T')[0];
          const existing = days.find(x => x.date === ds);
          result.push(existing || this.createEmptyDay(ds));
        }
        resolve(result);
      };
    });
  }

  async getAllDays() {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('days', 'readonly');
      const store = tx.objectStore('days');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).map(d => this.hydrateDay(d)));
    });
  }

  // Push-Backup (kein bidirektionaler Sync)
  async pushBackupToSupabase(day) {
    if (!supabase) return;
    try {
      await supabase.from('days').upsert(day);
    } catch (e) {
      console.log('Supabase push failed (offline?)', e);
    }
  }

  async exportAll() {
    const days = await this.getAllDays();
    const settings = await new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
    const weekGoals = await new Promise((resolve) => {
      const tx = this.db.transaction('weekGoals', 'readonly');
      const store = tx.objectStore('weekGoals');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
    return {
      days,
      settings,
      weekGoals,
      schemaVersion: 2,
      exportedAt: new Date().toISOString()
    };
  }
}

const db = new AcrybiaDB();
