const questions = window.QUESTION_BANK;

const screens = {
  start: document.querySelector("#start-screen"),
  quiz: document.querySelector("#quiz-screen"),
  result: document.querySelector("#result-screen")
};

const ui = {
  bestScore: document.querySelector("#best-score"),
  count: document.querySelector("#question-count"),
  score: document.querySelector("#score-display"),
  progress: document.querySelector("#progress-bar"),
  category: document.querySelector("#category"),
  question: document.querySelector("#question-text"),
  answers: document.querySelector("#answers"),
  feedback: document.querySelector("#feedback"),
  feedbackTitle: document.querySelector("#feedback-title"),
  feedbackText: document.querySelector("#feedback-text"),
  hint: document.querySelector("#selection-hint"),
  next: document.querySelector("#next-button"),
  finalScore: document.querySelector("#final-score"),
  resultTitle: document.querySelector("#result-title"),
  resultMessage: document.querySelector("#result-message"),
  scoreLabel: document.querySelector("#score-label")
};

let currentIndex = 0;
let score = 0;
let selectedIndex = null;
let answerChecked = false;
let activeQuestions = [];

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function prepareQuestions() {
  return shuffle(questions).slice(0, 10).map(item => {
    const shuffledAnswers = shuffle(item.answers.map((text, index) => ({
      text,
      isCorrect: index === item.correct
    })));

    return {
      ...item,
      answers: shuffledAnswers.map(answer => answer.text),
      correct: shuffledAnswers.findIndex(answer => answer.isCorrect)
    };
  });
}

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function loadBestScore() {
  const saved = Number.parseInt(localStorage.getItem("cybersafe-best-score"), 10);
  ui.bestScore.textContent = Number.isInteger(saved) ? `${saved}/10` : "—";
}

function startQuiz() {
  currentIndex = 0;
  score = 0;
  selectedIndex = null;
  answerChecked = false;
  activeQuestions = prepareQuestions();
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const item = activeQuestions[currentIndex];
  selectedIndex = null;
  answerChecked = false;

  ui.count.textContent = `Question ${currentIndex + 1} of ${activeQuestions.length}`;
  ui.score.textContent = `Score: ${score}`;
  ui.progress.style.width = `${((currentIndex + 1) / activeQuestions.length) * 100}%`;
  ui.category.textContent = item.category;
  ui.question.textContent = item.question;
  ui.answers.replaceChildren();
  ui.feedback.hidden = true;
  ui.feedback.className = "feedback";
  ui.hint.textContent = "Choose one answer";
  ui.next.textContent = "Check answer";
  ui.next.disabled = true;

  item.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.dataset.index = index;

    const marker = document.createElement("span");
    marker.className = "answer-marker";
    marker.textContent = String.fromCharCode(65 + index);
    marker.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = answer;
    button.append(marker, label);
    button.addEventListener("click", () => selectAnswer(index));
    ui.answers.append(button);
  });
}

function selectAnswer(index) {
  if (answerChecked) return;
  selectedIndex = index;
  [...ui.answers.children].forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  ui.next.disabled = false;
  ui.hint.textContent = "Answer selected";
}

function checkAnswer() {
  if (selectedIndex === null) return;

  if (answerChecked) {
    if (currentIndex < activeQuestions.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      finishQuiz();
    }
    return;
  }

  answerChecked = true;
  const item = activeQuestions[currentIndex];
  const isCorrect = selectedIndex === item.correct;
  if (isCorrect) score += 1;

  [...ui.answers.children].forEach((button, index) => {
    button.disabled = true;
    button.classList.remove("selected");
    if (index === item.correct) button.classList.add("correct");
    if (index === selectedIndex && !isCorrect) button.classList.add("wrong");
  });

  ui.score.textContent = `Score: ${score}`;
  ui.feedback.hidden = false;
  ui.feedback.classList.add(isCorrect ? "correct" : "wrong");
  ui.feedbackTitle.textContent = isCorrect ? "Correct!" : "Not quite.";
  ui.feedbackText.textContent = item.explanation;
  ui.hint.textContent = isCorrect ? "Nice work" : `Correct answer: ${String.fromCharCode(65 + item.correct)}`;
  ui.next.textContent = currentIndex === activeQuestions.length - 1 ? "See results" : "Next question";
  ui.next.disabled = false;
  ui.next.focus();
}

function finishQuiz() {
  const previousBest = Number.parseInt(localStorage.getItem("cybersafe-best-score"), 10);
  if (!Number.isInteger(previousBest) || score > previousBest) {
    localStorage.setItem("cybersafe-best-score", String(score));
  }

  const result = score >= 9
    ? ["Cyber champion!", "You make smart security choices and spot common threats.", "Excellent awareness"]
    : score >= 7
      ? ["Great work!", "You have strong security habits. Review the explanations to sharpen the few you missed.", "Strong awareness"]
      : score >= 5
        ? ["Good start!", "You know the basics. A quick review will help turn them into safer everyday habits.", "Developing awareness"]
        : ["Keep learning!", "Cybersecurity is a skill you can build. Review each explanation, then try again.", "More practice recommended"];

  ui.finalScore.textContent = score;
  ui.resultTitle.textContent = result[0];
  ui.resultMessage.textContent = result[1];
  ui.scoreLabel.textContent = result[2];
  loadBestScore();
  showScreen("result");
}

document.querySelector("#start-button").addEventListener("click", startQuiz);
document.querySelector("#restart-button").addEventListener("click", startQuiz);
ui.next.addEventListener("click", checkAnswer);

loadBestScore();
