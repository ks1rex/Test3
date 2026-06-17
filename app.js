"use strict";
/* ========== THEME (dark/light) ========== */
const body = document.body;
const themeToggle = document.getElementById("themeToggle");
if (localStorage.getItem("theme") === "light") body.classList.add("light");
// sync icon to initial theme before lucide.createIcons() runs at end of file
(function() {
  const i = themeToggle.querySelector("i");
  if (i) i.dataset.lucide = body.classList.contains("light") ? "sun" : "moon";
})();
themeToggle.onclick = () => {
  body.classList.toggle("light");
  const isLight = body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  const i = themeToggle.querySelector("i");
  if (i) { i.dataset.lucide = isLight ? "sun" : "moon"; lucide.createIcons(); }
};

/* ========== DOM REFS ========== */
const topicSelect = document.getElementById("topicSelect");
const rangeStartElem = document.getElementById("rangeStart");
const rangeEndElem = document.getElementById("rangeEnd");
const shuffleElem = document.getElementById("shuffle");

const startBtn = document.getElementById("startBtn");
const wrongOnlyBtn = document.getElementById("wrongOnlyBtn");
const checkBtn = document.getElementById("checkBtn");
const markRightBtn = document.getElementById("markRightBtn");
const markWrongBtn = document.getElementById("markWrongBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const questionBox = document.getElementById("question");
const answerInput = document.getElementById("answerInput");
const correctBox = document.getElementById("correctBox");
const answerContainer = document.getElementById("answerContainer");
const stepInfo = document.getElementById("stepInfo");
const wrongCount = document.getElementById("wrongCount");
const hideVariantsElem = document.getElementById("hideVariants");
const resultBox = document.getElementById("resultBox");
const firstRunHint = document.getElementById("firstRunHint");
const rangeError = document.getElementById("rangeError");
const drillContent = document.getElementById("drillContent");
const sessionComplete = document.getElementById("sessionComplete");
const sessionCorrectEl = document.getElementById("sessionCorrect");
const sessionErrorsEl = document.getElementById("sessionErrors");
const sessionPctEl = document.getElementById("sessionPct");
const sessionTotalEl = document.getElementById("sessionTotal");
const sessionTimeEl = document.getElementById("sessionTime");
const sessionBandEl = document.getElementById("sessionBand");
const restartSessionBtn = document.getElementById("restartSessionBtn");
const repeatWrongSessionBtn = document.getElementById("repeatWrongSessionBtn");
const kbHint = document.getElementById("kbHint");
const kbHintDismiss = document.getElementById("kbHintDismiss");

/* ========== DOM REFS — reset password ========== */
const resetPasswordScreen = document.getElementById("resetPasswordScreen");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const forgotEmailInput = document.getElementById("forgotEmail");
const forgotError = document.getElementById("forgotError");
const forgotSuccess = document.getElementById("forgotSuccess");
const sendResetBtn = document.getElementById("sendResetBtn");
const backFromForgot = document.getElementById("backFromForgot");
const resetPasswordInput = document.getElementById("resetPassword");
const resetPasswordToggle = document.getElementById("resetPasswordToggle");
const resetError = document.getElementById("resetError");
const resetSuccess = document.getElementById("resetSuccess");
const savePasswordBtn = document.getElementById("savePasswordBtn");

/* ========== STATE ========== */
let QA = [];
let order = [];
let idx = 0;
let wrongSet = new Set();
let lastStart = 0;
let lastEnd = 0;
let sessionStartTime = 0;

hideVariantsElem.onchange = () => {
  showQA();
};
/* ========== LOAD TOPIC LIST ========== */
async function loadTopicList(){
  try {
    const resp = await fetch("topics_index.json");
    if (!resp.ok) throw new Error("Нет topics_index.json");
    const topics = await resp.json();

    topicSelect.innerHTML = "";
    topics.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.file;
      opt.textContent = t.title || t.file;
      topicSelect.appendChild(opt);
    });


    topicSelect.onchange = () => loadTopic(topicSelect.value);


    if(topicSelect.options.length > 0){
      topicSelect.selectedIndex = 0;
      loadTopic(topicSelect.value);
    } else {

      questionBox.textContent = "Темы не найдены. Добавьте topics_index.json и файлы в папку topics/";
      updateButtons();
    }
  } catch (err) {
    console.error(err);
    questionBox.textContent = "Не удалось загрузить список тем: " + err.message;
    topicSelect.innerHTML = "";
    updateButtons();
  }
}

/* ========== LOAD TOPIC (JSON) ========== */
async function loadTopic(filename){
  wrongSet.clear();
  idx = 0;
  order = [];
  hideSessionComplete();
  kbHint.style.display = 'none';

  if(!filename){
    QA = [];
    questionBox.textContent = "Выберите тему";
    correctBox.style.display = "none";
    firstRunHint.style.display = "";
    updateButtons();
    return;
  }

  questionBox.textContent = "Загрузка темы…";
  firstRunHint.style.display = "none";
  rangeError.style.display = "none";
  startBtn.disabled = true;

  try {
    const resp = await fetch("topics/" + filename);
    if (!resp.ok) throw new Error("Файл темы не найден: " + filename);
    const data = await resp.json();

    QA = Array.isArray(data)
      ? data
      : Array.isArray(data.questions)
        ? data.questions
        : [];

    rangeStartElem.value = 1;
    rangeEndElem.value = QA.length || 1;
    questionBox.textContent = "Нажмите «Начать»";
    firstRunHint.style.display = "";
    correctBox.style.display = "none";
    correctBox.textContent = "";
    updateButtons();
  } catch (err) {
    console.error(err);
    QA = [];
    questionBox.textContent = "Ошибка при загрузке темы: " + err.message;
    correctBox.style.display = "none";
    updateButtons();
  }
}

/* ========== ORDER BUILD & NAV ========== */
function buildOrder(start, end){
  order = [];

  start = Math.max(0, Math.min(start, QA.length - 1));
  end = Math.max(0, Math.min(end, QA.length));
  for(let i = start; i < end; i++) order.push(i);
  if(shuffleElem.checked) fisherYates(order);
  idx = 0;
}

function showStep(){
  stepInfo.textContent = (order.length ? (idx + 1) : 0) + "/" + (order.length || 0);
  wrongCount.textContent = wrongSet.size;
}

/* ========== SESSION COMPLETE ========== */
function formatSessionTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return m + ':' + String(s).padStart(2, '0');
}

function showSessionComplete() {
  hideAnswer();
  const total = order.length;
  const errors = wrongSet.size;
  const correct = total - errors;
  const pct = total > 0 ? Math.round(correct / total * 100) : 0;
  const elapsed = sessionStartTime ? Date.now() - sessionStartTime : 0;

  sessionCorrectEl.textContent = correct;
  sessionTotalEl.textContent = total;
  sessionErrorsEl.textContent = errors;
  sessionPctEl.textContent = pct + '%';
  sessionTimeEl.textContent = elapsed > 0 ? formatSessionTime(elapsed) : '—';

  if (sessionBandEl) {
    let band = '';
    if (errors === 0)       band = 'Все вопросы верно';
    else if (pct >= 90)     band = 'Отличный результат';
    else if (pct >= 70)     band = 'Хороший результат';
    else if (pct >= 50)     band = 'Есть над чем работать';
    else                    band = 'Нужно ещё потренироваться';
    sessionBandEl.textContent = band;
  }

  const heroStat = sessionComplete.querySelector('.session-stat--hero');
  if (heroStat) heroStat.classList.toggle('session-stat--success', errors === 0);

  if (errors > 0) {
    repeatWrongSessionBtn.className = 'btn-primary';
    repeatWrongSessionBtn.style.display = '';
    restartSessionBtn.className = 'btn-outline';
  } else {
    repeatWrongSessionBtn.style.display = 'none';
    restartSessionBtn.className = 'btn-primary';
  }

  kbHint.style.display = 'none';
  drillContent.style.display = 'none';
  sessionComplete.style.display = '';
  showStep();
  updateButtons();
  lucide.createIcons();
}

function hideSessionComplete() {
  sessionComplete.style.display = 'none';
  drillContent.style.display = '';
}

/* ========== KEYBOARD HINT ========== */
function maybeShowKbHint() {
  if (!localStorage.getItem('kbHintSeen')) {
    kbHint.style.display = '';
  }
}
function dismissKbHint() {
  if (kbHint.style.display !== 'none') {
    kbHint.style.display = 'none';
    localStorage.setItem('kbHintSeen', '1');
  }
}
kbHintDismiss.onclick = () => {
  kbHint.style.display = 'none';
  localStorage.setItem('kbHintSeen', '1');
};

/* ========== PILL TOAST ========== */
function showPillToast(msg, duration) {
  if (duration === undefined) duration = 4000;
  let toast = document.getElementById('pillToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pillToast';
    toast.className = 'pill-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('pill-toast--visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('pill-toast--visible'), duration);
}

function normalizeQuestion(text) {
  if (!hideVariantsElem.checked) return text;


  return text.replace(/\s*\(\d+\)\s*$/, "");
}
function shuffleArray(array) {
  const arr = array.map((item, index) => ({ item, index }));

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function showResult(isCorrect) {
  resultBox.innerHTML = isCorrect
    ? '<i data-lucide="check"></i> Верно'
    : '<i data-lucide="x"></i> Неверно';
  resultBox.className = isCorrect ? "ok" : "wrong";
  resultBox.style.display = "block";
  lucide.createIcons();
}

function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
/* ========== SHOW QA ========== */
function showQA(){
  hideSessionComplete();
  if(!order.length){
    firstRunHint.style.display = "";
    questionBox.textContent = "Нажмите «Начать»";
    answerInput.value = "";
    answerContainer.innerHTML = "";
    answerInput.style.display = "none";
    correctBox.style.display = "none";
    correctBox.textContent = "";
    updateButtons();
    showStep();
    return;
  }

  firstRunHint.style.display = "none";
  const currentIndex = order[idx];
  const current = QA[currentIndex];
  if (!current) return;

  answerContainer.innerHTML = "";
  answerInput.style.display = "none";
  const qRaw = QA[currentIndex]?.q ?? ("Вопрос #" + (currentIndex + 1));
  const qText = current?.type === "fill_each"
    ? qRaw.replace(/_{2,}/g, "___").replace(/\s{2,}/g, " ").trim()
    : qRaw;
  switch (current.type) {

  case "single":
  case "multi": {

    const shuffledMulti = shuffleArray(current.options);

    current._multiMap = shuffledMulti.map(el => el.index);

    const inputType = current.type === "single" ? "radio" : "checkbox";

    shuffledMulti.forEach((el, newIndex) => {

      const label = document.createElement("label");
      const inp = document.createElement("input");
      inp.type = inputType;
      inp.name = "answer";
      inp.value = newIndex;
      label.appendChild(inp);
      label.appendChild(document.createTextNode(" " + el.item));

      answerContainer.appendChild(label);
      answerContainer.appendChild(document.createElement("br"));
    });

    break;
  }

  case "matching":

    const shuffledLeft = shuffleArray(current.left);

    shuffledLeft.forEach((el) => {

      const originalLeftIndex = el.index;

      const select = document.createElement("select");
      select.dataset.leftIndex = originalLeftIndex;
      select.setAttribute("aria-label", el.item);

      current.right.forEach((option, j) => {
        const opt = document.createElement("option");
        opt.value = j;
        opt.textContent = option;
        select.appendChild(opt);
      });

      const row = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = el.item;
      row.appendChild(strong);
      row.appendChild(document.createTextNode(" → "));
      row.appendChild(select);

      answerContainer.appendChild(row);
    });

    break;

  case "fill_each":

    const shuffledFill = shuffleArray(current.items);

    shuffledFill.forEach((el) => {

      const input = document.createElement("input");
      input.type = "text";
      input.dataset.originalIndex = el.index;
      input.setAttribute("aria-label", el.item);

      const row = document.createElement("div");
      const parts = el.item.split("[___]");
      if (parts.length === 2) {
        if (parts[0]) row.appendChild(document.createTextNode(parts[0]));
        row.appendChild(input);
        if (parts[1]) row.appendChild(document.createTextNode(parts[1]));
      } else {
        row.textContent = el.item + " ";
        row.appendChild(input);
      }

      answerContainer.appendChild(row);
    });

    break;


  case "sequence":

    const shuffledSeq = shuffleArray(current.items);

    shuffledSeq.forEach((el) => {

      const input = document.createElement("input");
      input.type = "number";
      input.min = 1;
      input.max = current.items.length;
      input.dataset.originalIndex = el.index;
      input.setAttribute("aria-label", el.item + " — порядковый номер");

      const row = document.createElement("div");
      row.textContent = el.item + " — порядок: ";
      row.appendChild(input);

      answerContainer.appendChild(row);
    });

    break;


  case "assertion":

    const block = document.createElement("div");
    const p1 = document.createElement("p");
    p1.textContent = "1) " + current.statement1;
    const p2 = document.createElement("p");
    p2.textContent = "2) " + current.statement2;
    block.appendChild(p1);
    block.appendChild(p2);
    answerContainer.appendChild(block);

    const variants = [
      "Оба верны, есть связь",
      "Оба верны, связи нет",
      "Верно только первое",
      "Верно только второе",
      "Оба неверны"
    ];

    variants.forEach((text, i) => {

      const label = document.createElement("label");
      const inp = document.createElement("input");
      inp.type = "radio";
      inp.name = "assertion";
      inp.value = i;
      label.appendChild(inp);
      label.appendChild(document.createTextNode(" " + text));

      answerContainer.appendChild(label);
      answerContainer.appendChild(document.createElement("br"));
    });

    break;


  default:
    answerInput.style.display = "block";
}

  questionBox.textContent = normalizeQuestion(qText);
  answerInput.value = "";
  correctBox.style.display = "none";
  correctBox.textContent = "";
  resultBox.style.display = "none";
  resultBox.textContent = "";
  resultBox.className = "";
  checkBtn.textContent = "Показать ответ";

  updateButtons();
  showStep();
}

/* ========== SHOW ANSWER ========== */


function showAnswer() {
  if (!order.length) return;
  const current = QA[order[idx]];
  if (!current) return;

  // ===== ПРОВЕРКИ =====

  if (current.type === "single") {
    const selected = document.querySelector("input[name='answer']:checked");
    const selectedOriginalIndex = selected ? current._multiMap[parseInt(selected.value)] : -1;
    showResult(selectedOriginalIndex === current.correct);
  }

  if (current.type === "multi") {

    const selected = [...document.querySelectorAll("input[name='answer']:checked")]
      .map(el => current._multiMap[parseInt(el.value)])
      .sort()
      .join(",");

    const correct = current.correct.slice().sort().join(",");

    showResult(selected === correct);
  }


  if (current.type === "matching") {
    let ok = true;
    // Scope to answerContainer to avoid capturing #topicSelect
    answerContainer.querySelectorAll("select").forEach(select => {
      const leftIndex = parseInt(select.dataset.leftIndex);
      const chosenRight = parseInt(select.value);
      if (chosenRight !== current.correct[leftIndex]) ok = false;
    });
    showResult(ok);
  }

  if (current.type === "fill_each") {
    let ok = true;
    answerContainer.querySelectorAll("input[type='text']").forEach(input => {
      const originalIndex = parseInt(input.dataset.originalIndex);
      if (input.value.trim().toLowerCase() !==
          current.answers[originalIndex].toLowerCase()) ok = false;
    });
    showResult(ok);
  }

  if (current.type === "sequence") {
    // correct_order[stepIdx] = originalIndex of item at that step.
    // Build inverse: correctStepOf[originalIndex] = stepIdx (0-based).
    const correctStepOf = {};
    current.correct_order.forEach((origIdx, stepIdx) => {
      correctStepOf[origIdx] = stepIdx;
    });
    let ok = true;
    // Scope to answerContainer to avoid capturing #rangeStart / #rangeEnd
    answerContainer.querySelectorAll("input[type='number']").forEach(input => {
      const originalIndex = parseInt(input.dataset.originalIndex);
      if (parseInt(input.value) - 1 !== correctStepOf[originalIndex]) ok = false;
    });
    showResult(ok);
  }

  if (current.type === "assertion") {
    const selected = document.querySelector("input[name='assertion']:checked");
    showResult(selected !== null && parseInt(selected.value) === current.correct);
  }

  let out = "Эталон:\n\n";

  if (current.type === "single" || current.type === "multi") {
    const arr = Array.isArray(current.correct) ? current.correct : [current.correct];
    arr.forEach(i => {
      out += "✔ " + current.options[i] + "\n";
    });
  }

  else if (current.type === "matching") {
    Object.keys(current.correct).forEach(k => {
      const left = current.left[k];
      const right = current.right[current.correct[k]];
      out += left + " → " + right + "\n";
    });
  }

  else if (current.type === "fill_each") {
    current.items.forEach((item, i) => {
      out += item.replace("[___]", current.answers[i]) + "\n";
    });
  }

  else if (current.type === "sequence") {
    current.correct_order.forEach((pos, i) => {
      out += (i + 1) + ") " + current.items[pos] + "\n";
    });
  }

  else if (current.type === "assertion") {
    const variants = [
      "Оба верны, есть связь",
      "Оба верны, связи нет",
      "Верно только первое",
      "Верно только второе",
      "Оба неверны"
    ];
    out += variants[current.correct];
  }

  else if (current.a) {
    out += current.a;
  }

  else {
    out += "(ответ не задан)";
  }

  correctBox.textContent = out;
  correctBox.style.display = "block";

  markRightBtn.disabled = false;
  markRightBtn.style.display = '';
  markWrongBtn.disabled = false;
  markWrongBtn.style.display = '';
  checkBtn.textContent = "Скрыть ответ";
}

function hideAnswer() {
  correctBox.style.display = "none";
  correctBox.textContent = "";
  resultBox.style.display = "none";
  resultBox.textContent = "";
  resultBox.className = "";

  markRightBtn.disabled = true;
  markRightBtn.style.display = 'none';
  markWrongBtn.disabled = true;
  markWrongBtn.style.display = 'none';
  checkBtn.textContent = "Показать ответ";
}

function isAnswerVisible() {
  return window.getComputedStyle(correctBox).display !== "none";
}

function toggleAnswer() {
  if (isAnswerVisible()) {
    hideAnswer();
  } else {
    showAnswer();
  }
}

checkBtn.onclick = toggleAnswer;

/* ========== UPDATE BUTTONS ========== */
function updateButtons(){
  const hasOrder = order.length > 0;
  checkBtn.disabled = !hasOrder;
  markRightBtn.disabled = true;
  markWrongBtn.disabled = true;

  prevBtn.disabled = !(hasOrder && idx > 0);
  nextBtn.disabled = !(hasOrder && idx < order.length - 1);

  wrongOnlyBtn.disabled = wrongSet.size === 0;


  startBtn.disabled = QA.length === 0;
}

/* ========== BUTTON HANDLERS ========== */
startBtn.onclick = () => {
  rangeError.style.display = "none";
  const start = Math.max(1, parseInt(rangeStartElem.value || 1)) - 1;
  let end = Math.min(QA.length, parseInt(rangeEndElem.value || QA.length));
  if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
    rangeError.textContent = "Неверный диапазон. Начало должно быть меньше конца и не выходить за пределы списка.";
    rangeError.style.display = "";
    return;
  }
  lastStart = start;
  lastEnd = end;
  sessionStartTime = Date.now();
  buildOrder(start, end);
  showQA();
  maybeShowKbHint();
};

wrongOnlyBtn.onclick = () => {
  if (!wrongSet.size) return;
  sessionStartTime = Date.now();
  order = Array.from(wrongSet);
  if (shuffleElem.checked) fisherYates(order);
  idx = 0;
  showQA();
  maybeShowKbHint();
};

restartSessionBtn.onclick = () => {
  sessionStartTime = Date.now();
  buildOrder(lastStart, lastEnd);
  showQA();
  maybeShowKbHint();
};

repeatWrongSessionBtn.onclick = () => {
  if (!wrongSet.size) return;
  sessionStartTime = Date.now();
  order = Array.from(wrongSet);
  if (shuffleElem.checked) fisherYates(order);
  idx = 0;
  showQA();
  maybeShowKbHint();
};


markRightBtn.onclick = () => {
  wrongSet.delete(order[idx]);
  if (idx < order.length - 1) { idx++; showQA(); } else { showSessionComplete(); }
};
markWrongBtn.onclick = () => {
  wrongSet.add(order[idx]);
  if (idx < order.length - 1) { idx++; showQA(); } else { showSessionComplete(); }
};

nextBtn.onclick = () => { if (idx < order.length - 1) { idx++; showQA(); } };
prevBtn.onclick = () => { if (idx > 0) { idx--; showQA(); } };

/* ========== SCREENS ========== */
const loadingScreen = document.getElementById("loadingScreen");
const authScreen = document.getElementById("authScreen");
const activationScreen = document.getElementById("activationScreen");
const appScreen = document.getElementById("appScreen");
const profileScreen = document.getElementById("profileScreen");
const submitTestScreen = document.getElementById("submitTestScreen");

function showScreen(screen) {
  [loadingScreen, authScreen, activationScreen, appScreen, resetPasswordScreen, profileScreen, submitTestScreen].forEach(s => { s.style.display = "none"; });
  screen.style.display = "";
}

/* ========== AUTH REFS & STATE ========== */
const tabSignIn = document.getElementById("tabSignIn");
const tabSignUp = document.getElementById("tabSignUp");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authError = document.getElementById("authError");
const codeInput = document.getElementById("codeInput");
const activateBtn = document.getElementById("activateBtn");
const activationError = document.getElementById("activationError");
const signOutFromActivation = document.getElementById("signOutFromActivation");
const accessPill = document.getElementById("accessPill");
const activationHint = document.getElementById("activationHint");
const authForm = document.getElementById("authForm");
const confirmNotice = document.getElementById("confirmNotice");
const confirmText = document.getElementById("confirmText");
const backToSignIn = document.getElementById("backToSignIn");
const passwordHint = document.getElementById("passwordHint");
const passwordToggle = document.getElementById("passwordToggle");

/* ========== USER MENU REFS ========== */
const userMenuBtn = document.getElementById("userMenuBtn");
const profileUserMenuBtn = document.getElementById("profileUserMenuBtn");

/* ========== PROFILE SCREEN REFS ========== */
const profileEmailElem = document.getElementById("profileEmail");
const profileAccessInfo = document.getElementById("profileAccessInfo");
const profileCodeSection = document.getElementById("profileCodeSection");
const profileCodeInput = document.getElementById("profileCodeInput");
const profileCodeError = document.getElementById("profileCodeError");
const profileCodeSuccess = document.getElementById("profileCodeSuccess");
const profileRedeemBtn = document.getElementById("profileRedeemBtn");
const adminBlock = document.getElementById("adminBlock");
const grantEmailInput = document.getElementById("grantEmailInput");
const grantMsg = document.getElementById("grantMsg");
const grantAccessBtn = document.getElementById("grantAccessBtn");
const revokeEmailInput = document.getElementById("revokeEmailInput");
const revokeMsg = document.getElementById("revokeMsg");
const revokeAccessBtn = document.getElementById("revokeAccessBtn");
const backToAppBtn = document.getElementById("backToAppBtn");

/* ========== CURRENT USER STATE ========== */
let currentEmail = '';
let currentUserId = null;
let currentExpiresAt = null;
let currentUnlimited = false;
let profileLocked = false;

// Enter-to-submit on auth and activation forms
[authEmail, authPassword].forEach(el => {
  el.addEventListener("keydown", e => { if (e.key === "Enter") authSubmitBtn.click(); });
});
codeInput.addEventListener("keydown", e => { if (e.key === "Enter") activateBtn.click(); });
authForm.addEventListener("submit", e => e.preventDefault());
forgotEmailInput.addEventListener("keydown", e => { if (e.key === "Enter") sendResetBtn.click(); });
resetPasswordInput.addEventListener("keydown", e => { if (e.key === "Enter") savePasswordBtn.click(); });

let isSignInMode = true;

function setAuthMode(isSignIn) {
  isSignInMode = isSignIn;
  tabSignIn.classList.toggle("tab-active", isSignIn);
  tabSignUp.classList.toggle("tab-active", !isSignIn);
  tabSignIn.setAttribute("aria-selected", String(isSignIn));
  tabSignUp.setAttribute("aria-selected", String(!isSignIn));
  authSubmitBtn.textContent = isSignIn ? "Войти" : "Зарегистрироваться";
  authPassword.autocomplete = isSignIn ? "current-password" : "new-password";
  authError.style.display = "none";
  passwordHint.style.display = isSignIn ? "none" : "";
  forgotPasswordBtn.style.display = isSignIn ? "" : "none";
  // reset password visibility on tab switch
  authPassword.type = "password";
  passwordToggle.setAttribute("aria-label", "Показать пароль");
  const pi = passwordToggle.querySelector("i");
  if (pi) { pi.dataset.lucide = "eye"; lucide.createIcons(); }
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return String(d.getDate()).padStart(2, '0') + '.' +
         String(d.getMonth() + 1).padStart(2, '0') + '.' +
         d.getFullYear();
}

function updateAccessPill(expiresAt, unlimited) {
  if (unlimited) {
    accessPill.innerHTML = `<i data-lucide="infinity"></i><span class="pill-text"> Бессрочный доступ</span>`;
    accessPill.title = "Бессрочный доступ";
    accessPill.style.display = "";
    lucide.createIcons();
    if (!localStorage.getItem('pillToastSeen')) {
      localStorage.setItem('pillToastSeen', '1');
      showPillToast('Ваш доступ: бессрочный');
    }
    return;
  }
  if (!expiresAt) { accessPill.style.display = "none"; return; }
  const dateStr = formatDate(expiresAt);
  accessPill.innerHTML = `<i data-lucide="clock"></i><span class="pill-text"> Доступ до ${dateStr}</span>`;
  accessPill.title = `Доступ до ${dateStr}`;
  accessPill.style.display = "";
  lucide.createIcons();
  if (!localStorage.getItem('pillToastSeen')) {
    localStorage.setItem('pillToastSeen', '1');
    showPillToast(`Доступ до ${dateStr}`);
  }
}

function showAdminMsg(el, text, type) {
  el.textContent = text;
  el.className = `auth-msg auth-msg--${type === 'error' ? 'error' : 'info'}`;
  el.style.display = "block";
}

function showProfileScreen(locked = false) {
  profileLocked = locked;
  profileEmailElem.textContent = currentEmail;

  if (locked) {
    const msg = currentExpiresAt !== null
      ? `Срок действия доступа истёк ${formatDate(currentExpiresAt)}`
      : 'У вас нет активного доступа';
    profileAccessInfo.innerHTML = `<div class="profile-access profile-access--none">${msg}</div>`;
    profileCodeSection.style.display = "";
    profileRedeemBtn.textContent = "Активировать";
    adminBlock.style.display = "none";
    backToAppBtn.style.display = "none";
  } else {
    backToAppBtn.style.display = "";
    profileRedeemBtn.textContent = "Активировать";
    if (currentUnlimited) {
      profileAccessInfo.innerHTML = `<div class="profile-access profile-access--unlimited"><i data-lucide="infinity"></i> Доступ: бессрочный</div>`;
      profileCodeSection.style.display = "none";
    } else if (currentExpiresAt) {
      profileAccessInfo.innerHTML = `<div class="profile-access profile-access--active"><i data-lucide="clock"></i> Доступ активен до ${formatDate(currentExpiresAt)}</div>`;
      profileCodeSection.style.display = "";
    } else {
      profileAccessInfo.innerHTML = `<div class="profile-access profile-access--none">Нет активного доступа</div>`;
      profileCodeSection.style.display = "";
    }
    adminBlock.style.display = currentEmail === ADMIN_EMAIL ? "" : "none";
  }

  profileCodeError.style.display = "none";
  profileCodeSuccess.style.display = "none";

  lucide.createIcons();
  showScreen(profileScreen);
}

// Переводит типичные ошибки Supabase Auth в читаемый русский текст
function translateAuthError(msg) {
  if (!msg) return 'Неизвестная ошибка. Попробуйте снова.';
  if (/fetch|network|failed to fetch/i.test(msg)) {
    return 'Ошибка соединения. Проверьте интернет и попробуйте снова.';
  }
  const map = {
    'Email not confirmed': 'Email не подтверждён — проверьте почту и перейдите по ссылке из письма.',
    'Invalid login credentials': 'Неверный email или пароль.',
    'User already registered': 'Пользователь с таким email уже зарегистрирован.',
    'Password should be at least 6 characters': 'Пароль должен содержать минимум 6 символов.',
    'Unable to validate email address: invalid format': 'Некорректный формат email-адреса.',
    'Email rate limit exceeded': 'Слишком много попыток. Подождите и попробуйте снова.',
    'over_email_send_rate_limit': 'Слишком много писем. Подождите несколько минут.',
    'signup_disabled': 'Регистрация временно недоступна.',
    'weak_password': 'Слишком слабый пароль. Используйте не менее 6 символов.',
    'email_address_invalid': 'Некорректный email-адрес.',
    'For security purposes, you can only request this after': 'Слишком много запросов. Подождите немного и попробуйте снова.',
  };
  return map[msg] ?? msg;
}

function showAuthError(msg) {
  authError.textContent = msg;
  authError.style.display = "block";
}

// Скрывает форму и показывает уведомление о письме с подтверждением
function showConfirmNotice(email) {
  authForm.style.display = "none";
  confirmText.textContent =
    `Мы отправили письмо на ${email}. Перейдите по ссылке в письме для подтверждения регистрации, затем войдите на этой странице.`;
  confirmNotice.style.display = "";
}

function showActivationError(msg) {
  activationError.textContent = msg;
  activationError.style.display = "block";
}

tabSignIn.onclick = () => setAuthMode(true);
tabSignUp.onclick = () => setAuthMode(false);

backToSignIn.onclick = () => {
  confirmNotice.style.display = "none";
  authForm.style.display = "";
  setAuthMode(true);
};

passwordToggle.onclick = () => {
  const isHidden = authPassword.type === "password";
  authPassword.type = isHidden ? "text" : "password";
  passwordToggle.setAttribute("aria-label", isHidden ? "Скрыть пароль" : "Показать пароль");
  const pi = passwordToggle.querySelector("i");
  if (pi) { pi.dataset.lucide = isHidden ? "eye-off" : "eye"; lucide.createIcons(); }
};

authSubmitBtn.onclick = async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !/.+@.+\..+/.test(email)) {
    showAuthError("Введите корректный email-адрес.");
    return;
  }
  if (!password) {
    showAuthError("Введите пароль.");
    return;
  }
  if (!isSignInMode && password.length < 6) {
    showAuthError("Пароль должен содержать минимум 6 символов.");
    return;
  }

  const prevText = authSubmitBtn.textContent;
  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = "Загрузка…";
  authError.style.display = "none";

  const { data, error } = isSignInMode
    ? await signIn(email, password)
    : await signUp(email, password);

  authSubmitBtn.disabled = false;
  authSubmitBtn.textContent = prevText;

  if (error) { showAuthError(translateAuthError(error.message)); return; }

  if (!isSignInMode) {
    // Supabase returns a session immediately when email confirmation is disabled.
    // If it's enabled (future), data.session is null and we show the "check your inbox" notice.
    if (data.session) {
      await initAccess();
    } else {
      showConfirmNotice(email);
    }
    return;
  }

  await initAccess();
};

activateBtn.onclick = async () => {
  const code = codeInput.value.trim();
  if (!code) { showActivationError("Введите код активации."); return; }

  activateBtn.disabled = true;
  activateBtn.textContent = "Проверка…";
  activationError.style.display = "none";

  const ok = await redeemCode(code);

  activateBtn.disabled = false;
  activateBtn.textContent = "Активировать";

  if (!ok) { showActivationError("Код недействителен или уже использован."); return; }

  const { expiresAt, unlimited, email, userId } = await checkAccess();
  currentExpiresAt = expiresAt;
  currentUnlimited = unlimited;
  currentEmail = email ?? '';
  currentUserId = userId ?? null;
  updateAccessPill(expiresAt, unlimited);
  showScreen(appScreen);
  loadTopicList();
};

function resetAppState() {
  QA = [];
  order = [];
  idx = 0;
  wrongSet.clear();
  hideSessionComplete();
  kbHint.style.display = 'none';

  topicSelect.innerHTML = "";
  topicSelect.onchange = null;

  questionBox.textContent = "Выберите тему";
  firstRunHint.style.display = "";
  answerInput.value = "";
  answerInput.style.display = "none";
  answerContainer.innerHTML = "";
  correctBox.style.display = "none";
  correctBox.textContent = "";
  resultBox.style.display = "none";
  resultBox.textContent = "";
  resultBox.className = "";

  rangeStartElem.value = 1;
  rangeEndElem.value = 1;

  accessPill.style.display = "none";
  accessPill.textContent = "";
  currentEmail = '';
  currentUserId = null;
  currentExpiresAt = null;
  currentUnlimited = false;
  profileLocked = false;
  closeAllMenus();

  updateButtons();
  showStep();
}

signOutFromActivation.onclick = async () => {
  signOutFromActivation.disabled = true;
  await signOut();
  signOutFromActivation.disabled = false;
  showScreen(authScreen);
};

/* ========== USER MENU ========== */
function closeAllMenus() {
  document.querySelectorAll('.user-menu-dropdown').forEach(d => { d.style.display = 'none'; });
  document.querySelectorAll('.user-avatar-btn').forEach(b => { b.setAttribute('aria-expanded', 'false'); });
}

function openUserMenu(btn) {
  closeAllMenus();
  const wrap = btn.closest('.user-menu-wrap');
  const dropdown = wrap.querySelector('.user-menu-dropdown');
  const onProfileScreen = profileScreen.style.display !== 'none';
  wrap.querySelectorAll('[data-action="profile"]').forEach(el => {
    el.style.display = (profileLocked || onProfileScreen) ? "none" : "";
  });
  wrap.querySelectorAll('[data-action="submit"]').forEach(el => {
    el.style.display = profileLocked ? "none" : "";
  });
  wrap.querySelectorAll('.user-menu-sep').forEach(sep => {
    sep.style.display = profileLocked ? "none" : "";
  });
  dropdown.style.display = '';
  btn.setAttribute('aria-expanded', 'true');
}

[userMenuBtn, profileUserMenuBtn].forEach(btn => {
  btn.onclick = (e) => {
    e.stopPropagation();
    const dropdown = btn.closest('.user-menu-wrap').querySelector('.user-menu-dropdown');
    dropdown.style.display !== 'none' ? closeAllMenus() : openUserMenu(btn);
  };
});

document.addEventListener('click', async (e) => {
  const item = e.target.closest('.user-menu-item[data-action]');
  if (item) {
    const action = item.dataset.action;
    closeAllMenus();
    if (action === 'profile') { showProfileScreen(); }
    else if (action === 'submit') { showSubmitQuestionsScreen(); }
    else if (action === 'signout') {
      item.disabled = true;
      await signOut();
      item.disabled = false;
      resetAppState();
      showScreen(authScreen);
    }
    return;
  }
  if (!e.target.closest('.user-menu-wrap')) closeAllMenus();
});

backToAppBtn.onclick = () => showScreen(appScreen);

/* ========== SUBMIT TEST SCREEN ========== */
const submitFileInput = document.getElementById("submitFileInput");
const submitFileError = document.getElementById("submitFileError");
const submitTopicInput = document.getElementById("submitTopicInput");
const submitCommentInput = document.getElementById("submitCommentInput");
const submitSuccess = document.getElementById("submitSuccess");
const submitTestBtn = document.getElementById("submitTestBtn");
const backFromSubmitBtn = document.getElementById("backFromSubmitBtn");

function showSubmitQuestionsScreen() {
  submitFileInput.value = "";
  submitTopicInput.value = "";
  submitCommentInput.value = "";
  submitFileError.style.display = "none";
  submitSuccess.style.display = "none";
  submitTestBtn.disabled = false;
  submitTestBtn.textContent = "Отправить";
  showScreen(submitTestScreen);
}

backFromSubmitBtn.onclick = () => showScreen(appScreen);

submitTestBtn.onclick = async () => {
  submitFileError.style.display = "none";
  submitSuccess.style.display = "none";

  const file = submitFileInput.files[0];
  if (!file) {
    submitFileError.textContent = "Выберите файл.";
    submitFileError.style.display = "block";
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    submitFileError.textContent = "Файл слишком большой. Максимальный размер — 25 МБ.";
    submitFileError.style.display = "block";
    return;
  }

  submitTestBtn.disabled = true;
  submitTestBtn.textContent = "Загрузка…";

  const filePath = `${currentUserId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabaseClient.storage
    .from('submissions')
    .upload(filePath, file);

  if (uploadError) {
    submitFileError.textContent = "Ошибка загрузки файла: " + uploadError.message;
    submitFileError.style.display = "block";
    submitTestBtn.disabled = false;
    submitTestBtn.textContent = "Отправить";
    return;
  }

  const { error: insertError } = await supabaseClient.from('question_submissions').insert({
    user_id: currentUserId,
    user_email: currentEmail,
    file_path: filePath,
    original_filename: file.name,
    topic_hint: submitTopicInput.value.trim() || null,
    comment: submitCommentInput.value.trim() || null,
  });

  submitTestBtn.disabled = false;
  submitTestBtn.textContent = "Отправить";

  if (insertError) {
    submitFileError.textContent = "Ошибка отправки: " + insertError.message;
    submitFileError.style.display = "block";
    return;
  }

  submitSuccess.textContent = "Спасибо! Ваш файл успешно отправлен.";
  submitSuccess.style.display = "block";
  submitFileInput.value = "";
  submitTopicInput.value = "";
  submitCommentInput.value = "";
};

profileRedeemBtn.onclick = async () => {
  const code = profileCodeInput.value.trim();
  if (!code) {
    profileCodeError.textContent = "Введите код активации.";
    profileCodeError.style.display = "block";
    return;
  }
  profileRedeemBtn.disabled = true;
  profileRedeemBtn.textContent = "Проверка…";
  profileCodeError.style.display = "none";
  profileCodeSuccess.style.display = "none";

  const ok = await redeemCode(code);

  profileRedeemBtn.disabled = false;
  profileRedeemBtn.textContent = "Активировать";

  if (!ok) {
    profileCodeError.textContent = "Код недействителен или уже использован.";
    profileCodeError.style.display = "block";
    return;
  }

  const { expiresAt, unlimited, userId } = await checkAccess();
  currentExpiresAt = expiresAt;
  currentUnlimited = unlimited;
  profileCodeInput.value = "";

  if (profileLocked) {
    // Locked mode: activation grants access → go to the app
    currentUserId = userId ?? null;
    updateAccessPill(expiresAt, unlimited);
    await initAccess();
    return;
  }

  updateAccessPill(expiresAt, unlimited);
  profileCodeSuccess.textContent = unlimited
    ? 'Бессрочный доступ активирован!'
    : `Доступ продлён до ${formatDate(expiresAt)}`;
  profileCodeSuccess.style.display = "block";
  if (unlimited) {
    profileAccessInfo.innerHTML = `<div class="profile-access profile-access--unlimited"><i data-lucide="infinity"></i> Доступ: бессрочный</div>`;
    profileCodeSection.style.display = "none";
  } else {
    profileAccessInfo.innerHTML = `<div class="profile-access profile-access--active"><i data-lucide="clock"></i> Доступ активен до ${formatDate(expiresAt)}</div>`;
  }
  lucide.createIcons();
};

grantAccessBtn.onclick = async () => {
  const email = grantEmailInput.value.trim();
  if (!email || !/.+@.+\..+/.test(email)) {
    showAdminMsg(grantMsg, 'Введите корректный email-адрес.', 'error');
    return;
  }
  grantAccessBtn.disabled = true;
  grantAccessBtn.textContent = "Выдача…";
  grantMsg.style.display = "none";

  const { data, error } = await supabaseClient.rpc('admin_grant_unlimited_access', { target_email: email });

  grantAccessBtn.disabled = false;
  grantAccessBtn.textContent = "Выдать доступ";

  if (error) {
    showAdminMsg(grantMsg, 'Ошибка: ' + error.message, 'error');
    return;
  }
  if (data === true) {
    showAdminMsg(grantMsg, `Доступ выдан ${email}`, 'info');
    grantEmailInput.value = "";
  } else {
    showAdminMsg(grantMsg, 'Пользователь с таким email не найден', 'error');
  }
};

revokeAccessBtn.onclick = async () => {
  const email = revokeEmailInput.value.trim();
  if (!email || !/.+@.+\..+/.test(email)) {
    showAdminMsg(revokeMsg, 'Введите корректный email-адрес.', 'error');
    return;
  }
  revokeAccessBtn.disabled = true;
  revokeAccessBtn.textContent = "Отзыв…";
  revokeMsg.style.display = "none";

  const { data, error } = await supabaseClient.rpc('admin_revoke_unlimited_access', { target_email: email });

  revokeAccessBtn.disabled = false;
  revokeAccessBtn.textContent = "Отозвать доступ";

  if (error) {
    showAdminMsg(revokeMsg, 'Ошибка: ' + error.message, 'error');
    return;
  }
  if (data === true) {
    showAdminMsg(revokeMsg, `Доступ отозван у ${email}`, 'info');
    revokeEmailInput.value = "";
  } else {
    showAdminMsg(revokeMsg, 'Пользователь с таким email не найден', 'error');
  }
};

/* ========== FORGOT PASSWORD ========== */
forgotPasswordBtn.onclick = () => {
  authForm.style.display = "none";
  forgotPasswordForm.style.display = "";
  forgotEmailInput.value = authEmail.value;
  forgotError.style.display = "none";
  forgotSuccess.style.display = "none";
  sendResetBtn.style.display = "";
  sendResetBtn.disabled = false;
};

backFromForgot.onclick = () => {
  forgotPasswordForm.style.display = "none";
  authForm.style.display = "";
  setAuthMode(true);
};

sendResetBtn.onclick = async () => {
  const email = forgotEmailInput.value.trim();
  if (!email || !/.+@.+\..+/.test(email)) {
    forgotError.textContent = "Введите корректный email-адрес.";
    forgotError.style.display = "block";
    return;
  }
  forgotError.style.display = "none";
  const prev = sendResetBtn.textContent;
  sendResetBtn.disabled = true;
  sendResetBtn.textContent = "Отправка…";

  const { error } = await resetPasswordForEmail(email);

  sendResetBtn.disabled = false;
  sendResetBtn.textContent = prev;

  if (error) {
    forgotError.textContent = translateAuthError(error.message);
    forgotError.style.display = "block";
    return;
  }

  forgotSuccess.textContent = "Если аккаунт с таким email существует, на него отправлена ссылка для сброса пароля.";
  forgotSuccess.style.display = "block";
  sendResetBtn.style.display = "none";
};

/* ========== RESET PASSWORD SCREEN ========== */
resetPasswordToggle.onclick = () => {
  const isHidden = resetPasswordInput.type === "password";
  resetPasswordInput.type = isHidden ? "text" : "password";
  resetPasswordToggle.setAttribute("aria-label", isHidden ? "Скрыть пароль" : "Показать пароль");
  const pi = resetPasswordToggle.querySelector("i");
  if (pi) { pi.dataset.lucide = isHidden ? "eye-off" : "eye"; lucide.createIcons(); }
};

savePasswordBtn.onclick = async () => {
  const pwd = resetPasswordInput.value;
  if (!pwd || pwd.length < 6) {
    resetError.textContent = "Пароль должен содержать минимум 6 символов.";
    resetError.style.display = "block";
    return;
  }
  resetError.style.display = "none";
  const prev = savePasswordBtn.textContent;
  savePasswordBtn.disabled = true;
  savePasswordBtn.textContent = "Сохранение…";

  const { error } = await updateUserPassword(pwd);

  savePasswordBtn.disabled = false;
  savePasswordBtn.textContent = prev;

  if (error) {
    resetError.textContent = translateAuthError(error.message);
    resetError.style.display = "block";
    return;
  }

  resetSuccess.textContent = "Пароль успешно изменён.";
  resetSuccess.style.display = "block";
  savePasswordBtn.style.display = "none";

  setTimeout(async () => {
    recoveryMode = false;
    resetPasswordInput.value = "";
    resetPasswordInput.type = "password";
    resetPasswordToggle.setAttribute("aria-label", "Показать пароль");
    const pi = resetPasswordToggle.querySelector("i");
    if (pi) { pi.dataset.lucide = "eye"; lucide.createIcons(); }
    resetError.style.display = "none";
    resetSuccess.style.display = "none";
    savePasswordBtn.style.display = "";
    savePasswordBtn.disabled = false;
    savePasswordBtn.textContent = "Сохранить новый пароль";
    await initAccess();
  }, 2000);
};

/* ========== INIT ========== */
let recoveryMode = false;

async function initAccess() {
  showScreen(loadingScreen);
  let result;
  try {
    result = await checkAccess();
  } catch (err) {
    showScreen(authScreen);
    showAuthError('Ошибка соединения. Проверьте интернет и обновите страницу.');
    return;
  }
  if (recoveryMode) return;
  const { loggedIn, hasAccess, expiresAt, unlimited, email, userId } = result;
  if (!loggedIn) {
    showScreen(authScreen);
  } else if (!hasAccess) {
    currentExpiresAt = expiresAt;
    currentUnlimited = unlimited;
    currentEmail = email ?? '';
    currentUserId = userId ?? null;
    showProfileScreen(true);
  } else {
    currentExpiresAt = expiresAt;
    currentUnlimited = unlimited;
    currentEmail = email ?? '';
    currentUserId = userId ?? null;
    profileLocked = false;
    updateAccessPill(expiresAt, unlimited);
    showScreen(appScreen);
    loadTopicList();
  }
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryMode = true;
    showScreen(resetPasswordScreen);
    resetError.style.display = "none";
    resetSuccess.style.display = "none";
    resetPasswordInput.value = "";
    savePasswordBtn.style.display = "";
    savePasswordBtn.disabled = false;
    savePasswordBtn.textContent = "Сохранить новый пароль";
  }
});
initAccess();
/* ========== KEYBOARD SHORTCUTS ========== */
// Space / Enter — show/hide answer
// 1 / ← (when answer visible) — mark right
// 2 / → (when answer visible) — mark wrong
// ← / → (when answer hidden) — navigate prev/next
document.addEventListener("click", () => {
  if (document.activeElement?.tagName === "BUTTON") document.activeElement.blur();
});

document.addEventListener("keydown", (e) => {
  const inTextarea = document.activeElement === answerInput;
  if (!inTextarea) {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON") return;
  }
  if (appScreen.style.display === "none") return;

  const answerShowing = isAnswerVisible();

  const isToggleKey =
    (e.key === "Enter" && !(inTextarea && e.shiftKey)) ||
    (e.key === " " && !inTextarea);

  if (isToggleKey && !checkBtn.disabled) {
    e.preventDefault();
    if (answerShowing) { hideAnswer(); }
    else { checkBtn.click(); dismissKbHint(); }
    return;
  }

  if (inTextarea) return;

  if (answerShowing) {
    if ((e.key === "1" || e.key === "ArrowLeft") && !markRightBtn.disabled) {
      e.preventDefault();
      markRightBtn.click();
      dismissKbHint();
    } else if ((e.key === "2" || e.key === "ArrowRight") && !markWrongBtn.disabled) {
      e.preventDefault();
      markWrongBtn.click();
      dismissKbHint();
    }
  } else {
    if (e.key === "ArrowLeft" && !prevBtn.disabled) {
      e.preventDefault();
      prevBtn.click();
    } else if (e.key === "ArrowRight" && !nextBtn.disabled) {
      e.preventDefault();
      nextBtn.click();
    }
  }
});

/* ========== LUCIDE ICONS INIT ========== */
lucide.createIcons();
