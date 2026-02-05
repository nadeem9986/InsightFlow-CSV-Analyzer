import os
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_experimental.agents import create_pandas_dataframe_agent
import tempfile

load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# Increase max upload size to 100MB
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

# Global dictionary to store dataframes for sessions (simplified for demo)
# In production, use session or database
session_data = {}

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith('.csv'):
        try:
            # Save to temporary file to read via pandas
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, file.filename)
            file.save(temp_path)
            
            df = pd.read_csv(temp_path)
            
            # Store in session (using a fixed ID for simplicity in this trainer)
            session_id = "default_user"
            session_data[session_id] = df
            
            # Sanitize preview data: replace NaN with None for valid JSON
            preview_df = df.head(5).where(pd.notnull(df), None)
            preview = preview_df.to_dict(orient='records')
            columns = df.columns.tolist()
            
            return jsonify({
                "message": "File uploaded successfully",
                "filename": file.filename,
                "rows": len(df),
                "columns": columns,
                "preview": preview
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Invalid file type. Please upload a CSV."}), 400

@app.route('/query', methods=['POST'])
def query_data():
    data = request.json
    question = data.get('question')
    session_id = "default_user"
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
        
    df = session_data.get(session_id)
    if df is None:
        return jsonify({"error": "No CSV data uploaded. Please upload a file first."}), 400
        
    try:
        llm = ChatOpenAI(
            model=os.getenv("MODEL_NAME", "gpt-4o-mini"),
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Add a system prompt to make it more human and handle charts
        prefix = """You are InsightFlow AI, a specialist data analyst. 

        CORE MISSION:
        - You are strictly built for CSV analysis and data visualization. 
        - If a user asks you to perform a task unrelated to the uploaded CSV data, politely state: "I'm sorry, my capabilities are focused on analyzing your data. I cannot perform that specific task apart from what I'm made for."

        ANALYTICAL ACCURACY (CRITICAL):
        - ALWAYS verify your final textual summary against the actual counts or values you computed.
        - If you say a category is the "majority", it MUST have the highest value in your computation.
        - Mention the specific counts/values in your text response to ensure transparency.

        HUMAN TOUCH:
        - Use a friendly, conversational tone. Format with markdown.

        CRITICAL: CHART GENERATION
        - ONLY generate a chart if the user EXPLICITLY asks for a "chart", "graph", "plot", or "visualization".
        - If the user just asks for information or analysis (e.g., "What is the total revenue?"), provide a textual answer ONLY.
        - NEVER ask for permission. If they ask for a chart, JUST DO IT.
        - If asked for a chart, provide a textual summary AND include a JSON block at the VERY END.
        - DATA TYPES: In JSON, "labels" must be STRINGS, "data" must be NUMBERS.
        - The JSON block MUST be exactly like this:
        ```json-chart
        {
          "type": "bar", 
          "labels": ["Category A", "Category B"], 
          "datasets": [{"label": "Count/Value", "data": [10, 20]}]
        }
        ```
        - Valid types: 'bar', 'line', 'pie'.
        - The textual summary and the JSON chart data MUST be perfectly synchronized.
        """

        agent = create_pandas_dataframe_agent(
            llm,
            df,
            verbose=True,
            allow_dangerous_code=True,
            agent_type="openai-tools",
            prefix=prefix
        )
        
        response = agent.invoke(question)
        return jsonify({"answer": response["output"]})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ensure static directory exists
    if not os.path.exists('static'):
        os.makedirs('static')
    # Disable reloader to prevent crashes during agent execution
    app.run(debug=True, port=5000, use_reloader=False)
