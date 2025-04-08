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
  - Custom Stimulus-Response Mappings: Assign different response keys to specific stimulials
  - Response feedback: Option to provide visual feedback after responses specific stimuli
    * Customizable feedback text for correct and incorrect responsesnses
    * Configurable feedback duration correct and incorrect responses
    * Visual indication with green (correct) and red (incorrect) colors
- Fixed-size experiment display (800x600 pixels) centered on a black background
- Stimulus presentation: Fixation → Text Stimulus → Response → Inter-trial interval
- Helper text explanations for all parametersulus → Response → Inter-trial interval
- Fully customizable text appearancearameters
- Large text stimuli (42px) for better visibility
- Large text stimuli (42px) for better visibility
## How to Use
## How to Use
1. Open `index.html` in a web browser
2. Configure your experiment parameters:
   - **Trial interval**: Set the duration (in milliseconds) of the blank screen between trials
   - **Trial background**: Choose the background color for the experiment screenbetween trials
   - **Fixation**: Choose whether to display a fixation cross in the center of the screen
   - **Fixation interval**: Set how long (in milliseconds) the fixation cross appearsreen
   - **Fixation color**: Select the color of the fixation cross (white, grey, or black)
   - **Fixation and Stimulus Location**: Position stimuli and fixation relative to center (X,Y coordinates in pixels)
      * [0,0] represents the screen centerosition stimuli and fixation relative to center (X,Y coordinates in pixels)
      * Negative X values move left, positive X values move right
      * Negative Y values move up, positive Y values move downght
   - **Stimulus offset**: Set how long (in milliseconds) stimuli remain visible (0 = until response)
   - **Trial count**: Set how many trials the experiment should runmain visible (0 = until response)
   - **Stimuli - Text**: Enter a comma-separated list of text stimuli to be presented
     * For stimulus sequences, use square brackets: `[apple, corn], speed, [bull, mind, rap]`
   - **Stimulus Text Size**: Select the font size for your stimuli, speed, [bull, mind, rap]`
   - **Stimulus Text Color**: Choose the color of the stimulus text
   - **Randomize stimulus sequence**: Check to randomize the order of stimuli or uncheck for sequential presentation
   - **Response key**: Set the default key that advances to the next trial (leave blank for SPACEBAR)al presentation
   - **Custom S-R Mappings**: Click to set specific response keys for individual stimulifor SPACEBAR)
   - **Provide Feedback**: Check to enable response feedback of keys that can also advance trials
   - **Feedback Text**: Enter text for correct and incorrect responses, separated by comma
   - **Feedback Duration**: Set how long (in milliseconds) feedback appears on screen
3. Click the "BEGIN" button to start the experimentincorrect responses, separated by comma
4. During the experiment:*: Set how long (in milliseconds) feedback appears on screen
   - The fixation point appears (if enabled) for the specified fixation interval
   - A stimulus from the list appears (using randomized or sequential selection)
   - If stimulus offset is greater than 0, the stimulus will disappear after that duration
     * For stimulus sequences with offset > 0, each item in the sequence appears for the specified duration
     * For stimulus sequences with offset = 0, each item requires a response to advanceion
   - The participant presses the designated response key (even if stimulus disappeared)e specified duration
   - If feedback is enabled, the feedback text appears for the specified durationdvance
   - There's a blank interval between trials with the duration specifiedus disappeared)
   - After all trials are complete, a "Task complete!" message will appearuration
5. Click "OK" on the completion screen to return to the parameter configuration screen
   - After all trials are complete, a "Task complete!" message will appear
## Stimulus Sequencescompletion screen to return to the parameter configuration screen

The experiment supports two types of stimulus presentations:

1. **Individual stimuli**: Each item in the comma-separated list is treated as a separate trial stimulus
   - Example: `apple, corn, speed` - Each word is presented in a separate trial
1. **Individual stimuli**: Each item in the comma-separated list is treated as a separate trial stimulus
2. **Stimulus sequences**: Items enclosed in square brackets are treated as a sequence within a single trial
   - Example: `[apple, corn], speed, [bull, mind, rap]` - This creates three trials:
     * Trial 1: "apple" followed by "corn"in square brackets are treated as a sequence within a single trial
     * Trial 2: "speed" alone speed, [bull, mind, rap]` - This creates three trials:
     * Trial 3: "bull" followed by "mind" followed by "rap"
     * Trial 2: "speed" alone
How sequences behave depends on the stimulus offset setting:

* **When stimulus offset = 0 (default)**:lus offset setting:
  - Each item in a sequence requires a response to advance to the next item
  - Example: For `[apple, corn]`, "apple" appears and remains until response, then "corn" appears and remains until response, completing the trial
  - Each item in a sequence requires a response to advance to the next item
* **When stimulus offset > 0**:`, "apple" appears and remains until response, then "corn" appears and remains until response, completing the trial
  - Each item in a sequence automatically advances after the specified duration
  - Example: For `[apple, corn]` with offset = 100ms, "apple" appears for 100ms, then "corn" appears for 100ms, then the trial ends
  - Each item in a sequence automatically advances after the specified duration
## Experiment Flow[apple, corn]` with offset = 100ms, "apple" appears for 100ms, then "corn" appears for 100ms, then the trial ends

1. **Setup Phase**: User configures experiment parameters
2. **Experiment Phase**:
   - Trial starts with fixation point for the fixation interval (if enabled)
   - A text stimulus appears (cycling through the list)
   - If stimulus offset > 0, stimulus disappears after specified milliseconds
   - User presses response key (required to advance even if stimulus is no longer visible)
   - If feedback is enabled, the feedback text appears for the specified duration
   - Stimulus disappears for the trial interval (blank screen)imulus is no longer visible)
   - Next trial beginsabled, the feedback text appears for the specified duration
   - Process repeats for the specified number of trialsscreen)
3. **Completion Phase**: "Task complete!" message is displayed with an OK button
4. **Reset Phase**: Clicking OK returns to the setup phase
3. **Completion Phase**: "Task complete!" message is displayed with an OK button
## Stimulus Selectionlicking OK returns to the setup phase

The experiment can present stimuli in two modes:

1. **Randomized** (default): Stimulus sequences are selected randomly without repeating until all have been used.
   - Example: With sequences `[apple, corn]`, `speed`, and `[bull, mind]` in 4 trials, all three sequences will be shown in random order, then one will be randomly selected again.
1. **Randomized** (default): Stimulus sequences are selected randomly without repeating until all have been used.
2. **Sequential**: Stimulus sequences are presented in the exact order they were entered.l three sequences will be shown in random order, then one will be randomly selected again.
   - Example: With sequences `[apple, corn]`, `speed`, and `[bull, mind]` in 4 trials, they would appear in that order, followed by `[apple, corn]` again.
2. **Sequential**: Stimulus sequences are presented in the exact order they were entered.
Note: Randomization applies to the sequences themselves, not the items within a sequence. Items within a sequence always appear in the order specified.in.

## Custom Stimulus-Response Mappingsequences themselves, not the items within a sequence. Items within a sequence always appear in the order specified.

The experiment builder allows you to define specific properties for each stimulus or sequence:

1. Configure your stimuli in the "Stimuli - Text" fieldoperties for each stimulus or sequence:
2. Click the "Custom S-R Mappings" button to open the mapping dialog (resizable from the bottom-right corner)
3. For each stimulus or sequence, you can set:xt" field
   - The corresponding correct response keyo open the mapping dialog (resizable from the bottom-right corner)
   - Custom X position (horizontal offset from center)
   - Custom Y position (vertical offset from center)
   - Custom offset time (how long the stimulus remains visible)
   - Custom text color (vertical offset from center)
   - Custom font size (in pixels) the stimulus remains visible)
4. Empty fields will automatically use the values set in the main form
5. Click "Save Mappings" to apply your custom mappings
4. Empty fields will automatically use the values set in the main form
When custom mappings are set:pply your custom mappings
- The specified key will be considered the correct response for that specific stimulus
- Different stimuli can have different correct responses
- Different stimuli can appear at different positions on the screent specific stimulus
- Different stimuli can have different display durations
- Different stimuli can have different colors and sizesn the screen
- Any custom settings override the global settings for that specific stimulus only
- If any property is not specified for a stimulus, the global setting is used for that property
- Any custom settings override the global settings for that specific stimulus only
Example applications:not specified for a stimulus, the global setting is used for that property
- Create a Stroop task with color words displayed in conflicting colors
- Create a flanker task with target stimuli at center and distractors offset to the sides
- Create a stimulus-response compatibility task with varying spatial mappings
- Create an attentional blink paradigm with varying stimulus durationsoffset to the sides
- Create tasks requiring different responses to different stimuliial mappings
- Create an attentional blink paradigm with varying stimulus durations
This flexible mapping system allows for complex experimental designs without requiring programming knowledge.

## Response Key Systemg system allows for complex experimental designs without requiring programming knowledge.

The experiment offers flexible control over which keys can advance trials:

1. **Default Response Key**: The main key that advances trials (defaults to SPACEBAR)pletes:
   - This is considered the "correct" response for feedback purposes
   - Can be customized per stimulus/sequence in the S-R Mappings

2. **Additional Responses**: Alternative keys that can also advance trialsemoved
   - Always accepted as valid responses regardless of the current stimulus- You can run multiple experiment sessions without needing to reconfigure settings
   - Useful for:
     * Multi-key experiments where several keys might be valid
     * Creating more liberal response collectionllows for efficient iteration when developing and testing experimental protocols.
     * Allowing left/right hand responses
   - When an additional response key is pressed, it advances the trial but is only considered "correct" 
     for feedback purposes if it matches the specific correct key for that stimulus

3. **Custom Response Mappings**: Stimulus-specific correct responses
   - Set in the Custom S-R Mappings dialog text will appear in green
   - Override the default response key for specific stimuli
   - Only the mapped key (or additional response keys) will be accepted for that stimulusr trial
- Default feedback values are "Correct" for correct responses and "X" for incorrect responses
This flexible response system allows for creating complex response-mapping paradigms like response will advance the trial; incorrect responses just display feedback
stimulus-response compatibility tasks, flanker tasks, and other cognitive psychology experiments.

## State Persistence
ss and stimulus:
The experiment builder remembers your settings even after the experiment completes:
on relative to screen center
- All form values persist between sessions (saved in browser's localStorage)left
- Custom S-R mappings are preserved as long as the stimuli text doesn't change  - Positive values move elements to the right
- When stimuli text changes, only mappings for stimuli that no longer exist are removed
- You can run multiple experiment sessions without needing to reconfigure settings
- Browser refresh or closing the page will still preserve your last-used settingstion relative to screen center
d
This persistence allows for efficient iteration when developing and testing experimental protocols.  - Positive values move elements downward

## Feedback System

When the feedback option is enabled, participants receive immediate visual feedback after their responses:
tion settings affect both the fixation cross and stimuli. If fixation is disabled, only the stimulus position will be affected.
- When the correct key is pressed (as specified in the response key setting), the "correct" feedback text will appear in green
- When any other key is pressed, the "incorrect" feedback text will appear in red
- Feedback remains visible for the specified duration before advancing to the next stimulus or trial
- Default feedback values are "Correct" for correct responses and "X" for incorrect responses
- Only the correct response will advance the trial; incorrect responses just display feedbackrectory
- Check that the CSS class "hidden" is properly toggled on the different screens
## Position Controlts all the JavaScript features used

The experiment allows you to control the position of both the fixation cross and stimulus:

- **X coordinate**: Controls horizontal position relative to screen centerages, shapes)
  - Negative values move elements to the left
  - Positive values move elements to the rightntal paradigms
  - Zero keeps them centered horizontally- Include more customization options for experiment appearance
ovements
- **Y coordinate**: Controls vertical position relative to screen center
  - Negative values move elements upward
  - Positive values move elements downward
  - Zero keeps them centered verticallybuilt using standard web technologies:

This feature is useful for creating offset display paradigms, peripheral attention tasks, or visual field experiments.- CSS3 for styling

Note that the position settings affect both the fixation cross and stimuli. If fixation is disabled, only the stimulus position will be affected.

























No external libraries or frameworks are used, making it easy to run in any modern browser without additional dependencies.- JavaScript for logic and interactivity- CSS3 for styling- HTML5 for structureThe experiment is built using standard web technologies:## Technical Implementation- Add timing precision improvements- Include more customization options for experiment appearance- Add more trial types and experimental paradigms- Implement data collection and export functionality- Add support for visual stimuli presentation (images, shapes)## Future Development Ideas- Ensure the browser supports all the JavaScript features used- Check that the CSS class "hidden" is properly toggled on the different screens- Make sure all three files (HTML, CSS, JS) are in the same directoryIf you encounter issues with screens not displaying properly:## TroubleshootingNo external libraries or frameworks are used, making it easy to run in any modern browser without additional dependencies.
