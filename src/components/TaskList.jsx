import { useState, useEffect, useRef } from "react";

function TaskList({
  todos,
  setTodos,
  filter,
  filteringTag,
  filteringDeadline,
}) {
  const [editingIndex, setEditingIndex] = useState(-1); // 編集中のインデックスを管理
  const [editText, setEditText] = useState(""); // 編集中のテキストを管理
  const [editTag, setEditTag] = useState(""); // 編集中のテキストを管理
  const [editDeadline, setEditDeadline] = useState(""); // 編集中のテキストを管理

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
    setEditTag(todos[index].tag);
    setEditDeadline(todos[index].deadline);
  };

  const handleSaveEdit = (index) => {
    if (editText.trim() === "") return;
    const newTodos = todos.map((todo, i) => {
      if (i === index) {
        return {
          ...todo,
          text: editText.trim(),
          tag: editTag,
          deadline: editDeadline,
        };
      }
      return todo;
    });
    setTodos(newTodos);
    setEditingIndex(-1); // 編集モードを終了
    setEditText("");
    setEditTag("");
    setEditDeadline("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setEditText("");
    setEditTag("");
    setEditDeadline("");
  };

  const visibleTag = (() => {
    const filtered = todos
      .map((t, i) => ({ ...t, originalIndex: i }))
      .filter((item) => item.tag && item.tag === filteringTag);

    return filtered.length > 0 ? filtered : [];
  })();

  const visibleDeadline = (() => {
    const filtered = todos
      .map((t, i) => ({ ...t, originalIndex: i }))
      .filter((item) => item.deadline && item.deadline === filteringDeadline);

    return filtered.length > 0 ? filtered : [];
  })();

  const visibleFileter = (() => {
    const filtered = todos
      .map((t, i) => ({ ...t, originalIndex: i }))
      .filter((item) => {
        if (filter === "completed") return item.completed;
        if (filter === "active") return !item.completed;
        return true;
      });

    return filtered.length > 0 ? filtered : [];
  })();

  const visibleTodos = (() => {
    if (filteringTag) {
      return visibleTag;
    } else if (filteringDeadline) {
      return visibleDeadline;
    }
    return visibleFileter;
  })();

  console.log(visibleTodos);

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
              const tag =
                todoObj.tag && todoObj.tag.length ? `#${todoObj.tag}` : "";
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
                      <input
                        type="text"
                        value={editTag}
                        onChange={(e) => {
                          setEditTag(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          const composing =
                            e.nativeEvent?.isComposing || e.isComposing;
                          if (e.key === "Enter" && !composing)
                            handleSaveEdit(i);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        placeholder="タグを入力"
                        style={{
                          height: "40px",
                          width: "400px",
                          marginLeft: "20px",
                        }}
                      />
                      <input
                        type="text"
                        value={editDeadline}
                        onChange={(e) => {
                          setEditDeadline(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          const composing =
                            e.nativeEvent?.isComposing || e.isComposing;
                          if (e.key === "Enter" && !composing)
                            handleSaveEdit(i);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        placeholder="納期を入力"
                        style={{
                          height: "40px",
                          width: "400px",
                          marginLeft: "20px",
                        }}
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
                      <div
                        style={{
                          width: "1000px",
                          margin: "auto 0",
                          textAlign: "left",
                        }}
                      >
                        {tag}
                      </div>
                      <div
                        style={{
                          width: "500px",
                          margin: "auto 0",
                          textAlign: "left",
                        }}
                      >
                        {todoObj.deadline}
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
