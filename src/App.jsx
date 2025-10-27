import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('todos')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.warn('failed to parse todos from localStorage', e)
      return []
    }
  })
  const [editingIndex, setEditingIndex] = useState(-1); // 編集中のインデックスを管理
  const [editText, setEditText] = useState(""); // 編集中のテキストを管理
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'active'
  const inputRef = useRef(null);

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
    setTodo("");                 // 入力欄をクリア
    inputRef.current?.focus();   // フォーカスを戻す
  };

  const handleKeyDown = (e) => {
    const composing = e.nativeEvent?.isComposing || e.isComposing;
    if (e.key === 'Enter' && !composing) handleAdd();
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

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditText(todos[index].text);
  };

  const handleSaveEdit = (index) => {
    if (editText.trim() === "") return;
    const newTodos = todos.map((todo, i) => {
      if (i === index) {
        return { ...todo, text: editText.trim() };
      }
      return todo;
    });
    setTodos(newTodos);
    setEditingIndex(-1); // 編集モードを終了
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setEditText("");
  };

  // 表示用に元のインデックスを保持した配列を作る
  const visibleTodos = todos
    .map((t, i) => ({ ...t, originalIndex: i }))
    .filter(item => {
      if (filter === 'completed') return item.completed;
      if (filter === 'active') return !item.completed;
      return true;
    });

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          ref={inputRef}
          type="text"
          value={todo}
          onChange={(e) => setTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="やることを入力"
        />
        <button onClick={handleAdd}>追加</button>
      </div>

      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{ fontWeight: filter === 'all' ? 'bold' : 'normal' }}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter('active')}
          style={{ fontWeight: filter === 'active' ? 'bold' : 'normal' }}
        >
          未完了
        </button>
        <button
          onClick={() => setFilter('completed')}
          style={{ fontWeight: filter === 'completed' ? 'bold' : 'normal' }}
        >
          完了
        </button>
      </div>

      <ul>
        {visibleTodos.map((todoObj) => {
          const i = todoObj.originalIndex;
          return (
            <li key={i} style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: todoObj.completed ? 'line-through' : 'none'
            }}>
              {editingIndex === i ? (
                <>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      const composing = e.nativeEvent?.isComposing || e.isComposing;
                      if (e.key === 'Enter' && !composing) handleSaveEdit(i);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <button onClick={() => handleSaveEdit(i)}>保存</button>
                  <button onClick={handleCancelEdit}>キャンセル</button>
                </>
              ) : (
                <>
                  <span>{todoObj.text}</span>
                  <button onClick={() => handleToggleComplete(i)}>
                    {todoObj.completed ? '未完了' : '完了'}
                  </button>
                  <button onClick={() => handleEdit(i)}>編集</button>
                  <button onClick={() => handleDelete(i)}>削除</button>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

export default App
