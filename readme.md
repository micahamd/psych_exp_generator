# Psychological Experiment Generator (PEG)

## Description

PEG is a Python-based application designed for experimental psychologists and researchers to easily create and deploy simple, web-based behavioral experiments. Inspired by tools like PsyToolkit, PEG allows users to define a sequence of trials in a simple, spreadsheet-like interface and then compiles this sequence into a single, self-contained HTML file that can be run in any modern web browser.

This tool aims to simplify the process of experiment creation, removing the need for extensive programming knowledge in web languages.

## Current Status: Step 13 - Block Repeats (Smart Grouping)

The current version includes the following features:

### Step 1 - Basic Working Interface
*   **Graphical User Interface (GUI):** A simple interface built with Python's native Tkinter library.
*   **Trial Definition:** Users can define trials in a table format with columns for stimulus, response, timing, and visual properties.
*   **Dynamic Rows:** The interface starts with one row, and new rows can be added by clicking the "Add Trial Row" button.
*   **Experiment Compilation:** Clicking the "Start Experiment" button validates the user's input, and if successful, compiles the trial list into an `experiment.html` file.
*   **Input Validation:** The application checks for critical errors and ensures all values are properly formatted.
*   **Automatic Execution:** After successful compilation, the generated `experiment.html` is automatically opened in the user's default web browser to run the experiment.

### Step 2 - Presentation Sequencing
* Added 'Block' column to organize trials into blocks
* Added 'Randomize Blocks?' checkbox to control trial sequence
* Trials are presented in order within blocks
* Optional randomization of blocks during experiment execution

### Step 3 - Save and Load Study Files
* Functional 'Save' button to export experiment configuration as a text file
* Functional 'Load' button to import experiment configuration from a text file
* Comma-separated format for easy editing outside the application

### Step 4 - Special Keys
* Support for special keys in response fields: 'space', 'ctrl', 'alt', 'lshift', 'rshift'
* Proper mapping of these keys to their JavaScript equivalents in the generated HTML

### Step 5 - Multiple Responses
* Support for multiple valid responses per trial
* Multiple responses can be specified in parentheses, e.g., (space, y, n)
* Proper parsing and handling of multiple responses during saving, loading, and experiment execution

### Step 6 - Improved Timing Accuracy
* Replaced setTimeout with requestAnimationFrame for more precise timing control
* Accurate measurement of response times using performance.now()
* Recording of detailed trial data including block number, stimulus, expected responses, actual response, and response time
* Data logging to console when experiment completes

### Step 7 - Data Recording and Measurement
* Automatic generation and download of JSON data files when experiments complete
* Comprehensive data recording including experiment metadata (timestamp, browser info) and detailed trial information
* Unique experiment session identifiers for each run
* Structured JSON format compatible with analysis software (R, Python, SPSS)

### Step 8 - Configurable Colors
* New columns for stimulus and background color customization
* Support for color names, hex codes, and RGB values
* Per-trial color configuration options

### Step 9 - Text Entry Responses
* Support for free-text input responses using [text] marker
* Configurable text field properties (placeholder, max length, width)
* Automatic data recording of text responses

### Step 10 - Block Repetition
* "Repeat Sequence" option for running block sequences multiple times
* Interaction with block randomization for flexible experimental designs
* Block counter for tracking repetitions in data

### Step 11 - Response Feedback
* Conditional feedback based on participant responses
* Support for correct/incorrect response indicators
* Configurable feedback duration

### Step 12 - Image Stimuli
* Support for image files as stimuli using [image:filename.jpg] syntax
* Image upload and management system
* Configurable image properties (size, position)
* Support for 9 positioning options (top-left, top-center, top-right, etc.)
* Image preloading for smooth experiment execution

### Step 13 - Block Repeats (Smart Grouping)
* **Block Repeats column** for specifying how many times each block should be repeated
* **Smart grouping logic** - only the first occurrence of each block number needs the repeat value
* **Default behavior** - empty Block Repeats cells default to 1 repetition
* **Backward compatibility** - can load old CSV files without Block Repeats column
* **Enhanced data recording** - tracks both sequence repetitions and block repetitions
* **Hierarchical control** - Block Repeats for fine-grained control, Repeat Sequence for macro-level control
  
## Future Development Roadmap

The following features are planned for future releases:

### Step 14 - Conditional Trial Sequencing
* Dynamic experiment flow based on participant responses
* Conditional logic for branching experimental designs
* Trial indexing system for precise control

### Step 15 - Audio Stimuli
* Support for audio files as stimuli using [audio:filename.mp3] syntax
* Configurable audio playback controls
* Multimodal stimulus presentation (text + audio, image + audio)

## Complete Column Reference

The current interface includes the following columns (in order):

1. **Block** - Integer value to group trials into blocks
2. **Block Repeats** - Number of times this block should repeat (only needed for first row of each block)
3. **Stimulus** - Text, image, or mixed content to display
4. **Response** - Accepted responses (comma-separated) or [text] for free input
5. **Latency** - Duration in milliseconds or "NA" to wait for response
6. **Correct Response** - Expected correct response for feedback systems
7. **Feedback Text** - Message to show after response (with [correct]/[incorrect] markers)
8. **Feedback Duration** - How long to show feedback in milliseconds
9. **Stimulus Color** - Color of the stimulus text (color names, hex, or RGB)
10. **Background Color** - Background color for the trial


## How to Use

1.  **Run the application:** Execute the `peg_main.py` script using a Python 3 interpreter.
    ```sh
    python peg_main.py
    ```
2.  **Define your trials:**
    *   In the GUI window, enter the details for each trial in the corresponding columns.
    *   **Block**: Enter an integer to group trials (e.g., 1, 2, 3)
    *   **Block Repeats**: Enter how many times this block should repeat (only needed for the first row of each block)
    *   **Stimulus**: Enter text, image references like `[image:filename.jpg]`, or mixed content
    *   **Response**: Enter acceptable responses (e.g., "y,n,space") or "[text]" for free input
    *   **Latency**: Enter duration in milliseconds or "NA" to wait for response
    *   Fill in optional columns for feedback, colors, etc.
    *   Click "Add Trial Row" if you need more rows.
3.  **Upload images (if needed):**
    *   Click "Upload Images" to add image files to the ./images directory
    *   Reference these images in your stimulus using `[image:filename.jpg]` syntax
4.  **Configure experiment settings:**
    *   Check/uncheck "Randomize Blocks" to control block order
    *   Set "Repeat Sequence" to run the entire experiment multiple times
5.  **Start the experiment:**
    *   Click "Start Experiment" to validate and compile your experiment
    *   If there are errors, warning messages will appear with specific details
    *   If successful, `experiment.html` will be created and opened automatically
6.  **Save/Load experiments:**
    *   Use "Save CSV" to export your experiment design
    *   Use "Load CSV" to import previously saved experiments

## Dependencies

*   **Python 3:** The core application is written in Python.
*   **Tkinter:** This is a standard library included with most Python installations, used for the GUI. No external installation is required.


## Detailed Stimulus Syntax Reference

PEG supports multiple stimulus formats and parameters.

### 1. Text Stimuli
- Plain text is displayed directly in the stimulus area.
- Example: `Press Y for Yes or N for No`

### 2. Image Stimuli
- Syntax: `[image:filename.ext(options)]`
- `filename.ext` should match an image uploaded via the **Upload Images** button. Files are stored in `./images/`.
- Supported formats: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`.
- Options (comma-separated, optional):
  - `width=<pixels>` – Set width in pixels.
  - `height=<pixels>` – Set height in pixels.
  - Position flags: `center`, `top`, `bottom`, `left`, `right`
  - Diagonal positioning: `top-left`, `top-right`, `bottom-left`, `bottom-right`
- Examples:
  - `[image:face01.jpg]` (display as-is, centered)
  - `[image:arrow.png(width=200,height=100)]`
  - `[image:logo.svg(top-left,width=150)]`

### 3. Mixed Text + Image
- You can mix text and image references in the same Stimulus field
- Example: `Look here [image:arrow.png(width=120)] then press space`

### 4. Response Types

#### Keyboard Responses
- Use key names: `space`, `ctrl`, `alt`, `lshift`, `rshift`, or any letter/number
- Multiple responses: `y,n,space` or `1,2,3,4,5`

#### Text Entry Responses
- Use `[text]` marker in the Response field to enable free-text input
- Optional parameters: `[text(placeholder="Your answer",maxlength=50,width=300)]`

### 5. Block Repeats
- Enter a number in the "Block Repeats" column for the **first row** of each block
- Empty cells default to 1 repetition
- Example:
  ```
  Block | Block Repeats | Stimulus
  1     | 1            | Instructions
  2     | 5            | Training trial 1  
  2     |              | Training trial 2  (inherits 5 repeats)
  3     | 20           | Test trial
  ```

### 6. Feedback System
- Use feedback markers in "Feedback Text" column:
  - `[correct] Great job!` - Shows only for correct responses
  - `[incorrect] Try again` - Shows only for incorrect responses  
  - `[all] Response recorded` - Shows for any response
- Set "Feedback Duration" in milliseconds

### 7. Colors
- **Stimulus Color**: Color of the text/stimulus (white, #FF0000, rgb(255,0,0))
- **Background Color**: Screen background color (darkgrey, black, #333333)

## Example Experiment Designs

### Simple Reaction Time Task
```
Block | Block Repeats | Stimulus | Response | Latency
1     | 1            | Press space when you see the + | space | NA
2     | 10           | + | space | NA
3     | 1            | Thank you! | NA | 2000
```

### Training + Testing Paradigm
```
Block | Block Repeats | Stimulus | Response | Latency | Feedback Text
1     | 1            | Training Phase: Press Y or N | space | NA |
2     | 5            | [image:stimulus1.jpg] | y,n | NA | [correct] Correct!
3     | 1            | Training complete. Testing begins. | space | NA |
4     | 20           | [image:stimulus2.jpg] | y,n | NA |
5     | 1            | Experiment complete! | NA | 3000 |
```

### Notes:
- All images are **preloaded** before the experiment starts to avoid display delays.
- If a referenced image is missing from `./images/`, the experiment will not start — an error will list missing files.


## Quick Start Guide
1. Run `python peg_main.py`
2. Click **Add Trial Row** and fill in the columns:
   - **Block**: 1, 2, 3... (group related trials)
   - **Block Repeats**: How many times this block runs (see below for additional notes on block randomization)
   - **Stimulus**: Text or `[image:filename.jpg]` 
   - **Response**: `y,n,space` or `[text]`
   - **Latency**: milliseconds or `NA`
3. (Optional) Click **Upload Images** to add files to `./images/`
4. Choose **Randomize Blocks** and **Repeat Sequence** settings
5. Click **Start Experiment**
6. Use **Save CSV** / **Load CSV** to manage experiment designs

## Block Repeats and Randomization:

PEG uses a sophisticated block numbering system that provides precise control over which blocks stay fixed and which get randomized. This system allows you to create complex experimental designs with multiple independent randomization groups.

### Block Number Ranges:

- **Blocks 1-99**: Fixed sequence blocks (instructions, transitions, endings)
- **Blocks 100-199**: Randomization Group 1
- **Blocks 200-299**: Randomization Group 2  
- **Blocks 300-399**: Randomization Group 3
- **Blocks 400-499**: Randomization Group 4
- *And so on...*

### How It Works:

1. **Fixed blocks (1-99)** always maintain their numerical order
2. **Randomizable blocks** are grouped by hundreds and randomized within their group
3. **Each hundred-group randomizes independently** from other groups
4. **Block positions are preserved** - randomization happens within the sequence structure

### Example 1: Simple Stroop Task with Randomization

```
Block | Block Repeats | Stimulus | Response | Latency
1     | 1            | Instructions: Identify ink color | space | NA
101   | 2            | red | r,g,b,y | NA
102   | 2            | green | r,g,b,y | NA  
103   | 2            | blue | r,g,b,y | NA
2     | 1            | Thank you! | NA | 2000
```

**Result**: Instructions → [101,102,103 randomized, each appearing twice] → Thank you
- Participant A might get: Instructions → red,red,blue,blue,green,green → Thank you
- Participant B might get: Instructions → green,green,red,red,blue,blue → Thank you

### Example 2: Training + Testing with Independent Randomization

```
Block | Block Repeats | Stimulus | Response | Latency
1     | 1            | Training Phase Instructions | space | NA
101   | 3            | Training Trial A | y,n | NA
102   | 3            | Training Trial B | y,n | NA
2     | 1            | Testing Phase Instructions | space | NA  
201   | 10           | Test Trial C | y,n | NA
202   | 10           | Test Trial D | y,n | NA
203   | 10           | Test Trial E | y,n | NA
3     | 1            | Experiment Complete! | NA | 3000
```

**Result**: 
- Training instructions → [101,102 randomized, each 3 times] → Testing instructions → [201,202,203 randomized, each 10 times] → End
- Training and testing trials randomize **independently** from each other
- Instructions and endings stay in fixed positions

### Example 3: Complex Multi-Phase Design

```
Block | Block Repeats | Stimulus | Response | Latency
1     | 1            | Welcome to the experiment | space | NA
101   | 2            | Practice Trial Type A | space | NA  
102   | 2            | Practice Trial Type B | space | NA
2     | 1            | Practice complete. Ready for Phase 1? | space | NA
201   | 5            | Phase 1 Trial X | y,n | NA
202   | 5            | Phase 1 Trial Y | y,n | NA
3     | 1            | Phase 1 complete. Ready for Phase 2? | space | NA
301   | 8            | Phase 2 Trial P | 1,2,3 | NA
302   | 8            | Phase 2 Trial Q | 1,2,3 | NA  
303   | 8            | Phase 2 Trial R | 1,2,3 | NA
4     | 1            | All phases complete. Thank you! | NA | 3000
```

**Result**: Creates three independent randomization groups:
- **Group 1** (100s): Practice trials randomize among themselves
- **Group 2** (200s): Phase 1 trials randomize among themselves  
- **Group 3** (300s): Phase 2 trials randomize among themselves
- **Fixed blocks** (1,2,3,4): Instructions and transitions stay in exact order

### Key Benefits:

✅ **Separated Randomization**: Different phases don't interfere with each other  
✅ **Fixed Structure**: Instructions and transitions never move  
✅ **Flexible Design**: Can have as many randomization groups as needed  
✅ **Intuitive Numbering**: Easy to organize and understand  
✅ **Experimental Validity**: Proper randomization without structural confusion

### Usage Tips:

- Use **blocks 1-99** for any content that must appear in a specific order
- Start each new randomization group with a new hundred (100s, 200s, 300s)
- Use **Block Repeats** on the first row of each block to control repetitions
- Check **"Randomize Blocks (100+)"** to enable randomization of experimental trials
- Use **"Repeat Sequence"** to run the entire experiment multiple times


## Troubleshooting
- **Missing Images**: Upload images via the button and ensure filenames match exactly
- **CSV Loading**: For old CSV files, Block Repeats column will be added automatically
- **Block Repeats**: Only fill this for the first row of each block - subsequent rows inherit the value
- **Response Timing**: Use "NA" for latency OR response, not both
- **Feedback**: Requires "Correct Response" column to be filled for [correct]/[incorrect] markers
