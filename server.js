const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: './config.env' });

// Créer l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de la base de données
let dbConfig;

// Utiliser JAWSDB_URL si disponible (pour Heroku), sinon utiliser les variables d'environnement locales
if (process.env.JAWSDB_URL) {
  // Format: mysql://username:password@hostname:port/database
  const url = new URL(process.env.JAWSDB_URL);
  dbConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    port: url.port
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };
}

// Créer un pool de connexions
const pool = mysql.createPool(dbConfig);

// Vérifier la connexion à la base de données
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connexion à la base de données réussie');
    connection.release();
  } catch (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  }
}

// Routes API

// GET /api/questions - Récupérer toutes les questions
app.get('/api/questions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM questions');
    
    const questions = [];
    
    for (const row of rows) {
      // Récupérer les options pour cette question
      const [options] = await pool.query(
        'SELECT * FROM options WHERE question_id = ? ORDER BY option_order',
        [row.id]
      );
      
      const optionsArray = [];
      let correctAnswer = 0;
      
      options.forEach((option, index) => {
        optionsArray.push(option.option_text);
        if (option.is_correct) {
          correctAnswer = index;
        }
      });
      
      questions.push({
        id: row.id,
        question: row.question_text,
        options: optionsArray,
        correctAnswer: correctAnswer
      });
    }
    
    res.json(questions);
  } catch (err) {
    console.error('Erreur lors de la récupération des questions:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/questions - Ajouter une nouvelle question
app.post('/api/questions', async (req, res) => {
  try {
    const { question, options, correctAnswer } = req.body;
    
    if (!question || !options || correctAnswer === undefined) {
      return res.status(400).json({ message: 'Données incomplètes' });
    }
    
    // Commencer une transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insérer la question
      const [result] = await connection.query(
        'INSERT INTO questions (question_text) VALUES (?)',
        [question]
      );
      
      const questionId = result.insertId;
      
      // Insérer les options
      for (let i = 0; i < options.length; i++) {
        const isCorrect = (i === correctAnswer) ? 1 : 0;
        await connection.query(
          'INSERT INTO options (question_id, option_text, option_order, is_correct) VALUES (?, ?, ?, ?)',
          [questionId, options[i], i, isCorrect]
        );
      }
      
      // Valider la transaction
      await connection.commit();
      connection.release();
      
      res.status(201).json({
        message: 'Question ajoutée avec succès',
        id: questionId
      });
    } catch (err) {
      // Annuler la transaction en cas d'erreur
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Erreur lors de l\'ajout de la question:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/questions/:id - Supprimer une question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Commencer une transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Supprimer les options associées à la question
      await connection.query('DELETE FROM options WHERE question_id = ?', [id]);
      
      // Supprimer la question
      const [result] = await connection.query('DELETE FROM questions WHERE id = ?', [id]);
      
      // Vérifier si la question a été supprimée
      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Question non trouvée' });
      }
      
      // Valider la transaction
      await connection.commit();
      connection.release();
      
      res.json({ message: 'Question supprimée avec succès' });
    } catch (err) {
      // Annuler la transaction en cas d'erreur
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Erreur lors de la suppression de la question:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour servir l'application frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  await testDatabaseConnection();
});

// Script pour initialiser la base de données si elle n'existe pas
async function initializeDatabase() {
  try {
    // Sur Heroku avec JawsDB, nous n'avons pas besoin de créer la base de données
    // car elle est déjà créée pour nous
    let tempPool;
    
    if (process.env.JAWSDB_URL) {
      tempPool = pool; // Utiliser le pool existant sur Heroku
    } else {
      // En local, créer une connexion sans spécifier de base de données
      tempPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
      
      // Créer la base de données si elle n'existe pas
      await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      
      // Utiliser la base de données
      await tempPool.query(`USE ${process.env.DB_NAME}`);
    }
    
    // Créer la table des questions
    await tempPool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Créer la table des options
    await tempPool.query(`
      CREATE TABLE IF NOT EXISTS options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        option_text TEXT NOT NULL,
        option_order INT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // Insérer quelques questions par défaut si la table est vide
    const [rows] = await tempPool.query('SELECT COUNT(*) as count FROM questions');
    
    if (rows[0].count === 0) {
      // Questions par défaut
      const defaultQuestions = [
        {
          question: 'Quelle planète est surnommée \'la planète rouge\'?',
          options: ['Vénus', 'Mars', 'Jupiter', 'Saturne'],
          correctAnswer: 1
        },
        {
          question: 'Quel langage de programmation a été créé par Brendan Eich en 1995?',
          options: ['Python', 'Java', 'C++', 'JavaScript'],
          correctAnswer: 3
        },
        {
          question: 'Quelle est la plus grande lune de Saturne?',
          options: ['Europe', 'Titan', 'Ganymède', 'Callisto'],
          correctAnswer: 1
        },
        {
          question: 'Quel est l\'élément chimique le plus léger?',
          options: ['Hélium', 'Hydrogène', 'Lithium', 'Oxygène'],
          correctAnswer: 1
        },
        {
          question: 'Quelle société a développé le processeur Ryzen?',
          options: ['Intel', 'AMD', 'NVIDIA', 'Qualcomm'],
          correctAnswer: 1
        }
      ];
      
      // Insérer les questions par défaut
      for (const q of defaultQuestions) {
        const [result] = await tempPool.query(
          'INSERT INTO questions (question_text) VALUES (?)',
          [q.question]
        );
        
        const questionId = result.insertId;
        
        // Insérer les options
        for (let i = 0; i < q.options.length; i++) {
          const isCorrect = (i === q.correctAnswer) ? 1 : 0;
          await tempPool.query(
            'INSERT INTO options (question_id, option_text, option_order, is_correct) VALUES (?, ?, ?, ?)',
            [questionId, q.options[i], i, isCorrect]
          );
        }
      }
      
      console.log('Questions par défaut ajoutées à la base de données');
    }
    
    await tempPool.end();
    console.log('Base de données initialisée avec succès');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
  }
}

// Initialiser la base de données au démarrage
initializeDatabase(); 