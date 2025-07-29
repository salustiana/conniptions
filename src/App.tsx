import React, { useMemo, useState } from "react";
import WordCard from "./components/WordCard";
import AuthForm from "./components/AuthForm";
import { useAuth } from "./context/AuthContext";
import { Routes, Route, Link } from "react-router-dom";
import UserPage from "./pages/UserPage";
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
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState<"login" | "signup" | null>(null);
  const [solved, setSolved] = useState<Group[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shakeWords, setShakeWords] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Set<string>>(new Set());
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

    // normalize guess to unordered key
    const guessKey = [...selected].sort().join("|");
    if (guesses.has(guessKey)) {
      setToast("Already guessed");
      // hide after 1.5s
      setTimeout(() => setToast(null), 1500);
      return;
    }

    // store this new guess
    setGuesses((prev) => {
      const next = new Set(prev);
      next.add(guessKey);
      return next;
    });

    const found = todaysPuzzle.groups.find((g) => arraysEqual(g.words, selected));
    if (found && !solved.includes(found)) {
      setSolved([...solved, found]);
      setSelected([]);
      // remove words implicitly via solved state effect
    } else {
      // check if guess is "one away" (3 out of 4 words belong to the same group)
      const oneAway = todaysPuzzle.groups.some((g) => {
        const matches = selected.filter((w) => g.words.includes(w)).length;
        return matches === 3;
      });

      if (oneAway) {
        const nextMistakes = mistakes + 1;
        const willLose = nextMistakes >= MAX_MISTAKES;
        setMistakes(nextMistakes);
        if (!willLose) {
          setToast("One away...");
          // hide toast after 1.5s
          setTimeout(() => setToast(null), 1500);
        }
        // keep selection so the player can adjust (or see final attempt)
      } else {
        setMistakes(mistakes + 1);
        setShakeWords(selected);
        // clear shake after animation duration
        setTimeout(() => setShakeWords([]), 500);
      }
    }
  };

  const shuffle = () => {
    setOrder(shuffleArray(order));
  };

  const deselect = () => setSelected([]);

  const lost = mistakes >= MAX_MISTAKES;
  const won = solved.length === todaysPuzzle.groups.length;

  // groups to render above grid; if lost, show every category in order of difficulty
  const groupsToShow = (lost ? todaysPuzzle.groups : solved)
    .slice()
    .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}

      {/* Top-right auth button */}
      <div className="auth-top">
        {user ? (
          <span>
            <Link to="/me" className="link">{user}</Link> · {" "}
            <button className="pill-btn" onClick={logout}>Log out</button>
          </span>
        ) : (
          <div className="auth-buttons">
            <button className="pill-btn" onClick={() => setShowAuth("login")}>Log In</button>
            <button className="pill-btn" onClick={() => setShowAuth("signup")}>Sign Up</button>
          </div>
        )}
      </div>

      {(!user && showAuth) && (
        <div
          className="auth-overlay"
          onClick={() => setShowAuth(null)}
        >
          <div
            className="auth-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthForm
              initialMode={showAuth}
              onSuccess={() => setShowAuth(null)}
            />
          </div>
        </div>
      )}

      {/* Game core always visible */}

          <header className="top-bar">
            <h1 className="title">Conniptions</h1>
            {todaysPuzzle.date && <span className="date">{todaysPuzzle.date}</span>}
          </header>
          <p className="subtitle">Create four groups of four!</p>

      <Routes>
        <Route path="/" element={
          <div className="game-core">
            {groupsToShow.map((g) => (
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
        } />
        <Route path="/me" element={<UserPage />} />
      </Routes>
    </div>
  );
};

export default App; 
