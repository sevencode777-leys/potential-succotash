   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Fill in the required values:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     OPENAI_API_KEY=your_openai_api_key_here
     PORT=3000
     FIREBASE_PROJECT_ID=your_firebase_project_id
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
     ```
   - **Security Warning**: Never commit the `.env` file to version control.

4. Start the server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000` by default.

### Frontend Setup

1. Configure Firebase in `js/config.js`:
   - Update the `firebaseConfig` object with your Firebase project credentials:
     ```javascript
     const firebaseConfig = {
       apiKey: "your_api_key",
       authDomain: "your_project.firebaseapp.com",
       projectId: "your_project_id",
       storageBucket: "your_project.appspot.com",
       messagingSenderId: "123456789",
       appId: "your_app_id"
     };
     ```

2. Open `index.html` in a web browser or serve it via a local server (e.g., using Python: `python -m http.server`).

3. Ensure the backend is running for full functionality.

## Security Improvements

- **API Key Protection**: Moved all API keys to the backend server, eliminating exposure in client-side code.
- **XSS Prevention**: Implemented DOMPurify for sanitizing all HTML content, preventing cross-site scripting attacks.
- **Proper Multimodal API**: Fixed Gemini integration to use correct `inline_data` format with MIME types and base64 data, ensuring true multimodal capabilities.
- **Network Resilience**: Added timeout, retry logic with exponential backoff, and abort controllers to handle network failures, rate limits, and interruptions gracefully.

## Authentication

Nibras uses Firebase Authentication for secure user sign-in:

- **Google Sign-In**: One-click authentication using Google accounts via popup or redirect.
- **Phone Sign-In**: SMS-based verification for phone numbers, with reCAPTCHA integration for spam prevention.
- **Session Management**: Automatic auth state monitoring with UI updates for signed-in users.
- **Backend Verification**: Server-side token validation ensures only authenticated requests reach AI endpoints.

## API Endpoints

### POST /api/chat

Sends a chat request to the AI provider and returns the response.

**Request Body**:
```json
{
  "provider": "gemini" | "openai",
  "text": "User message text",
  "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", ...],
  "context": ["Previous message 1", "Previous message 2", ...],
  "mode": "chat" | "planner" | "brainstorm"
}
```

**Response**:
```json
{
  "success": true,
  "text": "AI response text",
  "error": null
}
```
On error:
```json
{
  "success": false,
  "text": null,
  "error": "Error description"
}