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
  const [tag, setTag] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'completed' | 'active'
  const [filteringTag, setFilteringTag] = useState("");
  const [filteringDeadline, setFilteringDeadline] = useState("");
  const [deadline, setDeadline] = useState("");
  const inputRef = useRef(null);
  const tagRef = useRef(null);
  const deadlineRef = useRef(null);

  // todos が変わるたびに保存
  useEffect(() => {
    try {
      localStorage.setItem("todos", JSON.stringify(todos));
    } catch (e) {
      console.warn("failed to save todos to localStorage", e);
    }
  }, [todos]);

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
        <section id="filter">
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
            <input
              placeholder="タグを入力"
              onChange={(e) => {
                setFilteringTag(e.target.value);
              }}
              style={{ height: "40px", width: "250px", marginLeft: "20px" }}
            />
            <input
              placeholder="納期を入力"
              onChange={(e) => {
                setFilteringDeadline(e.target.value);
              }}
              style={{ height: "40px", width: "250px", marginLeft: "20px" }}
            />
          </div>
        </section>
        <section>
          <TaskList
            todos={todos}
            setTodos={setTodos}
            filter={filter}
            filteringTag={filteringTag}
            filteringDeadline={filteringDeadline}
          />
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
          tagRef={tagRef}
          setTodo={setTodo}
          todo={todo}
          setTodos={setTodos}
          todos={todos}
          tag={tag}
          setTag={setTag}
          deadlineRef={deadlineRef}
          deadline={deadline}
          setDeadline={setDeadline}
        />
      </footer>
    </>
  );
}

export default App;
