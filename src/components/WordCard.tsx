import React from "react";

type Props = {
  text: string;
  selected: boolean;
  solved: boolean;
  shake?: boolean;
  onClick: () => void;
};

const WordCard: React.FC<Props> = ({ text, selected, solved, shake = false, onClick }) => {
  return (
    <div
      className={[
        "word-card",
        selected ? "selected" : "",
        solved ? "solved" : "",
        shake ? "shake" : "",
      ].join(" ").trim()}
      onClick={solved ? undefined : onClick}
    >
      {text}
    </div>
  );
};

export default WordCard; 