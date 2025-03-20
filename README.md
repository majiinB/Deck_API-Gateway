<p align="center">
  <img src="https://firebasestorage.googleapis.com/v0/b/deck-f429c.appspot.com/o/image_2024-10-25_214738368.png?alt=media&token=4efd82e3-b592-4335-8d96-72b330806330" alt="Header Cover" style="width: 100%; height: auto;">
</p>

---

# 🚪 Deck AI API Service

**Deck AI API Service** is a microservice within the *Deck* ecosystem that handles all AI-related functionalities. It integrates Gemini AI to process user input, generate flashcards, generate quizzes, help moderate deck of flashcards and enhance productivity. This service provides dedicated endpoints for AI-driven content generation, ensuring seamless interaction between the *Deck* application and AI models.

---

## 🌟 Features

### Gemini Integration
- **⚡ Flashcard Generation**: Utilize Gemini to automatically generate flashcards from study materials (pdf files) and text inputs.
- **📝 Quiz Generation: Generate interactive multiple-choice quizzes using AI, based on your deck of flashcards.
- **🛡️ Content Moderation: Ensure appropriate and high-quality content by using AI to filter and analyze user-generated inputs, preventing harmful or irrelevant material.

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- OpenAI API key
- Firebase admin SDK

### Installation
1. 🛠️ Clone this repository to your local machine.
2. 📦 Install dependencies using `npm install`.
3. ⚙️ Set up environment variables:
   - `GEMINI_API_KEY`: Your Google Generative AI API key.
   - `ASSISTANT_ID`: Your OpenAI assistant ID.
   - `FIREBASE_API_KEY`: Found in Firebase admin.
   - `AUTH_DOMAIN`: Found in Firebase admin.
   - `PROJECT_ID`: Found in Firebase admin.
   - `STORAGE_BUCKET`: Found in Firebase admin.
   - `MESSAGING_SENDER_ID`: Found in Firebase admin.
   - `APP_ID`: Found in Firebase admin.
   - `KEY_FILE`: Found in Firebase Service Providers.
4. 📃 generate your firebase private key json file and place it in your project's root folder
5. 🚀 Run the server using `npm start`.

---

### 📡 API Endpoints

#### 🚀 API Health Check
- **GET** `/v2/deck/hi`  
  - **Description:** Checks if the API is online.  
  - **Response:**  
    ```json
    { "message": "Hi! the server is active" }
    ```

#### ⚡ Flashcard Generation
- **POST** `/v2/deck/generate/flashcards/:id`  
  - **Description:** Generates flashcards using Gemini AI based on provided input.  
  - **Path Parameter:**
    - `id` (string) – The user's unique ID.  
  - **Request Body:**
    ```json
    {
      "deckTitle": "WEBDEV - Frameworks",
      "subject": "Web development",
      "topic": "frameworks",
      "addDescription": "The various frameworks used for web development and their design patterns", // Optional
      "numberOfFlashcards": 10
    }
    ```
  - **Response:**
    ```json
    {
      "flashcards": [
        { "question": "What is wave-particle duality?", "answer": "It refers to the property of quantum entities to exhibit both wave and particle characteristics." }
      ]
    }
    ```

#### 🛡️ Content Moderation
- **POST** `/v2/deck/moderate/:id`  
  - **Description:** Uses Gemini AI to analyze user-generated content and determine its appropriateness.  
  - **Path Parameter:**
    - `id` (string) – The user's session or request identifier.  
  - **Request Body:**
    ```json
    {
      "content": "Input text to be moderated"
    }
    ```
  - **Response:**
    ```json
    {
      "moderation_result": "Safe",
      "flags": []
    }
    ```

#### 📝 Quiz Generation
- **POST** `/v2/deck/generate/quiz/:id`  
  - **Description:** Generates quiz questions based on provided text or study materials using OpenAI.  
  - **Path Parameter:**
    - `id` (string) – The user's session or request identifier.  
  - **Request Body:**
    ```json
    {
      "topic": "Biology",
      "subject": "Cell Structure",
      "description": "Test questions about cell organelles.",
      "material": "Base64_encoded_PDF_or_text"
    }
    ```
  - **Response:**
    ```json
    {
      "quiz": [
        {
          "question": "Which organelle is responsible for energy production in cells?",
          "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
          "answer": "Mitochondria"
        }
      ]
    }
    ```


---

## 🤝 Contributing

We welcome contributions from the community! To contribute:
1. 🍴 Fork the repository.
2. 🌿 Create a new branch (`git checkout -b feature/YourFeature`).
3. 💻 Commit your changes (`git commit -m 'Add some feature'`).
4. 📤 Push to the branch (`git push origin feature/YourFeature`).
5. 🔄 Open a pull request.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 📧 Contact

If you have any questions or suggestions, feel free to [open an issue](#).

---

Thank you for using Deck API Gateway! We hope it helps streamline your productivity workflows and enhances your "Deck" application experience. 🎉
