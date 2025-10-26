import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [todo, setTodo] = useState("");
  // completedフラグを含むオブジェクトの配列に変更
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
    const newTodos = [...todos, { text: todo.trim(), completed: false }];
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

  const handleDelete = (index) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setTodos(newTodos);
    // 削除後の値をローカルストレージに即時保存
    try {
      localStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (e) {
      console.warn('failed to save todos to localStorage', e);
    }
  };

  const handleToggleComplete = (index) => {
    const newTodos = todos.map((todo, i) => {
      if (i === index) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    setTodos(newTodos);
    try {
      localStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (e) {
      console.warn('failed to save todos to localStorage', e);
    }
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
        {todos.map((todo, i) => (
          <li key={i} style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: todo.completed ? 'line-through' : 'none'
          }}>
            <span>{todo.text}</span>
            <button onClick={() => handleToggleComplete(i)}>
              {todo.completed ? '未完了' : '完了'}
            </button>
            <button onClick={() => handleDelete(i)}>削除</button>
          </li>
        ))}
      </ul>
    </>
  )
}

export default App
