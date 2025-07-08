const { expect } = require('chai');

// Fonction à tester
function validateQuestion(question) {
  if (!question) return false;
  if (!question.question || typeof question.question !== 'string') return false;
  if (!Array.isArray(question.options) || question.options.length < 2) return false;
  if (typeof question.correctAnswer !== 'number') return false;
  if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) return false;
  return true;
}

describe('Question Validation', () => {
  it('should validate a correct question object', () => {
    const validQuestion = {
      question: 'Quelle planète est surnommée la planète rouge?',
      options: ['Vénus', 'Mars', 'Jupiter', 'Saturne'],
      correctAnswer: 1
    };
    expect(validateQuestion(validQuestion)).to.be.true;
  });

  it('should reject a question without question text', () => {
    const invalidQuestion = {
      options: ['Vénus', 'Mars', 'Jupiter', 'Saturne'],
      correctAnswer: 1
    };
    expect(validateQuestion(invalidQuestion)).to.be.false;
  });

  it('should reject a question with less than 2 options', () => {
    const invalidQuestion = {
      question: 'Quelle planète est surnommée la planète rouge?',
      options: ['Mars'],
      correctAnswer: 0
    };
    expect(validateQuestion(invalidQuestion)).to.be.false;
  });

  it('should reject a question with invalid correctAnswer index', () => {
    const invalidQuestion = {
      question: 'Quelle planète est surnommée la planète rouge?',
      options: ['Vénus', 'Mars', 'Jupiter', 'Saturne'],
      correctAnswer: 4
    };
    expect(validateQuestion(invalidQuestion)).to.be.false;
  });

  it('should reject a question with negative correctAnswer index', () => {
    const invalidQuestion = {
      question: 'Quelle planète est surnommée la planète rouge?',
      options: ['Vénus', 'Mars', 'Jupiter', 'Saturne'],
      correctAnswer: -1
    };
    expect(validateQuestion(invalidQuestion)).to.be.false;
  });
});

// Exporter la fonction pour la réutiliser ailleurs
module.exports = { validateQuestion }; 