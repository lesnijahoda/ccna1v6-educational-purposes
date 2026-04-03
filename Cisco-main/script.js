let questions = [];
let quizQuestions = [];
let currentIndex = 0;
let selectedAnswers = [];
let alreadyChecked = false;
let correctCount = 0;
let draggedItem = null;

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function shuffleArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data;

    let quizCount = localStorage.getItem("quizCount");

    if (quizCount === "all") {
      quizQuestions = shuffleArray(questions);
    } else {
      quizCount = parseInt(quizCount);
      quizQuestions = shuffleArray(questions).slice(0, quizCount);
    }

    showQuestion();
  })
  .catch(err => {
    console.error("Chyba při načítání questions.json:", err);
    document.getElementById("question").innerText = "Nepodařilo se načíst otázky.";
  });

function resetQuestionAreas() {
  document.getElementById("answers").style.display = "none";
  document.getElementById("answers").innerHTML = "";

  document.getElementById("textAnswerContainer").style.display = "none";
  document.getElementById("textAnswer").value = "";
  document.getElementById("textAnswer").disabled = false;
  document.getElementById("textAnswer").style.backgroundColor = "";
  document.getElementById("textAnswer").style.color = "";
  document.getElementById("textAnswer").style.borderColor = "";

  document.getElementById("matchingContainer").style.display = "none";
  document.getElementById("matchingLeft").innerHTML = "";
  document.getElementById("matchingRight").innerHTML = "";
}

function showQuestion() {
  let q = quizQuestions[currentIndex];
  selectedAnswers = [];
  alreadyChecked = false;
  draggedItem = null;

  document.getElementById("progress").innerText =
    `Otázka ${currentIndex + 1} z ${quizQuestions.length}`;

  document.getElementById("question").innerText = q.question;

  resetQuestionAreas();

  let img = document.getElementById("questionImage");

  img.onerror = () => {
    console.log("Obrázek se nenačetl:", q.image);
    img.style.display = "none";
  };

  if (q.image && q.image.trim() !== "") {
    img.src = q.image;
    img.style.display = "block";
  } else {
    img.src = "";
    img.style.display = "none";
  }

  if (q.type === "matching") {
    showMatchingQuestion(q);
  } else if (q.type === "text") {
    showTextQuestion(q);
  } else {
    showClassicQuestion(q);
  }
}

function showClassicQuestion(q) {
  let answersDiv = document.getElementById("answers");
  answersDiv.style.display = "block";

  let answers = q.answers.split(" | ");

  answers.forEach((a, index) => {
    let btn = document.createElement("button");
    btn.innerText = a;
    btn.classList.add("answer-btn");

    btn.onclick = () => {
      if (alreadyChecked) return;

      if (selectedAnswers.includes(index)) {
        selectedAnswers = selectedAnswers.filter(i => i !== index);
        btn.classList.remove("selected");
      } else {
        selectedAnswers.push(index);
        btn.classList.add("selected");
      }
    };

    answersDiv.appendChild(btn);
  });
}

function showTextQuestion() {
  document.getElementById("textAnswerContainer").style.display = "block";
}

function showMatchingQuestion(q) {
  let container = document.getElementById("matchingContainer");
  let left = document.getElementById("matchingLeft");
  let right = document.getElementById("matchingRight");

  container.style.display = "block";

  let shuffledLeftItems = shuffleArray(q.pairs.map(pair => pair.left));

  shuffledLeftItems.forEach(text => {
    let item = document.createElement("div");
    item.classList.add("draggable-item");
    item.innerText = text;
    item.draggable = true;

    item.addEventListener("dragstart", () => {
      if (alreadyChecked) return;
      draggedItem = item;
    });

    left.appendChild(item);
  });

  q.pairs.forEach(pair => {
    let zone = document.createElement("div");
    zone.classList.add("dropzone");
    zone.dataset.correct = pair.left;

    let title = document.createElement("div");
    title.classList.add("dropzone-title");
    title.innerText = pair.right;

    let target = document.createElement("div");
    target.classList.add("dropzone-target");
    target.innerText = "Sem přetáhni odpověď";

    zone.appendChild(title);
    zone.appendChild(target);

    zone.addEventListener("dragover", e => {
      e.preventDefault();
    });

    zone.addEventListener("drop", e => {
      e.preventDefault();

      if (alreadyChecked || !draggedItem) return;

      let oldParent = draggedItem.parentElement;
      if (oldParent && oldParent.classList.contains("dropzone-target")) {
        oldParent.innerHTML = "";
        oldParent.innerText = "Sem přetáhni odpověď";
      }

      target.innerHTML = "";
      target.appendChild(draggedItem);
      draggedItem = null;
    });

    right.appendChild(zone);
  });
}

function checkAnswer() {
  if (alreadyChecked) return;

  let q = quizQuestions[currentIndex];

  if (q.type === "matching") {
    checkMatchingQuestion(q);
  } else if (q.type === "text") {
    checkTextQuestion(q);
  } else {
    checkClassicQuestion(q);
  }

  alreadyChecked = true;
}

function checkClassicQuestion(q) {
  let buttons = document.querySelectorAll("#answers button");
  let correctAnswers = q.correct.split(" | ").map(a => normalize(a));

  let selectedTexts = selectedAnswers.map(index =>
    normalize(buttons[index].innerText)
  );

  let isCorrect =
    selectedTexts.length === correctAnswers.length &&
    selectedTexts.every(answer => correctAnswers.includes(answer));

  if (isCorrect) {
    correctCount++;
  }

  buttons.forEach((b, index) => {
    let btnText = normalize(b.innerText);

    if (correctAnswers.includes(btnText)) {
      b.style.backgroundColor = "green";
      b.style.color = "white";
    } else if (selectedAnswers.includes(index)) {
      b.style.backgroundColor = "red";
      b.style.color = "white";
    }

    b.disabled = true;
  });
}

function checkTextQuestion(q) {
  let input = document.getElementById("textAnswer");
  let userAnswer = normalize(input.value);
  let correctAnswer = normalize(q.correct);

  if (userAnswer === correctAnswer) {
    correctCount++;
    input.style.backgroundColor = "green";
    input.style.color = "white";
    input.style.borderColor = "green";
  } else {
    input.style.backgroundColor = "red";
    input.style.color = "white";
    input.style.borderColor = "red";
    input.value = `${input.value}  → správně: ${q.correct}`;
  }

  input.disabled = true;
}

function checkMatchingQuestion(q) {
  let zones = document.querySelectorAll(".dropzone");
  let allCorrect = true;

  zones.forEach(zone => {
    let target = zone.querySelector(".dropzone-target");
    let item = target.querySelector(".draggable-item");
    let correct = normalize(zone.dataset.correct);

    if (!item) {
      zone.classList.add("wrong");
      zone.classList.remove("correct");
      allCorrect = false;
      return;
    }

    let droppedText = normalize(item.innerText);

    if (droppedText === correct) {
      zone.classList.add("correct");
      zone.classList.remove("wrong");
    } else {
      zone.classList.add("wrong");
      zone.classList.remove("correct");
      allCorrect = false;
    }

    item.draggable = false;
  });

  if (allCorrect) {
    correctCount++;
  }
}

function nextQuestion() {
  if (!alreadyChecked) {
    alert("Nejdřív klikni na Zkontrolovat.");
    return;
  }

  currentIndex++;

  if (currentIndex >= quizQuestions.length) {
    showResult();
    return;
  }

  showQuestion();
}

function showResult() {
  let total = quizQuestions.length;
  let wrong = total - correctCount;
  let success = Math.round((correctCount / total) * 100);

  document.getElementById("progress").style.display = "none";
  document.getElementById("question").style.display = "none";
  document.getElementById("answers").style.display = "none";
  document.getElementById("textAnswerContainer").style.display = "none";
  document.getElementById("matchingContainer").style.display = "none";
  document.getElementById("questionImage").style.display = "none";

  let buttons = document.querySelectorAll(".container > button");
  buttons.forEach(btn => btn.style.display = "none");

  let resultDiv = document.getElementById("result");
  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <h2>Test dokončen!</h2>
    <p><strong>Správně:</strong> ${correctCount}</p>
    <p><strong>Špatně:</strong> ${wrong}</p>
    <p><strong>Úspěšnost:</strong> ${success} %</p>
  `;

  document.getElementById("backBtn").style.display = "inline-block";
}

function goToMenu() {
  window.location.href = "index.html";
}