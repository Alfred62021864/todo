import { useEffect, useMemo, useState } from "react";

async function request(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error("Request failed. Please try again.");
  return response.status === 204 ? null : response.json();
}

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    request("/api/todos")
      .then(setTodos)
      .catch(() => setError("Couldn't load your tasks. Is the API running?"));
  }, []);

  const visibleTodos = useMemo(
    () => todos.filter((todo) => filter === "all" || (filter === "active" ? !todo.completed : todo.completed)),
    [todos, filter],
  );
  const remaining = todos.filter((todo) => !todo.completed).length;

  async function addTodo(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const todo = await request("/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: title.trim() }),
      });
      setTodos((current) => [todo, ...current]);
      setTitle("");
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function toggleTodo(todo) {
    try {
      const updated = await request(`/api/todos/${todo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !todo.completed }),
      });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteTodo(id) {
    try {
      await request(`/api/todos/${id}`, { method: "DELETE" });
      setTodos((current) => current.filter((todo) => todo.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Today home"><span className="brand-mark">t</span> today</a>
        <span className="date-label">A little more focus, every day.</span>
      </header>

      <section className="todo-panel" id="top">
        <div className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE</div>
        <div className="heading-row">
          <div>
            <h1>Make room<br />for <em>what matters.</em></h1>
            <p className="intro">One thing at a time. You’ve got this.</p>
          </div>
          <div className="task-count"><strong>{String(remaining).padStart(2, "0")}</strong><span>LEFT TO DO</span></div>
        </div>

        <form className="add-form" onSubmit={addTodo}>
          <span className="plus">+</span>
          <input aria-label="New task" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs your attention?" />
          <button type="submit">Add task <span>↗</span></button>
        </form>
        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="list-toolbar">
          <span className="list-title">YOUR TASKS <span className="list-total">{todos.length}</span></span>
          <nav className="filters" aria-label="Filter tasks">
            {["all", "active", "done"].map((item) => <button className={filter === item ? "selected" : ""} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}
          </nav>
        </div>

        <ul className="todo-list">
          {visibleTodos.map((todo, index) => (
            <li className={`todo-item ${todo.completed ? "completed" : ""}`} key={todo.id}>
              <button className="check-button" type="button" onClick={() => toggleTodo(todo)} aria-label={todo.completed ? "Mark task active" : "Mark task done"}>{todo.completed && "✓"}</button>
              <span className="item-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="item-title">{todo.title}</span>
              <button className="delete-button" type="button" onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}>×</button>
            </li>
          ))}
          {visibleTodos.length === 0 && <li className="empty-state">{todos.length === 0 ? "Your list is clear. Add a task to get started." : "Nothing in this view yet."}</li>}
        </ul>
        <footer className="panel-footer"><span>SMALL STEPS ADD UP</span><span>MADE FOR TODAY <span className="sun">✳</span></span></footer>
      </section>
      <p className="page-note">Keep it simple. Keep moving.</p>
    </main>
  );
}
