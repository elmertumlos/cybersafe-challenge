# Code Review Handoff

## Project

Cybersecurity Awareness Quiz — a browser-based MVP that selects 10 multiple-choice questions from a bank of 100.

## Reviewer Task

Review the implementation for correctness, usability, and maintainability. Do not rewrite the project unless explicitly asked. Report concrete issues first, ordered by severity, and include the relevant file and line number.

## Expected MVP Behavior

- Contains exactly 100 cybersecurity-awareness questions and displays 10 per attempt without repeats.
- Randomizes both question order and answer order on every attempt.
- Each question has clear multiple-choice answers and one correct answer.
- Allows the user to select an answer and move through the quiz.
- Prevents accidental double-scoring or invalid submissions.
- Calculates the final score correctly out of 10.
- Shows a clear results screen after the final question.
- Provides short explanations or identifies the correct answers.
- Includes a working **Try Again** action that resets all quiz state.
- Works without login, a database, or external services.
- Is usable on both desktop and mobile screen sizes.

## Review Checklist

1. Run the app and complete the quiz with all-correct, all-wrong, and mixed answers.
2. Verify navigation, scoring, result text, explanations, and restart behavior.
3. Check edge cases such as clicking buttons repeatedly or proceeding without an answer.
4. Inspect the question data for factual accuracy and unambiguous wording.
5. Check HTML semantics, keyboard accessibility, visible focus states, and color contrast.
6. Look for duplicated logic, unnecessary complexity, unsafe DOM usage, and console errors.
7. Confirm that the layout remains readable at narrow mobile widths.

## Review Output

### Findings

- **High — Focus dropped to `<body>` on question advance and screen transitions** (`app.js:83-94`, `app.js:58-61`): When an answer is checked, focus moves to `#next-button` ("Next question"). When activated to advance, `renderQuestion()` immediately sets `ui.next.disabled = true`. Disabling the currently focused element causes browsers to drop focus to `document.body`. Similarly, when `#start-button` and `#restart-button` are clicked, their parent `<section>` is hidden via `display: none`, dropping focus to `<body>`. This forces keyboard and screen-reader users to re-navigate the DOM from the top on every question.
  - *Fix*: Move programmatic focus to the question heading (`#question-text` with `tabindex="-1"`) or the first answer option upon rendering each question, and focus the main heading/card when transitioning screens.

- **Medium — Incomplete ARIA Radio Group implementation and lack of programmatic correct/wrong indicator** (`app.js:96-101`, `index.html:43`): The answers container uses `role="radiogroup"` and child buttons use `role="radio"`, but the component lacks standard WAI-ARIA radiogroup keyboard interactions (arrow key navigation and roving `tabindex="0"` / `tabindex="-1"`). All buttons remain individual tab stops. Furthermore, after checking an answer, buttons are disabled while `aria-checked` remains `true` on the selected answer and `false` on the correct answer, with no accessible text/attribute on the buttons indicating which was correct or incorrect (only visual CSS classes `.correct` / `.wrong` are applied).
  - *Fix*: Either use native `<input type="radio">` with `<label>` (which provides arrow key handling, tab management, and radio semantics natively), or implement arrow key listeners with roving tabindex and add an accessible label/badge (e.g. `aria-label="${answer} - Correct answer"`).

- **Medium — Screen-reader live region announcement interrupted by immediate button focus** (`app.js:154-162`): In `checkAnswer()`, `ui.feedback` (`role="status"`, `aria-live="polite"`) is populated with feedback text and unhidden, immediately followed synchronously by `ui.next.focus()`. In screen readers (such as NVDA and VoiceOver), shifting focus immediately to a new element interrupts and cancels pending polite live region speech, causing the screen reader to speak only "Next question, button" without reading the feedback.
  - *Fix*: Allow screen readers to announce the live feedback by keeping focus on the feedback region or delaying the focus shift until navigation.

- **Medium — Rapid double-click skips question feedback and explanation** (`app.js:131-139`, `app.js:159-160`): The same button (`#next-button`) is used to check an answer and to advance to the next question. When checked, the button label changes to "Next question" and remains enabled. If a user quickly double-clicks "Check answer", the first click checks the question and the second click immediately satisfies `if (answerChecked)` and advances to the next question.
  - *Fix*: Introduce a brief debounce or lockout period (e.g. disable `#next-button` for 300–400ms when switching to "Next question"), or keep check and advance actions distinct.

- **Low — Unhandled `localStorage` exceptions in restricted environments** (`app.js:64`, `app.js:165-167`): Direct calls to `localStorage.getItem()` and `localStorage.setItem()` are not wrapped in `try...catch`. In environments where third-party storage or cookies are blocked (such as LMS iframe embeds, strict sandboxes, or private browsing modes), `localStorage` throws an uncaught `DOMException: Access is denied`. This crashes script initialization at line 190 (preventing the start button from working) or crashes `finishQuiz()` at the end of the 10th question.
  - *Fix*: Wrap `localStorage` calls in a helper function with `try...catch` and fall back gracefully to in-memory state.

- **Low — Category pill color contrast fails WCAG 2.1 AA** (`styles.css:160`): The `.category` badge renders `color: var(--blue)` (`#176bff`) over background `#eaf2ff`. At `.72rem` (approx. 11.5px), the contrast ratio is 4.07:1, which is below the WCAG 2.1 AA requirement of 4.5:1 for small text.
  - *Fix*: Darken the text color (e.g. `#0d5be1` or `#094db8`) to achieve a contrast ratio above 4.5:1.

- **Low — Results screen omits best score and return path to home screen** (`index.html:56-67`, `app.js:178-184`): While `finishQuiz()` persists the best score to storage and updates `ui.bestScore`, `#best-score` is located exclusively on the start screen. `#result-screen` only shows the current score, and "Try again" jumps straight back to `#quiz-screen`. Users cannot see whether they beat their personal record or view their best score without a full page reload.
  - *Fix*: Display the all-time best score or a "New Best Score!" indicator on the results screen, and provide an option to return to the start screen.

### Verification

- **Question Bank Validation**: Executed automated validation scripts over `question-bank.js`. Confirmed exactly 100 questions, each having 4 options, a valid `correct` index (0–3), non-empty explanations, no duplicate questions, and no duplicate answer choices within any question.
- **Scoring & State Simulation**: Ran end-to-end simulation suites for:
  - All 10 correct answers (10/10, "Cyber champion!", best score recorded as 10).
  - All 10 incorrect answers (0/10, "Keep learning!", best score handled properly).
  - Mixed answer profiles (7/10 "Great work!", 5/10 "Good start!").
  - Restart / Try Again state reset: verified questions reshuffle, answers reshuffle, and `currentIndex` / `score` reset to 0.
  - Button state edge cases: verified proceeding without selection is blocked (`ui.next.disabled = true; if (selectedIndex === null) return;`).
- **Color Contrast Calculations**: Evaluated WCAG contrast ratios across key UI elements (button text 4.58:1, feedback text 6.68:1 and 7.75:1, muted text 4.69:1, category pill 4.07:1).
- **Checks that could not be performed**: Headless browser screenshot rendering and live screen-reader speech engine verification (NVDA/JAWS audio output) were not executed in this environment.
