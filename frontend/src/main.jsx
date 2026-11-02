import React from "react";
import { createRoot } from "react-dom/client";
import TodoApp from "./todo-app.jsx";
import "./style.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TodoApp />
  </React.StrictMode>,
);
