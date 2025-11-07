import BaseButton from "./utility/BaseButton.jsx";

function AddButton({ callback, text }) {
  return (
    <>
      <BaseButton callback={callback} text={text} />
    </>
  );
}

export default AddButton;
