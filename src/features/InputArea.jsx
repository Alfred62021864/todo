import AddButton from "./AddButton.jsx";

function InputArea({
  inputRef,
  tagRef,
  setTodo,
  todo,
  setTodos,
  todos,
  tag,
  setTag,
  deadline,
  setDeadline,
  deadlineRef,
}) {
  const handleKeyDown = (e) => {
    const composing = e.nativeEvent?.isComposing || e.isComposing;
    if (e.key === "Enter" && !composing) {
      if (todo.trim() === "") return;
      const text = todo.trim();
      const newTodos = [...todos, { text, completed: false, tag, deadline }];
      setTodos(newTodos);
      try {
        localStorage.setItem("todos", JSON.stringify(newTodos));
      } catch (e) {
        console.warn("failed to save todos to localStorage", e);
      }
      setTodo("");
      inputRef.current?.focus();
      setTag("");
      setDeadline("");
    }
  };

  return (
    <>
      <div style={{ width: "100%" }}>
        <div></div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="やることを入力"
            style={{ height: "40px", width: "100%", marginLeft: "20px" }}
          />
          <input
            ref={tagRef}
            type="text"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="タグを入力"
            style={{ height: "40px", width: "500px", marginLeft: "20px" }}
          />
          <input
            ref={deadlineRef}
            type="text"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="納期を入力"
            style={{ height: "40px", width: "250px", marginLeft: "20px" }}
          />
          <AddButton
            callback={() => {
              if (todo.trim() === "") return;
              const text = todo.trim();
              const newTodos = [
                ...todos,
                { text, completed: false, tag, deadline },
              ];
              setTodos(newTodos);
              try {
                localStorage.setItem("todos", JSON.stringify(newTodos));
              } catch (e) {
                console.warn("failed to save todos to localStorage", e);
              }

              setTodo("");
              setTag("");
              setDeadline("");
              inputRef.current?.focus();
            }}
            text="追加"
          />
        </div>
      </div>
    </>
  );
}

export default InputArea;
