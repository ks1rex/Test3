"use strict";
/* ========== THEME (dark/light) ========== */
const body = document.body;
const themeToggle = document.getElementById("themeToggle");
if (localStorage.getItem("theme") === "light") body.classList.add("light");
themeToggle.onclick = () => {
  body.classList.toggle("light");
  localStorage.setItem("theme", body.classList.contains("light") ? "light" : "dark");
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
/* ========== STATE ========== */
let QA = [];
let order = [];
let idx = 0;
let wrongSet = new Set();

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
    topics.forEach((t, i) => {
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

  if(!filename){
    QA = [];
    questionBox.textContent = "Выберите тему";
    correctBox.style.display = "none";
    updateButtons();
    return;
  }

  try {
    const resp = await fetch("topics/" + filename);
    if (!resp.ok) throw new Error("Файл темы не найден: " + filename);
    const data = await resp.json();

    QA = Array.isArray(data)
      ? data
      : Array.isArray(data.questions)
        ? data.questions
        : [];


    if(!Array.isArray(QA)) QA = [];

    rangeStartElem.value = 1;
    rangeEndElem.value = QA.length || 1;
    questionBox.textContent = "Нажмите «Начать»";
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
  resultBox.textContent = isCorrect ? "✅ Верно" : "❌ Неверно";
  resultBox.className = isCorrect ? "ok" : "wrong";
  resultBox.style.display = "block";
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
  if(!order.length){
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

  const currentIndex = order[idx];
  const current = QA[currentIndex];
  if (!current) return;

  answerContainer.innerHTML = "";
  answerInput.style.display = "none";
  const qText = QA[currentIndex]?.q ?? ("Вопрос #" + (currentIndex + 1));
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

      const row = document.createElement("div");
      row.textContent = el.item + " ";
      row.appendChild(input);

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

    document.querySelectorAll("select").forEach(select => {
      const leftIndex = parseInt(select.dataset.leftIndex);
      const chosenRight = parseInt(select.value);

      if (chosenRight !== current.correct[leftIndex]) {
        ok = false;
      }
    });

    showResult(ok);
  }


  if (current.type === "fill_each") {

    let ok = true;

    document.querySelectorAll("input[type='text']").forEach(input => {
      const originalIndex = parseInt(input.dataset.originalIndex);

      if (input.value.trim().toLowerCase() !==
          current.answers[originalIndex].toLowerCase()) {
        ok = false;
      }
    });

    showResult(ok);
  }


  if (current.type === "sequence") {

    let ok = true;

    document.querySelectorAll("input[type='number']").forEach(input => {
      const originalIndex = parseInt(input.dataset.originalIndex);

      if (parseInt(input.value) - 1 !==
          current.correct_order[originalIndex]) {
        ok = false;
      }
    });

    showResult(ok);
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
    current.items.forEach((q, i) => {
      out += q + " " + current.answers[i] + "\n";
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
  markWrongBtn.disabled = false;
  checkBtn.textContent = "Скрыть ответ";
}

function hideAnswer() {
  correctBox.style.display = "none";
  correctBox.textContent = "";
  resultBox.style.display = "none";
  resultBox.textContent = "";
  resultBox.className = "";

  markRightBtn.disabled = true;
  markWrongBtn.disabled = true;
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
  const start = Math.max(1, parseInt(rangeStartElem.value || 1)) - 1;
  let end = Math.min(QA.length, parseInt(rangeEndElem.value || QA.length));
  if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
    return alert("Неверный диапазон. Убедитесь, что 'С' < 'По' и в пределах доступных вопросов.");
  }

  buildOrder(start, end);
  showQA();
};

wrongOnlyBtn.onclick = () => {
  if (!wrongSet.size) return;
  order = Array.from(wrongSet);
  if (shuffleElem.checked) fisherYates(order);
  idx = 0;
  showQA();
};


markRightBtn.onclick = () => {
  wrongSet.delete(order[idx]);
  if (idx < order.length - 1) { idx++; showQA(); } else { showStep(); updateButtons(); }
};
markWrongBtn.onclick = () => {
  wrongSet.add(order[idx]);
  if (idx < order.length - 1) { idx++; showQA(); } else { showStep(); updateButtons(); }
};

nextBtn.onclick = () => { if (idx < order.length - 1) { idx++; showQA(); } };
prevBtn.onclick = () => { if (idx > 0) { idx--; showQA(); } };

/* ========== SCREENS ========== */
const authScreen = document.getElementById("authScreen");
const activationScreen = document.getElementById("activationScreen");
const appScreen = document.getElementById("appScreen");

function showScreen(screen) {
  [authScreen, activationScreen, appScreen].forEach(s => { s.style.display = "none"; });
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
const signOutBtn = document.getElementById("signOutBtn");
const signOutFromActivation = document.getElementById("signOutFromActivation");
const accessPill = document.getElementById("accessPill");
const activationHint = document.getElementById("activationHint");
const authForm = document.getElementById("authForm");
const confirmNotice = document.getElementById("confirmNotice");
const confirmText = document.getElementById("confirmText");
const backToSignIn = document.getElementById("backToSignIn");

let isSignInMode = true;

function setAuthMode(isSignIn) {
  isSignInMode = isSignIn;
  tabSignIn.classList.toggle("tab-active", isSignIn);
  tabSignUp.classList.toggle("tab-active", !isSignIn);
  authSubmitBtn.textContent = isSignIn ? "Войти" : "Зарегистрироваться";
  authPassword.autocomplete = isSignIn ? "current-password" : "new-password";
  authError.style.display = "none";
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return String(d.getDate()).padStart(2, '0') + '.' +
         String(d.getMonth() + 1).padStart(2, '0') + '.' +
         d.getFullYear();
}

function updateAccessPill(expiresAt) {
  if (!expiresAt) { accessPill.style.display = "none"; return; }
  accessPill.textContent = "Доступ до " + formatDate(expiresAt);
  accessPill.style.display = "";
}

// Переводит типичные ошибки Supabase Auth в читаемый русский текст
function translateAuthError(msg) {
  const map = {
    'Email not confirmed': 'Email не подтверждён — проверьте почту и перейдите по ссылке из письма.',
    'Invalid login credentials': 'Неверный email или пароль.',
    'User already registered': 'Этот email уже зарегистрирован.',
    'Password should be at least 6 characters': 'Пароль должен содержать минимум 6 символов.',
    'Unable to validate email address: invalid format': 'Некорректный формат email.',
    'Email rate limit exceeded': 'Слишком много попыток. Попробуйте позже.',
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

authSubmitBtn.onclick = async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) { showAuthError("Введите email и пароль."); return; }

  authSubmitBtn.disabled = true;
  authError.style.display = "none";

  const { data, error } = isSignInMode
    ? await signIn(email, password)
    : await signUp(email, password);

  authSubmitBtn.disabled = false;

  if (error) { showAuthError(translateAuthError(error.message)); return; }

  if (!isSignInMode) {
    if (data.session) {
      // Email-подтверждение отключено в Supabase — сессия выдана сразу
      await initAccess();
    } else {
      // Email-подтверждение включено — показываем уведомление
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
  activationError.style.display = "none";

  const ok = await redeemCode(code);
  activateBtn.disabled = false;

  if (!ok) { showActivationError("Код недействителен или уже использован."); return; }

  const { expiresAt } = await checkAccess();
  updateAccessPill(expiresAt);
  showScreen(appScreen);
  loadTopicList();
};

signOutBtn.onclick = async () => {
  await signOut();
  showScreen(authScreen);
};

signOutFromActivation.onclick = async () => {
  await signOut();
  showScreen(authScreen);
};

async function initAccess() {
  const { loggedIn, hasAccess, expiresAt } = await checkAccess();
  if (!loggedIn) {
    showScreen(authScreen);
  } else if (!hasAccess) {
    activationHint.textContent = expiresAt !== null
      ? `Срок действия доступа истёк ${formatDate(expiresAt)}. Введите новый код для продления.`
      : "Введите код активации, чтобы получить доступ к тренажёру.";
    showScreen(activationScreen);
  } else {
    updateAccessPill(expiresAt);
    showScreen(appScreen);
    loadTopicList();
  }
}

/* ========== INIT ========== */
initAccess();
/* ========== KEYBOARD SHORTCUTS (fixed toggle) ========== */
document.addEventListener("keydown", (e) => {
  if (document.activeElement === answerInput) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      toggleAnswer();
    }
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    toggleAnswer();
  } else if (e.key === "ArrowLeft") {
    if (!prevBtn.disabled) prevBtn.click();
  } else if (e.key === "ArrowRight") {
    if (!nextBtn.disabled) nextBtn.click();
  }
});
