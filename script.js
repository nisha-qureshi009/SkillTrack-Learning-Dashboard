const STORAGE_KEY = "skilltrack-data-v1";
const defaultData = {
  goals: [
    { id: 1, name: "Master HTML & CSS", category: "Development", progress: 75 },
    { id: 2, name: "Learn JavaScript basics", category: "Development", progress: 35 },
    { id: 3, name: "Build a personal portfolio", category: "Career", progress: 15 }
  ],
  tasks: [
    { id: 101, title: "Review CSS Flexbox and Grid", completed: true },
    { id: 102, title: "Practice JavaScript array methods", completed: false },
    { id: 103, title: "Write notes from today's lesson", completed: false }
  ]
};

let data = loadData();
let editingGoalId = null;

const $ = (selector) => document.querySelector(selector);
const goalList = $("#goalList");
const taskList = $("#taskList");
const goalDialog = $("#goalDialog");

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(defaultData);
  } catch (error) {
    console.warn("Could not load saved data:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderGoals() {
  $("#totalGoals").textContent = data.goals.length;
  if (!data.goals.length) {
    goalList.innerHTML = '<div class="empty-state">No goals yet. Add your first learning goal to get started.</div>';
    return;
  }
  goalList.innerHTML = data.goals.map((goal) => `
    <article class="goal-item">
      <div class="goal-symbol">${goal.category === "Design" ? "✎" : goal.category === "Career" ? "↗" : "⌘"}</div>
      <div class="goal-info">
        <strong>${escapeHTML(goal.name)}</strong>
        <span>${escapeHTML(goal.category)}</span>
        <div class="goal-progress"><span style="width:${goal.progress}%"></span></div>
      </div>
      <div class="goal-percent">${goal.progress}%</div>
      <button class="delete-task" data-delete-goal="${goal.id}" aria-label="Delete ${escapeHTML(goal.name)}">×</button>
    </article>`).join("");
}

function renderTasks() {
  const filter = $("#taskFilter").value;
  const visible = data.tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });
  if (!visible.length) {
    taskList.innerHTML = '<div class="empty-state">Nothing here yet. Add a task and make some progress.</div>';
  } else {
    taskList.innerHTML = visible.map((task) => `
      <div class="task-row ${task.completed ? "completed" : ""}">
        <input class="task-check" type="checkbox" data-task-check="${task.id}" ${task.completed ? "checked" : ""} aria-label="Mark ${escapeHTML(task.title)} complete">
        <span class="task-title">${escapeHTML(task.title)}</span>
        <span class="task-tag">${task.completed ? "Done" : "In progress"}</span>
        <button class="delete-task" data-delete-task="${task.id}" aria-label="Delete ${escapeHTML(task.title)}">×</button>
      </div>`).join("");
  }
  const done = data.tasks.filter((task) => task.completed).length;
  $("#taskSummary").textContent = `${data.tasks.length} task${data.tasks.length === 1 ? "" : "s"} · ${done} completed`;
  $("#completedTasks").textContent = done;
  $("#remainingTasks").textContent = data.tasks.length - done;
  const percent = data.tasks.length ? Math.round(done / data.tasks.length * 100) : 0;
  $("#focusPercent").textContent = `${percent}%`;
  $("#focusRing").style.background = `conic-gradient(var(--purple) ${percent}%, var(--line) ${percent}% 100%)`;
  $("#focusCaption").textContent = data.tasks.length ? (percent === 100 ? "Amazing work — all tasks completed!" : "Keep going. You're making progress.") : "Add a task to set your focus.";
  $("#overallProgress").textContent = data.goals.length ? Math.round(data.goals.reduce((sum, goal) => sum + Number(goal.progress), 0) / data.goals.length) : 0;
  $("#overallBar").style.width = `${$("#overallProgress").textContent}%`;
}

function render() {
  renderGoals();
  renderTasks();
  saveData();
}

function openGoalDialog(goal = null) {
  editingGoalId = goal ? goal.id : null;
  $("#goalModalTitle").textContent = goal ? "Update your learning goal" : "Create a learning goal";
  $("#goalName").value = goal ? goal.name : "";
  $("#goalCategory").value = goal ? goal.category : "Development";
  $("#goalProgress").value = goal ? goal.progress : 0;
  $("#progressValue").textContent = `${$("#goalProgress").value}%`;
  goalDialog.showModal();
  $("#goalName").focus();
}

$("#goalProgress").addEventListener("input", (event) => {
  $("#progressValue").textContent = `${event.target.value}%`;
});
$("#quickAddBtn").addEventListener("click", () => openGoalDialog());
$("#allGoalsBtn").addEventListener("click", () => openGoalDialog());
$("#closeGoalDialog").addEventListener("click", () => goalDialog.close());
$("#cancelGoal").addEventListener("click", () => goalDialog.close());

$("#goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#goalName").value.trim();
  if (!name) return;
  const goal = {
    id: editingGoalId || Date.now(),
    name,
    category: $("#goalCategory").value,
    progress: Number($("#goalProgress").value)
  };
  if (editingGoalId) {
    data.goals = data.goals.map((item) => item.id === editingGoalId ? goal : item);
  } else {
    data.goals.unshift(goal);
  }
  render();
  goalDialog.close();
});

goalList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-goal]");
  if (deleteButton) {
    data.goals = data.goals.filter((goal) => goal.id !== Number(deleteButton.dataset.deleteGoal));
    render();
    return;
  }
  const item = event.target.closest(".goal-item");
  if (item) {
    const goal = data.goals.find((entry) => item.querySelector("[data-delete-goal]")?.dataset.deleteGoal == entry.id);
    if (goal) openGoalDialog(goal);
  }
});

function addTask(value) {
  const title = value.trim();
  if (!title) return;
  data.tasks.unshift({ id: Date.now(), title, completed: false });
  $("#taskInput").value = "";
  render();
}

$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addTask($("#taskInput").value);
});
$("#addTaskBtn").addEventListener("click", () => {
  $("#taskInput").focus();
});
$("#taskFilter").addEventListener("change", renderTasks);

taskList.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-task-check]");
  if (!checkbox) return;
  const task = data.tasks.find((item) => item.id === Number(checkbox.dataset.taskCheck));
  if (task) task.completed = checkbox.checked;
  render();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-task]");
  if (!button) return;
  data.tasks = data.tasks.filter((task) => task.id !== Number(button.dataset.deleteTask));
  render();
});

$("#clearCompletedBtn").addEventListener("click", () => {
  data.tasks = data.tasks.filter((task) => !task.completed);
  render();
});

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  $("#themeBtn").textContent = isDark ? "☀" : "☾";
  localStorage.setItem("skilltrack-theme", isDark ? "dark" : "light");
});

if (localStorage.getItem("skilltrack-theme") === "dark") {
  document.body.classList.add("dark");
  $("#themeBtn").textContent = "☀";
}

$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    $("#sidebar").classList.remove("open");
  });
});

const now = new Date();
$("#todayLabel").textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
$("#datePill").textContent = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });

render();
