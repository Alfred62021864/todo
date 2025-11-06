import { useState, useEffect, useRef } from "react";

function EditButton({ callback, text }) {
  const [editingIndex, setEditingIndex] = useState(-1); // 編集中のインデックスを管理
  const [editText, setEditText] = useState(""); // 編集中のテキストを管理

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

  return (
    <>
      <button onClick={callback}>{text}</button>
    </>
  );
}

export default EditButton;
