# NeonQuiz - Application de Quiz Futuriste

Une application de quiz avec un design futuriste néon, utilisant HTML, CSS, JavaScript pour le frontend et Node.js avec MySQL pour le backend.

## Fonctionnalités

- Interface utilisateur futuriste avec effets néon
- Système de quiz interactif avec minuteur
- Tableau des meilleurs scores
- Panel administrateur pour gérer les questions
- Base de données MySQL pour stocker les questions
- Import/export de questions au format JSON

## Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v5.7 ou supérieur)

## Installation

1. Clonez ce dépôt :
   ```
   git clone https://github.com/votre-nom/neon-quiz.git
   cd neon-quiz
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Configurez la base de données :
   - Créez une base de données MySQL nommée `neonquiz`
   - Modifiez les informations de connexion dans le fichier `config.env` si nécessaire

4. Démarrez l'application :
   ```
   npm start
   ```

5. Accédez à l'application dans votre navigateur :
   ```
   http://localhost:3000
   ```

## Structure du Projet

```
neon-quiz/
├── public/               # Fichiers statiques
│   ├── css/              # Feuilles de style
│   │   └── style.css     # Styles principaux
│   ├── js/               # Scripts JavaScript
│   │   └── app.js        # Application frontend
│   └── index.html        # Page HTML principale
├── server.js             # Serveur Node.js
├── package.json          # Configuration npm
├── config.env            # Variables d'environnement
└── README.md             # Documentation
```

## Base de données

L'application utilise deux tables principales :

1. **questions** - Stocke les questions du quiz
   - id (INT, clé primaire)
   - question_text (TEXT)
   - created_at (TIMESTAMP)

2. **options** - Stocke les options de réponse pour chaque question
   - id (INT, clé primaire)
   - question_id (INT, clé étrangère)
   - option_text (TEXT)
   - option_order (INT)
   - is_correct (BOOLEAN)

## API REST

L'application expose les endpoints suivants :

- `GET /api/questions` - Récupérer toutes les questions
- `POST /api/questions` - Ajouter une nouvelle question
- `DELETE /api/questions/:id` - Supprimer une question

## Format JSON pour l'importation de questions

Pour importer des questions, vous devez fournir un fichier JSON contenant un tableau d'objets avec la structure suivante :

```json
[
  {
    "question": "Quelle planète est surnommée 'la planète rouge'?",
    "options": ["Vénus", "Mars", "Jupiter", "Saturne"],
    "correctAnswer": 1
  },
  {
    "question": "Quel langage de programmation a été créé par Brendan Eich en 1995?",
    "options": ["Python", "Java", "C++", "JavaScript"],
    "correctAnswer": 3
  }
]
```

Chaque objet question doit contenir :
- `question` (string) : Le texte de la question
- `options` (array) : Un tableau de chaînes de caractères représentant les options de réponse
- `correctAnswer` (number) : L'index de la bonne réponse dans le tableau `options` (commence à 0)

Vous pouvez exporter vos questions existantes au format JSON depuis le panel administrateur, les modifier, puis les réimporter.

## Utilisation

1. **Page d'accueil** : Choisissez le nombre de questions et commencez le quiz
2. **Quiz** : Répondez aux questions dans le temps imparti
3. **Résultats** : Consultez votre score et comparez-le aux meilleurs scores
4. **Panel Admin** : Accédez au panel administrateur pour gérer les questions

## Licence

Ce projet est sous licence MIT. 