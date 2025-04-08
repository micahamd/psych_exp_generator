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
  - Stimulus offset: Controls how long the stimulus remains visible (0 = until response)
  - Trial count: Set the number of trials (between 1 and 999)
  - Stimuli - Text: Comma-separated list of text stimuli to display during trials
     * Support for stimulus sequences using square brackets notation
  - Randomize stimulus sequence: Option to present stimuli in random or sequential order
  - Response key: Customize the key used to progress through trials (defaults to SPACEBAR)
- Fixed-size experiment display (800x600 pixels) centered on a black background
- Stimulus presentation: Fixation → Text Stimulus → Response → Inter-trial interval
- Helper text explanations for all parameters
- Large text stimuli (42px) for better visibility

## How to Use

1. Open `index.html` in a web browser
2. Configure your experiment parameters:
   - **Trial interval**: Set the duration (in milliseconds) of the blank screen between trials
   - **Trial background**: Choose the background color for the experiment screen
   - **Fixation**: Choose whether to display a fixation cross in the center of the screen
   - **Fixation interval**: Set how long (in milliseconds) the fixation cross appears
   - **Stimulus offset**: Set how long (in milliseconds) stimuli remain visible (0 = until response)
   - **Trial count**: Set how many trials the experiment should run
   - **Stimuli - Text**: Enter a comma-separated list of text stimuli to be presented
     * For stimulus sequences, use square brackets: `[apple, corn], speed, [bull, mind, rap]`
   - **Randomize stimulus sequence**: Check to randomize the order of stimuli or uncheck for sequential presentation
   - **Response key**: Set which key advances to the next trial (leave blank for SPACEBAR)
3. Click the "BEGIN" button to start the experiment
4. During the experiment:
   - The fixation point appears (if enabled) for the specified fixation interval
   - A stimulus from the list appears (using randomized or sequential selection)
   - If stimulus offset is greater than 0, the stimulus will disappear after that duration
     * For stimulus sequences with offset > 0, each item in the sequence appears for the specified duration
     * For stimulus sequences with offset = 0, each item requires a response to advance
   - The participant presses the designated response key (even if stimulus disappeared)
   - There's a blank interval between trials with the duration specified
   - After all trials are complete, a "Task complete!" message will appear
5. Click "OK" on the completion screen to return to the parameter configuration screen

## Stimulus Sequences

The experiment supports two types of stimulus presentations:

1. **Individual stimuli**: Each item in the comma-separated list is treated as a separate trial stimulus
   - Example: `apple, corn, speed` - Each word is presented in a separate trial

2. **Stimulus sequences**: Items enclosed in square brackets are treated as a sequence within a single trial
   - Example: `[apple, corn], speed, [bull, mind, rap]` - This creates three trials:
     * Trial 1: "apple" followed by "corn"
     * Trial 2: "speed" alone
     * Trial 3: "bull" followed by "mind" followed by "rap"

How sequences behave depends on the stimulus offset setting:

* **When stimulus offset = 0 (default)**:
  - Each item in a sequence requires a response to advance to the next item
  - Example: For `[apple, corn]`, "apple" appears and remains until response, then "corn" appears and remains until response, completing the trial

* **When stimulus offset > 0**:
  - Each item in a sequence automatically advances after the specified duration
  - Example: For `[apple, corn]` with offset = 100ms, "apple" appears for 100ms, then "corn" appears for 100ms, then the trial ends

## Experiment Flow

1. **Setup Phase**: User configures experiment parameters
2. **Experiment Phase**:
   - Trial starts with fixation point for the fixation interval (if enabled)
   - A text stimulus appears (cycling through the list)
   - If stimulus offset > 0, stimulus disappears after specified milliseconds
   - User presses response key (required to advance even if stimulus is no longer visible)
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

## Troubleshooting

If you encounter issues with screens not displaying properly:
- Make sure all three files (HTML, CSS, JS) are in the same directory
- Check that the CSS class "hidden" is properly toggled on the different screens
- Ensure the browser supports all the JavaScript features used

## Future Development Ideas

- Add support for visual stimuli presentation (images, shapes)
- Implement data collection and export functionality
- Add more trial types and experimental paradigms
- Include more customization options for experiment appearance
- Add timing precision improvements

## Technical Implementation

The experiment is built using standard web technologies:
- HTML5 for structure
- CSS3 for styling
- JavaScript for logic and interactivity

No external libraries or frameworks are used, making it easy to run in any modern browser without additional dependencies.
