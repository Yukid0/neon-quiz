// Configuration de l'API
const API_URL = '/api';

// Quiz state
let currentQuestionIndex = 0;
let score = 0;
let selectedQuestions = [];
let timerInterval;
let timeLeft = 30;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let questions = [];

// DOM Elements
const quizDashboard = document.getElementById('quizDashboard');
const quizArea = document.getElementById('quizArea');
const resultsScreen = document.getElementById('resultsScreen');
const highScoresScreen = document.getElementById('highScoresScreen');
const adminPanel = document.getElementById('adminPanel');

const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const currentQuestionElement = document.getElementById('currentQuestion');
const totalQuestionsElement = document.getElementById('totalQuestions');
const progressBar = document.getElementById('progressBar');
const timerElement = document.getElementById('timer');

const finalScoreElement = document.getElementById('finalScore');
const totalPossibleElement = document.getElementById('totalPossible');
const scoreMessageElement = document.getElementById('scoreMessage');

const adminQuestionInput = document.getElementById('adminQuestion');
const adminOptionsInput = document.getElementById('adminOptions');
const adminCorrectAnswerInput = document.getElementById('adminCorrectAnswer');
const questionCountDbElement = document.getElementById('questionCountDb');
const questionListContainer = document.getElementById('questionListContainer');
const searchQuestionInput = document.getElementById('searchQuestion');

// Question count controls
const questionCountInput = document.getElementById('questionCount');
const decreaseQuestionsBtn = document.getElementById('decreaseQuestions');
const increaseQuestionsBtn = document.getElementById('increaseQuestions');

// Buttons
const startQuizBtn = document.getElementById('startQuizBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const quitQuizBtn = document.getElementById('quitQuizBtn');
const retryQuizBtn = document.getElementById('retryQuizBtn');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');
const highScoresBtn = document.getElementById('highScoresBtn');
const backFromHighScoresBtn = document.getElementById('backFromHighScoresBtn');
const adminToggleBtn = document.getElementById('adminToggle');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const exportQuestionsBtn = document.getElementById('exportQuestionsBtn');
const backFromAdminBtn = document.getElementById('backFromAdminBtn');
const jsonFileInput = document.getElementById('jsonFileInput');
const importFileBtn = document.getElementById('importFileBtn');
const importQuestionsBtn = document.getElementById('importQuestionsBtn');
const selectedFileName = document.getElementById('selectedFileName');

// Event Listeners
startQuizBtn.addEventListener('click', startQuiz);
nextQuestionBtn.addEventListener('click', showNextQuestion);
quitQuizBtn.addEventListener('click', quitQuiz);
retryQuizBtn.addEventListener('click', retryQuiz);
backToDashboardBtn.addEventListener('click', showDashboard);
highScoresBtn.addEventListener('click', showHighScores);
backFromHighScoresBtn.addEventListener('click', showDashboard);
adminToggleBtn.addEventListener('click', toggleAdminPanel);
addQuestionBtn.addEventListener('click', addQuestion);
exportQuestionsBtn.addEventListener('click', exportQuestions);
backFromAdminBtn.addEventListener('click', showDashboard);
importFileBtn.addEventListener('click', () => jsonFileInput.click());
jsonFileInput.addEventListener('change', handleFileSelection);
importQuestionsBtn.addEventListener('click', importQuestions);

decreaseQuestionsBtn.addEventListener('click', () => {
  const currentValue = parseInt(questionCountInput.value);
  if (currentValue > 5) {
    questionCountInput.value = currentValue - 1;
  }
});

increaseQuestionsBtn.addEventListener('click', () => {
  const currentValue = parseInt(questionCountInput.value);
  if (currentValue < 20) {
    questionCountInput.value = currentValue + 1;
  }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Charger les questions depuis l'API
  fetchQuestions();
});

// API Functions
async function fetchQuestions() {
  try {
    const response = await fetch(`${API_URL}/questions`);
    questions = await response.json();
    updateQuestionCount();
    renderQuestionList();
  } catch (error) {
    console.error('Erreur lors du chargement des questions:', error);
  }
}

async function addQuestionToDb(question) {
  try {
    const response = await fetch(`${API_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(question)
    });
        
    if (response.ok) {
      // Recharger les questions
      fetchQuestions();
      return true;
    } else {
      console.error('Erreur lors de l\'ajout de la question');
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la question:', error);
    return false;
  }
}

async function deleteQuestionFromDb(id) {
  try {
    const response = await fetch(`${API_URL}/questions/${id}`, {
      method: 'DELETE'
    });
        
    if (response.ok) {
      // Recharger les questions
      fetchQuestions();
      return true;
    } else {
      console.error('Erreur lors de la suppression de la question');
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la question:', error);
    return false;
  }
}

// Functions
function updateQuestionCount() {
  questionCountDbElement.textContent = questions.length;
}

function startQuiz() {
  const questionCount = parseInt(questionCountInput.value);
    
  // Select random questions
  selectedQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, questionCount);
    
  // Reset quiz state
  currentQuestionIndex = 0;
  score = 0;
    
  // Update UI
  quizDashboard.classList.add('hidden');
  quizArea.classList.remove('hidden');
  resultsScreen.classList.add('hidden');
    
  totalQuestionsElement.textContent = `/${selectedQuestions.length}`;
    
  showQuestion();
}

function showQuestion() {
  const currentQuestion = selectedQuestions[currentQuestionIndex];
    
  // Update question counter
  currentQuestionElement.textContent = `Question ${currentQuestionIndex + 1}`;
    
  // Update progress bar
  progressBar.style.width = `${((currentQuestionIndex) / selectedQuestions.length) * 100}%`;
    
  // Set question text
  questionText.textContent = currentQuestion.question;
    
  // Clear previous options
  optionsContainer.innerHTML = '';
    
  // Create and append new options
  currentQuestion.options.forEach((option, index) => {
    const optionElement = document.createElement('div');
    optionElement.className = 'neon-box p-4 rounded-lg cursor-pointer transition-all duration-300 question-option';
    optionElement.textContent = option;
    optionElement.dataset.index = index;
    optionElement.addEventListener('click', () => selectAnswer(index));
    optionsContainer.appendChild(optionElement);
  });
    
  // Reset timer
  resetTimer();
  nextQuestionBtn.classList.add('hidden');
}

function selectAnswer(selectedIndex) {
  const currentQuestion = selectedQuestions[currentQuestionIndex];
    
  // Disable all options
  Array.from(optionsContainer.children).forEach(option => {
    option.style.pointerEvents = 'none';
  });
    
  // Highlight correct and incorrect answers
  Array.from(optionsContainer.children).forEach((option, index) => {
    if (index === currentQuestion.correctAnswer) {
      setTimeout(() => {
        option.classList.add('correct');
      }, 500);
    } else if (index === selectedIndex && selectedIndex !== currentQuestion.correctAnswer) {
      setTimeout(() => {
        option.classList.add('incorrect');
      }, 500);
    }
  });
    
  // Update score if correct
  if (selectedIndex === currentQuestion.correctAnswer) {
    score++;
  }
    
  // Stop timer
  clearInterval(timerInterval);
    
  // Show next question button or finish quiz
  if (currentQuestionIndex < selectedQuestions.length - 1) {
    nextQuestionBtn.classList.remove('hidden');
  } else {
    setTimeout(() => {
      showResults();
    }, 1500);
  }
}

function showNextQuestion() {
  currentQuestionIndex++;
  showQuestion();
}

function resetTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  timerElement.textContent = `${timeLeft}s`;
    
  timerInterval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = `${timeLeft}s`;
        
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoSelectAnswer();
    }
        
    // Change color when time is running out
    if (timeLeft <= 10) {
      timerElement.classList.add('text-red-500');
      timerElement.style.textShadow = '0 0 5px red, 0 0 10px red';
    } else {
      timerElement.classList.remove('text-red-500');
      timerElement.style.textShadow = '0 0 5px var(--neon-blue), 0 0 10px var(--neon-blue)';
    }
  }, 1000);
}

function autoSelectAnswer() {
  // Select a random option when time runs out
  const randomIndex = Math.floor(Math.random() * 4);
  selectAnswer(randomIndex);
}

function quitQuiz() {
  clearInterval(timerInterval);
  showDashboard();
}

function showResults() {
  clearInterval(timerInterval);
    
  quizArea.classList.add('hidden');
  resultsScreen.classList.remove('hidden');
    
  // Update final score
  finalScoreElement.textContent = score;
  totalPossibleElement.textContent = selectedQuestions.length;
    
  // Set progress bar to 100%
  progressBar.style.width = '100%';
    
  // Set score message
  const percentage = (score / selectedQuestions.length) * 100;
  let message = '';
    
  if (percentage >= 90) {
    message = 'Excellent! Vous êtes un vrai génie!';
  } else if (percentage >= 70) {
    message = 'Super travail! Vous avez une bonne connaissance du sujet.';
  } else if (percentage >= 50) {
    message = 'Pas mal! Vous pouvez encore vous améliorer.';
  } else {
    message = 'Essayez encore! Vous pouvez faire mieux.';
  }
    
  scoreMessageElement.textContent = message;
    
  // Save high score
  saveHighScore(score);
}

function saveHighScore(newScore) {
  highScores.push({
    score: newScore,
    total: selectedQuestions.length,
    date: new Date().toLocaleDateString()
  });
    
  // Sort high scores
  highScores.sort((a, b) => (b.score / b.total) - (a.score / a.total));
    
  // Keep only top 10 scores
  if (highScores.length > 10) {
    highScores = highScores.slice(0, 10);
  }
    
  // Save to localStorage
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function retryQuiz() {
  resultsScreen.classList.add('hidden');
  quizDashboard.classList.remove('hidden');
}

function showDashboard() {
  quizDashboard.classList.remove('hidden');
  quizArea.classList.add('hidden');
  resultsScreen.classList.add('hidden');
  highScoresScreen.classList.add('hidden');
  adminPanel.classList.add('hidden');
}

function showHighScores() {
  quizDashboard.classList.add('hidden');
  highScoresScreen.classList.remove('hidden');
    
  const highScoresList = document.getElementById('highScoresList');
  highScoresList.innerHTML = '';
    
  if (highScores.length === 0) {
    highScoresList.innerHTML = '<p class="text-center neon-text">Aucun score enregistré</p>';
    return;
  }
    
  highScores.forEach((scoreObj, index) => {
    const scoreElement = document.createElement('div');
    scoreElement.className = 'neon-box p-4 rounded-lg flex justify-between';
        
    const scoreText = document.createElement('div');
    scoreText.innerHTML = `
            <span class="font-bold neon-text">${index + 1}.</span> 
            <span>${scoreObj.score}/${scoreObj.total}</span>
        `;
        
    const dateText = document.createElement('div');
    dateText.className = 'text-gray-300';
    dateText.textContent = scoreObj.date;
        
    scoreElement.appendChild(scoreText);
    scoreElement.appendChild(dateText);
        
    highScoresList.appendChild(scoreElement);
  });
}

function toggleAdminPanel() {
  if (adminPanel.classList.contains('hidden')) {
    quizDashboard.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    renderQuestionList();
  } else {
    adminPanel.classList.add('hidden');
    quizDashboard.classList.remove('hidden');
  }
}

function addQuestion() {
  const question = adminQuestionInput.value.trim();
  const options = adminOptionsInput.value.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
  const correctAnswer = parseInt(adminCorrectAnswerInput.value) - 1; // Convert to 0-based index
    
  if (question.length === 0 || options.length < 2 || isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
    alert('Veuillez remplir tous les champs correctement');
    return;
  }
    
  const newQuestion = {
    question,
    options,
    correctAnswer
  };
    
  // Ajouter la question à la base de données
  addQuestionToDb(newQuestion).then(success => {
    if (success) {
      // Clear inputs
      adminQuestionInput.value = '';
      adminOptionsInput.value = '';
      adminCorrectAnswerInput.value = '';
            
      // Show success message
      alert('Question ajoutée avec succès!');
    }
  });
}

function renderQuestionList(searchTerm = '') {
  questionListContainer.innerHTML = '';
    
  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
  );
    
  if (filteredQuestions.length === 0) {
    questionListContainer.innerHTML = '<p class="text-center neon-text">Aucune question trouvée</p>';
    return;
  }
    
  filteredQuestions.forEach((q, index) => {
    const questionElement = document.createElement('div');
    questionElement.className = 'neon-box p-4 rounded-lg mb-3 cursor-pointer hover:shadow-lg transition-all';
    questionElement.innerHTML = `
            <div class="flex justify-between mb-2">
                <span class="font-bold neon-text">${index + 1}. ${q.question}</span>
                <span class="text-xs text-gray-400">${q.options.length} options</span>
            </div>
            <ul class="text-sm text-gray-300 ml-4">
                ${q.options.map((opt, i) => `
                    <li class="${i === q.correctAnswer ? 'text-green-400' : ''}">
                        ${i + 1}. ${opt}
                    </li>
                `).join('')}
            </ul>
            <div class="mt-2 text-right">
                <button class="text-xs text-red-400 hover:text-red-200" onclick="deleteQuestion(${q.id})">
                    Supprimer
                </button>
            </div>
        `;
        
    questionListContainer.appendChild(questionElement);
  });
}

function deleteQuestion(id) {
  if (confirm('Voulez-vous vraiment supprimer cette question?')) {
    deleteQuestionFromDb(id);
  }
}

// Fonctions pour l'importation de questions
let selectedFile = null;

function handleFileSelection(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile = file;
    selectedFileName.textContent = file.name;
    importQuestionsBtn.disabled = false;
  } else {
    selectedFile = null;
    selectedFileName.textContent = 'Aucun fichier sélectionné';
    importQuestionsBtn.disabled = true;
  }
}

async function importQuestions() {
  if (!selectedFile) {
    alert('Veuillez sélectionner un fichier JSON');
    return;
  }

  try {
    // Lire le contenu du fichier
    const fileContent = await readFileAsText(selectedFile);
    let questionsToImport;

    try {
      questionsToImport = JSON.parse(fileContent);
    } catch (error) {
      alert('Le fichier sélectionné n\'est pas un JSON valide');
      return;
    }

    // Vérifier que le format est correct
    if (!Array.isArray(questionsToImport)) {
      alert('Le fichier doit contenir un tableau de questions');
      return;
    }

    // Vérifier chaque question
    const validQuestions = questionsToImport.filter(q => {
      return (
        q.question && 
                Array.isArray(q.options) && 
                q.options.length >= 2 && 
                q.correctAnswer !== undefined &&
                q.correctAnswer >= 0 && 
                q.correctAnswer < q.options.length
      );
    });

    if (validQuestions.length === 0) {
      alert('Aucune question valide trouvée dans le fichier');
      return;
    }

    // Confirmer l'importation
    if (confirm(`Voulez-vous importer ${validQuestions.length} questions ?`)) {
      // Importer les questions
      const importPromises = validQuestions.map(q => addQuestionToDb(q));
            
      // Attendre que toutes les questions soient importées
      await Promise.all(importPromises);
            
      // Recharger les questions
      await fetchQuestions();
            
      // Réinitialiser le sélecteur de fichier
      selectedFile = null;
      selectedFileName.textContent = 'Aucun fichier sélectionné';
      importQuestionsBtn.disabled = true;
      jsonFileInput.value = '';
            
      alert(`${validQuestions.length} questions ont été importées avec succès !`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'importation des questions:', error);
    alert('Une erreur est survenue lors de l\'importation des questions');
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}

function exportQuestions() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'neonquiz_questions.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

// Make deleteQuestion function available globally for the onclick event in rendered questions
window.deleteQuestion = deleteQuestion;

// Search functionality
searchQuestionInput.addEventListener('input', (e) => {
  renderQuestionList(e.target.value);
}); 