// ============================================
// Acrybia App — Main Controller (Helles Design)
// Version: 1.1.0
// ============================================

const app = {
  currentDate: new Date().toISOString().split('T')[0],
  currentDay: null,
  selectedCategory: null,
  selectedSubcategory: null,
  selectedPriority: 2,
  selectedTags: [],
  completingTaskId: null,
  weightSettings: { startWeight: null, targetWeight: 89, startWaist: null, targetWaist: null },

  categories: {
    arbeit: { icon: 'briefcase', color: 'blue', label: 'Arbeit', subs: {
      homeoffice: { label: 'Homeoffice', hasTime: true, detailType: 'blank' },
      office: { label: 'Office', hasTime: true, detailType: 'subsub', children: {
        fahrrad: { label: 'Fahrrad', hasTime: true, timeLabel: 'Arbeitsweg' },
        oepnv: { label: 'Öffentliche Verkehrsmittel', hasTime: true, timeLabel: 'Arbeitsweg' }
      }}
    }},
    acrybia: { icon: 'rocket', color: 'purple', label: 'Acrybia', subs: {
      blank: { label: 'Blank (Selbst eingeben)', hasTime: true, detailType: 'text' }
    }},
    sport: { icon: 'dumbbell', color: 'orange', label: 'Sport', subs: {
      krafttraining: { label: 'Krafttraining', hasTime: true },
      schwimmen: { label: 'Schwimmen', hasTime: true },
      boxen: { label: 'Boxen', hasTime: true },
      fitnessboxen: { label: 'Fitness Boxen', hasTime: true },
      pause: { label: 'Pause', hasTime: true }
    }},
    chinesisch: { icon: 'language', color: 'red', label: 'Chinesisch', subs: {
      hsk1: { label: 'HSK 1', hasTime: true, detailType: 'hsk' },
      hsk2: { label: 'HSK 2', hasTime: true, detailType: 'hsk' },
      hsk3: { label: 'HSK 3', hasTime: true, detailType: 'hsk' },
      hsk4: { label: 'HSK 4', hasTime: true, detailType: 'hsk' },
      hsk5: { label: 'HSK 5', hasTime: true, detailType: 'hsk' },
      hsk6: { label: 'HSK 6', hasTime: true, detailType: 'hsk' }
    }},
    custom: { icon: 'plus-circle', color: 'emerald', label: 'Weiteres', subs: {
      blank: { label: 'Blank (Selbst eingeben)', hasTime: true, detailType: 'text' }
    }}
  },

  async init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    const savedStart = await db.getSettings('startWeight');
    const savedTarget = await db.getSettings('targetWeight');
    const savedStartWaist = await db.getSettings('startWaist');
    const savedTargetWaist = await db.getSettings('targetWaist');
    if (savedStart !== undefined) this.weightSettings.startWeight = savedStart;
    if (savedTarget !== undefined) this.weightSettings.targetWeight = savedTarget;
    if (savedStartWaist !== undefined) this.weightSettings.startWaist = savedStartWaist;
    if (savedTargetWaist !== undefined) this.weightSettings.targetWaist = savedTargetWaist;

    await this.loadDay();

    Charts.initWeightChart();
    Charts.initWaistChart();
    this.updateCharts();

    this.renderWeekChallenges();
    this.renderTasks();
    this.renderBody();
    this.renderWeekDayStrip();
    this.renderTimeline();
    this.renderWeekGoals();
    this.updateDayCompleteButton();
  },

  async loadDay() {
    this.currentDay = await db.getDay(this.currentDate);
  },

  switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tab).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    if (tab === 'dashboard') { this.renderWeekDayStrip(); this.renderTimeline(); }
    if (tab === 'week') this.renderWeekGoals();
    if (tab === 'tasks') { this.renderWeekChallenges(); this.renderTasks(); }
  },

  // ========== WEEKLY CHALLENGES (Home) ==========
  async renderWeekChallenges() {
    const weekId = db.getWeekId(this.currentDate);
    const goals = await db.getWeekGoals(weekId);
    const container = document.getElementById('weekChallenges');
    container.innerHTML = '';

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="challenge-card bg-gradient-to-br from-primary to-primary-light rounded-2xl p-5 text-white shadow-lg shadow-primary/20">
          <p class="text-xs font-medium opacity-80 mb-1">Noch keine Ziele</p>
          <h3 class="text-lg font-bold mb-3">Erstelle dein erstes Wochenziel</h3>
          <div class="w-full bg-white/20 rounded-full h-2 mb-2">
            <div class="bg-white rounded-full h-2" style="width: 0%"></div>
          </div>
          <p class="text-xs opacity-70">0%</p>
        </div>
        <div class="challenge-card bg-gradient-to-br from-purple-500 to-purple-400 rounded-2xl p-5 text-white shadow-lg shadow-purple/20">
          <p class="text-xs font-medium opacity-80 mb-1">Tipp</p>
          <h3 class="text-lg font-bold mb-3">Bleib konsistent</h3>
          <p class="text-sm opacity-80">Trage täglich deine Tasks ein, um Fortschritte zu sehen.</p>
        </div>
      `;
      return;
    }

    const colors = [
      ['from-primary', 'to-primary-light', 'shadow-primary/20'],
      ['from-purple-500', 'to-purple-400', 'shadow-purple/20'],
      ['from-orange-500', 'to-orange-400', 'shadow-orange/20'],
      ['from-emerald-500', 'to-emerald-400', 'shadow-emerald/20']
    ];

    goals.forEach((goal, i) => {
      const color = colors[i % colors.length];
      const el = document.createElement('div');
      el.className = `challenge-card bg-gradient-to-br ${color[0]} ${color[1]} rounded-2xl p-5 text-white shadow-lg ${color[2]}`;
      el.innerHTML = `
        <p class="text-xs font-medium opacity-80 mb-1">${this.categories[goal.category]?.label || goal.category}</p>
        <h3 class="text-lg font-bold mb-3 leading-tight">${goal.text}</h3>
        <div class="w-full bg-white/20 rounded-full h-2 mb-2">
          <div class="bg-white rounded-full h-2" style="width: ${Math.random() * 40 + 10}%"></div>
        </div>
        <p class="text-xs opacity-70">In Bearbeitung</p>
      `;
      container.appendChild(el);
    });
  },

  // ========== TASK LIST (Home) ==========
  renderTasks() {
    const list = document.getElementById('tasksList');
    list.innerHTML = '';
    if (this.currentDay.tasks.length === 0) {
      list.innerHTML = `
        <div class="text-center py-10">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i class="fas fa-clipboard-list text-2xl text-gray-300"></i>
          </div>
          <p class="text-sm text-gray-400 font-medium">Noch keine Aufgaben für heute</p>
          <p class="text-xs text-gray-300 mt-1">Tippe auf das + um zu starten</p>
        </div>
      `;
      return;
    }
    const sorted = [...this.currentDay.tasks].sort((a, b) => a.priority - b.priority);
    sorted.forEach(task => {
      const cat = this.categories[task.category];
      const sub = cat?.subs[task.subcategory];
      const el = document.createElement('div');
      el.className = `task-item bg-white rounded-2xl p-4 border border-gray-100 shadow-sm ${task.completed ? 'completed' : ''}`;
      const timeStr = task.startTime && task.endTime ? `${task.startTime}-${task.endTime}` : (task.startTime || '');
      const detailStr = task.detail ? `<p class="text-xs text-gray-400 mt-1">${task.detail}</p>` : '';
      const achievementStr = task.achievement ? `<p class="text-xs text-emerald-500 mt-1 font-medium"><i class="fas fa-check mr-1"></i>${task.achievement}</p>` : '';
      const badgeClass = task.priority === 1 ? 'badge-high' : (task.priority === 2 ? 'badge-medium' : 'badge-low');
      const badgeText = task.priority === 1 ? 'High' : (task.priority === 2 ? 'Medium' : 'Low');
      el.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-2.5 h-2.5 rounded-full mt-2 dot-${task.category} flex-shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="task-title font-semibold text-sm text-gray-900">${sub?.label || task.subcategory}</p>
                <p class="text-xs text-gray-400 mt-0.5">${cat?.label || task.category}${timeStr ? ' · ' + timeStr : ''}</p>
                ${detailStr}
                ${achievementStr}
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-[10px] font-bold px-2 py-1 rounded-full ${badgeClass}">${badgeText}</span>
                ${!task.completed ? `
                  <button onclick="app.openCompleteModal('${task.id}')" class="w-8 h-8 rounded-full bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 flex items-center justify-center transition text-gray-400 hover:text-emerald-500">
                    <i class="fas fa-check text-xs"></i>
                  </button>
                ` : '<i class="fas fa-check-circle text-emerald-500 text-lg"></i>'}
              </div>
            </div>
          </div>
        </div>
      `;
      list.appendChild(el);
    });
  },

  // ========== WEEK DAY STRIP (Schedule) ==========
  renderWeekDayStrip() {
    const strip = document.getElementById('weekDayStrip');
    strip.innerHTML = '';
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - today.getDay() + 1 + i);
      const ds = d.toISOString().split('T')[0];
      const isToday = ds === this.currentDate;
      const dayNum = d.getDate();
      const btn = document.createElement('button');
      btn.className = `day-strip-item w-11 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${isToday ? 'active' : ''}`;
      btn.innerHTML = `<span class="text-[10px] font-medium opacity-70">${dayNames[i]}</span><span class="text-sm font-bold">${dayNum}</span>`;
      btn.onclick = () => {
        this.currentDate = ds;
        this.loadDay().then(() => {
          this.renderTimeline();
          this.renderTasks();
        });
        document.querySelectorAll('.day-strip-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
      strip.appendChild(btn);
    }
  },

  // ========== TIMELINE (Schedule) ==========
  async renderTimeline() {
    const container = document.getElementById('timelineView');
    container.innerHTML = '';
    const day = await db.getDay(this.currentDate);
    const tasks = day.tasks || [];

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i class="fas fa-clock text-2xl text-gray-300"></i>
          </div>
          <p class="text-sm text-gray-400 font-medium">Keine Tasks für diesen Tag</p>
          <p class="text-xs text-gray-300 mt-1">Wähle einen anderen Tag oder erstelle eine Aufgabe</p>
        </div>
      `;
      return;
    }

    const sorted = [...tasks].sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });

    sorted.forEach(task => {
      const cat = this.categories[task.category];
      const sub = cat?.subs[task.subcategory];
      const el = document.createElement('div');
      el.className = 'timeline-item mb-6';
      const timeLabel = task.startTime || '––:––';
      const badgeClass = task.priority === 1 ? 'badge-high' : (task.priority === 2 ? 'badge-medium' : 'badge-low');
      const badgeText = task.priority === 1 ? 'High' : (task.priority === 2 ? 'Medium' : 'Low');
      el.innerHTML = `
        <div class="text-xs font-bold text-gray-400 w-12 text-right absolute left-0 top-6">${timeLabel}</div>
        <div class="timeline-dot dot-${task.category}"></div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm ${task.completed ? 'opacity-50' : ''}">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-sm text-gray-900 ${task.completed ? 'line-through text-gray-400' : ''}">${sub?.label || task.subcategory}</p>
              <p class="text-xs text-gray-400 mt-0.5">${cat?.label || task.category}</p>
              ${task.detail ? `<p class="text-xs text-gray-400 mt-1">${task.detail}</p>` : ''}
            </div>
            <div class="flex flex-col items-end gap-1.5">
              <span class="text-[10px] font-bold px-2 py-1 rounded-full ${badgeClass}">${badgeText}</span>
              ${!task.completed ? `
                <button onclick="app.openCompleteModal('${task.id}')" class="w-7 h-7 rounded-full bg-gray-50 hover:bg-emerald-50 border border-gray-200 flex items-center justify-center transition text-gray-400 hover:text-emerald-500">
                  <i class="fas fa-check text-[10px]"></i>
                </button>
              ` : '<i class="fas fa-check-circle text-emerald-500"></i>'}
            </div>
          </div>
        </div>
      `;
      container.appendChild(el);
    });
  },

  // ========== TASK MODAL ==========
  openTaskModal() {
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.selectedPriority = 2;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector('[data-prio="2"]').classList.add('selected');
    document.getElementById('subcategorySection').classList.add('hidden');
    document.getElementById('detailSection').classList.add('hidden');
    document.getElementById('taskStart').value = '';
    document.getElementById('taskEnd').value = '';
    document.getElementById('taskModal').classList.remove('hidden');
  },

  closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
  },

  selectCategory(cat) {
    this.selectedCategory = cat;
    this.selectedSubcategory = null;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-cat="${cat}"]`).classList.add('selected');
    this.renderSubcategories(cat);
  },

  renderSubcategories(cat) {
    const cfg = this.categories[cat];
    const grid = document.getElementById('subcategoryGrid');
    grid.innerHTML = '';
    Object.entries(cfg.subs).forEach(([key, sub]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sub-btn p-3 rounded-xl bg-gray-50 border-2 border-gray-100 hover:border-primary transition text-sm font-medium text-gray-700';
      btn.textContent = sub.label;
      btn.onclick = () => this.selectSubcategory(key);
      grid.appendChild(btn);
    });
    document.getElementById('subcategorySection').classList.remove('hidden');
    document.getElementById('detailSection').classList.add('hidden');
  },

  selectSubcategory(sub) {
    this.selectedSubcategory = sub;
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('selected'));
    event.target.classList.add('selected');
    this.renderDetailInput();
  },

  renderDetailInput() {
    const cat = this.categories[this.selectedCategory];
    const sub = cat.subs[this.selectedSubcategory];
    const container = document.getElementById('detailInputContainer');
    const section = document.getElementById('detailSection');
    const label = document.getElementById('detailLabel');
    container.innerHTML = '';

    if (sub.detailType === 'subsub' && sub.children) {
      label.textContent = 'Verkehrsmittel';
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-2 gap-2';
      Object.entries(sub.children).forEach(([k, child]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'detail-sub-btn p-2.5 rounded-lg bg-gray-50 border-2 border-gray-100 text-xs font-medium text-gray-700 hover:border-primary transition';
        btn.textContent = child.label;
        btn.onclick = () => {
          document.querySelectorAll('.detail-sub-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          btn.dataset.value = k;
        };
        grid.appendChild(btn);
      });
      container.appendChild(grid);
      section.classList.remove('hidden');
      return;
    }

    if (sub.detailType === 'hsk') {
      label.textContent = 'Thema';
      const input1 = document.createElement('input');
      input1.type = 'text';
      input1.placeholder = 'Thema eingeben...';
      input1.className = 'w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 mb-2 focus:outline-none focus:border-primary transition';
      input1.id = 'detailTopic';
      const label2 = document.createElement('label');
      label2.className = 'block text-xs text-gray-400 mb-1 mt-2 font-medium';
      label2.textContent = 'Unterthemen (gelernt)';
      const input2 = document.createElement('input');
      input2.type = 'text';
      input2.placeholder = 'z.B. Zahlen, Farben, Familie...';
      input2.className = 'w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition';
      input2.id = 'detailSubtopics';
      container.appendChild(input1);
      container.appendChild(label2);
      container.appendChild(input2);
      section.classList.remove('hidden');
      return;
    }

    if (sub.detailType === 'text' || sub.detailType === 'blank') {
      label.textContent = 'Beschreibung';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Was genau?...';
      input.className = 'w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition';
      input.id = 'detailText';
      container.appendChild(input);
      section.classList.remove('hidden');
      return;
    }

    section.classList.add('hidden');
  },

  selectPriority(prio) {
    this.selectedPriority = prio;
    document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-prio="${prio}"]`).classList.add('selected');
  },

  async saveTask() {
    if (!this.selectedCategory || !this.selectedSubcategory) {
      alert('Bitte Kategorie und Unterkategorie wählen');
      return;
    }
    const cat = this.categories[this.selectedCategory];
    const sub = cat.subs[this.selectedSubcategory];
    let detail = '';
    if (sub.detailType === 'subsub') {
      const selected = document.querySelector('.detail-sub-btn.selected');
      detail = selected ? selected.dataset.value : '';
    } else if (sub.detailType === 'hsk') {
      const topic = document.getElementById('detailTopic')?.value || '';
      const subtopics = document.getElementById('detailSubtopics')?.value || '';
      detail = topic + (subtopics ? ' | ' + subtopics : '');
    } else {
      detail = document.getElementById('detailText')?.value || '';
    }

    const task = {
      id: db.uuid(),
      category: this.selectedCategory,
      subcategory: this.selectedSubcategory,
      detail: detail,
      startTime: document.getElementById('taskStart').value,
      endTime: document.getElementById('taskEnd').value,
      priority: this.selectedPriority,
      completed: false,
      achievement: ''
    };

    this.currentDay.tasks.push(task);
    await db.saveDay(this.currentDay);
    this.closeTaskModal();
    this.renderTasks();
    this.renderTimeline();
    this.updateCharts();
    this.updateDayCompleteButton();
  },

  // ========== TASK COMPLETE ==========
  openCompleteModal(taskId) {
    this.completingTaskId = taskId;
    document.getElementById('taskAchievement').value = '';
    document.getElementById('completeTaskModal').classList.remove('hidden');
  },

  closeCompleteTaskModal() {
    document.getElementById('completeTaskModal').classList.add('hidden');
  },

  async completeTask() {
    const achievement = document.getElementById('taskAchievement').value;
    const task = this.currentDay.tasks.find(t => t.id === this.completingTaskId);
    if (task) {
      task.completed = true;
      task.achievement = achievement;
      await db.saveDay(this.currentDay);
      this.closeCompleteTaskModal();
      this.renderTasks();
      this.renderTimeline();
      this.updateCharts();
      this.updateDayCompleteButton();
    }
  },

  // ========== DAY COMPLETE ==========
  updateDayCompleteButton() {
    const openCount = this.currentDay.tasks.filter(t => !t.completed).length;
    const btnText = document.getElementById('dayCompleteBtnText');
    const btn = document.getElementById('dayCompleteBtn');
    if (!btn || !btnText) return;
    if (openCount > 0) {
      btnText.textContent = `Abschließen (${openCount} offen)`;
      btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
      btn.classList.add('bg-amber-500', 'hover:bg-amber-600');
    } else {
      btnText.textContent = 'Tag abschließen';
      btn.classList.remove('bg-amber-500', 'hover:bg-amber-600');
      btn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
    }
  },

  openDayCompleteModal() {
    const openCount = this.currentDay.tasks.filter(t => !t.completed).length;
    const warning = document.getElementById('dayCompleteWarning');
    if (openCount > 0) {
      warning.textContent = `Noch ${openCount} offene Aufgabe(n) — trotzdem abschließen?`;
      warning.classList.remove('hidden');
    } else {
      warning.classList.add('hidden');
    }
    this.selectedTags = [];
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('refProblemCat').value = 'arbeit';
    document.getElementById('refProblemText').value = '';
    document.getElementById('refBlocker').value = '';
    document.getElementById('refBlockerWhy').value = '';
    document.getElementById('refMood').value = 3;
    document.getElementById('moodVal').textContent = '3';
    document.getElementById('refEnergy').value = 3;
    document.getElementById('energyVal').textContent = '3';
    document.getElementById('shameToggle').checked = false;
    document.getElementById('shameFields').classList.add('hidden');
    document.getElementById('shameWhen').value = '';
    document.getElementById('shameWhy').value = '';
    document.getElementById('fearToggle').checked = false;
    document.getElementById('fearFields').classList.add('hidden');
    document.getElementById('fearWhy').value = '';
    document.getElementById('dayCompleteModal').classList.remove('hidden');
  },

  toggleShame() {
    const checked = document.getElementById('shameToggle').checked;
    document.getElementById('shameFields').classList.toggle('hidden', !checked);
  },

  toggleFear() {
    const checked = document.getElementById('fearToggle').checked;
    document.getElementById('fearFields').classList.toggle('hidden', !checked);
  },

  toggleTag(btn, tag) {
    btn.classList.toggle('selected');
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    } else {
      this.selectedTags.push(tag);
    }
  },

  async saveDayComplete() {
    const openCount = this.currentDay.tasks.filter(t => !t.completed).length;
    this.currentDay.completedWithOpenTasks = openCount > 0;
    this.currentDay.completed = true;
    this.currentDay.reflection = {
      biggestProblem: {
        category: document.getElementById('refProblemCat').value,
        text: document.getElementById('refProblemText').value
      },
      blocker: document.getElementById('refBlocker').value,
      blockerWhy: document.getElementById('refBlockerWhy').value,
      tags: [...this.selectedTags],
      mood: parseInt(document.getElementById('refMood').value),
      energy: parseInt(document.getElementById('refEnergy').value),
      shame: {
        experienced: document.getElementById('shameToggle').checked,
        when: document.getElementById('shameWhen').value,
        why: document.getElementById('shameWhy').value
      },
      fear: {
        experienced: document.getElementById('fearToggle').checked,
        why: document.getElementById('fearWhy').value
      }
    };
    await db.saveDay(this.currentDay);
    document.getElementById('dayCompleteModal').classList.add('hidden');
    this.updateCharts();
    this.updateDayCompleteButton();
    alert('Tag abgeschlossen! Gut gemacht!');
  },

  // ========== BODY ==========
  async saveWeight() {
    const val = parseFloat(document.getElementById('weightInput').value);
    if (!val) return;
    if (!this.weightSettings.startWeight) {
      this.weightSettings.startWeight = val;
      await db.saveSettings('startWeight', val);
    }
    this.currentDay.body.weight = val;
    await db.saveDay(this.currentDay);
    this.renderBody();
    this.updateCharts();
  },

  async saveWaist() {
    const val = parseFloat(document.getElementById('waistInput').value);
    if (!val) return;
    if (!this.weightSettings.startWaist) {
      this.weightSettings.startWaist = val;
      await db.saveSettings('startWaist', val);
    }
    this.currentDay.body.waist = val;
    await db.saveDay(this.currentDay);
    this.renderBody();
    this.updateCharts();
  },

  async saveBody() {
    this.currentDay.body.meals = {
      morning: document.getElementById('mealMorning').value,
      lunch: document.getElementById('mealLunch').value,
      dinner: document.getElementById('mealDinner').value,
      snack: document.getElementById('mealSnack').value
    };
    this.currentDay.body.protein = parseInt(document.getElementById('proteinInput').value) || null;
    await db.saveDay(this.currentDay);
    alert('Body-Daten gespeichert!');
  },

  renderBody() {
    const body = this.currentDay.body;
    document.getElementById('currentWeightDisplay').textContent = body.weight || '--';
    document.getElementById('weightInput').value = body.weight || '';
    document.getElementById('currentWaistDisplay').textContent = body.waist || '--';
    document.getElementById('waistInput').value = body.waist || '';
    document.getElementById('mealMorning').value = body.meals?.morning || '';
    document.getElementById('mealLunch').value = body.meals?.lunch || '';
    document.getElementById('mealDinner').value = body.meals?.dinner || '';
    document.getElementById('mealSnack').value = body.meals?.snack || '';
    document.getElementById('proteinInput').value = body.protein || '';
  },

  openWeightSettings() {
    document.getElementById('startWeightInput').value = this.weightSettings.startWeight || '';
    document.getElementById('targetWeightInput').value = this.weightSettings.targetWeight;
    document.getElementById('startWaistInput').value = this.weightSettings.startWaist || '';
    document.getElementById('targetWaistInput').value = this.weightSettings.targetWaist || '';
    document.getElementById('weightSettingsModal').classList.remove('hidden');
  },

  closeWeightSettings() {
    document.getElementById('weightSettingsModal').classList.add('hidden');
  },

  async saveWeightSettings() {
    this.weightSettings.startWeight = parseFloat(document.getElementById('startWeightInput').value) || null;
    this.weightSettings.targetWeight = parseFloat(document.getElementById('targetWeightInput').value) || 89;
    this.weightSettings.startWaist = parseFloat(document.getElementById('startWaistInput').value) || null;
    this.weightSettings.targetWaist = parseFloat(document.getElementById('targetWaistInput').value) || null;
    await db.saveSettings('startWeight', this.weightSettings.startWeight);
    await db.saveSettings('targetWeight', this.weightSettings.targetWeight);
    await db.saveSettings('startWaist', this.weightSettings.startWaist);
    await db.saveSettings('targetWaist', this.weightSettings.targetWaist);
    this.closeWeightSettings();
    this.updateCharts();
  },

  // ========== CHARTS ==========
  updateCharts() {
    const body = this.currentDay.body;
    if (body.weight && this.weightSettings.startWeight && this.weightSettings.targetWeight) {
      Charts.updateWeightChart(body.weight, this.weightSettings.startWeight, this.weightSettings.targetWeight);
    }
    if (body.waist && this.weightSettings.startWaist && this.weightSettings.targetWaist) {
      Charts.updateWaistChart(body.waist, this.weightSettings.startWaist, this.weightSettings.targetWaist);
    }
  },

  // ========== WEEK GOALS ==========
  async renderWeekGoals() {
    const weekId = db.getWeekId(this.currentDate);
    const goals = await db.getWeekGoals(weekId);
    const container = document.getElementById('weekGoals');
    container.innerHTML = '';
    if (goals.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i class="fas fa-bullseye text-2xl text-gray-300"></i>
          </div>
          <p class="text-sm text-gray-400 font-medium">Noch keine Wochenziele</p>
          <p class="text-xs text-gray-300 mt-1">Füge oben ein Ziel hinzu</p>
        </div>
      `;
      return;
    }
    goals.forEach(goal => {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm';
      el.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full dot-${goal.category}"></div>
          <div>
            <p class="text-sm font-semibold text-gray-900">${goal.text}</p>
            <p class="text-xs text-gray-400">${this.categories[goal.category]?.label || goal.category}</p>
          </div>
        </div>
        <button onclick="app.deleteWeekGoalItem(${goal.id})" class="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-50 flex items-center justify-center transition text-gray-400 hover:text-red-500">
          <i class="fas fa-trash text-xs"></i>
        </button>
      `;
      container.appendChild(el);
    });
  },

  async addWeekGoal() {
    const text = prompt('Wochenziel:');
    if (!text) return;
    const category = prompt('Kategorie (arbeit/acrybia/sport/chinesisch/custom):', 'arbeit');
    if (!category) return;
    const goal = { weekId: db.getWeekId(this.currentDate), text, category, created: new Date().toISOString() };
    await db.saveWeekGoal(goal);
    this.renderWeekGoals();
    this.renderWeekChallenges();
  },

  async deleteWeekGoalItem(id) {
    if (!confirm('Wirklich löschen?')) return;
    await db.deleteWeekGoal(id);
    this.renderWeekGoals();
    this.renderWeekChallenges();
  },

  // ========== EXPORT ==========
  async exportData() {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acrybia-export-${this.currentDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
