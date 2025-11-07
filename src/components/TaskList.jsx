import { useState, useEffect, useRef } from "react";

function TaskList({ todos, setTodos, filter }) {
  const [editingIndex, setEditingIndex] = useState(-1); // 編集中のインデックスを管理
  const [editText, setEditText] = useState(""); // 編集中のテキストを管理

  const handleDelete = (index) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setTodos(newTodos);
    // 削除後の値をローカルストレージに即時保存
    try {
      localStorage.setItem("todos", JSON.stringify(newTodos));
    } catch (e) {
      console.warn("failed to save todos to localStorage", e);
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
      localStorage.setItem("todos", JSON.stringify(newTodos));
    } catch (e) {
      console.warn("failed to save todos to localStorage", e);
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

  const visibleTodos = todos
    .map((t, i) => ({ ...t, originalIndex: i }))
    .filter((item) => {
      if (filter === "completed") return item.completed;
      if (filter === "active") return !item.completed;
      return true;
    });

  const commonButtonCSS = { width: "100px" };
  const liCSS = { display: "flex", justifyContent: "flex-end", width: "100%" };
  const buttonAreaCSS = {
    width: "850px",
    gap: "15px",
    display: "flex",
    justifyContent: "center",
  };

  return (
    <>
      <div
        id="task_list"
        style={{
          height: "400px", // 高さを固定
          overflowY: "auto", // 縦方向のスクロールを有効化
          padding: "10px", // 内側の余白
          // border: "1px solid #ccc", // 境界線を追加（オプション）
          borderRadius: "4px", // 角を丸く（オプション）
        }}
      >
        <ul>
          <div>
            {visibleTodos.map((todoObj) => {
              const i = todoObj.originalIndex;
              return (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: todoObj.completed ? "line-through" : "none",
                    marginBottom: "10px",
                  }}
                >
                  {editingIndex === i ? (
                    <div style={liCSS}>
                      <input
                        style={{ width: "100%" }}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          const composing =
                            e.nativeEvent?.isComposing || e.isComposing;
                          if (e.key === "Enter" && !composing)
                            handleSaveEdit(i);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <div id="buttonArea" style={buttonAreaCSS}>
                        <button
                          style={commonButtonCSS}
                          onClick={() => handleSaveEdit(i)}
                        >
                          保存
                        </button>
                        <button
                          style={commonButtonCSS}
                          onClick={handleCancelEdit}
                        >
                          破棄
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={liCSS}>
                      <div
                        style={{
                          width: "100%",
                          margin: "auto 0",
                          textAlign: "left",
                        }}
                      >
                        {todoObj.text}
                      </div>
                      <div id="buttonArea" style={buttonAreaCSS}>
                        <button
                          style={commonButtonCSS}
                          onClick={() => handleToggleComplete(i)}
                        >
                          {todoObj.completed ? "未完了" : "完了"}
                        </button>
                        <button
                          style={commonButtonCSS}
                          onClick={() => handleEdit(i)}
                        >
                          編集
                        </button>
                        <button
                          style={commonButtonCSS}
                          onClick={() => handleDelete(i)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </div>
        </ul>
      </div>
    </>
  );
}

export default TaskList;
