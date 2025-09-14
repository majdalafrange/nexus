# Rox Nexus - AI-Powered Voice Sales Assistant

A revolutionary voice-to-text sales application built for the WISPR Flow challenge, featuring Claude AI integration for enhanced transcript analysis and actionable insights.

## 🎯 Features

- **Voice-to-Text Integration**: Web Speech API with WISPR Flow support
- **AI-Powered Analysis**: Claude 3.5 Sonnet for sentiment analysis and insights
- **Smart Bookmarking**: "Bookmark that" voice commands for important items
- **Real-time Processing**: Click-to-start/stop speech recognition
- **Interactive UI**: Modern React interface with real-time updates
- **Word Count Tracking**: Progress tracking toward 2,000 words for WISPR Flow challenge

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Claude API key

### Backend Setup
```bash
cd backend
npm install
```

Set up environment variables:
```bash
# Create .env file
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
PORT=8787
```

Start the backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
```

Start the frontend:
```bash
npm run dev
```

## 🎤 Voice Commands

- **"Bookmark that"** - Save important items and commitments
- **"Tell me a joke"** - Get a laugh and boost morale
- **"What's my word count"** - Check progress toward 2,000 words
- **"Sing me a song"** - Musical interlude
- **"Help"** - Show available voice commands

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **AI Integration**: Claude 3.5 Sonnet API
- **Speech Recognition**: Web Speech API + WISPR Flow

## 📊 API Endpoints

- `GET /api/data` - Get current state
- `POST /api/bookmark` - Bookmark items via voice
- `POST /api/storytime` - Process speech transcripts
- `POST /api/reset-demo` - Reset demo state
- `GET /api/builder-log` - Get word count progress

## 🎯 WISPR Flow Challenge

This application is designed for the WISPR Flow challenge, featuring:
- Voice-to-text integration
- Creative UX with voice commands
- AI-powered sales insights
- Word count tracking (target: 2,000 words)
- Real-time transcript analysis

## 🔧 Development

The project uses TypeScript for both frontend and backend, with hot reloading for development.

### Backend Development
```bash
cd backend
npm run dev  # Starts with tsx watch
npm run build  # Compiles TypeScript
npm start  # Runs compiled JavaScript
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server
npm run build  # Builds for production
```

## 📝 License

MIT License - Built for WISPR Flow Challenge 2024