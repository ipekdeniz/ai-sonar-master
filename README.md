# Sonar Issue Analyzer

Bu proje, Sonar'dan alınan kod kalitesi sorunlarını Ollama AI modeli kullanarak analiz eder ve çözüm önerileri sunar.

## Gereksinimler

- Node.js (v14 veya üzeri)
- SonarQube/SonarCloud hesabı ve API token'ı
- Ollama kurulumu ve çalışır durumda olması

## Kurulum

1. Projeyi klonlayın:
```bash
git clone [repo-url]
cd sonar-analyzer
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun ve aşağıdaki değişkenleri ayarlayın:
```
SONAR_HOST=http://localhost:9000
SONAR_TOKEN=your_sonar_token
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=codellama
```

## Kullanım

1. Uygulamayı başlatın:
```bash
npm start
```

2. API'yi kullanın:
```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectKey": "your-project-key"}'
```

## API Endpoint

### POST /analyze

Sonar projesindeki issue'ları analiz eder ve Ollama modelinden çözüm önerileri alır.

**Request Body:**
```json
{
  "projectKey": "your-project-key"
}
```

**Response:**
```json
[
  {
    "issue": {
      "type": "BUG",
      "severity": "MAJOR",
      "message": "Issue description",
      "component": "file:path",
      "line": 42
    },
    "solution": "AI generated solution..."
  }
]
``` 