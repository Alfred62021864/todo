import { useState, useEffect, useRef } from "react";
import "./App.css";
import AddButton from "./components/AddButton.jsx";
import TaskList from "./components/TaskList.jsx";

import gear from "./assets/gear.svg";
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

  const handleKeyDown = (e) => {
    const composing = e.nativeEvent?.isComposing || e.isComposing;
    if (e.key === "Enter" && !composing) {
      if (todo.trim() === "") return;
      const text = todo.trim();
      const newTodos = [...todos, { text, completed: false }];
      setTodos(newTodos);
      try {
        localStorage.setItem("todos", JSON.stringify(newTodos));
      } catch (e) {
        console.warn("failed to save todos to localStorage", e);
      }
      setTodo("");
      inputRef.current?.focus();
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
  const gearStyle = { height: "100%" };

  return (
    <>
      <header style={headerStyle}>
        <div className="logo">
          <img src={logo} style={logoStyle} />
        </div>
        {/* <div className="setting">
          <img src={gear} style={gearStyle} />
        </div> */}
      </header>
      {/* <div className="main">main</div> */}
      {/* <div style={{ marginBottom: "20px" }}>
        今月の目標
        <input
          ref={inputRef}
          type="text"
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="やることを入力"
        />
        <button onClick={handleMonthly}>追加</button>
        <button onClick={handleMonthlyClear}>クリア</button>
        <ul>
          {visibleMonthlies.map((todoObj) => {
            const i = todoObj.originalIndex;
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textDecoration: todoObj.completed ? "line-through" : "none",
                }}
              >
                <span>{todoObj.text}</span>
              </li>
            );
          })}
        </ul>
      </div> */}
      <div style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
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
      <TaskList todos={todos} setTodos={setTodos} filter={filter} />
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
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <input
            ref={inputRef}
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="やることを入力"
            style={{ height: "40px", width: "80%", marginLeft: "20px" }}
          />
          <AddButton
            callback={() => {
              if (todo.trim() === "") return;
              const text = todo.trim();
              const newTodos = [...todos, { text, completed: false }];
              setTodos(newTodos);
              try {
                localStorage.setItem("todos", JSON.stringify(newTodos));
              } catch (e) {
                console.warn("failed to save todos to localStorage", e);
              }

              setTodo("");
              inputRef.current?.focus();
            }}
            text="追加"
          />
        </div>
      </footer>
    </>
  );
}

export default App;
