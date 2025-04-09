# Psychology Experiment Builder

A simple web-based tool for building and running psychology experiments with customizable parameters.

## Project Structure

The project consists of three main files:

- `index.html`: The main HTML file that contains the user interface for the experiment builder
- `style.css`: Contains all styling for the application
- `script.js`: Contains the JavaScript code that handles the experiment logic

## Features

- Customizable trial parameters:
  - Trial interval: The duration of the inter-trial interval in milliseconds
  - Trial background color: Choose between white, black, or grey
  - Fixation point: Option to show or hide a central fixation cross
  - Fixation interval: The duration (in milliseconds) that the fixation appears
  - Fixation color: Color of the fixation cross (white, grey, or black)
  - Fixation and Stimulus Location: Control the position of stimuli and fixation relative to screen center
  - Stimulus offset: Controls how long the stimulus remains visible (0 = until response)
  - Trial count: Set the number of trials (between 1 and 999)
  - Stimuli - Text: Comma-separated list of text stimuli to display during trials
     * Support for stimulus sequences using square brackets notation
  - Stimulus Text Size: Font size of stimuli (12px to 120px)
  - Stimulus Text Color: Color of the stimulus text (white, black, or grey)
  - Randomize stimulus sequence: Option to present stimuli in random or sequential order
  - Response key: Customize the key used to progress through trials (defaults to SPACEBAR)
  - Custom Stimulus-Response Mappings: Assign different response keys to specific stimuli
  - Response feedback: Option to provide visual feedback after responses specific stimuli
    * Customizable feedback text for correct and incorrect responses
    * Configurable feedback duration correct and incorrect responses
    * Visual indication with green (correct) and red (incorrect) colors
  - Data collection: Option to save experiment data in JSON format
    * Records trial information, responses, accuracy, and timing
    * Automatic download when experiment completes
- Fixed-size experiment display (800x600 pixels) centered on a black background
- Stimulus presentation: Fixation → Text Stimulus → Response → Inter-trial interval
- Helper text explanations for all parameters
- Fully customizable text appearance
- Large text stimuli (42px) for better visibility

## How to Use

1. Open `index.html` in a web browser
2. Configure your experiment parameters:
   - **Trial interval**: Set the duration (in milliseconds) of the blank screen between trials
   - **Trial background**: Choose the background color for the experiment screen
   - **Fixation**: Choose whether to display a fixation cross in the center of the screen
   - **Fixation interval**: Set how long (in milliseconds) the fixation cross appears
   - **Fixation color**: Select the color of the fixation cross (white, grey, or black)
   - **Fixation and Stimulus Location**: Position stimuli and fixation relative to center (X,Y coordinates in pixels)
      * [0,0] represents the screen center
      * Negative X values move left, positive X values move right
      * Negative Y values move up, positive Y values move down
   - **Stimulus offset**: Set how long (in milliseconds) stimuli remain visible (0 = until response)
   - **Trial count**: Set how many trials the experiment should run
   - **Stimuli - Text**: Enter a comma-separated list of text stimuli to be presented
     * For stimulus sequences, use square brackets: `[apple, corn], speed, [bull, mind, rap]`
   - **Stimulus Text Size**: Select the font size for your stimuli
   - **Stimulus Text Color**: Choose the color of the stimulus text
   - **Randomize stimulus sequence**: Check to randomize the order of stimuli or uncheck for sequential presentation
   - **Response key**: Set the default key that advances to the next trial (leave blank for SPACEBAR)
   - **Custom S-R Mappings**: Click to set specific response keys for individual stimuli
   - **Provide Feedback**: Check to enable response feedback
   - **Feedback Text**: Enter text for correct and incorrect responses, separated by comma
   - **Feedback Duration**: Set how long (in milliseconds) feedback appears on screen
   - **Save Data**: Check to enable data collection and download results at the end of the experiment
3. Click the "BEGIN" button to start the experiment
4. During the experiment:
   - The fixation point appears (if enabled) for the specified fixation interval
   - A stimulus from the list appears (using randomized or sequential selection)
   - If stimulus offset is greater than 0, the stimulus will disappear after that duration
     * For stimulus sequences with offset > 0, each item in the sequence appears for the specified duration
     * For stimulus sequences with offset = 0, each item requires a response to advance
   - The participant presses the designated response key (even if stimulus disappeared)
   - If feedback is enabled, the feedback text appears for the specified duration
   - There's a blank interval between trials with the duration specified
   - After all trials are complete, a "Task complete!" message will appear
5. Click "OK" on the completion screen to return to the parameter configuration screen

## Stimulus Presentations

The experiment supports three types of stimulus presentations:

1. **Individual stimuli**: Each item in the comma-separated list is treated as a separate trial stimulus
   - Example: `apple, corn, speed` - Each word is presented in a separate trial

2. **Stimulus sequences**: Items enclosed in square brackets are treated as a sequence within a single trial
   - Example: `[apple, corn], speed` - This creates two trials:
     * Trial 1: "apple" followed by "corn"
     * Trial 2: "speed" alone

3. **Concurrent stimuli**: Items enclosed in curved brackets appear simultaneously on screen
   - Example: `(apple, corn), speed` - This creates two trials:
     * Trial 1: "apple" and "corn" displayed simultaneously
     * Trial 2: "speed" alone

How sequences behave depends on the stimulus offset setting:

* **When stimulus offset = 0 (default)**:
  - Each item in a sequence requires a response to advance to the next item
  - Example: For `[apple, corn]`, "apple" appears and remains until response, then "corn" appears and remains until response, completing the trial
  - For concurrent stimuli, all items remain visible until response

* **When stimulus offset > 0**:
  - Each item in a sequence automatically advances after the specified duration
  - Example: For `[apple, corn]` with offset = 100ms, "apple" appears for 100ms, then "corn" appears for 100ms, then the trial ends
  - For concurrent stimuli, all items disappear after the specified duration

## Positioning Multiple Stimuli

When using concurrent stimuli presentation mode (with curved brackets), each stimulus can have its own position:

1. **Default positioning**: When multiple stimuli are displayed concurrently, they are automatically positioned:
   - Two stimuli: Placed horizontally on left and right sides
   - Three or more stimuli: Placed in a circular arrangement around the center

2. **Custom positioning**: In the S-R Mappings dialog, concurrent stimuli get individual position columns:
   - Each stimulus in the concurrent group gets its own X and Y position fields
   - Individual colors and sizes can also be set for each concurrent stimulus
   - The column headers will show "Item 1 X", "Item 1 Y", "Item 2 X", etc.

This allows for creating complex spatial arrangements of stimuli for:
- Visual search tasks
- Flanker tasks
- Change detection paradigms 
- Multiple object tracking
- And many other multi-stimulus experimental designs

## Experiment Flow

1. **Setup Phase**: User configures experiment parameters
2. **Experiment Phase**:
   - Trial starts with fixation point for the fixation interval (if enabled)
   - A text stimulus appears (cycling through the list)
   - If stimulus offset > 0, stimulus disappears after specified milliseconds
   - User presses response key (required to advance even if stimulus is no longer visible)
   - If feedback is enabled, the feedback text appears for the specified duration
   - Stimulus disappears for the trial interval (blank screen)
   - Next trial begins
   - Process repeats for the specified number of trials
3. **Completion Phase**: "Task complete!" message is displayed with an OK button
4. **Reset Phase**: Clicking OK returns to the setup phase

## Stimulus Selection

The experiment can present stimuli in two modes:

1. **Randomized** (default): Stimulus sequences are selected randomly without repeating until all have been used.
   - Example: With sequences `[apple, corn]`, `speed`, and `[bull, mind]` in 4 trials, all three sequences will be shown in random order, then one will be randomly selected again.

2. **Sequential**: Stimulus sequences are presented in the exact order they were entered.
   - Example: With sequences `[apple, corn]`, `speed`, and `[bull, mind]` in 4 trials, they would appear in that order, followed by `[apple, corn]` again.

Note: Randomization applies to the sequences themselves, not the items within a sequence. Items within a sequence always appear in the order specified.

## Custom Stimulus-Response Mappings

The experiment builder allows you to define specific properties for each stimulus or sequence:

1. Configure your stimuli in the "Stimuli - Text" field
2. Click the "Custom S-R Mappings" button to open the mapping dialog (resizable from the bottom-right corner)
3. For each stimulus or sequence, you can set:
   - The corresponding correct response key
   - Custom X position (horizontal offset from center)
   - Custom Y position (vertical offset from center)
   - Custom offset time (how long the stimulus remains visible)
   - Custom text color
   - Custom font size (in pixels)
4. Empty fields will automatically use the values set in the main form
5. Click "Save Mappings" to apply your custom mappings

When custom mappings are set:
- The specified key will be considered the correct response for that specific stimulus
- Different stimuli can have different correct responses
- Different stimuli can appear at different positions on the screen
- Different stimuli can have different display durations
- Different stimuli can have different colors and sizes
- Any custom settings override the global settings for that specific stimulus only
- If any property is not specified for a stimulus, the global setting is used for that property

Example applications:
- Create a Stroop task with color words displayed in conflicting colors
- Create a flanker task with target stimuli at center and distractors offset to the sides
- Create a stimulus-response compatibility task with varying spatial mappings
- Create an attentional blink paradigm with varying stimulus durations
- Create tasks requiring different responses to different stimuli

This flexible mapping system allows for complex experimental designs without requiring programming knowledge.

## Response Key System

The experiment offers flexible control over which keys can advance trials:

1. **Default Response Key**: The main key that advances trials (defaults to SPACEBAR):
   - This is considered the "correct" response for feedback purposes
   - Can be customized per stimulus/sequence in the S-R Mappings

2. **Additional Responses**: Alternative keys that can also advance trials
   - Always accepted as valid responses regardless of the current stimulus
   - Useful for:
     * Multi-key experiments where several keys might be valid
     * Creating more liberal response collection
     * Allowing left/right hand responses
   - When an additional response key is pressed, it advances the trial but is only considered "correct" 
     for feedback purposes if it matches the specific correct key for that stimulus

3. **Custom Response Mappings**: Stimulus-specific correct responses
   - Set in the Custom S-R Mappings dialog
   - Override the default response key for specific stimuli
   - Only the mapped key (or additional response keys) will be accepted for that stimulus

This flexible response system allows for creating complex response-mapping paradigms like stimulus-response compatibility tasks, flanker tasks, and other cognitive psychology experiments.

## State Persistence

The experiment builder remembers your settings even after the experiment completes:
- All form values persist between sessions (saved in browser's localStorage)
- Custom S-R mappings are preserved as long as the stimuli text doesn't change
- When stimuli text changes, only mappings for stimuli that no longer exist are removed
- You can run multiple experiment sessions without needing to reconfigure settings
- Browser refresh or closing the page will still preserve your last-used settings

This persistence allows for efficient iteration when developing and testing experimental protocols.

## Feedback System

When the feedback option is enabled, participants receive immediate visual feedback after their responses:
- When the correct key is pressed (as specified in the response key setting), the "correct" feedback text will appear in green
- When any other key is pressed, the "incorrect" feedback text will appear in red
- Feedback remains visible for the specified duration before advancing to the next stimulus or trial
- Default feedback values are "Correct" for correct responses and "X" for incorrect responses
- Only the correct response will advance the trial; incorrect responses just display feedback

## Position Control

The experiment allows you to control the position of both the fixation cross and stimulus:

- **X coordinate**: Controls horizontal position relative to screen center
  - Negative values move elements to the left
  - Positive values move elements to the right
  - Zero keeps them centered horizontally

- **Y coordinate**: Controls vertical position relative to screen center
  - Negative values move elements upward
  - Positive values move elements downward
  - Zero keeps them centered vertically

This feature is useful for creating offset display paradigms, peripheral attention tasks, or visual field experiments.

Note that the position settings affect both the fixation cross and stimuli. If fixation is disabled, only the stimulus position will be affected.

## Data Collection

When the "Save Data" option is enabled, the experiment collects the following data for each trial:

1. **Timestamp**: Date and time of the response (HH:MM:SS_DD:MM:YYYY format)
2. **Trial Number**: Sequential trial number (starting from 1)
3. **Stimulus**: The stimulus or sequence presented
4. **Stimulus_Offset**: The stimulus timing configuration (in milliseconds)
5. **Response**: The actual key pressed by the participant
6. **Accurate**: Whether the response was correct (1) or incorrect (0)
7. **ResponseTime_ms**: The time taken to respond (in milliseconds)

When the experiment completes, a JSON file containing this data is automatically downloaded. A download button is also provided on the completion screen for manual download if needed.

### Data Format Example:

```json
[
  {
    "Timestamp": "13:45:22_15:06:2023",
    "Trial Number": 1,
    "Stimulus": "apple",
    "Stimulus_Offset": 0,
    "Response": "SPACE",
    "Accurate": 1,
    "ResponseTime_ms": 543
  },
  {
    "Timestamp": "13:45:24_15:06:2023",
    "Trial Number": 2,
    "Stimulus": "[red, green, blue]",
    "Stimulus_Offset": 0,
    "Response": "SPACE",
    "Accurate": 1,
    "ResponseTime_ms": 782
  }
]
```

This data can be imported into statistical software or spreadsheets for further analysis.

## Technical Implementation

The experiment is built using standard web technologies:
- HTML5 for structure
- CSS3 for styling
- JavaScript for logic and interactivity

No external libraries or frameworks are used, making it easy to run in any modern browser without additional dependencies.

## Troubleshooting

If you encounter issues with screens not displaying properly:
- Make sure all three files (HTML, CSS, JS) are in the same directory
- Ensure the browser supports all the JavaScript features used
- Check that the CSS class "hidden" is properly toggled on the different screens

## Future Development Ideas

- Add timing precision improvements
- Include more customization options for experiment appearance
- Add more trial types and experimental paradigms
- Implement data collection and export functionality
- Add support for visual stimuli presentation (images, shapes)
