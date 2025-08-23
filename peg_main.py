import tkinter as tk
from tkinter import messagebox, filedialog
import webbrowser
import os
import csv
import random
import shutil
import re
import json

class ExperimentGenerator:
    def __init__(self, master):
        self.master = master
        master.title("Psychological Experiment Generator")
        master.geometry("1200x600")

        # Create main container with scrollbar
        main_container = tk.Frame(master)
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create canvas and scrollbar for scrolling
        canvas = tk.Canvas(main_container)
        scrollbar = tk.Scrollbar(main_container, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Pack canvas and scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Bind mousewheel to canvas
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)

        # --- Main Frames ---
        self.main_frame = tk.Frame(scrollable_frame)
        self.main_frame.pack(padx=10, pady=10)

        # --- Header ---
        self.headers = [
            'Block', 'Block Repeats', 'Stimulus', 'Response', 'Latency',
            'Correct Response', 'Feedback Text', 'Feedback Duration',
            'Stimulus Color', 'Background Color'
        ]
        for i, header in enumerate(self.headers):
            label = tk.Label(self.main_frame, text=header, font=('Arial', 12, 'bold'))
            label.grid(row=0, column=i, padx=5, pady=5)

        # --- Data Rows Container ---
        self.trial_rows = []
        self.add_trial_row() # Start with one row

        # --- Controls (moved inside scrollable area) ---
        self.button_frame = tk.Frame(scrollable_frame)
        self.button_frame.pack(padx=10, pady=(10,10))

        self.add_button = tk.Button(self.button_frame, text="Add Trial Row", command=self.add_trial_row)
        self.add_button.grid(row=0, column=0, padx=5)

        self.save_button = tk.Button(self.button_frame, text="Save CSV", command=self.save_file)
        self.save_button.grid(row=0, column=1, padx=5)

        self.load_button = tk.Button(self.button_frame, text="Load CSV", command=self.load_file)
        self.load_button.grid(row=0, column=2, padx=5)

        self.upload_images_button = tk.Button(self.button_frame, text="Upload Images", command=self.upload_images)
        self.upload_images_button.grid(row=0, column=3, padx=5)

        self.start_button = tk.Button(self.button_frame, text="Start Experiment", command=self.start_experiment)
        self.start_button.grid(row=0, column=4, padx=5)

        # Randomize + Repeat
        self.randomize_var = tk.BooleanVar(value=True)
        self.randomize_check = tk.Checkbutton(self.button_frame, text="Randomize Blocks (100+)", variable=self.randomize_var)
        self.randomize_check.grid(row=0, column=5, padx=5)

        self.repeat_var = tk.StringVar(value="1")
        tk.Label(self.button_frame, text="Repeat Sequence:").grid(row=0, column=6, padx=(15,5))
        self.repeat_entry = tk.Entry(self.button_frame, width=4, textvariable=self.repeat_var)
        self.repeat_entry.grid(row=0, column=7, padx=5)

    def add_trial_row(self):
        row_num = len(self.trial_rows) + 1
        widgets = []
        widths = [5, 10, 40, 20, 10, 15, 20, 10, 15, 15]
        for col, w in enumerate(widths):
            e = tk.Entry(self.main_frame, width=w)
            e.grid(row=row_num, column=col, padx=5, pady=2)
            widgets.append(e)
        self.trial_rows.append(tuple(widgets))

    def upload_images(self):
        filepaths = filedialog.askopenfilenames(
            title="Select image files",
            filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.gif;*.svg"), ("All Files", "*.*の声")]
        )
        if not filepaths: return
        images_dir = os.path.join(os.getcwd(), "images")
        os.makedirs(images_dir, exist_ok=True)
        for fp in filepaths:
            shutil.copy2(fp, images_dir)
        messagebox.showinfo("Images Uploaded", f"Copied {len(filepaths)} image(s) to ./images")

    def start_experiment(self):
        trials_by_block = {}
        block_repeats = {}  # Store repeat counts for each block (from first occurrence)
        original_block_order = []  # Track the order blocks appear in the design
        
        for i, row_widgets in enumerate(self.trial_rows):
            row_values = [w.get().strip() for w in row_widgets]
            if not any(row_values): continue

            (block, block_repeat, stimulus, response, latency, correct_response, feedback_text, 
             feedback_duration, stimulus_color, background_color) = row_values

            if not block:
                messagebox.showwarning("Input Error", f"Row {i+1}: Block cannot be empty.")
                return
            try:
                block_num = int(block)
            except ValueError:
                messagebox.showwarning("Input Error", f"Row {i+1}: Block must be an integer.")
                return

            # Track the original order blocks appear
            if block_num not in original_block_order:
                original_block_order.append(block_num)

            # Handle Block Repeats - only use value from first occurrence of each block
            if block_num not in block_repeats:
                if block_repeat.strip():
                    try:
                        block_repeats[block_num] = int(block_repeat)
                    except ValueError:
                        messagebox.showwarning("Input Error", f"Row {i+1}: Block Repeats must be a number.")
                        return
                else:
                    block_repeats[block_num] = 1  # Default to 1 if empty

            if response.upper() == 'NA' and latency.upper() == 'NA':
                messagebox.showwarning("Input Error", f"Row {i+1}: Response and Latency cannot both be NA.")
                return

            if latency.upper() != 'NA':
                try:
                    int(latency)
                except ValueError:
                    messagebox.showwarning("Input Error", f"Row {i+1}: Latency must be a number or NA.")
                    return
            
            if correct_response and response.upper() != 'NA' and not response.strip().startswith('[text'):
                response_options = [r.strip() for r in response.split(',')]
                if correct_response not in response_options:
                    messagebox.showwarning("Input Error", f"Row {i+1}: Correct Response must be one of the Response options.")
                    return

            if feedback_duration:
                try:
                    int(feedback_duration)
                except ValueError:
                    messagebox.showwarning("Input Error", f"Row {i+1}: Feedback Duration must be a number.")
                    return

            trials_by_block.setdefault(block_num, []).append({
                'block': block_num,
                'stimulus': stimulus,
                'response': response,
                'latency': latency,
                'correct_response': correct_response,
                'feedback_text': feedback_text,
                'feedback_duration': feedback_duration,
                'stimulus_color': stimulus_color or 'white',
                'background_color': background_color or 'darkgrey'
            })

        if not trials_by_block:
            messagebox.showinfo("No Trials", "Please define at least one trial.")
            return
            
        image_regex = re.compile(r'\[image:([^()\]]+?)(?:\((.*?)\))?\]')
        for block_trials in trials_by_block.values():
            for t in block_trials:
                for m in image_regex.finditer(t['stimulus']):
                    fname = m.group(1).strip()
                    if fname and not os.path.isfile(os.path.join(os.getcwd(), "images", fname)):
                        messagebox.showerror("Missing Images", f"Image file not found in ./images: {fname}")
                        return

        try:
            repeat_count = int(self.repeat_var.get())
        except ValueError:
            messagebox.showwarning("Input Error", "Repeat Sequence must be a valid number.")
            return

        final_trials = []
        
        for rep in range(repeat_count):
            # Create section groups for randomization (100s, 200s, etc.)
            randomizable_sections = {}
            
            # First, organize trials into sections
            for block_num in original_block_order:
                if block_num >= 100:
                    section_id = block_num // 100  # 101->1, 201->2, etc.
                    if section_id not in randomizable_sections:
                        randomizable_sections[section_id] = []
                    randomizable_sections[section_id].append(block_num)
            
            # Determine section repeat counts (from first block in each section)
            section_repeats = {}
            for section_id, section_blocks in randomizable_sections.items():
                first_block = min(section_blocks)
                section_repeats[section_id] = block_repeats.get(first_block, 1)
            
            # Process the sequence following the original design order
            for block_num in original_block_order:
                if block_num < 100:
                    # Fixed block - add with its individual repeats
                    for block_rep in range(block_repeats[block_num]):
                        for trial in trials_by_block[block_num]:
                            trial_copy = trial.copy()
                            trial_copy['repetition'] = rep + 1
                            trial_copy['block_repetition'] = block_rep + 1
                            final_trials.append(trial_copy)
                else:
                    # Randomizable section - check if this is the first block in its section
                    section_id = block_num // 100
                    section_blocks = randomizable_sections[section_id]
                    
                    if block_num == min(section_blocks):
                        # This is the first block in the section - process the entire section
                        section_repeat_count = section_repeats[section_id]
                        
                        for section_rep in range(section_repeat_count):
                            # Collect all trials in this section
                            section_trials = []
                            for sect_block_num in section_blocks:
                                for trial in trials_by_block[sect_block_num]:
                                    trial_copy = trial.copy()
                                    trial_copy['repetition'] = rep + 1
                                    trial_copy['section_repetition'] = section_rep + 1
                                    section_trials.append(trial_copy)
                            
                            # Randomize section if requested
                            if self.randomize_var.get():
                                random.shuffle(section_trials)
                            
                            # Add all section trials to final list
                            final_trials.extend(section_trials)
                    # If not the first block in section, skip (already processed)

        self.compile_and_run(final_trials)

    def compile_and_run(self, trials):
        html_content = self.generate_html(trials)
        with open("experiment.html", "w", encoding="utf-8") as f:
            f.write(html_content)
        webbrowser.open('file://' + os.path.realpath('experiment.html'))

    def save_file(self):
        filepath = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*の声")]
        )
        if not filepath: return
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(self.headers)
            for row_widgets in self.trial_rows:
                values = [w.get() for w in row_widgets]
                if any(values):
                    writer.writerow(values)

    def load_file(self):
        filepath = filedialog.askopenfilename(
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*の声")]
        )
        if not filepath: return
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            try:
                header = next(reader)
                # Allow loading of files with or without the Block Repeats column for backward compatibility
                if len(header) == len(self.headers) - 1:  # Old format without Block Repeats
                    # Insert empty Block Repeats column for compatibility
                    header.insert(1, 'Block Repeats')
                elif [h.lower() for h in header] != [h.lower() for h in self.headers]:
                    messagebox.showwarning("Load Failed", "CSV headers do not match expected format.")
                    return
            except StopIteration:
                return # Empty file

            for e in self.trial_rows:
                for w in e: w.destroy()
            self.trial_rows.clear()

            for i, row_vals in enumerate(reader):
                # Handle old format files that don't have Block Repeats column
                if len(row_vals) == len(self.headers) - 1:
                    row_vals.insert(1, '')  # Insert empty Block Repeats value
                
                self.add_trial_row()
                for e, val in zip(self.trial_rows[i], row_vals):
                    e.insert(0, val)

    def generate_html(self, trials):
        image_regex = re.compile(r'\[image:([^()\]]+?)(?:\((.*?)\))?\]')
        preloaded_images = set()

        def img_tag(filename, opts_str):
            attrs, flags = {}, set()
            position_y, position_x = 'center', 'center'
            if opts_str:
                for token in [t.strip() for t in opts_str.split(',') if t.strip()]:
                    if '=' in token:
                        k, v = token.split('=', 1)
                        attrs[k.strip().lower()] = v.strip().strip("'")
                    else:
                        flags.add(token.lower())
            for flag in flags:
                if 'top' in flag: position_y = 'top'
                if 'bottom' in flag: position_y = 'bottom'
                if 'left' in flag: position_x = 'left'
                if 'right' in flag: position_x = 'right'
            
            src = f"images/{filename}"
            preloaded_images.add(src)
            styles = ["max-width:90%", "max-height:90vh"]
            if 'width' in attrs: styles.append(f"width:{int(attrs['width'])}px")
            if 'height' in attrs: styles.append(f"height:{int(attrs['height'])}px")
            
            style_attr = f' style="{';'.join(styles)}"'
            tag = f'<img src="{src}" alt="{filename}"{style_attr} />'
            return tag, f"{position_y}-{position_x}"

        def process_stim(raw):
            final_pos = 'center-center'
            def _repl(m):
                nonlocal final_pos
                fname, opts = m.group(1).strip(), (m.group(2) or '').strip()
                tag, pos = img_tag(fname, opts)
                final_pos = pos
                return tag
            processed_content = image_regex.sub(_repl, raw)
            return processed_content, final_pos

        js_trials = []
        for i, t in enumerate(trials):
            processed_stimulus, position = process_stim(t['stimulus'])
            js_trials.append({
                'block': t['block'],
                'stimulus': processed_stimulus,
                'response': t['response'],
                'latency': int(t['latency']) if t['latency'].upper() != 'NA' else None,
                'correctResponse': t['correct_response'] or None,
                'feedbackText': t['feedback_text'] or None,
                'feedbackDuration': int(t['feedback_duration']) if t['feedback_duration'] else None,
                'stimulusColor': t['stimulus_color'],
                'backgroundColor': t['background_color'],
                'position': position,
                'repetition': t.get('repetition', 1),
                'blockRepetition': t.get('block_repetition', 1),
                'trialIndex': i
            })

        trials_json = json.dumps(js_trials, indent=4)
        preload_list_json = json.dumps(list(preloaded_images))

        return f'''<!DOCTYPE html>
<html>
<head>
    <title>Experiment</title>
    <style>
        body {{ background-color: darkgrey; color: white; font-family: Arial, sans-serif; height: 100vh; margin: 0; display: flex; justify-content: center; align-items: center; }}
        #container {{ text-align: center; max-width: 90%; }}
        #feedback {{ position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); padding: 8px 12px; background: rgba(0,0,0,0.6); border-radius: 6px; display: none; }}
        input[type='text'] {{ font-size: 24px; padding: 8px; }}
        button {{ font-size: 18px; padding: 8px 16px; margin-left: 8px; }}
    </style>
</head>
<body>
    <div id="container"></div>
    <div id="feedback"></div>
    <script>
        const trials = {trials_json};
        const preloadList = {preload_list_json};
        const keyMap = {{ 'space': ' ', 'ctrl': 'control', 'alt': 'alt', 'lshift': 'shift', 'rshift': 'shift' }};
        
        let currentTrial = 0;
        let startTime = 0;
        let trialResults = [];
        let rafTimer = null;

        function preloadImages(srcs) {{
            if (!srcs || srcs.length === 0) return Promise.resolve();
            return Promise.all(srcs.map(src => new Promise(resolve => {{
                const img = new Image();
                img.onload = img.onerror = () => resolve();
                img.src = src;
            }})));
        }}

        function displayTrial(trial) {{
            const container = document.getElementById('container');
            document.body.style.backgroundColor = trial.backgroundColor;
            container.style.color = trial.stimulusColor;

            const [y_pos, x_pos] = trial.position.split('-');
            document.body.style.alignItems = y_pos === 'top' ? 'flex-start' : y_pos === 'bottom' ? 'flex-end' : 'center';
            document.body.style.justifyContent = x_pos === 'left' ? 'flex-start' : x_pos === 'right' ? 'flex-end' : 'center';
            
            container.innerHTML = trial.stimulus;
            startTime = performance.now();

            if (rafTimer) clearTimeout(rafTimer);
            document.onkeydown = null;

            const isText = trial.response.trim().startsWith('[text');
            if (isText) {{
                const input = document.createElement('input');
                input.type = 'text';
                const btn = document.createElement('button');
                btn.textContent = 'Continue';
                btn.onclick = () => handleResponse(input.value);
                container.appendChild(document.createElement('br'));
                container.appendChild(input);
                container.appendChild(btn);
                input.focus();
            }} else if (trial.response.toUpperCase() !== 'NA') {{
                document.onkeydown = (e) => {{
                    const allowed = trial.response.split(',').map(k => {{
                        const keyName = k.trim().toLowerCase();
                        return keyMap[keyName] || keyName;
                    }});
                    if (allowed.includes(e.key.toLowerCase())) {{
                        document.onkeydown = null; // Disable further key presses
                        handleResponse(e.key);
                    }}
                }};
            }}

            if (trial.latency !== null) {{
                rafTimer = setTimeout(() => {{
                    document.onkeydown = null; // Disable key responses during auto-progression
                    handleResponse(null);
                }}, trial.latency);
                // For trials with both response and latency, prioritize latency (automatic progression)
                // This allows for automatic slideshow-style presentations
                if (trial.response.toUpperCase() !== 'NA') {{
                    // Brief delay before disabling keys to allow immediate response if needed
                    setTimeout(() => {{
                        if (rafTimer) {{ // Only disable if timer is still active
                            document.onkeydown = null;
                        }}
                    }}, 50);
                }}
            }}
        }}

        function handleResponse(response) {{
            if (rafTimer) clearTimeout(rafTimer);
            const responseTime = performance.now() - startTime;
            const trial = trials[currentTrial];
            
            const correctResponseMapped = trial.correctResponse ? (keyMap[trial.correctResponse.toLowerCase()] || trial.correctResponse) : null;
            const isCorrect = correctResponseMapped ? (response && response.toLowerCase() === correctResponseMapped.toLowerCase()) : null;

            trialResults.push(Object.assign(trial, {{
                actualResponse: response,
                responseTime: responseTime,
                isCorrect: isCorrect,
                timestamp: new Date().toISOString()
            }}));

            // Handle feedback based on markers: [correct], [incorrect], [all]
            let showFeedback = false;
            let feedbackMessage = '';
            
            if (trial.feedbackText) {{
                const feedbackText = trial.feedbackText.trim();
                
                if (feedbackText.includes('[all]')) {{
                    showFeedback = true;
                    feedbackMessage = feedbackText.replace('[all]', '').trim();
                }} else if (feedbackText.includes('[correct]') && isCorrect === true) {{
                    showFeedback = true;
                    feedbackMessage = feedbackText.replace('[correct]', '').trim();
                }} else if (feedbackText.includes('[incorrect]') && isCorrect === false) {{
                    showFeedback = true;
                    feedbackMessage = feedbackText.replace('[incorrect]', '').trim();
                }} else if (!feedbackText.includes('[correct]') && !feedbackText.includes('[incorrect]') && !feedbackText.includes('[all]')) {{
                    // No markers - show feedback for any response
                    showFeedback = true;
                    feedbackMessage = feedbackText;
                }}
            }}

            if (showFeedback && feedbackMessage) {{
                const fb = document.getElementById('feedback');
                fb.textContent = feedbackMessage;
                fb.style.display = 'block';
                setTimeout(() => {{
                    fb.style.display = 'none';
                    nextTrial();
                }}, trial.feedbackDuration || 1000);
            }} else {{
                nextTrial();
            }}
        }}

        function nextTrial() {{
            currentTrial++;
            if (currentTrial < trials.length) {{
                displayTrial(trials[currentTrial]);
            }} else {{
                document.getElementById('container').innerHTML = "<h2>Experiment complete. Thank you!</h2>";
                downloadData();
            }}
        }}

        function downloadData() {{
            const experimentId = 'exp_' + Date.now().toString(36);
            const data = {{
                experimentId: experimentId,
                timestamp: new Date().toISOString(),
                browserInfo: navigator.userAgent,
                randomized: {str(self.randomize_var.get()).lower()},
                repetitions: {self.repeat_var.get()},
                trials: trialResults
            }};
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], {{ type: 'application/json' }});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `experiment_data_${{experimentId}}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }}

        preloadImages(preloadList).then(() => {{
            if (trials.length > 0) displayTrial(trials[0]);
        }});
    </script>
</body>
</html>
'''

if __name__ == "__main__":
    root = tk.Tk()
    app = ExperimentGenerator(root)
    root.mainloop()
