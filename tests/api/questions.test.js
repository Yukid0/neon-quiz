const request = require('supertest');
const { expect } = require('chai');
const express = require('express');
const dotenv = require('dotenv');

// Charger les variables d'environnement pour les tests
dotenv.config({ path: './config.env' });

// Créer une application express de test
const app = express();
app.use(express.json());

// Mock de la base de données pour les tests
const mockQuestions = [
  {
    id: 1,
    question: 'Quelle planète est surnommée la planète rouge?',
    options: ['Vénus', 'Mars', 'Jupiter', 'Saturne'],
    correctAnswer: 1
  },
  {
    id: 2,
    question: 'Quel langage de programmation a été créé par Brendan Eich en 1995?',
    options: ['Python', 'Java', 'C++', 'JavaScript'],
    correctAnswer: 3
  }
];

// Route GET pour les tests
app.get('/api/questions', (req, res) => {
  res.json(mockQuestions);
});

// Route POST pour les tests
app.post('/api/questions', (req, res) => {
  const { question, options, correctAnswer } = req.body;
  
  if (!question || !options || correctAnswer === undefined) {
    return res.status(400).json({ message: 'Données incomplètes' });
  }
  
  const newQuestion = {
    id: mockQuestions.length + 1,
    question,
    options,
    correctAnswer
  };
  
  mockQuestions.push(newQuestion);
  res.status(201).json({
    message: 'Question ajoutée avec succès',
    id: newQuestion.id
  });
});

// Route DELETE pour les tests
app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const index = mockQuestions.findIndex(q => q.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Question non trouvée' });
  }
  
  mockQuestions.splice(index, 1);
  res.json({ message: 'Question supprimée avec succès' });
});

describe('Questions API', () => {
  describe('GET /api/questions', () => {
    it('should return all questions', async () => {
      const res = await request(app).get('/api/questions');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      expect(res.body[0]).to.have.property('question');
      expect(res.body[0]).to.have.property('options');
      expect(res.body[0]).to.have.property('correctAnswer');
    });
  });
  
  describe('POST /api/questions', () => {
    it('should add a new question', async () => {
      const newQuestion = {
        question: 'Qui a créé le personnage de Mickey Mouse?',
        options: ['Walt Disney', 'Chuck Jones', 'Tex Avery', 'Hayao Miyazaki'],
        correctAnswer: 0
      };
      
      const res = await request(app)
        .post('/api/questions')
        .send(newQuestion);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('id');
      expect(mockQuestions.length).to.equal(3);
    });
    
    it('should return 400 if question data is incomplete', async () => {
      const incompleteQuestion = {
        question: 'Question sans options'
      };
      
      const res = await request(app)
        .post('/api/questions')
        .send(incompleteQuestion);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('DELETE /api/questions/:id', () => {
    it('should delete a question', async () => {
      const res = await request(app).delete('/api/questions/1');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      expect(mockQuestions.length).to.equal(2); // 3-1=2
    });
    
    it('should return 404 if question is not found', async () => {
      const res = await request(app).delete('/api/questions/999');
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message');
    });
  });
}); 