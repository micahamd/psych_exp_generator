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
  - Trial count: Set the number of trials (between 1 and 999)
  - Stimuli - Text: Comma-separated list of text stimuli to display during trials
  - Response key: Customize the key used to progress through trials (defaults to SPACEBAR)
- Fixed-size experiment display (800x600 pixels) centered on a black background
- Stimulus presentation: Fixation → Text Stimulus → Response → Inter-trial interval

## How to Use

1. Open `index.html` in a web browser
2. Configure your experiment parameters:
   - **Trial interval**: Set the duration (in milliseconds) of the blank screen between trials
   - **Trial background**: Choose the background color for the experiment screen
   - **Fixation**: Choose whether to display a fixation cross in the center of the screen
   - **Fixation interval**: Set how long (in milliseconds) the fixation cross appears
   - **Trial count**: Set how many trials the experiment should run
   - **Stimuli - Text**: Enter a comma-separated list of text stimuli to be presented
   - **Response key**: Set which key advances to the next trial (leave blank for SPACEBAR)
3. Click the "BEGIN" button to start the experiment
4. During the experiment:
   - The fixation point appears (if enabled) for the specified fixation interval
   - A stimulus from the list appears (cycling through all stimuli before repeating)
   - The participant presses the designated response key
   - There's a blank interval between trials with the duration specified
   - After all trials are complete, a "Task complete!" message will appear
5. Click "OK" on the completion screen to return to the parameter configuration screen

## Experiment Flow

1. **Setup Phase**: User configures experiment parameters
2. **Experiment Phase**:
   - Trial starts with fixation point for the fixation interval (if enabled)
   - A text stimulus appears (cycling through the list)
   - User presses response key
   - Stimulus disappears for the trial interval (blank screen)
   - Next trial begins
   - Process repeats for the specified number of trials
3. **Completion Phase**: "Task complete!" message is displayed with an OK button
4. **Reset Phase**: Clicking OK returns to the setup phase

## Stimulus Selection

The experiment cycles through the provided stimuli in order, without repeating until all stimuli have been used. If there are more trials than stimuli, the cycle will restart. For example:

- With 3 stimuli and 4 trials, the presentation would be: stimulus1, stimulus2, stimulus3, stimulus1
- With 5 stimuli and 3 trials, the presentation would be: stimulus1, stimulus2, stimulus3

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
