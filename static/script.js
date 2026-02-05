document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const chatSection = document.getElementById('chat-section');
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInfo = document.getElementById('file-info');
    const filenameLabel = document.getElementById('selected-filename');
    const filestatsLabel = document.getElementById('selected-stats');
    const removeFileBtn = document.getElementById('remove-file');
    const statusBadge = document.getElementById('status-badge');
    const previewSection = document.getElementById('preview-section');
    const tableContainer = document.getElementById('table-container');

    // Drag and Drop
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });

    async function handleFileUpload(file) {
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a CSV file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        showTypingIndicator();

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            // Update UI
            filenameLabel.textContent = data.filename;
            filestatsLabel.textContent = `${data.rows} rows • ${data.columns.length} columns`;

            dropZone.classList.add('hidden');
            fileInfo.classList.remove('hidden');
            chatSection.classList.remove('disabled');
            userInput.disabled = false;
            sendBtn.disabled = false;
            statusBadge.textContent = 'Data Loaded';
            statusBadge.classList.add('active');

            // Show Preview
            showPreview(data.preview, data.columns);
            addMessage('The data is ready! What would you like to know about it? Try asking for a chart!', 'ai');

        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            hideTypingIndicator();
        }
    }

    removeFileBtn.addEventListener('click', () => {
        dropZone.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        chatSection.classList.add('disabled');
        userInput.disabled = true;
        sendBtn.disabled = true;
        userInput.value = '';
        statusBadge.textContent = 'Awaiting Data';
        statusBadge.classList.remove('active');
        previewSection.classList.add('hidden');
        tableContainer.innerHTML = '';
        chatDisplay.innerHTML = '<div class="message ai-message">Hello! I\'m your AI data assistant. Upload a CSV file above, and I\'ll help you analyze it.</div>';
    });

    function showPreview(data, columns) {
        if (!data || data.length === 0) return;

        previewSection.classList.remove('hidden');
        let html = '<table><thead><tr>';
        columns.forEach(col => html += `<th>${col}</th>`);
        html += '</tr></thead><tbody>';

        data.forEach(row => {
            html += '<tr>';
            columns.forEach(col => html += `<td>${row[col] !== undefined ? row[col] : '-'}</td>`);
            html += '</tr>';
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }

    // Chat Functions
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function sendMessage() {
        const question = userInput.value.trim();
        if (!question) return;

        addMessage(question, 'user');
        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        showTypingIndicator();

        try {
            const response = await fetch('/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            addMessage(data.answer, 'ai');

        } catch (error) {
            addMessage('Sorry, I encountered an error: ' + error.message, 'ai');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
            hideTypingIndicator();
        }
    }

    async function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        chatDisplay.appendChild(div);

        if (sender === 'user') {
            div.textContent = text;
        } else {
            // Check for chart JSON
            const chartData = extractChartData(text);
            // Flexible regex to remove the JSON-chart block from the visible text
            const cleanText = text.replace(/```(?:json-chart|json|chart)?[\s\S]*?```/gi, '').trim();

            // Typing effect for the text part
            await typeWriter(cleanText, div);

            // If there's chart data, render it
            if (chartData) {
                renderChart(chartData, chatDisplay);
            }
        }

        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    function extractChartData(text) {
        // More robust regex: works with ```json, ```json-chart, or just ```
        const match = text.match(/```(?:json-chart|json|chart)?\s*(\{[\s\S]*?\})\s*```/i);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1].trim());
            } catch (e) {
                console.error("InsightFlow: Failed to parse chart JSON", e);
                return null;
            }
        }
        return null;
    }

    function renderChart(config, container) {
        const chartCard = document.createElement('div');
        chartCard.className = 'chart-card';
        const canvas = document.createElement('canvas');
        canvas.id = 'chart-' + Date.now();
        chartCard.appendChild(canvas);
        container.appendChild(chartCard);

        setTimeout(() => {
            try {
                // Sanitize Data: Ensure all data points are numbers
                config.datasets.forEach(ds => {
                    ds.data = ds.data.map(val => {
                        const num = Number(val);
                        return isNaN(num) ? 0 : num;
                    });
                });

                new Chart(canvas, {
                    type: config.type || 'bar',
                    data: {
                        labels: config.labels,
                        datasets: config.datasets.map((ds, i) => ({
                            ...ds,
                            backgroundColor: ds.data.map((_, idx) => getColors(config.type, idx, ds.data.length)),
                            borderColor: ds.data.map((_, idx) => getColors(config.type, idx, ds.data.length)),
                            borderWidth: config.type === 'line' ? 2 : 1,
                            borderRadius: config.type === 'bar' ? 6 : 0,
                            tension: 0.4
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: 10 },
                        plugins: {
                            legend: {
                                display: config.type === 'pie' || config.datasets.length > 1,
                                position: 'bottom',
                                labels: {
                                    usePointStyle: true,
                                    font: { size: 11 }
                                }
                            }
                        },
                        scales: config.type !== 'pie' ? {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.03)' },
                                ticks: { font: { size: 10 } }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { size: 10 } }
                            }
                        } : {}
                    }
                });
            } catch (err) {
                console.error("InsightFlow: Chart.js Error", err);
            }
            container.scrollTop = container.scrollHeight;
        }, 120);
    }

    function getColors(type, index, count) {
        const palette = [
            '#007AFF', '#5856D6', '#FF2D55', '#FF9500',
            '#FFCC00', '#4CD964', '#5AC8FA', '#AF52DE'
        ];
        return palette[index % palette.length];
    }

    async function typeWriter(text, element) {
        const fullContent = marked.parse(text);
        let currentText = "";
        const words = text.split(" ");

        for (let i = 0; i < words.length; i++) {
            currentText += words[i] + " ";
            element.innerHTML = marked.parse(currentText);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
        }
        element.innerHTML = fullContent;
    }

    function showTypingIndicator() {
        if (document.getElementById('typing-indicator')) return;

        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatDisplay.appendChild(div);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }
});
