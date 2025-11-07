function BaseButton({ callback, text }) {
  return (
    <>
      <button onClick={callback} style={{ width: "100px", margin: "0 10px" }}>
        {text}
      </button>
    </>
  );
}

export default BaseButton;
