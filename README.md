# Sonar Analyzer

A tool that analyzes SonarQube issues and provides AI-generated solutions using Ollama.

## Features

- Analyzes SonarQube issues
- Generates AI-powered solutions using Ollama
- Creates detailed HTML reports
- Supports multiple issue types
- Real-time analysis progress updates

## Prerequisites

- Node.js (v14 or higher)
- SonarQube instance
- Ollama instance with CodeLlama model

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sonar-analyzer.git
cd sonar-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Set your SonarQube token in `.env` file:
```
SONAR_TOKEN=your_sonar_token
SONAR_URL=http://your-sonar-url
OLLAMA_URL=http://your-ollama-url
```

4. Start the application:
```bash
npm start
```

5. Pull the CodeLlama model in Ollama:
```bash
curl -X POST http://localhost:11434/api/pull -d '{"name": "codellama"}'
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter your SonarQube project key
3. Select issue types to analyze
4. Click "Analyze" to start the analysis
5. View the generated reports in the results directory

## API Documentation

API documentation is available at `http://localhost:3000/api-docs` when the server is running.

## License

MIT 