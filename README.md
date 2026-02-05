# CSV Assignment - AI-Powered CSV Analyzer

## 📋 Overview
This is a standalone LangChain project that allows you to upload CSV files and query them using natural language with AI.

## ✅ Setup Complete
- ✅ Virtual environment created (`.venv`)
- ✅ Dependencies installed
- ✅ Environment variables configured (`.env`)

## 🚀 Quick Start

### 1. Activate Virtual Environment
```bash
# Windows PowerShell
.venv\Scripts\activate.ps1

# Windows CMD
.venv\Scripts\activate.bat
```

### 2. Run Your Application

#### Option A: Premium Web UI (Flask Backend + HTML/CSS/JS)
This provides a stunning Apple-style interface with liquid glass effects.
```bash
python server.py
```
Then open: **http://localhost:5000**

#### Option B: Jupyter Notebook (Tutorial)
Open `csv_analyzer.ipynb` in VS Code or Jupyter to see the step-by-step logic.

## 📦 Architecture
- **Frontend**: Pure HTML5, CSS3 (Liquid Glass Design), Vanilla JavaScript.
- **Backend**: Python Flask (handling AI analysis and file processing).
- **AI**: LangChain + GPT-4o-mini.

## 📦 Installed Dependencies
- **LangChain** - AI application framework
- **LangChain OpenAI** - OpenAI integration
- **Streamlit** - Web UI framework
- **Pandas** - Data processing
- **Python-dotenv** - Environment management
- **Pydantic** - Data validation

## 🔑 Configuration
Your OpenAI API key is already configured in `.env`:
```
OPENAI_API_KEY=sk-proj-...
MODEL_NAME=gpt-4o-mini
```

## 📝 Next Steps
Ready to build your CSV analyzer! The environment is set up and waiting for your code.

## 🛠️ Project Structure
```
csvassignment/
├── .venv/              # Virtual environment (isolated)
├── .env                # API keys (configured ✅)
├── .gitignore          # Git ignore rules
├── requirements.txt    # Dependencies list
└── README.md           # This file
```

## 💡 Example Use Cases
- "What's the average sales by region?"
- "Show me top 10 customers"
- "How many orders were placed in January?"
- "What's the total revenue?"

---
**Status:** ✅ Ready to code!
