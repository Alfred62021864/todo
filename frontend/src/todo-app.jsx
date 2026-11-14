import { useEffect, useMemo, useRef, useState } from "react";

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "保存できませんでした。もう一度お試しください。");
  }
  return response.status === 204 ? null : response.json();
}

function localDateString(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function formatDate(value, options = { month: "short", day: "numeric" }) {
  if (!value) return "未設定";
  return new Intl.DateTimeFormat("ja-JP", options).format(new Date(`${value}T00:00:00`));
}

function daysUntil(value) {
  if (!value) return null;
  return Math.ceil((new Date(`${value}T00:00:00`) - new Date(`${localDateString()}T00:00:00`)) / 86_400_000);
}

function tagHue(value = "") {
  return Array.from(value).reduce((hash, character) => (hash * 31 + character.codePointAt(0)) % 360, 17);
}

function ProgressChart({ history, progress }) {
  const width = 720;
  const height = 244;
  const left = 38;
  const right = 12;
  const top = 18;
  const bottom = 34;
  const graphHeight = height - top - bottom;
  const graphWidth = width - left - right;
  const points = history.slice(-14);
  const coordinate = (value, index) => ({
    x: points.length === 1 ? left + graphWidth : left + (index / (points.length - 1)) * graphWidth,
    y: top + graphHeight - (value / 100) * graphHeight,
  });
  const path = points.map((item, index) => {
    const point = coordinate(item.progress, index);
    return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
  }).join(" ");

  return (
    <div className="chart-wrap">
      {points.length === 0 ? (
        <div className="chart-empty"><span className="chart-empty-mark">↗</span><strong>記録をつけると、ここに歩みが描かれます。</strong><span>日々の振り返りを保存して、進捗の変化を見てみましょう。</span></div>
      ) : (
        <svg className="progress-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="目標進捗の推移">
          {[0, 25, 50, 75, 100].map((value) => {
            const y = top + graphHeight - (value / 100) * graphHeight;
            return <g key={value}><line x1={left} x2={width - right} y1={y} y2={y} className="chart-grid" /><text x={left - 10} y={y + 4} textAnchor="end" className="chart-axis">{value}%</text></g>;
          })}
          {points.length > 1 && <path d={`${path} L ${coordinate(points[points.length - 1].progress, points.length - 1).x} ${top + graphHeight} L ${coordinate(points[0].progress, 0).x} ${top + graphHeight} Z`} className="chart-area" />}
          {points.length > 1 && <path d={path} className="chart-line" />}
          {points.map((item, index) => {
            const point = coordinate(item.progress, index);
            return <g key={item.date}><circle cx={point.x} cy={point.y} r="4.5" className="chart-point" /><title>{formatDate(item.date, { year: "numeric", month: "long", day: "numeric" })}: {item.progress}%</title></g>;
          })}
          {[0, Math.floor((points.length - 1) / 2), points.length - 1].filter((value, index, list) => list.indexOf(value) === index).map((index) => {
            const point = coordinate(points[index].progress, index);
            return <text key={points[index].date} x={point.x} y={height - 7} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} className="chart-axis">{formatDate(points[index].date)}</text>;
          })}
        </svg>
      )}
      <div className="chart-current"><span className="chart-legend" />現在の達成率 <strong>{progress}%</strong></div>
    </div>
  );
}

function TaskProgress({ task, onChange, disabled = false }) {
  return (
    <label className={`progress-select ${disabled ? "is-disabled" : ""}`}>
      <span className="sr-only">{task.title}の進捗</span>
      <select aria-label={`${task.title}の進捗`} value={task.progress || 0} disabled={disabled} onChange={(event) => onChange(task, Number(event.target.value))}>
        {Array.from({ length: 11 }, (_, index) => index * 10).map((value) => <option key={value} value={value}>{value}%</option>)}
      </select>
    </label>
  );
}

function TaskName({ children, className = "", title }) {
  return <span className={`task-name ${className}`} title={title}><span className="task-name-icon" aria-hidden="true">☷</span><span className="task-name-text">{children}</span></span>;
}

function EditableTaskTitle({ task, onSave, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  async function save(event) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    const saved = await onSave(task, { title });
    if (saved) setEditing(false);
  }

  if (editing) {
    return <form className="task-title-edit" onSubmit={save}><input autoFocus aria-label={`${task.title}の課題名`} value={draft} maxLength={160} required onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { setDraft(task.title); setEditing(false); } }} /><button type="submit" disabled={disabled || !draft.trim()} aria-label="課題名を保存">✓</button><button type="button" disabled={disabled} onClick={() => { setDraft(task.title); setEditing(false); }} aria-label="編集をキャンセル">×</button></form>;
  }

  return <div className="task-title-display"><strong><TaskName>{task.title}</TaskName></strong><button type="button" className="task-title-edit-button" disabled={disabled} onClick={() => { setDraft(task.title); setEditing(true); }} aria-label={`${task.title}を編集`} title="課題名を編集">✎</button></div>;
}

export default function TodoApp() {
  const [workspace, setWorkspace] = useState(null);
  const [view, setView] = useState("daily");
  const [theme, setTheme] = useState(() => window.localStorage.getItem("today-theme") === "dark" ? "dark" : "light");
  const [filterTag, setFilterTag] = useState("");
  const [dailyDate, setDailyDate] = useState(localDateString());
  const [dailyTaskNotes, setDailyTaskNotes] = useState({});
  const [showSaveGuide, setShowSaveGuide] = useState(false);
  const [goalDraft, setGoalDraft] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTag, setTaskTag] = useState("");
  const [childParent, setChildParent] = useState(null);
  const [childTitle, setChildTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [navExpanded, setNavExpanded] = useState(false);
  const dailySaveButtonRef = useRef(null);

  async function loadWorkspace() {
    const data = await request("/api/workspace");
    setWorkspace(data);
    setGoalDraft(data.goal);
    return data;
  }

  useEffect(() => {
    loadWorkspace().catch(() => setError("データを読み込めませんでした。時間をおいて再読み込みしてください。"));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("today-theme", theme);
  }, [theme]);

  useEffect(() => {
    setNotice("");
    setError("");
    setShowSaveGuide(false);
  }, [view]);

  useEffect(() => setShowSaveGuide(false), [dailyDate]);

  const dailyEntryActivitiesKey = JSON.stringify(workspace?.daily_entries.find((item) => item.date === dailyDate)?.activities || []);
  useEffect(() => {
    const notes = Object.fromEntries(JSON.parse(dailyEntryActivitiesKey).map((activity) => [activity.task_id, {
      done: activity.done || activity.content || "",
      not_done: activity.not_done || "",
    }]));
    setDailyTaskNotes(notes);
  }, [dailyDate, dailyEntryActivitiesKey]);

  const rootTasks = useMemo(() => workspace?.tasks.filter((task) => !task.parent_id) || [], [workspace]);
  const tasksByParent = useMemo(() => {
    const grouped = new Map();
    workspace?.tasks.filter((task) => task.parent_id).forEach((task) => {
      grouped.set(task.parent_id, [...(grouped.get(task.parent_id) || []), task]);
    });
    return grouped;
  }, [workspace]);
  const taskTags = useMemo(() => [...new Set((workspace?.tasks || []).map((task) => task.tag?.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, "ja")), [workspace]);
  const visibleRootTasks = rootTasks.filter((task) => !filterTag || task.tag === filterTag || (tasksByParent.get(task.id) || []).some((child) => child.tag === filterTag));
  const selectedEntry = workspace?.daily_entries.find((item) => item.date === dailyDate);
  const taskLeaves = workspace?.tasks.filter((task) => task.parent_id || !workspace.tasks.some((child) => child.parent_id === task.id)) || [];
  const withinGoalPeriod = (!workspace?.goal?.start_date || dailyDate >= workspace.goal.start_date) && (!workspace?.goal?.target_date || dailyDate <= workspace.goal.target_date);
  const dueDateForTask = (task) => task.due_date || (task.parent_id ? workspace?.tasks.find((item) => item.id === task.parent_id)?.due_date : null) || null;
  const selectedPlanTasks = withinGoalPeriod ? [...taskLeaves].sort((left, right) => {
    const leftDays = daysUntil(dueDateForTask(left));
    const rightDays = daysUntil(dueDateForTask(right));
    if (leftDays === null) return rightDays === null ? 0 : 1;
    if (rightDays === null) return -1;
    return leftDays - rightDays;
  }) : [];
  const activePlanTasks = selectedPlanTasks.filter((task) => task.progress < 100);
  const selectedPlanTaskIds = selectedPlanTasks.map((task) => task.id);
  const daysRemaining = workspace?.goal.target_date
    ? Math.ceil((new Date(`${workspace.goal.target_date}T00:00:00`) - new Date(`${localDateString()}T00:00:00`)) / 86_400_000)
    : null;

  async function refreshAfter(action, successMessage) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await loadWorkspace();
      setNotice(successMessage);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveGoal(event) {
    event.preventDefault();
    await refreshAfter(() => request("/api/goal", { method: "PATCH", body: JSON.stringify({ goal: goalDraft }) }), "目標を保存しました。");
  }

  async function addTask(event, parentId = null) {
    event.preventDefault();
    const title = parentId ? childTitle : taskTitle;
    if (!title.trim()) return;
    const saved = await refreshAfter(() => request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ task: { title: title.trim(), parent_id: parentId, due_date: parentId ? null : taskDate, tag: parentId ? null : taskTag } }),
    }), parentId ? "子課題を追加しました。" : "課題を追加しました。");
    if (saved && parentId) { setChildTitle(""); setChildParent(null); }
    if (saved && !parentId) { setTaskTitle(""); setTaskDate(""); setTaskTag(""); }
  }

  function changeTaskTag(task, tag) {
    setWorkspace((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, tag } : item) }));
  }

  async function updateTask(task, changes, successMessage = "計画を更新しました。") {
    return refreshAfter(() => request(`/api/tasks/${task.id}`, {
      method: "PATCH", body: JSON.stringify({ task: changes }),
    }), successMessage);
  }

  async function removeTask(task) {
    setTaskToDelete(task);
  }

  async function confirmRemoveTask() {
    if (!taskToDelete) return;
    const removed = await refreshAfter(() => request(`/api/tasks/${taskToDelete.id}`, { method: "DELETE" }), "課題を削除しました。");
    if (removed) setTaskToDelete(null);
  }

  async function saveDaily(event) {
    event.preventDefault();
    if (selectedPlanTasks.length === 0) {
      setError("記録する課題を「今日やること」に追加してください。");
      return;
    }
    const plannedIds = new Set(selectedPlanTasks.map((task) => task.id));
    const activities = (selectedEntry?.activities || []).filter((item) => !plannedIds.has(Number(item.task_id)));
    selectedPlanTasks.forEach((task) => {
      const note = dailyTaskNotes[task.id] || {};
      const done = (note.done || "").trim();
      const notDone = (note.not_done || "").trim();
      if (done || notDone) activities.push({ task_id: task.id, task_title: task.title, done, not_done: notDone });
    });
    const saved = await refreshAfter(() => request(`/api/daily_entries/${dailyDate}`, {
      method: "PUT",
      body: JSON.stringify({ daily_entry: { activities } }),
    }), "今日の記録を保存しました。");
    if (saved) setShowSaveGuide(false);
  }

  function jumpToDailySave() {
    dailySaveButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    dailySaveButtonRef.current?.focus({ preventScroll: true });
  }

  function chooseDaily(date) {
    setDailyDate(date);
    setView("daily");
  }

  if (!workspace) return <main className="loading-screen"><span className="brand-mark">t</span><p>あなたの計画を開いています…</p></main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => { setView("daily"); setNavExpanded(false); }}><span className="brand-mark">t</span><span>today</span><span className="brand-divider">/</span><span className="brand-sub">目標とふりかえり</span></a>
        <nav className="main-nav" aria-label="メインナビゲーション">
          {[{ id: "daily", label: "今日の記録", icon: "✎" }, { id: "plan", label: "計画", icon: "☷" }].map((item) => (
            <button type="button" key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} aria-label={item.label} onClick={() => { setView(item.id); setNavExpanded(false); }}><span className="nav-item-icon">{item.icon}</span><span className="nav-item-label">{item.label}</span>{item.id === "daily" && <i className="nav-today-dot" />}</button>
          ))}
          <div className={`nav-extra ${navExpanded ? "is-expanded" : ""}`}>
            {[{ id: "review", label: "振り返り", icon: "↗" }, { id: "settings", label: "設定", icon: "⚙" }].map((item) => (
              <button type="button" key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} aria-label={item.label} onClick={() => { setView(item.id); setNavExpanded(false); }}><span className="nav-item-icon">{item.icon}</span><span className="nav-item-label">{item.label}</span></button>
            ))}
          </div>
          <button type="button" className="nav-more" aria-label="その他のメニュー" aria-expanded={navExpanded} onClick={() => setNavExpanded((expanded) => !expanded)}>{navExpanded ? "×" : "···"}</button>
          <span className="nav-spacer" />
          <span className="nav-goal-chip"><span />{workspace.goal.title}</span>
        </nav>
        <div className="header-date"><span className="online-dot" />{formatDate(localDateString(), { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</div>
      </header>

      {(error || notice) && <div className={`toast ${error ? "toast-error" : "toast-success"}`} role={error ? "alert" : "status"}>{error || notice}<button type="button" onClick={() => { setError(""); setNotice(""); }} aria-label="閉じる">×</button></div>}

      {taskToDelete && <div className="dialog-backdrop"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description"><span className="confirm-dialog-icon">!</span><h2 id="delete-dialog-title">課題を削除しますか？</h2><p id="delete-dialog-description">「{taskToDelete.title}」{(tasksByParent.get(taskToDelete.id) || []).length ? "とその子課題" : ""}を削除します。この操作は取り消せません。</p><div className="confirm-dialog-actions"><button type="button" className="button button-light" disabled={busy} onClick={() => setTaskToDelete(null)}>キャンセル</button><button type="button" className="button button-danger" disabled={busy} onClick={confirmRemoveTask}>{busy ? "削除中…" : "削除する"}</button></div></section></div>}


      {view === "overview" && (
        <section className="view-content">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />YOUR NORTH STAR</div><h1>大切なことを、<em>一歩ずつ。</em></h1><p>目標を小さく分けて、今日できることから進めよう。</p></div><button type="button" className="button button-dark" onClick={() => setView("daily")}>今日を記録する <span>↗</span></button></div>

          <form className="goal-card" onSubmit={saveGoal}>
            <div className="goal-card-top"><div className="section-label">FOCUS GOAL <span className="section-label-line" /></div><span className="goal-badge"><span>✦</span> MY GOAL</span></div>
            <div className="goal-fields">
              <label className="goal-title-field"><span className="sr-only">目標</span><input value={goalDraft?.title || ""} onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })} maxLength={100} aria-label="目標" /></label>
              <label className="goal-description-field"><span className="sr-only">目標の説明</span><textarea value={goalDraft?.description || ""} onChange={(event) => setGoalDraft({ ...goalDraft, description: event.target.value })} rows={2} maxLength={400} aria-label="目標の説明" /></label>
            </div>
            <div className="goal-card-bottom"><div className="goal-dates"><label>開始日<input type="date" value={goalDraft?.start_date || ""} onChange={(event) => setGoalDraft({ ...goalDraft, start_date: event.target.value })} /></label><span className="date-arrow">→</span><label>目標日<input type="date" value={goalDraft?.target_date || ""} onChange={(event) => setGoalDraft({ ...goalDraft, target_date: event.target.value })} /></label></div><button type="submit" className="text-button" disabled={busy}>変更を保存 <span>↗</span></button></div>
          </form>

          <div className="stat-grid">
            <article className="stat-card stat-progress"><span className="stat-label">GOAL PROGRESS</span><div className="stat-main"><strong>{workspace.progress}<small>%</small></strong><div className="ring" style={{ "--progress": `${workspace.progress * 3.6}deg` }}><span>↗</span></div></div><div className="stat-track"><span style={{ width: `${workspace.progress}%` }} /></div><span className="stat-foot">{workspace.completed_tasks} / {workspace.total_tasks} 個の課題を完了</span></article>
            <article className="stat-card"><span className="stat-label">REMAINING DAYS</span><strong className="stat-number">{daysRemaining === null ? "—" : Math.max(daysRemaining, 0)}<small>{daysRemaining === null ? "" : "日"}</small></strong><span className="stat-foot">目標日 {formatDate(workspace.goal.target_date, { month: "long", day: "numeric" })}</span></article>
            <article className="stat-card"><span className="stat-label">PLANNED TASKS</span><strong className="stat-number">{String(workspace.tasks.length).padStart(2, "0")}<small>件</small></strong><span className="stat-foot">計画にあるすべての課題</span></article>
          </div>

          <section className="surface chart-card"><div className="section-heading"><div><div className="section-label">YOUR MOMENTUM</div><h2>進捗のうつりかわり</h2></div><button type="button" className="quiet-link" onClick={() => setView("review")}>記録を見る <span>→</span></button></div><ProgressChart history={workspace.progress_history} progress={workspace.progress} /></section>

          <section className="surface overview-bottom"><div className="section-heading"><div><div className="section-label">NEXT STEPS</div><h2>次に進めること</h2></div><button type="button" className="quiet-link" onClick={() => setView("plan")}>計画を開く <span>→</span></button></div>
            {rootTasks.length === 0 ? <div className="inline-empty"><span>✳</span><p>最初の課題を決めると、目標への道筋が見えてきます。</p><button type="button" className="button button-light" onClick={() => setView("plan")}>計画をつくる</button></div> : <div className="overview-task-list">{rootTasks.slice(0, 3).map((task) => <button type="button" className="overview-task" key={task.id} onClick={() => setView("plan")}><span className={`task-status-dot ${task.progress >= 100 ? "is-done" : ""}`} /><TaskName className="overview-task-name">{task.title}</TaskName><span className="overview-task-date">{task.due_date ? formatDate(task.due_date) : "日付未設定"}</span><span className="overview-task-percent">{task.progress}%</span></button>)}</div>}
          </section>
          <footer className="page-footer"><span>SMALL STEPS, REAL PROGRESS.</span><span>今日の積み重ねが、目標につながる。</span></footer>
        </section>
      )}

      {view === "plan" && (
        <section className="view-content">
          <div className="page-heading page-heading-compact"><div><div className="eyebrow"><span className="eyebrow-dot" />BREAK IT DOWN</div><h1>目標までの<em>道すじ。</em></h1><p>大きな目標を、実行できる課題に分けてみよう。</p></div><div className="plan-progress"><span>全体の達成率</span><strong>{workspace.progress}%</strong></div></div>
          <section className="surface plan-card"><div className="plan-card-heading"><div><div className="section-label">WORK BREAKDOWN</div><h2>課題の計画 <span>{workspace.tasks.length}</span></h2><p>親課題と子課題の1階層で整理できます。</p></div></div>
            <datalist id="task-tag-suggestions">{taskTags.map((tag) => <option key={tag} value={tag} />)}</datalist>
            <form className="new-task-form" onSubmit={(event) => addTask(event)}><span className="new-task-plus">＋</span><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="新しい課題を追加する" aria-label="新しい課題" maxLength={160} /><input list="task-tag-suggestions" value={taskTag} onChange={(event) => setTaskTag(event.target.value)} placeholder="タグ" aria-label="課題のタグ" maxLength={20} /><input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} aria-label="課題の日付" /><button type="submit" className="button button-dark" disabled={busy || !taskTitle.trim()}>課題を追加 <span>↗</span></button></form>
            <div className="task-tag-filters" aria-label="タグで課題を絞り込み"><span>タグ</span><button type="button" className={`tag-filter-chip ${filterTag === "" ? "active" : ""}`} aria-pressed={filterTag === ""} onClick={() => setFilterTag("")}>すべて</button>{taskTags.map((tag) => <button type="button" key={tag} className={`tag-filter-chip ${filterTag === tag ? "active" : ""}`} data-tag-color style={{ "--tag-hue": tagHue(tag) }} aria-pressed={filterTag === tag} onClick={() => setFilterTag(filterTag === tag ? "" : tag)}>{tag}</button>)}</div>
            {rootTasks.length === 0 ? <div className="plan-empty"><span className="empty-spark">✳</span><h3>最初の一歩を決めましょう</h3><p>目標に近づくために、まず取り組む課題を追加してください。</p></div> : visibleRootTasks.length === 0 ? <div className="plan-empty filter-empty"><span className="empty-spark">⌕</span><h3>「{filterTag}」の課題はありません</h3><p>別のタグを選ぶか、すべての課題を表示してください。</p><button type="button" className="button button-light" onClick={() => setFilterTag("")}>すべて表示</button></div> : <div className="wbs-list">{visibleRootTasks.map((task) => {
              const allChildren = tasksByParent.get(task.id) || [];
              const children = allChildren;
              return <article className="wbs-group" key={task.id}><div className="wbs-row wbs-parent"><span className={`task-status-dot ${task.progress >= 100 ? "is-done" : ""}`} /><div className="wbs-main"><EditableTaskTitle task={task} onSave={updateTask} disabled={busy} /><div className="wbs-meta"><span>{children.length ? `${children.length} 個の子課題` : "課題"}</span><span className="meta-separator">·</span><span>{task.due_date ? `目標日 ${formatDate(task.due_date)}` : "日付未設定"}</span><input className="task-tag-input" data-tag-color={task.tag ? "" : undefined} style={task.tag ? { "--tag-hue": tagHue(task.tag) } : undefined} value={task.tag || ""} placeholder="＋ タグ" aria-label={`${task.title}のタグ`} maxLength={20} onChange={(event) => changeTaskTag(task, event.target.value)} onBlur={() => updateTask(task, { tag: workspace.tasks.find((item) => item.id === task.id)?.tag || "" })} /></div><div className="mini-progress"><span style={{ width: `${task.progress}%` }} /></div></div><span className="wbs-percent">{task.progress}%</span><button type="button" className="icon-button" onClick={() => { setChildParent(childParent === task.id ? null : task.id); setChildTitle(""); }} aria-label={`${task.title}に子課題を追加`}>＋</button><button type="button" className="icon-button delete-icon" onClick={() => removeTask(task)} aria-label={`${task.title}を削除`}>×</button></div>
                {!children.length && <div className="task-detail-row"><span className="detail-label">日付</span><input className="date-inline" type="date" value={task.due_date || ""} aria-label={`${task.title}の日付`} onChange={(event) => updateTask(task, { due_date: event.target.value })} /><span className="detail-spacer"/><button type="button" className="icon-button delete-child" onClick={() => removeTask(task)} aria-label={`${task.title}を削除`}>×</button></div>}
                {children.map((child) => <div className="wbs-row wbs-child" key={child.id}><span className="child-branch"/><span className={`task-status-dot ${child.progress >= 100 ? "is-done" : ""}`} /><div className="wbs-main"><EditableTaskTitle task={child} onSave={updateTask} disabled={busy} /><div className="mini-progress"><span style={{ width: `${child.progress}%` }} /></div></div><button type="button" className="icon-button delete-child" onClick={() => removeTask(child)} aria-label={`${child.title}を削除`}>×</button></div>)}
                {childParent === task.id && <form className="child-task-form" onSubmit={(event) => addTask(event, task.id)}><span className="child-branch"/><span className="new-task-plus">↳</span><input autoFocus value={childTitle} onChange={(event) => setChildTitle(event.target.value)} placeholder={`${task.title} の子課題`} aria-label="子課題" maxLength={160} /><button type="submit" className="button button-light" disabled={busy || !childTitle.trim()}>追加</button><button type="button" className="icon-button" onClick={() => setChildParent(null)} aria-label="キャンセル">×</button></form>}
              </article>;
            })}</div>}
          </section>
          <footer className="page-footer"><span>ONE STEP AT A TIME.</span><span>課題の進捗は日次記録時にグラフへ反映されます。</span></footer>
        </section>
      )}

      {view === "daily" && (
        <section className="view-content daily-view">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />A MOMENT FOR TODAY</div><h1>今日の一歩を、<em>記録しよう。</em></h1><p>課題ごとに、今日できたこと・できなかったことを書き留めましょう。</p></div><div className="daily-date-control"><label htmlFor="daily-date">記録する日</label><input id="daily-date" type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} /></div></div>
          <form className="surface today-plan-card" onSubmit={saveDaily}>
            <div className="section-heading"><div><div className="section-label">TASKS IN GOAL PERIOD</div><h2>{dailyDate === localDateString() ? "今日やること" : "この日にやること"}</h2></div></div>
            <p className="daily-plan-hint">課題の追加・編集は「<button type="button" className="daily-plan-hint-link" onClick={() => setView("plan")}>計画</button>」タブから行えます。</p>
            {activePlanTasks.length === 0 ? <p className="today-plan-empty">{selectedPlanTasks.length > 0 ? "進捗が100%の課題は今日やることに表示されません。" : workspace.tasks.length > 0 && !withinGoalPeriod ? "選択した日は目標期間外です。目標の開始日〜目標日の範囲で記録できます。" : "計画に課題を追加すると、ここに一覧表示されます。"}</p> : <div className="today-plan-list">{activePlanTasks.map((task) => {
              const parentTask = task.parent_id ? workspace.tasks.find((item) => item.id === task.parent_id) : null;
              const dueDate = dueDateForTask(task);
              const tag = parentTask?.tag || task.tag;
              const remainingDays = daysUntil(dueDate);
              const badgeText = remainingDays === null ? null : remainingDays < 0 ? `期限超過 ${Math.abs(remainingDays)}日` : remainingDays === 0 ? "今日が期日" : `あと${remainingDays}日`;
              const badgeClass = remainingDays !== null && remainingDays <= 1 ? "is-urgent" : remainingDays !== null && remainingDays <= 3 ? "is-warning" : "";
              const needsAttention = remainingDays !== null && remainingDays <= 5 && task.progress <= 30;
              const note = dailyTaskNotes[task.id] || {};
              return <div className="today-plan-item" key={task.id}><div className="today-plan-item-heading"><TaskName className="today-plan-task" title={task.title}>{task.title}</TaskName>{tag && <span className="daily-task-tag" data-tag-color style={{ "--tag-hue": tagHue(tag) }}>{tag}</span>}{badgeText && <span className={`due-badge ${badgeClass}`}>{badgeText}</span>}</div><div className="daily-task-controls">{parentTask && <div className="today-plan-parent">親課題：{parentTask.title}</div>}<div className="daily-task-progress"><span>進捗</span><TaskProgress task={task} disabled={busy} onChange={(item, progress) => updateTask(item, { progress }, "進捗を更新しました。")} /></div></div>{needsAttention && <div className="task-deadline-alert" role="status"><span aria-hidden="true">!</span>期日が近く、進捗が{task.progress}%です</div>}<div className="daily-task-notes"><label><span className="reflection-title">できたこと</span><textarea value={note.done || ""} rows={3} maxLength={4000} placeholder="取り組めたことを書きましょう" onChange={(event) => { setDailyTaskNotes((current) => ({ ...current, [task.id]: { ...current[task.id], done: event.target.value } })); setShowSaveGuide(true); }} /></label><label><span className="reflection-title">できなかったこと</span><textarea value={note.not_done || ""} rows={3} maxLength={4000} placeholder="できなかったことや次にやることを書きましょう" onChange={(event) => { setDailyTaskNotes((current) => ({ ...current, [task.id]: { ...current[task.id], not_done: event.target.value } })); setShowSaveGuide(true); }} /></label></div></div>;
            })}</div>}
            {workspace.tasks.length === 0 && <div className="today-plan-empty"><p>計画に課題を追加すると、ここで今日のリストを作れます。</p><button type="button" className="button button-light" onClick={() => setView("plan")}>計画を開く</button></div>}
            {selectedPlanTasks.length > 0 && <div className="daily-form-footer"><span>課題ごとに、できたこと・できなかったことを記録できます</span><button ref={dailySaveButtonRef} type="submit" className="button button-dark" disabled={busy}>今日の記録を保存 <span>↗</span></button></div>}
          </form>
          {showSaveGuide && <button type="button" className="daily-save-guide" onClick={jumpToDailySave}><span>入力した記録を保存しましょう</span><b>記録を保存へ <span aria-hidden="true">↓</span></b></button>}
          {selectedEntry?.activities?.some((activity) => !selectedPlanTaskIds.includes(Number(activity.task_id))) && <section className="surface today-activity-list"><div className="section-heading"><div><div className="section-label">PREVIOUS NOTES</div><h2>この日の以前の記録</h2></div></div>{selectedEntry.activities.filter((activity) => !selectedPlanTaskIds.includes(Number(activity.task_id))).map((activity) => <div className="today-activity" key={`${activity.task_id}-${activity.task_title}`}><TaskName className="activity-task-name">{activity.task_title}</TaskName>{activity.done || activity.content ? <p><strong>できたこと</strong>{activity.done || activity.content}</p> : null}{activity.not_done ? <p><strong>できなかったこと</strong>{activity.not_done}</p> : null}</div>)}</section>}
          {selectedEntry?.done || selectedEntry?.not_done ? <section className="surface legacy-entry"><strong>以前の振り返り</strong>{selectedEntry.done && <p><span>できたこと</span>{selectedEntry.done}</p>}{selectedEntry.not_done && <p><span>できなかったこと</span>{selectedEntry.not_done}</p>}</section> : null}
          <div className="gentle-note"><span>✦</span> 小さな一歩も、確かな前進です。</div>
        </section>
      )}

      {view === "review" && (
        <section className="view-content">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />LOOKING BACK</div><h1>歩みを見つめて、<em>次へ。</em></h1><p>積み重ねを振り返ると、次に進むヒントが見えてくる。</p></div><button type="button" className="button button-dark" onClick={() => setView("daily")}>今日を記録する <span>↗</span></button></div>
          <section className="surface chart-card review-chart"><div className="section-heading"><div><div className="section-label">YOUR MOMENTUM</div><h2>進捗のうつりかわり</h2></div><span className="review-current">現在 <strong>{workspace.progress}%</strong></span></div><ProgressChart history={workspace.progress_history} progress={workspace.progress} /></section>
          <section className="surface review-card"><div className="section-heading"><div><div className="section-label">DAILY NOTES</div><h2>日々の振り返り <span className="entry-count">{workspace.daily_entries.length}</span></h2></div></div>
            {workspace.daily_entries.length === 0 ? <div className="plan-empty review-empty"><span className="empty-spark">✳</span><h3>まだ記録はありません</h3><p>課題を選んで、その日に取り組んだことを残しましょう。</p><button type="button" className="button button-light" onClick={() => setView("daily")}>最初の記録を書く</button></div> : <div className="journal-list">{[...workspace.daily_entries].reverse().map((entry) => <article className="journal-entry" key={entry.date}><button type="button" className="journal-date" onClick={() => chooseDaily(entry.date)}><span>{formatDate(entry.date, { month: "short", day: "numeric" })}</span><small>{formatDate(entry.date, { weekday: "short" })}</small><b>→</b></button><div className="journal-content">{entry.activities?.map((activity) => <div className="journal-activity" key={`${activity.task_id}-${activity.task_title}`}><div className="journal-activity-title"><span className="journal-label"><i className="journal-check">✓</i><TaskName>{activity.task_title}</TaskName></span></div>{activity.done || activity.content ? <p className="journal-note"><strong>できたこと</strong><span>{activity.done || activity.content}</span></p> : null}{activity.not_done ? <p className="journal-note"><strong>できなかったこと</strong><span>{activity.not_done}</span></p> : null}</div>)}{entry.activities?.length && (entry.done || entry.not_done) ? <div className="journal-legacy"><span>以前の振り返り</span><p>{entry.done}</p><p>{entry.not_done}</p></div> : null}{!entry.activities?.length && <><div className="journal-column"><span className="journal-label"><i className="journal-check">✓</i>できたこと</span><p>{entry.done || <span className="muted-copy">記録なし</span>}</p></div><div className="journal-column"><span className="journal-label"><i className="journal-reflect">↗</i>できなかったこと</span><p>{entry.not_done || <span className="muted-copy">記録なし</span>}</p></div></>}</div><div className="journal-progress"><span>進捗</span><strong>{entry.progress ?? 0}%</strong></div></article>)}</div>}
          </section>
          <footer className="page-footer"><span>NOTICE YOUR PROGRESS.</span><span>振り返りから、次の一歩へ。</span></footer>
        </section>
      )}

      {view === "settings" && (
        <section className="view-content">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />PREFERENCES</div><h1>自分らしく、<em>整えよう。</em></h1><p>画面の見た目を選べます。</p></div></div>
          <section className="surface settings-card" aria-labelledby="appearance-title">
            <div className="section-label">APPEARANCE</div>
            <h2 id="appearance-title">テーマ</h2>
            <p>アプリの表示モードを選択してください。</p>
            <div className="theme-options" role="radiogroup" aria-label="テーマ">
              {[{ id: "light", label: "ライト", icon: "☀" }, { id: "dark", label: "ダーク", icon: "☾" }].map((option) => (
                <button type="button" key={option.id} role="radio" aria-checked={theme === option.id} className={`theme-option ${theme === option.id ? "selected" : ""}`} onClick={() => setTheme(option.id)}>
                  <span className="theme-preview" data-preview={option.id}><i /><i /><i /></span>
                  <span className="theme-option-label"><span>{option.icon}</span>{option.label}</span>
                  <span className="theme-radio" />
                </button>
              ))}
            </div>
          </section>
          <footer className="page-footer"><span>MAKE IT YOURS.</span><span>選択したテーマはこの端末に保存されます。</span></footer>
        </section>
      )}
    </main>
  );
}
