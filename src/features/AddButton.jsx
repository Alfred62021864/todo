import BaseButton from "../components/BaseButton.jsx";

function AddButton({ callback, text }) {
  return (
    <>
      <BaseButton callback={callback} text={text} />
    </>
  );
}

export default AddButton;
