<p align="center">
  <img src="https://firebasestorage.googleapis.com/v0/b/deck-f429c.appspot.com/o/image_2024-10-25_214738368.png?alt=media&token=4efd82e3-b592-4335-8d96-72b330806330" alt="Header Cover" style="width: 100%; height: auto;">
</p>

---

# 🚪 Deck API Gateway

The Deck API Gateway serves as a bridge between your "Deck" application and both the OpenAI API and Gemini AI, facilitating the processing and connection of data. It provides endpoints for interacting with the Deck application and leveraging the power of these AI services for generating flashcards and enhancing productivity.

---

## 🌟 Features

### OpenAI Integration
- **⚡ Flashcard Generation**: Utilize the OpenAI API to automatically generate flashcards from study materials (pdf files) and text inputs.

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
   - `OPENAI_API_KEY`: Your OpenAI API key.
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

#### OpenAI Integration
- `GET /hi`: To check if the API is online
- `POST /prompt/v1/openAI/:id`: Send prompt or message to OpenAI assistant.
- `POST /prompt/v2/gemini/:id`: Send prompt or message to Gemini AI and also receive a response.
- `GET /response/v1/openAI/:id`: Retrieve OpenAI assistant response.

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
