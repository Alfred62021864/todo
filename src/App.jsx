import { useState, useEffect, useRef } from "react";
import "./App.css";
import TaskList from "./components/TaskList.jsx";
import InputArea from "./components/InputArea.jsx";

import logo from "./assets/logo.jpg";

function App() {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem("todos");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("failed to parse todos from localStorage", e);
      return [];
    }
  });
  const [filter, setFilter] = useState("all"); // 'all' | 'completed' | 'active'
  const inputRef = useRef(null);
  const [monthly, setMonthly] = useState("");
  const [monthlies, setMontlies] = useState(() => {
    try {
      const saved = localStorage.getItem("monthlies");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("failed to parse todos from localStorage", e);
      return [];
    }
  });

  // todos が変わるたびに保存
  useEffect(() => {
    try {
      localStorage.setItem("todos", JSON.stringify(todos));
    } catch (e) {
      console.warn("failed to save todos to localStorage", e);
    }
  }, [todos]);

  const handleMonthly = () => {
    if (monthly.trim() === "") return;
    const newTodos = [...monthlies, { text: monthly.trim(), completed: false }];
    setMontlies(newTodos);
    // 確定した値をローカルストレージに即時保存
    try {
      localStorage.setItem("monthlies", JSON.stringify(newTodos));
    } catch (e) {
      console.warn("failed to save todos to localStorage", e);
    }
    setMonthly(""); // 入力欄をクリア
    inputRef.current?.focus(); // フォーカスを戻す
  };

  const handleMonthlyClear = () => {
    setMontlies([]);
    try {
      localStorage.setItem("monthlies", JSON.stringify([]));
    } catch (e) {
      console.warn("failed to save monthlies to localStorage", e);
    }
  };

  // 表示用に元のインデックスを保持した配列を作る
  const visibleMonthlies = monthlies
    .map((t, i) => ({ ...t, originalIndex: i }))
    .filter((item) => {
      if (filter === "completed") return item.completed;
      if (filter === "active") return !item.completed;
      return true;
    });

  const headerStyle = {
    position: "fixed",
    top: "0",
    left: "0",
    display: "flex",
  };
  const logoStyle = { height: "100%" };

  return (
    <>
      <header style={headerStyle}>
        <div className="logo">
          <img src={logo} style={logoStyle} />
        </div>
      </header>
      <main>
        <section>
          <div
            style={{
              marginBottom: "12px",
              display: "flex",
              gap: "15px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setFilter("all")}
              style={{ fontWeight: filter === "all" ? "bold" : "normal" }}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter("active")}
              style={{ fontWeight: filter === "active" ? "bold" : "normal" }}
            >
              未完了
            </button>
            <button
              onClick={() => setFilter("completed")}
              style={{ fontWeight: filter === "completed" ? "bold" : "normal" }}
            >
              完了
            </button>
          </div>
        </section>
        <section>
          <TaskList todos={todos} setTodos={setTodos} filter={filter} />
        </section>
      </main>
      <footer
        style={{
          width: "100%",
          position: "fixed",
          bottom: "0",
          left: "0",
          height: "100px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <InputArea
          inputRef={inputRef}
          setTodo={setTodo}
          todo={todo}
          setTodos={setTodos}
          todos={todos}
        />
      </footer>
    </>
  );
}

export default App;
