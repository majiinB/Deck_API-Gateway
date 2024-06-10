# Deck API Gateway

The Deck API Gateway serves as a bridge between your "Deck" application and the OpenAI API, facilitating the processing and connection of data. It provides endpoints for interacting with the Deck application and leveraging the power of the OpenAI API for generating flashcards and enhancing productivity.

## Features

### Integration with "Deck" Application
- **Flashcard Management**: Create, retrieve, update, and delete flashcards within the "Deck" application.

### OpenAI Integration
- **Flashcard Generation**: Utilize the OpenAI API to automatically generate flashcards from study materials and text inputs.

## Getting Started

### Prerequisites
- Node.js installed
- OpenAI API key
- Firebase admin sdk

### Installation
1. Clone this repository to your local machine.
2. Install dependencies using `npm install`.
3. Set up environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key.
   - `ASSISTANT_ID` : Your OpenAI assistant ID
   - `FIREBASE_API_KEY` : Found in Firebase admin
   - `AUTH_DOMAIN` : Found in Firebase admin 
   - `PROJECT_ID` : Found in Firebase admin
   - `STORAGE_BUCKET` : Found in Firebase admin
   - `MESSAGING_SENDER_ID` : Found in Firebase admin
   - `APP_ID` : Found in Firebase admin
   - `KEY_FILE` : Found in Firebase Service Providers
4. Run the server using `npm start`.

### API Endpoints

#### OpenAI Integration
- `POST /message/:id`: Send prompt or message to OpenAi assistant
- `GET /response/:id`: Retrieve OpenAi assitant response.


## Contributing

We welcome contributions from the community! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

If you have any questions or suggestions, feel free to [open an issue](#)

---

Thank you for using Deck API Gateway! We hope it helps streamline your productivity workflows and enhances your "Deck" application experience.
