# InsightFlow - AI-Powered CSV Analyzer

Upload a CSV and query it in plain English. A Flask backend runs the analysis through LangChain and GPT-4o-mini, and a liquid-glass style web UI presents the results.

## Demo

_Add a screenshot of the web UI answering a question about a CSV here._

## What it does

- Upload any CSV file through the web UI
- Ask questions in natural language ("which month had the highest sales?")
- LangChain + GPT-4o-mini interprets the question and analyzes the data with Pandas
- Results rendered in an Apple-style liquid glass interface

## Tech stack

- **Backend:** Python, Flask, LangChain, langchain-openai, Pandas
- **AI:** OpenAI GPT-4o-mini
- **Frontend:** HTML5, CSS3 (liquid glass design), vanilla JavaScript
- **Also included:** a Jupyter notebook (`csv_analyzer.ipynb`) showing the step-by-step logic

## Setup

1. Clone the repository.
2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate    # Windows
   # source .venv/bin/activate   # macOS/Linux
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your own keys:

   ```
   OPENAI_API_KEY=your_key_here
   MODEL_NAME=gpt-4o-mini
   ```

   (`.env` is local only - never commit it.)

5. Run the app:

   ```bash
   python server.py
   ```

6. Open `http://localhost:5000`.

## What this demonstrates

LLM integration in a real application: LangChain orchestration, prompt-driven data analysis over user-uploaded files, and a full backend-plus-frontend delivery.
