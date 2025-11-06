import { useState, useEffect, useRef } from "react";

function AddButton({ callback, text }) {
  return (
    <>
      <button onClick={callback} style={{ width: "100px" }}>
        {text}
      </button>
    </>
  );
}

export default AddButton;
