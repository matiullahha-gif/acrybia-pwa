// ============================================
// Chart.js Wrappers — Helles Design
// ============================================

const Charts = {
  taskChart: null,
  weightChart: null,
  waistChart: null,

  initTaskChart() {
    const ctx = document.getElementById('taskChart');
    if (!ctx) return;
    this.taskChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Erledigt', 'Offen'],
        datasets: [{
          data: [0, 1],
          backgroundColor: ['#10b981', '#f3f4f6'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  },

  updateTaskChart(completed, total) {
    if (!this.taskChart) return;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    this.taskChart.data.datasets[0].data = total === 0 ? [0, 1] : [completed, Math.max(0, total - completed)];
    this.taskChart.data.datasets[0].backgroundColor = [
      pct === 100 ? '#10b981' : '#4F46E5',
      '#f3f4f6'
    ];
    this.taskChart.update();
    const el = document.getElementById('taskProgressText');
    if (el) el.textContent = pct + '%';
  },

  initWeightChart() {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    this.weightChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Fortschritt', 'Verbleibend'],
        datasets: [{
          data: [0, 100],
          backgroundColor: ['#f97316', '#f3f4f6'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  },

  calcProgressPct(start, current, target) {
    const denom = start - target;
    if (!isFinite(denom) || denom === 0) return 0;
    const raw = ((start - current) / denom) * 100;
    return Math.max(0, Math.min(100, raw));
  },

  updateWeightChart(current, start, target) {
    if (!this.weightChart) return;
    const pct = this.calcProgressPct(start, current, target);
    this.weightChart.data.datasets[0].data = [pct, 100 - pct];
    this.weightChart.data.datasets[0].backgroundColor = [
      pct >= 100 ? '#10b981' : '#f97316',
      '#f3f4f6'
    ];
    this.weightChart.update();
  },

  initWaistChart() {
    const ctx = document.getElementById('waistChart');
    if (!ctx) return;
    this.waistChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Fortschritt', 'Verbleibend'],
        datasets: [{
          data: [0, 100],
          backgroundColor: ['#a855f7', '#f3f4f6'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  },

  updateWaistChart(current, start, target) {
    if (!this.waistChart) return;
    const pct = this.calcProgressPct(start, current, target);
    this.waistChart.data.datasets[0].data = [pct, 100 - pct];
    this.waistChart.data.datasets[0].backgroundColor = [
      pct >= 100 ? '#10b981' : '#a855f7',
      '#f3f4f6'
    ];
    this.waistChart.update();
  }
};
