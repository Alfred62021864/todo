import { useEffect, useMemo, useState } from "react";

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
        {[0, 25, 50, 75, 100].map((value) => <option key={value} value={value}>{value}%</option>)}
      </select>
    </label>
  );
}

export default function TodoApp() {
  const [workspace, setWorkspace] = useState(null);
  const [view, setView] = useState("daily");
  const [theme, setTheme] = useState(() => window.localStorage.getItem("today-theme") === "dark" ? "dark" : "light");
  const [dailyDate, setDailyDate] = useState(localDateString());
  const [activityTaskId, setActivityTaskId] = useState("");
  const [activityDraft, setActivityDraft] = useState("");
  const [goalDraft, setGoalDraft] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTag, setTaskTag] = useState("");
  const [childParent, setChildParent] = useState(null);
  const [childTitle, setChildTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
    const entry = workspace?.daily_entries.find((item) => item.date === dailyDate);
    const selectedActivity = entry?.activities?.find((item) => String(item.task_id) === activityTaskId) || entry?.activities?.[0];
    const taskId = selectedActivity?.task_id ?? workspace?.tasks.find((item) => String(item.id) === activityTaskId)?.id ?? workspace?.tasks[0]?.id ?? "";
    setActivityTaskId(taskId === "" ? "" : String(taskId));
    setActivityDraft(selectedActivity?.content || "");
  }, [workspace, dailyDate]);

  const rootTasks = useMemo(() => workspace?.tasks.filter((task) => !task.parent_id) || [], [workspace]);
  const tasksByParent = useMemo(() => {
    const grouped = new Map();
    workspace?.tasks.filter((task) => task.parent_id).forEach((task) => {
      grouped.set(task.parent_id, [...(grouped.get(task.parent_id) || []), task]);
    });
    return grouped;
  }, [workspace]);
  const selectedEntry = workspace?.daily_entries.find((item) => item.date === dailyDate);
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
      body: JSON.stringify({ task: { title: title.trim(), parent_id: parentId, due_date: parentId ? null : taskDate, tag: taskTag } }),
    }), parentId ? "子課題を追加しました。" : "課題を追加しました。");
    if (saved && parentId) { setChildTitle(""); setChildParent(null); setTaskTag(""); }
    if (saved && !parentId) { setTaskTitle(""); setTaskDate(""); setTaskTag(""); }
  }

  function changeTaskTag(task, tag) {
    setWorkspace((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, tag } : item) }));
  }

  async function updateTask(task, changes) {
    await refreshAfter(() => request(`/api/tasks/${task.id}`, {
      method: "PATCH", body: JSON.stringify({ task: changes }),
    }), "計画を更新しました。");
  }

  async function removeTask(task) {
    const hasChildren = (tasksByParent.get(task.id) || []).length > 0;
    const prompt = hasChildren ? "この課題と子課題を削除しますか？" : "この課題を削除しますか？";
    if (!window.confirm(prompt)) return;
    await refreshAfter(() => request(`/api/tasks/${task.id}`, { method: "DELETE" }), "課題を削除しました。");
  }

  async function saveDaily(event) {
    event.preventDefault();
    if (!activityTaskId || !activityDraft.trim()) {
      setError("課題を選び、今日行ったことを入力してください。");
      return;
    }
    const task = workspace.tasks.find((item) => String(item.id) === activityTaskId);
    const activities = [...(selectedEntry?.activities || [])];
    const activity = { task_id: Number(activityTaskId), task_title: task?.title || "", content: activityDraft.trim() };
    const existingIndex = activities.findIndex((item) => String(item.task_id) === activityTaskId);
    if (existingIndex >= 0) activities[existingIndex] = activity;
    else activities.push(activity);
    await refreshAfter(() => request(`/api/daily_entries/${dailyDate}`, {
      method: "PUT",
      body: JSON.stringify({ daily_entry: { activities } }),
    }), "課題の記録を保存しました。");
  }

  function selectActivityTask(taskId) {
    setActivityTaskId(taskId);
    const activity = selectedEntry?.activities?.find((item) => String(item.task_id) === taskId);
    setActivityDraft(activity?.content || "");
  }

  function chooseDaily(date) {
    setDailyDate(date);
    setView("daily");
  }

  if (!workspace) return <main className="loading-screen"><span className="brand-mark">t</span><p>あなたの計画を開いています…</p></main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setView("daily")}><span className="brand-mark">t</span><span>today</span><span className="brand-divider">/</span><span className="brand-sub">目標とふりかえり</span></a>
        <div className="header-date"><span className="online-dot" />{formatDate(localDateString(), { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</div>
      </header>

      <nav className="main-nav" aria-label="メインナビゲーション">
        {[{ id: "daily", label: "今日の記録", icon: "✎" }, { id: "overview", label: "概要", icon: "◫" }, { id: "plan", label: "計画", icon: "☷" }, { id: "review", label: "振り返り", icon: "↗" }, { id: "settings", label: "設定", icon: "⚙" }].map((item) => (
          <button type="button" key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}{item.id === "daily" && <i className="nav-today-dot" />}</button>
        ))}
        <span className="nav-spacer" />
        <span className="nav-goal-chip"><span />{workspace.goal.title}</span>
      </nav>

      {(error || notice) && <div className={`toast ${error ? "toast-error" : "toast-success"}`} role={error ? "alert" : "status"}>{error || notice}<button type="button" onClick={() => { setError(""); setNotice(""); }} aria-label="閉じる">×</button></div>}

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
            {rootTasks.length === 0 ? <div className="inline-empty"><span>✳</span><p>最初の課題を決めると、目標への道筋が見えてきます。</p><button type="button" className="button button-light" onClick={() => setView("plan")}>計画をつくる</button></div> : <div className="overview-task-list">{rootTasks.slice(0, 3).map((task) => <button type="button" className="overview-task" key={task.id} onClick={() => setView("plan")}><span className={`task-status-dot ${task.progress >= 100 ? "is-done" : ""}`} /><span className="overview-task-name">{task.title}</span><span className="overview-task-date">{task.due_date ? formatDate(task.due_date) : "日付未設定"}</span><span className="overview-task-percent">{task.progress}%</span></button>)}</div>}
          </section>
          <footer className="page-footer"><span>SMALL STEPS, REAL PROGRESS.</span><span>今日の積み重ねが、目標につながる。</span></footer>
        </section>
      )}

      {view === "plan" && (
        <section className="view-content">
          <div className="page-heading page-heading-compact"><div><div className="eyebrow"><span className="eyebrow-dot" />BREAK IT DOWN</div><h1>目標までの<em>道すじ。</em></h1><p>大きな目標を、実行できる課題に分けてみよう。</p></div><div className="plan-progress"><span>全体の達成率</span><strong>{workspace.progress}%</strong></div></div>
          <section className="surface plan-card"><div className="plan-card-heading"><div><div className="section-label">WORK BREAKDOWN</div><h2>課題の計画 <span>{workspace.tasks.length}</span></h2><p>親課題と子課題の1階層で整理できます。</p></div><span className="wbs-key"><i />課題 <i className="child-key" />子課題</span></div>
            <form className="new-task-form" onSubmit={(event) => addTask(event)}><span className="new-task-plus">＋</span><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="新しい課題を追加する" aria-label="新しい課題" maxLength={160} /><input value={taskTag} onChange={(event) => setTaskTag(event.target.value)} placeholder="タグ" aria-label="課題のタグ" maxLength={20} /><input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} aria-label="課題の日付" /><button type="submit" className="button button-dark" disabled={busy || !taskTitle.trim()}>課題を追加 <span>↗</span></button></form>
            {rootTasks.length === 0 ? <div className="plan-empty"><span className="empty-spark">✳</span><h3>最初の一歩を決めましょう</h3><p>目標に近づくために、まず取り組む課題を追加してください。</p></div> : <div className="wbs-list">{rootTasks.map((task, index) => {
              const children = tasksByParent.get(task.id) || [];
              return <article className="wbs-group" key={task.id}><div className="wbs-row wbs-parent"><span className="wbs-index">{String(index + 1).padStart(2, "0")}</span><span className={`task-status-dot ${task.progress >= 100 ? "is-done" : ""}`} /><div className="wbs-main"><strong>{task.title}</strong><div className="wbs-meta"><span>{children.length ? `${children.length} 個の子課題` : "課題"}</span><span className="meta-separator">·</span><span>{task.due_date ? `目標日 ${formatDate(task.due_date)}` : "日付未設定"}</span><input className="task-tag-input" value={task.tag || ""} placeholder="＋ タグ" aria-label={`${task.title}のタグ`} maxLength={20} onChange={(event) => changeTaskTag(task, event.target.value)} onBlur={() => updateTask(task, { tag: workspace.tasks.find((item) => item.id === task.id)?.tag || "" })} /></div><div className="mini-progress"><span style={{ width: `${task.progress}%` }} /></div></div><span className="wbs-percent">{task.progress}%</span><button type="button" className="icon-button" onClick={() => { setChildParent(childParent === task.id ? null : task.id); setChildTitle(""); }} aria-label={`${task.title}に子課題を追加`}>＋</button><button type="button" className="icon-button delete-icon" onClick={() => removeTask(task)} aria-label={`${task.title}を削除`}>×</button></div>
                {!children.length && <div className="task-detail-row"><span className="detail-indent"/><span className="detail-label">進捗</span><TaskProgress task={task} onChange={(item, progress) => updateTask(item, { progress })} /><span className="detail-spacer"/><span className="detail-label">日付</span><input className="date-inline" type="date" value={task.due_date || ""} aria-label={`${task.title}の日付`} onChange={(event) => updateTask(task, { due_date: event.target.value })} /><button type="button" className="icon-button delete-child" onClick={() => removeTask(task)} aria-label={`${task.title}を削除`}>×</button></div>}
                {children.map((child) => <div className="wbs-row wbs-child" key={child.id}><span className="child-branch"/><span className={`task-status-dot ${child.progress >= 100 ? "is-done" : ""}`} /><div className="wbs-main"><strong>{child.title}</strong><div className="wbs-meta"><span>子課題</span><span className="meta-separator">·</span><span>{child.due_date ? `目標日 ${formatDate(child.due_date)}` : "日付未設定"}</span><input className="task-tag-input" value={child.tag || ""} placeholder="＋ タグ" aria-label={`${child.title}のタグ`} maxLength={20} onChange={(event) => changeTaskTag(child, event.target.value)} onBlur={() => updateTask(child, { tag: workspace.tasks.find((item) => item.id === child.id)?.tag || "" })} /></div><div className="mini-progress"><span style={{ width: `${child.progress}%` }} /></div></div><TaskProgress task={child} onChange={(item, progress) => updateTask(item, { progress })} /><button type="button" className="icon-button delete-child" onClick={() => removeTask(child)} aria-label={`${child.title}を削除`}>×</button></div>)}
                {childParent === task.id && <form className="child-task-form" onSubmit={(event) => addTask(event, task.id)}><span className="child-branch"/><span className="new-task-plus">↳</span><input autoFocus value={childTitle} onChange={(event) => setChildTitle(event.target.value)} placeholder={`${task.title} の子課題`} aria-label="子課題" maxLength={160} /><input value={taskTag} onChange={(event) => setTaskTag(event.target.value)} placeholder="タグ" aria-label="子課題のタグ" maxLength={20} /><button type="submit" className="button button-light" disabled={busy || !childTitle.trim()}>追加</button><button type="button" className="icon-button" onClick={() => setChildParent(null)} aria-label="キャンセル">×</button></form>}
              </article>;
            })}</div>}
          </section>
          <footer className="page-footer"><span>ONE STEP AT A TIME.</span><span>課題の進捗は日次記録時にグラフへ反映されます。</span></footer>
        </section>
      )}

      {view === "daily" && (
        <section className="view-content daily-view">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />A MOMENT FOR TODAY</div><h1>今日の一歩を、<em>記録しよう。</em></h1><p>課題を選んで、今日取り組んだことを書き留めましょう。</p></div><div className="daily-date-control"><label htmlFor="daily-date">記録する日</label><input id="daily-date" type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} /></div></div>
          <div className="daily-progress-banner"><span className="daily-banner-icon">✳</span><div><span>{workspace.goal.title}</span><strong>現在の達成率 <b>{workspace.progress}%</b></strong></div><div className="daily-banner-track"><span style={{ width: `${workspace.progress}%` }} /></div></div>
          <form className="daily-form surface" onSubmit={saveDaily}>
            {workspace.tasks.length === 0 ? <div className="plan-empty"><span className="empty-spark">✳</span><h3>記録する課題を追加しましょう</h3><p>計画で課題を作ると、課題ごとの今日の記録を残せます。</p><button type="button" className="button button-light" onClick={() => setView("plan")}>計画を開く</button></div> : <>
              <label className="activity-task-field"><span className="reflection-title">記録する課題</span><select value={activityTaskId} onChange={(event) => selectActivityTask(event.target.value)} aria-label="記録する課題">{workspace.tasks.map((task) => <option key={task.id} value={task.id}>{task.parent_id ? "　↳ " : ""}{task.title}</option>)}</select></label>
              <label className="activity-note-field"><span className="reflection-icon done-icon">✎</span><span className="reflection-title">今日行ったこと</span><span className="reflection-hint">進めた内容や気づきを書き留めましょう。</span><textarea value={activityDraft} onChange={(event) => setActivityDraft(event.target.value)} placeholder="例：資料の構成を決め、参考資料を3件確認した。" rows={6} maxLength={4000} /></label>
              <div className="daily-form-footer"><span>{selectedEntry?.activities?.some((item) => String(item.task_id) === activityTaskId) ? "この課題の記録を編集中" : "課題ごとに1日1件の記録を保存できます"}</span><button type="submit" className="button button-dark" disabled={busy || !activityTaskId || !activityDraft.trim()}>この課題の記録を保存 <span>↗</span></button></div>
            </>}
          </form>
          {selectedEntry?.activities?.length > 0 && <section className="surface today-activity-list"><div className="section-heading"><div><div className="section-label">TODAY'S WORK</div><h2>この日の記録 <span className="entry-count">{selectedEntry.activities.length}</span></h2></div></div>{selectedEntry.activities.map((activity) => <button type="button" className={`today-activity ${String(activity.task_id) === activityTaskId ? "active" : ""}`} key={`${activity.task_id}-${activity.task_title}`} onClick={() => selectActivityTask(String(activity.task_id))}><span className="activity-task-name">{activity.task_title}</span><span className="activity-content">{activity.content}</span><span className="activity-edit">編集 →</span></button>)}</section>}
          {selectedEntry?.done || selectedEntry?.not_done ? <section className="surface legacy-entry"><strong>以前の振り返り</strong>{selectedEntry.done && <p><span>できたこと</span>{selectedEntry.done}</p>}{selectedEntry.not_done && <p><span>できなかったこと</span>{selectedEntry.not_done}</p>}</section> : null}
          <div className="gentle-note"><span>✦</span> 小さな一歩も、確かな前進です。</div>
        </section>
      )}

      {view === "review" && (
        <section className="view-content">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />LOOKING BACK</div><h1>歩みを見つめて、<em>次へ。</em></h1><p>積み重ねを振り返ると、次に進むヒントが見えてくる。</p></div><button type="button" className="button button-dark" onClick={() => setView("daily")}>今日を記録する <span>↗</span></button></div>
          <section className="surface chart-card review-chart"><div className="section-heading"><div><div className="section-label">YOUR MOMENTUM</div><h2>進捗のうつりかわり</h2></div><span className="review-current">現在 <strong>{workspace.progress}%</strong></span></div><ProgressChart history={workspace.progress_history} progress={workspace.progress} /></section>
          <section className="surface review-card"><div className="section-heading"><div><div className="section-label">DAILY NOTES</div><h2>日々の振り返り <span className="entry-count">{workspace.daily_entries.length}</span></h2></div></div>
            {workspace.daily_entries.length === 0 ? <div className="plan-empty review-empty"><span className="empty-spark">✳</span><h3>まだ記録はありません</h3><p>課題を選んで、その日に取り組んだことを残しましょう。</p><button type="button" className="button button-light" onClick={() => setView("daily")}>最初の記録を書く</button></div> : <div className="journal-list">{[...workspace.daily_entries].reverse().map((entry) => <article className="journal-entry" key={entry.date}><button type="button" className="journal-date" onClick={() => chooseDaily(entry.date)}><span>{formatDate(entry.date, { month: "short", day: "numeric" })}</span><small>{formatDate(entry.date, { weekday: "short" })}</small><b>→</b></button><div className="journal-content">{entry.activities?.map((activity) => <div className="journal-activity" key={`${activity.task_id}-${activity.task_title}`}><span className="journal-label"><i className="journal-check">✓</i>{activity.task_title}</span><p>{activity.content}</p></div>)}{entry.activities?.length && (entry.done || entry.not_done) ? <div className="journal-legacy"><span>以前の振り返り</span><p>{entry.done}</p><p>{entry.not_done}</p></div> : null}{!entry.activities?.length && <><div className="journal-column"><span className="journal-label"><i className="journal-check">✓</i>できたこと</span><p>{entry.done || <span className="muted-copy">記録なし</span>}</p></div><div className="journal-column"><span className="journal-label"><i className="journal-reflect">↗</i>できなかったこと</span><p>{entry.not_done || <span className="muted-copy">記録なし</span>}</p></div></>}</div><div className="journal-progress"><span>進捗</span><strong>{entry.progress ?? 0}%</strong></div></article>)}</div>}
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
