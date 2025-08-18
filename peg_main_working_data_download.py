import tkinter as tk
from tkinter import messagebox, filedialog
import webbrowser
import os
import random

class ExperimentGenerator:
    def __init__(self, master):
        self.master = master
        master.title("Psychological Experiment Generator")

        # --- Main Frames ---
        self.main_frame = tk.Frame(master)
        self.main_frame.pack(padx=10, pady=10)

        # --- Header ---
        headers = ['Block', 'Block Label', 'Stimulus', 'Response', 'Latency', 'Correct Response', 'Feedback Text', 'Feedback Duration', 'Stimulus Color', 'Background Color']
        for i, header in enumerate(headers):
            label = tk.Label(self.main_frame, text=header, font=('Arial', 12, 'bold'))
            label.grid(row=0, column=i, padx=5, pady=5)

        # --- Trial Rows ---
        self.trial_rows = []
        for i in range(5):
            self.add_trial_row()

        # --- Buttons ---
        self.button_frame = tk.Frame(master)
        self.button_frame.pack(pady=10)

        self.add_row_button = tk.Button(self.button_frame, text="+", command=self.add_trial_row)
        self.add_row_button.grid(row=0, column=0, padx=5)

        self.start_button = tk.Button(self.button_frame, text="Start", command=self.start_experiment)
        self.start_button.grid(row=0, column=1, padx=5)

        self.save_button = tk.Button(self.button_frame, text="Save", command=self.save_file)
        self.save_button.grid(row=0, column=2, padx=5)

        self.load_button = tk.Button(self.button_frame, text="Load", command=self.load_file)
        self.load_button.grid(row=0, column=3, padx=5)

        self.randomize_var = tk.BooleanVar(value=True)
        self.randomize_check = tk.Checkbutton(self.button_frame, text="Randomize Blocks?", var=self.randomize_var)
        self.randomize_check.grid(row=0, column=5, padx=5)
        
        # --- Repeat Sequence ---
        self.repeat_frame = tk.Frame(self.button_frame)
        self.repeat_frame.grid(row=0, column=6, padx=5)
        
        self.repeat_label = tk.Label(self.repeat_frame, text="Repeat Sequence:")
        self.repeat_label.pack(side=tk.LEFT)
        
        self.repeat_var = tk.StringVar(value="1")
        self.repeat_entry = tk.Entry(self.repeat_frame, textvariable=self.repeat_var, width=3)
        self.repeat_entry.pack(side=tk.LEFT, padx=2)

    def add_trial_row(self):
        row_num = len(self.trial_rows) + 1

        block_entry = tk.Entry(self.main_frame, width=5)
        block_entry.grid(row=row_num, column=0, padx=5, pady=2)
        
        block_label_entry = tk.Entry(self.main_frame, width=15)
        block_label_entry.grid(row=row_num, column=1, padx=5, pady=2)

        stimulus_entry = tk.Entry(self.main_frame, width=40)
        stimulus_entry.grid(row=row_num, column=2, padx=5, pady=2)

        response_entry = tk.Entry(self.main_frame, width=20)
        response_entry.grid(row=row_num, column=3, padx=5, pady=2)

        latency_entry = tk.Entry(self.main_frame, width=10)
        latency_entry.grid(row=row_num, column=4, padx=5, pady=2)
        
        correct_response_entry = tk.Entry(self.main_frame, width=15)
        correct_response_entry.grid(row=row_num, column=5, padx=5, pady=2)
        
        feedback_text_entry = tk.Entry(self.main_frame, width=20)
        feedback_text_entry.grid(row=row_num, column=6, padx=5, pady=2)
        
        feedback_duration_entry = tk.Entry(self.main_frame, width=10)
        feedback_duration_entry.grid(row=row_num, column=7, padx=5, pady=2)

        stimulus_color_entry = tk.Entry(self.main_frame, width=15)
        stimulus_color_entry.grid(row=row_num, column=8, padx=5, pady=2)

        background_color_entry = tk.Entry(self.main_frame, width=15)
        background_color_entry.grid(row=row_num, column=9, padx=5, pady=2)

        self.trial_rows.append((block_entry, block_label_entry, stimulus_entry, response_entry, latency_entry, correct_response_entry, feedback_text_entry, feedback_duration_entry, stimulus_color_entry, background_color_entry))

    def start_experiment(self):
        trials_by_block = {}
        for i, (block_entry, block_label_entry, stim_entry, resp_entry, lat_entry, correct_resp_entry, feedback_text_entry, feedback_duration_entry, stim_color_entry, bg_color_entry) in enumerate(self.trial_rows):
            block = block_entry.get().strip()
            block_label = block_label_entry.get().strip()
            stimulus = stim_entry.get().strip()
            response = resp_entry.get().strip()
            latency = lat_entry.get().strip()
            correct_response = correct_resp_entry.get().strip()
            feedback_text = feedback_text_entry.get().strip()
            feedback_duration = feedback_duration_entry.get().strip()
            stimulus_color = stim_color_entry.get().strip()
            background_color = bg_color_entry.get().strip()

            # Skip empty rows
            if not block and not stimulus and not response and not latency and not stimulus_color and not background_color:
                continue

            # Validation
            if not block:
                messagebox.showwarning("Input Error", f"Row {i+1}: Block cannot be empty.")
                return
            try:
                block_num = int(block)
            except ValueError:
                messagebox.showwarning("Input Error", f"Row {i+1}: Block must be an integer.")
                return

            if response.upper() == 'NA' and latency.upper() == 'NA':
                messagebox.showwarning("Input Error", f"Row {i+1}: Response and Latency cannot both be NA.")
                return

            if latency.upper() != 'NA':
                try:
                    int(latency)
                except ValueError:
                    messagebox.showwarning("Input Error", f"Row {i+1}: Latency must be a number or NA.")
                    return
                    
            # Validate correct response is in the response options if provided
            if correct_response and response.upper() != 'NA':
                # Check if correct_response is one of the response options
                response_options = [r.strip() for r in response.split(',')]
                if correct_response not in response_options and not response.startswith('[text'):
                    messagebox.showwarning("Input Error", f"Row {i+1}: Correct Response must be one of the Response options.")
                    return
                    
            # Validate feedback duration if provided
            if feedback_duration:
                try:
                    int(feedback_duration)
                except ValueError:
                    messagebox.showwarning("Input Error", f"Row {i+1}: Feedback Duration must be a number.")
                    return

            if block_num not in trials_by_block:
                trials_by_block[block_num] = []
            
            # Set default feedback duration if feedback text is provided but duration is not
            if feedback_text and correct_response and not feedback_duration:
                feedback_duration = "1000"
            
            trials_by_block[block_num].append({
                'stimulus': stimulus,
                'response': response,
                'latency': latency,
                'block_num': block_num,
                'block_label': block_label if block_label else f"Block {block_num}",
                'correct_response': correct_response,
                'feedback_text': feedback_text,
                'feedback_duration': feedback_duration,
                'stimulus_color': stimulus_color if stimulus_color else 'white',
                'background_color': background_color if background_color else 'darkgrey'
            })

        if not trials_by_block:
            messagebox.showinfo("No Trials", "Please define at least one trial.")
            return

        # Get repeat sequence count
        try:
            repeat_count = int(self.repeat_var.get())
            if repeat_count < 1:
                messagebox.showwarning("Input Error", "Repeat Sequence must be at least 1.")
                return
        except ValueError:
            messagebox.showwarning("Input Error", "Repeat Sequence must be a valid number.")
            return

        # Assemble trials based on block sequence and repetition
        final_trials = []
        
        for repetition in range(1, repeat_count + 1):
            # Get sorted blocks
            sorted_blocks = sorted(trials_by_block.keys())
            
            # Randomize if needed
            if self.randomize_var.get():
                random.shuffle(sorted_blocks)
            
            # Add trials for this repetition
            for block_num in sorted_blocks:
                for trial in trials_by_block[block_num]:
                    # Create a copy of the trial with repetition info
                    trial_copy = trial.copy()
                    trial_copy['repetition'] = repetition
                    final_trials.append(trial_copy)

        self.compile_and_run(final_trials)

    def compile_and_run(self, trials):
        messagebox.showinfo("Compiling", "Compiling the experiment...")

        html_content = self.generate_html(trials)
        with open("experiment.html", "w") as f:
            f.write(html_content)

        webbrowser.open('file://' + os.path.realpath('experiment.html'))

    def save_file(self):
        filepath = filedialog.asksaveasfilename(
            defaultextension="txt",
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")],
        )
        if not filepath:
            return
        with open(filepath, "w") as f:
            f.write("Block,Block Label,Stimulus,Response,Latency,Correct Response,Feedback Text,Feedback Duration,Stimulus Color,Background Color\n")
            for (block_entry, block_label_entry, stim_entry, resp_entry, lat_entry, correct_resp_entry, feedback_text_entry, feedback_duration_entry, stim_color_entry, bg_color_entry) in self.trial_rows:
                block = block_entry.get().strip()
                block_label = block_label_entry.get().strip()
                stimulus = stim_entry.get().strip()
                response = resp_entry.get().strip()
                latency = lat_entry.get().strip()
                correct_response = correct_resp_entry.get().strip()
                feedback_text = feedback_text_entry.get().strip()
                feedback_duration = feedback_duration_entry.get().strip()
                stimulus_color = stim_color_entry.get().strip()
                background_color = bg_color_entry.get().strip()
                if block or block_label or stimulus or response or latency or correct_response or feedback_text or feedback_duration or stimulus_color or background_color:
                    # Handle commas in fields
                    if ',' in response:
                        response = f'({response})'
                    if ',' in feedback_text:
                        feedback_text = f'({feedback_text})'
                    f.write(f"{block},{block_label},{stimulus},{response},{latency},{correct_response},{feedback_text},{feedback_duration},{stimulus_color},{background_color}\n")

    def load_file(self):
        filepath = filedialog.askopenfilename(
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")])
        if not filepath:
            return
        with open(filepath, "r") as f:
            # Clear existing rows
            for (block_entry, block_label_entry, stim_entry, resp_entry, lat_entry, correct_resp_entry, feedback_text_entry, feedback_duration_entry, stim_color_entry, bg_color_entry) in self.trial_rows:
                block_entry.delete(0, tk.END)
                block_label_entry.delete(0, tk.END)
                stim_entry.delete(0, tk.END)
                resp_entry.delete(0, tk.END)
                lat_entry.delete(0, tk.END)
                correct_resp_entry.delete(0, tk.END)
                feedback_text_entry.delete(0, tk.END)
                feedback_duration_entry.delete(0, tk.END)
                stim_color_entry.delete(0, tk.END)
                bg_color_entry.delete(0, tk.END)

            # Skip header
            header = next(f).strip()
            
            # Load new data
            for i, line in enumerate(f):
                if i >= len(self.trial_rows):
                    self.add_trial_row()
                
                parts = line.strip().split(',')
                
                # Handle different format versions
                if len(parts) >= 10:  # Newest format with feedback
                    block = parts[0]
                    block_label = parts[1]
                    stimulus = parts[2]
                    response = parts[3]
                    latency = parts[4]
                    correct_response = parts[5]
                    feedback_text = parts[6]
                    feedback_duration = parts[7]
                    stimulus_color = parts[8]
                    background_color = parts[9]
                elif len(parts) >= 7:  # Format with Block Label
                    block = parts[0]
                    block_label = parts[1]
                    stimulus = parts[2]
                    response = parts[3]
                    latency = parts[4]
                    correct_response = ""
                    feedback_text = ""
                    feedback_duration = ""
                    stimulus_color = parts[5]
                    background_color = parts[6]
                elif len(parts) >= 6:  # Format with colors but no block label
                    block = parts[0]
                    block_label = ""
                    stimulus = parts[1]
                    response = parts[2]
                    latency = parts[3]
                    correct_response = ""
                    feedback_text = ""
                    feedback_duration = ""
                    stimulus_color = parts[4]
                    background_color = parts[5]
                elif len(parts) >= 4:  # Original format
                    block = parts[0]
                    block_label = ""
                    stimulus = parts[1]
                    response = parts[2]
                    latency = parts[3]
                    correct_response = ""
                    feedback_text = ""
                    feedback_duration = ""
                    stimulus_color = ""
                    background_color = ""
                else:
                    continue

                # Handle parentheses in fields
                if response.startswith('(') and response.endswith(')'):
                    response = response[1:-1]
                if feedback_text.startswith('(') and feedback_text.endswith(')'):
                    feedback_text = feedback_text[1:-1]

                block_entry, block_label_entry, stim_entry, resp_entry, lat_entry, correct_resp_entry, feedback_text_entry, feedback_duration_entry, stim_color_entry, bg_color_entry = self.trial_rows[i]
                block_entry.insert(0, block)
                block_label_entry.insert(0, block_label)
                stim_entry.insert(0, stimulus)
                resp_entry.insert(0, response)
                lat_entry.insert(0, latency)
                correct_resp_entry.insert(0, correct_response)
                feedback_text_entry.insert(0, feedback_text)
                feedback_duration_entry.insert(0, feedback_duration)
                stim_color_entry.insert(0, stimulus_color)
                bg_color_entry.insert(0, background_color)

    def generate_html(self, trials):
        # Convert Python trials to a JavaScript array of objects
        js_trials = []
        key_map = {
            "space": " ",
            "ctrl": "Control",
            "alt": "Alt",
            "lshift": "ShiftLeft",
            "rshift": "ShiftRight",
        }
        
        for i, t in enumerate(trials):
            # Handle responses - check for [text] marker
            response_type = "keypress"
            text_options = {}
            
            if t['response'].upper() == 'NA':
                responses = "null"
            elif t['response'].strip().startswith('[text'):
                response_type = "text"
                responses = '"[text]"'
                
                # Parse text options
                response_str = t['response'].strip()
                if '(' in response_str and ')' in response_str:
                    options_str = response_str[response_str.find('(')+1:response_str.find(')')]
                    for option in options_str.split(','):
                        if '=' in option:
                            key, value = option.split('=', 1)
                            key = key.strip()
                            value = value.strip().strip('"\'')
                            text_options[key] = value
            else:
                # Split by comma and create a JS array of strings
                raw_responses = [r.strip() for r in t['response'].split(',')]
                mapped_responses = [key_map.get(r.lower(), r) for r in raw_responses]
                responses = str(mapped_responses)

            # Handle latency
            latency = t['latency'] if t['latency'].upper() != 'NA' else "null"
            
            # Handle colors
            stimulus_color = t.get('stimulus_color', 'white')
            background_color = t.get('background_color', 'darkgrey')
            
            # Add block number and trial index for data recording
            block_num = t.get('block_num', 0)
            
            # Get repetition info
            repetition = t.get('repetition', 1)
            block_label = t.get('block_label', f"Block {block_num}")
            
            # Handle feedback-related fields
            correct_response = "null"
            if 'correct_response' in t and t['correct_response']:
                if response_type == "text":
                    correct_response = f"\"{t['correct_response']}\""
                else:
                    correct_response = f"\"{t['correct_response']}\""
            
            feedback_text = "null"
            if 'feedback_text' in t and t['feedback_text']:
                feedback_text = f"\"{t['feedback_text']}\""
            
            feedback_duration = "null"
            if 'feedback_duration' in t and t['feedback_duration']:
                feedback_duration = t['feedback_duration']
            elif feedback_text != "null" and correct_response != "null":
                feedback_duration = "1000"  # Default if feedback text is provided but duration is not
                
            # Build trial object
            trial_obj = f"{{ stimulus: `{t['stimulus']}`, responses: {responses}, latency: {latency}, blockNum: {block_num}, blockLabel: '{block_label}', repetition: {repetition}, trialIndex: {i}, responseType: '{response_type}', stimulusColor: '{stimulus_color}', backgroundColor: '{background_color}', correctResponse: {correct_response}, feedbackText: {feedback_text}, feedbackDuration: {feedback_duration}"
            
            # Add text options if present
            if text_options:
                for key, value in text_options.items():
                    trial_obj += f", {key}: '{value}'"
            
            trial_obj += " }"
            js_trials.append(trial_obj)

        js_trials_string = ',\n            '.join(js_trials)
        
        # Pass experiment settings to JavaScript
        randomized_blocks = str(self.randomize_var.get()).lower()
        repeat_sequence = self.repeat_var.get()
        
        # HTML and JavaScript for the experiment
        html = f'''
<!DOCTYPE html>
<html>
<head>
    <title>Experiment</title>
    <style>
        body {{ 
            background-color: darkgrey; 
            color: white; 
            font-family: Arial, sans-serif; 
            font-size: 14px; 
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
        }}
        #stimulus-container {{ 
            font-size: 2em; 
            text-align: center;
            margin-bottom: 20px;
        }}
        #feedback-container {{
            font-size: 1.5em;
            text-align: center;
            margin-top: 20px;
            min-height: 40px;
        }}
        .correct-feedback {{
            color: darkgreen;
            font-weight: bold;
        }}
        #feedback-container {{
            font-size: 1.5em;
            text-align: center;
            margin-top: 20px;
            min-height: 40px;
        }}
        .correct-feedback {{
            color: darkgreen;
            font-weight: bold;
        }}
        #text-input-container {{
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }}
        #text-input {{
            padding: 10px;
            font-size: 16px;
            border: 2px solid #ccc;
            border-radius: 5px;
            min-width: 200px;
        }}
        #submit-button {{
            padding: 10px 20px;
            font-size: 16px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }}
        #submit-button:hover {{
            background-color: #0056b3;
        }}
    </style>
</head>
<body>
    <div id="stimulus-container"></div>
    <div id="feedback-container"></div>
    <div id="text-input-container">
        <input type="text" id="text-input" />
        <button id="submit-button">Submit</button>
    </div>

    <script>
        const trials = [
            {js_trials_string}
        ];

        let currentTrial = 0;
        let animationFrameId = null;
        let startTime = 0;
        let trialResults = [];
        let rafPrecisionTimer = null;
        const randomizedBlocks = {randomized_blocks};

        // High-precision timer using requestAnimationFrame
        class RAFTimer {{
            constructor(duration, callback) {{
                this.startTime = performance.now();
                this.duration = duration;
                this.callback = callback;
                this.rafId = null;
                this.start();
            }}
            
            start() {{
                const tick = (timestamp) => {{
                    const elapsed = timestamp - this.startTime;
                    if (elapsed >= this.duration) {{
                        this.callback();
                        return;
                    }}
                    this.rafId = requestAnimationFrame(tick);
                }};
                this.rafId = requestAnimationFrame(tick);
            }}
            
            cancel() {{
                if (this.rafId) {{
                    cancelAnimationFrame(this.rafId);
                    this.rafId = null;
                }}
            }}
        }}

        function displayTrial(trial) {{
            const container = document.getElementById('stimulus-container');
            const textInputContainer = document.getElementById('text-input-container');
            const textInput = document.getElementById('text-input');
            const submitButton = document.getElementById('submit-button');
            
            // Apply colors
            document.body.style.backgroundColor = trial.backgroundColor;
            container.style.color = trial.stimulusColor;
            
            // Display stimulus
            container.innerHTML = trial.stimulus;
            
            // Record the start time when the stimulus is displayed
            startTime = performance.now();

            // Clear previous animation frame and event listeners
            if (rafPrecisionTimer) {{
                rafPrecisionTimer.cancel();
                rafPrecisionTimer = null;
            }}
            document.removeEventListener('keydown', handleKeyPress);
            submitButton.removeEventListener('click', handleTextSubmit);

            // Hide text input initially
            textInputContainer.style.display = 'none';

            // Set up response handling based on response type
            if (trial.responseType === 'text') {{
                // Show text input
                textInputContainer.style.display = 'flex';
                textInput.value = '';
                
                // Set text input options
                if (trial.placeholder) {{
                    textInput.placeholder = trial.placeholder;
                }}
                if (trial.maxlength) {{
                    textInput.maxLength = parseInt(trial.maxlength);
                }}
                if (trial.width) {{
                    textInput.style.width = trial.width + 'px';
                }}
                
                // Focus on text input
                setTimeout(() => textInput.focus(), 100);
                
                // Add submit button event listener
                submitButton.addEventListener('click', handleTextSubmit);
                
                // Allow Enter key to submit
                textInput.addEventListener('keydown', function(event) {{
                    if (event.key === 'Enter') {{
                        handleTextSubmit();
                    }}
                }});
                
            }} else if (trial.responses) {{
                // Set up keypress handling
                document.addEventListener('keydown', handleKeyPress);
            }}

            // Set up latency using the high-precision timer
            if (trial.latency !== null) {{
                rafPrecisionTimer = new RAFTimer(trial.latency, () => {{
                    if (trial.responses === null) {{
                        // Record trial data with no response
                        recordTrialData(null, trial.latency);
                        nextTrial();
                    }}
                }});
            }}
        }}

        function handleKeyPress(event) {{
            const trial = trials[currentTrial];
            if (trial.responses && (trial.responses.includes(event.key) || trial.responses.includes(event.code))) {{
                // Calculate response time with high precision
                const responseTime = performance.now() - startTime;
                
                // Record trial data with response
                recordTrialData(event.key, responseTime);
                
                // Cancel any pending timer
                if (rafPrecisionTimer) {{
                    rafPrecisionTimer.cancel();
                }}
                
                // Check if feedback should be displayed
                if (trial.correctResponse && trial.feedbackDuration) {{
                    displayFeedback(event.key, trial);
                }} else {{
                    nextTrial();
                }}
            }}
        }}
        
        function handleTextSubmit() {{
            const textInput = document.getElementById('text-input');
            const responseTime = performance.now() - startTime;
            const trial = trials[currentTrial];
            
            // Record trial data with text response
            recordTrialData(textInput.value, responseTime);
            
            // Cancel any pending timer
            if (rafPrecisionTimer) {{
                rafPrecisionTimer.cancel();
            }}
            
            // Check if feedback should be displayed
            if (trial.correctResponse && trial.feedbackDuration) {{
                displayFeedback(textInput.value, trial);
            }} else {{
                nextTrial();
            }}
        }}
        
        function recordTrialData(response, responseTime) {{
            const trial = trials[currentTrial];
            const isCorrect = trial.correctResponse ? 
                (Array.isArray(trial.correctResponse) ? 
                    trial.correctResponse.includes(response) : 
                    response === trial.correctResponse) : 
                null;
            
            trialResults.push({{
                blockNum: trial.blockNum,
                blockLabel: trial.blockLabel,
                repetition: trial.repetition,
                trialIndex: trial.trialIndex,
                stimulus: trial.stimulus,
                expectedResponses: trial.responses,
                correctResponse: trial.correctResponse,
                actualResponse: response,
                isCorrect: isCorrect,
                feedbackShown: trial.feedbackText && isCorrect !== null ? true : false,
                feedbackText: isCorrect ? trial.feedbackText : '',
                responseTime: Math.round(responseTime),
                timestamp: new Date().toISOString()
            }});
        }}

        function downloadExperimentData() {{
            // Create a unique experiment ID
            const experimentId = 'exp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            
            // Prepare the experiment data object
            const experimentData = {{
                experiment_id: experimentId,
                timestamp: new Date().toISOString(),
                browser_info: navigator.userAgent,
                randomized_blocks: randomizedBlocks,
                repeat_sequence: {repeat_sequence},
                trials: trialResults
            }};
            
            // Convert to JSON string
            const jsonData = JSON.stringify(experimentData, null, 2);
            
            // Create a Blob with the JSON data
            const blob = new Blob([jsonData], {{ type: 'application/json' }});
            
            // Create a download link and trigger the download
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `experiment_data_${{experimentId}}.json`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Log to console as well
            console.log('Experiment data saved:', experimentData);
            
            // Update UI
            document.getElementById('stimulus-container').innerHTML = "Experiment Finished - Data Downloaded";
        }}
        
        function displayFeedback(response, trial) {{
            // Get the feedback container
            const feedbackContainer = document.getElementById('feedback-container');
            
            // Check if the response is correct
            const isCorrect = Array.isArray(trial.correctResponse) ? 
                trial.correctResponse.includes(response) : 
                response === trial.correctResponse;
            
            // Display appropriate feedback
            if (isCorrect && trial.feedbackText) {{
                // Show correct feedback
                feedbackContainer.innerHTML = trial.feedbackText;
                feedbackContainer.className = 'correct-feedback';
                feedbackContainer.style.display = 'block';
            }} else {{
                // Show blank feedback for incorrect responses
                feedbackContainer.innerHTML = '';
                feedbackContainer.className = '';
                feedbackContainer.style.display = 'block';
            }}
            
            // Set timer to hide feedback and proceed to next trial
            setTimeout(() => {{
                feedbackContainer.style.display = 'none';
                nextTrial();
            }}, trial.feedbackDuration);
        }}
        
        function nextTrial() {{
            currentTrial++;
            if (currentTrial < trials.length) {{
                displayTrial(trials[currentTrial]);
            }} else {{
                // Experiment finished
                document.getElementById('stimulus-container').innerHTML = "Experiment Finished - Downloading Data...";
                console.log("Trial results:", trialResults);
                
                // Generate and download JSON data file
                downloadExperimentData();
            }}
        }}

        // Start the experiment
        if (trials.length > 0) {{
            displayTrial(trials[currentTrial]);
        }}
    </script>
</body>
</html>
'''
        return html

if __name__ == "__main__":
    root = tk.Tk()
    app = ExperimentGenerator(root)
    root.mainloop()
