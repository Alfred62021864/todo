import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [todo, setTodo] = useState("");
  // ローカルストレージから同期的に初期化（マウント前に読み込む）
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('todos')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.warn('failed to parse todos from localStorage', e)
      return []
    }
  })
  const [count, setCount] = useState(0)

  // todos が変わるたびに保存
  useEffect(() => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (e) {
      console.warn('failed to save todos to localStorage', e);
    }
  }, [todos]);
  
  const handleAdd = () => {
    if (todo.trim() === "") return;
    const newTodos = [...todos, todo.trim()];
    setTodos(newTodos);
    // 確定した値をローカルストレージに即時保存
    try {
      localStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (e) {
      console.warn('failed to save todos to localStorage', e);
    }
    setTodo("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <>
      <input
        type="text"
        value={todo}
        onChange={(e) => setTodo(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="やることを入力"
      />
      <button onClick={handleAdd}>追加</button>

      <ul>
        {todos.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </>
  )
}

export default App
