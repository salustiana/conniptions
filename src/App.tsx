import React, { useMemo, useState } from "react";
import WordCard from "./components/WordCard";
import { Group } from "./types";
import { todaysPuzzle } from "./puzzles";
import "./index.scss";

const MAX_MISTAKES = 4;

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

const App: React.FC = () => {
  const [solved, setSolved] = useState<Group[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shakeWords, setShakeWords] = useState<string[]>([]);
  const allWords = useMemo(
    () => todaysPuzzle.groups.flatMap((g) => g.words),
    []
  );

  const unsolvedWords = useMemo(
    () => allWords.filter((w) => !solved.some((g) => g.words.includes(w))),
    [allWords, solved]
  );

  // utility to shuffle array
  const shuffleArray = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);

  // maintain a shuffle order in state
  const [order, setOrder] = useState<string[]>(shuffleArray(unsolvedWords));
  // ensure order updated when words removed due to solving
  React.useEffect(() => {
    setOrder((prev) => prev.filter((w) => unsolvedWords.includes(w)));
  }, [unsolvedWords]);

  const toggleWord = (word: string) => {
    if (selected.includes(word)) {
      setSelected(selected.filter((w) => w !== word));
    } else if (selected.length < 4) {
      setSelected([...selected, word]);
    }
  };

  const submit = () => {
    if (selected.length !== 4) return;
    const found = todaysPuzzle.groups.find((g) => arraysEqual(g.words, selected));
    if (found && !solved.includes(found)) {
      setSolved([...solved, found]);
      setSelected([]);
      // remove words implicitly via solved state effect
    } else {
      setMistakes(mistakes + 1);
      setShakeWords(selected);
      setSelected([]);
      // clear shake after animation duration
      setTimeout(() => setShakeWords([]), 500);
    }
  };

  const shuffle = () => {
    setOrder(shuffleArray(order));
  };

  const deselect = () => setSelected([]);

  const lost = mistakes >= MAX_MISTAKES;
  const won = solved.length === todaysPuzzle.groups.length;

  return (
    <div>
      <h1 className="header">Conniptions</h1>

      {solved
        .slice()
        .sort((a, b) => a.difficulty - b.difficulty)
        .map((g) => (
          <div key={g.name} className={`solved-group solved-${g.difficulty}`}>
            <div className="group-name">{g.name}</div>
            <div className="group-words">{g.words.join(", ")}</div>
          </div>
        ))}

      {!won && !lost && (
        <div className="grid">
          {order.map((word) => (
            <WordCard
              key={word}
              text={word}
              selected={selected.includes(word)}
              solved={false}
              shake={shakeWords.includes(word)}
              onClick={() => toggleWord(word)}
            />
          ))}
        </div>
      )}

      <div className="controls">
        <button onClick={shuffle} disabled={won || lost}>Shuffle</button>
        <button onClick={deselect} disabled={selected.length === 0 || won || lost}>
          Deselect All
        </button>
        <button
          onClick={submit}
          disabled={selected.length !== 4 || won || lost}
        >
          Submit
        </button>
      </div>

      <div className="mistakes-wrapper">
        <span className="mistakes-label">Mistakes Remaining:</span>
        <div className="mistakes-dots">
          {Array.from({ length: MAX_MISTAKES }, (_, i) => (
            <span
              key={i}
              className={`dot ${i < MAX_MISTAKES - mistakes ? "active" : ""}`}
            />
          ))}
        </div>
      </div>

      {lost && <h2>You lost! Refresh to play again.</h2>}
      {won && <h2>Congratulations! You solved it.</h2>}
    </div>
  );
};

export default App; 