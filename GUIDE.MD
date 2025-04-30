# Psychology Experiment Builder Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Creating an Experiment](#creating-an-experiment)
4. [Stimulus Configuration](#stimulus-configuration)
5. [Response Mapping](#response-mapping)
6. [Running Experiments](#running-experiments)
7. [Survey Creation](#survey-creation)
8. [Study Management](#study-management)
9. [Data Collection and Export](#data-collection-and-export)
10. [Technical Reference](#technical-reference)
11. [Variable System](#variable-system)
12. [Deployment Options](#deployment-options)
13. [Troubleshooting](#troubleshooting)

## Introduction

The Psychology Experiment Builder is a web-based tool designed for creating and running psychological experiments. It allows researchers to design experiments with precise control over stimuli presentation, timing, and response collection. The application supports various experiment types including reaction time tasks, surveys, and multi-block studies.

## Getting Started

The application interface consists of several main sections:
- **Experiment Configuration Panel**: Where you set up your experiment parameters
- **Stimulus Input Area**: Where you define the stimuli to be presented
- **Study Management**: For creating multi-block experiments
- **Experiment Preview**: For testing and running your experiment

## Creating an Experiment

### Basic Experiment Setup

1. **Experiment Type**: Choose between "Reaction Time" or "Survey" from the dropdown menu.
   - **Reaction Time**: For experiments measuring response times to stimuli
   - **Survey**: For questionnaires with various response formats

2. **Experiment Name**: Enter a descriptive name for your experiment.
   - This name will appear in data files and on the experiment screen
   - Example: "Stroop Task" or "Visual Search Experiment"

3. **Instructions**: Provide clear instructions for participants.
   - Explain the task and response requirements
   - Include any specific information about timing or feedback
   - These instructions will be shown before the experiment begins

4. **Timing Settings**:
   - **Fixation Duration**: How long the fixation cross appears (in milliseconds)
     - Typical values: 500-1000ms
     - Purpose: Centers participant attention before stimulus presentation

   - **Stimulus Duration**: How long each stimulus is displayed
     - Can be set to 0 for unlimited display until response
     - Typical values: 100-2000ms depending on task difficulty

   - **Inter-Trial Interval (ITI)**: Time between trials
     - Typical values: 500-2000ms
     - Purpose: Prevents response carryover between trials

   - **Response Window**: Maximum time allowed for responses
     - Can be set to 0 for unlimited response time
     - Typical values: 1000-3000ms for reaction time studies

### Advanced Settings

- **Canvas Background**: The background color of the experiment screen
  - Default: White (#FFFFFF)
  - Can be set to any valid CSS color value
  - Affects the entire experiment area

- **Trial Background**: Background color during stimulus presentation
  - Default: Same as canvas background
  - Changes only during the trial presentation
  - Useful for creating visual contrast during stimulus presentation

- **Fixation Color**: Color of the fixation cross
  - Default: Black (#000000)
  - The fixation cross is displayed at the center of the screen
  - Can be customized to improve visibility against the background

- **Stimulus Color**: Default color for stimuli (can be overridden per stimulus)
  - Default: Black (#000000)
  - Applied to all stimuli unless individually overridden
  - For text stimuli, this sets the font color

- **Stimulus Size**: Default font size for text stimuli
  - Default: 48px
  - For text stimuli, this sets the font size
  - For image stimuli, this is overridden by width/height settings

- **Stimulus Offset**: Delay before stimulus presentation after fixation
  - Default: 0ms
  - Adds a blank interval between fixation and stimulus
  - Can be used to create a warning interval

- **Position (X,Y)**: Default position coordinates for stimuli
  - Default: (0,0) which is the center of the screen
  - Positive X values move right, negative move left
  - Positive Y values move down, negative move up
  - Can be overridden for individual stimuli

### Experiment Options

- **Randomize Trials**: When enabled, presents stimuli in random order
  - Default: Enabled
  - When disabled, stimuli are presented in the order listed

- **Show Feedback**: Provides visual feedback on response accuracy
  - Default: Disabled
  - When enabled, shows "Correct" or "X" after each response
  - Useful for training or learning experiments

- **Save Data**: Records participant responses and timing information
  - Default: Enabled
  - When enabled, allows downloading data at experiment completion
  - Required for collecting experimental results

- **Number of Repetitions**: How many times each stimulus is presented
  - Default: 1
  - Increases the number of trials by repeating each stimulus
  - Useful for collecting more data points per condition

## Stimulus Configuration

### Entering Stimuli

Stimuli are entered in the "Stimuli" text area, separated by commas. The application supports three types of stimuli:

1. **Single Stimuli**: Simple text or image filenames
   ```
   A, B, C, image.jpg
   ```

2. **Sequential Stimuli**: Multiple stimuli presented in sequence, enclosed in square brackets
   ```
   [A, B], [C, D], [image1.jpg, image2.jpg]
   ```

3. **Concurrent Stimuli**: Multiple stimuli presented simultaneously, enclosed in parentheses
   ```
   (A, B), (C, D), (image1.jpg, image2.jpg)
   ```

### Using Variables

The application supports variable categories for stimuli:
1. Define variables by clicking the "Define Variables" button
2. Create categories (e.g., 'X', 'Y') and assign values to each
3. Use variable names in your stimulus sequences
   ```
   'X', 'Y', ['X', 'Y']
   ```

## Response Mapping

Response mapping allows you to define which keys correspond to which stimuli and customize stimulus properties.

1. Click the "S-R Mapping" button to open the mapping dialog
2. For each stimulus, you can set:
   - **Response Key**: The key participants should press (e.g., "f", "j", "Space")
   - **Position**: X and Y coordinates for stimulus placement
   - **Offset**: Timing offset for this specific stimulus
   - **Color**: Custom color for this stimulus
   - **Size**: Custom size for this stimulus (for text) or dimensions (for images)

For concurrent stimuli, you can set individual properties for each element.

### Importing/Exporting Mappings

- **Export Mappings**: Save your stimulus-response mappings as a CSV file
- **Import Mappings**: Load previously saved mappings from a CSV file

## Running Experiments

1. **Test Mode**: Click "Test" to preview your experiment
2. **Begin Study**: Start the full experiment for a participant
3. **Save Data**: Enable to collect and save participant responses

During the experiment:
- Stimuli will be presented according to your configuration
- Responses and reaction times will be recorded
- Feedback can be provided based on accuracy

## Survey Creation

The Psychology Experiment Builder includes a comprehensive survey creation tool that allows you to create questionnaires with various response formats.

### Creating a Survey

1. Select "Survey" as the experiment type from the dropdown menu
2. Configure basic settings:
   - **Survey Name**: Enter a descriptive name for your survey
   - **Instructions**: Provide clear instructions for participants
   - **Save Data**: Enable to collect and store responses

3. Add questions by clicking the "Add Question" button
   - Each question is assigned a unique ID automatically
   - Questions are presented in the order they are created
   - You can add as many questions as needed

### Question Types

For each question, you can set:

1. **Question Text**: The question to ask
   - Enter the full text of your question
   - Can include formatting like asterisks for emphasis
   - Example: "How satisfied are you with the experiment?"

2. **Answer Type**: Choose from four response formats:

   a. **Text**: Single-line text input
      - Best for short answers or names
      - Example use: "What is your participant ID?"

   b. **Textarea**: Multi-line text input
      - Best for longer, open-ended responses
      - Example use: "Please describe your experience during the experiment."

   c. **Radio**: Multiple-choice options with radio buttons
      - Best for selecting one option from a list
      - Requires defining option choices (see below)
      - Example use: "Which condition did you find most difficult?"

   d. **Slider**: Numerical scale with adjustable slider
      - Best for rating scales or continuous measures
      - Customizable range and labels (see below)
      - Example use: "Rate your level of fatigue from 1-7."

### Configuring Response Options

#### For Radio Button Questions:
1. Enter each option in the "Options" field, separated by commas
   - Example: "Very Easy, Easy, Moderate, Difficult, Very Difficult"
2. Each option will be presented as a separate radio button
3. Participants can select only one option

#### For Slider Questions:
1. **Min Value**: Set the minimum value (default: 1)
   - Example: 1 for a 1-7 scale
2. **Max Value**: Set the maximum value (default: 9)
   - Example: 7 for a 1-7 scale
3. **Left Label**: Text label for the minimum value
   - Example: "Not at all" or "Strongly Disagree"
4. **Right Label**: Text label for the maximum value
   - Example: "Extremely" or "Strongly Agree"

### Survey Presentation

When the survey is run:
1. All questions are presented on a single screen
2. Questions appear in the order they were created
3. Required fields are marked (if enabled)
4. A "Submit Survey" button appears at the bottom
5. Responses can be submitted by clicking the button or pressing Enter

### Survey Data Collection

When "Save Data" is enabled:
1. All responses are collected when the survey is submitted
2. Data is formatted as JSON with question text, answer type, and response
3. A timestamp is added to each response
4. At the end of the survey, a "Download Survey Data" button appears
5. In study mode, survey data can be downloaded separately from experimental data

### Survey Best Practices

1. **Keep questions clear and concise**
   - Avoid double-barreled questions (asking two things at once)
   - Use simple language when possible

2. **Use appropriate question types**
   - Text for short, open responses
   - Textarea for longer, detailed responses
   - Radio buttons for categorical choices
   - Sliders for continuous ratings

3. **Provide clear instructions**
   - Explain the purpose of the survey
   - Indicate if questions are required
   - Mention any time limits

4. **Test your survey**
   - Preview the survey before deploying
   - Check that all question types display correctly
   - Verify that data is saved properly

## Study Management

The Study Management feature allows you to create multi-block experiments by combining multiple experiment configurations into a single study. This is particularly useful for complex experimental designs with different conditions, practice blocks, or mixed methods (e.g., combining reaction time tasks with surveys).

### Creating a Multi-Block Study

1. Click "Study Management" to open the study panel
   - The study panel appears as a modal window
   - Any existing study blocks will be displayed

2. **Add Current Config**: Add your current experiment settings as a block
   - Configure your experiment settings as desired
   - Click "Add Current Config" to add it to the study
   - The configuration is added as a new block with a unique ID
   - You can add both reaction time and survey blocks to the same study

3. **Reorder Blocks**: Drag and drop to change the order
   - Click and hold on a block to drag it
   - Release to drop it in the new position
   - The order determines the sequence of presentation during the study

4. **Edit Blocks**: Modify block settings
   - Click on a block to load its configuration into the main interface
   - Make your changes to the configuration
   - Click "Update Block" to save changes to that block
   - The updated configuration will be reflected in the study panel

5. **Delete Blocks**: Remove unwanted blocks
   - Click the "X" button on a block to remove it
   - Confirm deletion when prompted
   - Remaining blocks will be reordered automatically

### Managing Studies

1. **Save Study**: Save your multi-block study
   - Click "Save Study" in the study management panel
   - Enter a name for your study
   - The study is saved to the browser's local storage
   - You can also export the study as a JSON file

2. **Load Study**: Load a previously saved study
   - Click "Load Study" in the study management panel
   - Select a study from the dropdown list
   - The study configurations will be loaded into the study panel
   - Any current unsaved study will be replaced

3. **Import/Export Study**: Share studies between computers
   - **Export**: Save the current study as a JSON file
   - **Import**: Load a study from a JSON file
   - This allows sharing studies between researchers or computers

### Running a Multi-Block Study

1. Configure all blocks in your study
2. Click "Begin Study" to start the full experiment
3. The study will:
   - Present each block in the defined order
   - Show instructions before each block
   - Collect data for each block separately
   - Show a completion screen between blocks
   - Provide a final completion screen at the end

### Study Data Collection

When running a multi-block study with "Save Data" enabled:

1. Data is collected separately for each block
2. Each data entry includes:
   - Block index and name
   - Configuration type (reaction time or survey)
   - All response data for that block

3. **Important Note**: Survey blocks in a study must be downloaded separately as they don't merge with experimental blocks in the study data download.

### Study Design Best Practices

1. **Logical Progression**: Arrange blocks in a logical order
   - Start with instructions or practice blocks
   - Group related experimental conditions
   - End with survey or debriefing blocks

2. **Consistent Parameters**: Maintain consistency where appropriate
   - Use similar timing parameters across related blocks
   - Keep response mappings consistent unless manipulation is intended
   - Use consistent instructions formatting

3. **Participant Experience**: Consider the participant's experience
   - Include breaks between intensive blocks
   - Vary task types to reduce fatigue
   - Provide clear transitions between different types of blocks

4. **Testing**: Always test the complete study flow
   - Run through the entire study to check transitions
   - Verify that data is collected correctly for each block
   - Check that block order makes sense from the participant perspective

## Data Collection and Export

The Psychology Experiment Builder provides comprehensive data collection capabilities for both reaction time experiments and surveys. Data collection is controlled by the "Save Data" option, which must be enabled to record participant responses.

### Enabling Data Collection

1. Check the "Save Data" checkbox in the experiment configuration
   - For reaction time experiments: Located in the main configuration panel
   - For surveys: Located in the survey configuration panel
   - In study mode: Can be set individually for each block

2. When enabled, the application will:
   - Record all participant responses
   - Track timing information
   - Store accuracy data (for reaction time experiments)
   - Prepare data for download at experiment completion

### Data Format and Structure

#### For Reaction Time Experiments:

Data is saved in JSON format with detailed information about each trial:

1. **Trial Information**:
   - **TrialNumber**: Sequential number of the trial
   - **Stimulus**: The stimulus presented (text or image filename)
   - **StimulusType**: Single, sequential, or concurrent
   - **ExpectedResponse**: The correct response key

2. **Response Data**:
   - **Response**: The key pressed by the participant
   - **RT**: Reaction time in milliseconds
   - **Accuracy**: Whether the response was correct (1) or incorrect (0)
   - **Timestamp**: Date and time when the response was recorded

3. **Timing Information**:
   - **FixationOnset**: When the fixation cross appeared
   - **StimulusOnset**: When the stimulus appeared
   - **ResponseTime**: When the response was made
   - **TrialEnd**: When the trial ended

4. **Configuration Data**:
   - **ExperimentName**: Name of the experiment
   - **FixationDuration**: Duration of fixation cross
   - **StimulusDuration**: Duration of stimulus presentation
   - **ITI**: Inter-trial interval
   - **ResponseWindow**: Maximum time allowed for response

#### For Surveys:

Survey data is saved in a separate format:

1. **Question Information**:
   - **QuestionNumber**: Unique ID of the question
   - **Question**: Full text of the question
   - **AnswerType**: Type of answer (text, textarea, radio, slider)

2. **Response Data**:
   - **Answer**: The participant's response
   - **Timestamp**: Date and time when the survey was submitted

3. For slider questions, additional context is included:
   - Scale range (min to max)
   - Label information for the scale endpoints

### Downloading Experiment Data

1. **At Experiment Completion**:
   - A "Download Data" button appears on the completion screen
   - Clicking this button downloads the data as a JSON file
   - The filename includes the experiment name and timestamp

2. **For Multi-Block Studies**:
   - Data from all reaction time blocks is combined in one file
   - Survey data must be downloaded separately for each survey block
   - Each block's data includes its configuration index and name

3. **File Naming Convention**:
   - Reaction time data: `experiment_data_[timestamp].json`
   - Survey data: `survey_data_[timestamp].json` or `survey_[block]_data_[timestamp].json`
   - Timestamp format: YYYY-MM-DD_HH-MM-SS

### Data Analysis Considerations

1. **JSON Format**:
   - Data is saved in JSON format, which can be imported into most analysis software
   - For R: Use the `jsonlite` package
   - For Python: Use the `json` module
   - For Excel: Convert JSON to CSV using online tools or scripts

2. **Data Structure**:
   - Each trial is a separate entry in the data array
   - All relevant information is included with each trial
   - No preprocessing is applied to the raw data

3. **Timing Precision**:
   - Timing is recorded using JavaScript's performance.now() when available
   - Precision may vary depending on the browser and system
   - For critical timing experiments, consider external validation

4. **Missing Data**:
   - Trials with no response are marked with empty response fields
   - Reaction time is set to null for missed responses
   - Accuracy is set to 0 for incorrect or missed responses

### Exporting Stimulus-Response Mappings

In addition to experiment data, you can export your stimulus-response mappings:

1. Click the "Export Mappings" button in the S-R Mapping dialog
2. A CSV file will be downloaded containing:
   - All stimuli in your experiment
   - Associated response keys
   - Custom properties (position, color, size, etc.)
3. This file can be:
   - Used as documentation for your experiment design
   - Imported into another experiment using the "Import Mappings" feature
   - Edited in spreadsheet software and re-imported

### Data Privacy Considerations

1. All data is stored locally in the participant's browser
2. No data is automatically sent to any server
3. It is the researcher's responsibility to:
   - Inform participants about data collection
   - Securely store downloaded data
   - Remove any personally identifiable information if required

## Technical Reference

### Core Components

#### HTML Structure
The application is built with a modular HTML structure that includes:
- **Configuration Forms**: Input fields and controls for experiment settings
- **Modal Dialogs**: Popup interfaces for specialized functions (mapping, variables, etc.)
- **Experiment Display Screens**: Canvas and elements for stimulus presentation
- **Study Management Interface**: Tools for creating multi-block studies
- **Data Visualization**: Results display and statistics

#### Main Screens
1. **Intro Screen**: The main configuration interface
2. **Experiment Screen**: Where stimuli are presented to participants
3. **Completion Screen**: Shown after experiment completion with results
4. **Study Window**: Interface for managing multi-block studies

#### JavaScript Functions and Objects

##### Global Variables
- **stimuliResponses**: Object storing mapping between stimuli and response keys/properties
- **studyConfigurations**: Array storing multi-block study configurations
- **studyData**: Array collecting participant data during study mode
- **variableCategories**: Object storing defined variable categories and their values
- **trialCounter**: Tracks the current trial number
- **correctResponses**: Counts correct responses during an experiment
- **reactionTimes**: Array storing reaction times for each trial
- **saveData**: Boolean flag indicating whether to save participant data
- **isStudyMode**: Boolean flag indicating if running in study mode
- **currentStudyIndex**: Tracks the current block in study mode

##### Key Functions in Detail

###### Experiment Configuration
- **parseStimuli(stimuliText)**:
  - Parses the stimuli input text into structured data
  - Handles single stimuli, sequential stimuli (in brackets), and concurrent stimuli (in parentheses)
  - Detects image files and creates appropriate objects
  - Processes variable references and expands them

- **generateMappingTable(parsedStimuli)**:
  - Creates the stimulus-response mapping interface
  - Dynamically generates table rows for each stimulus
  - Handles different input types for different properties
  - Supports concurrent stimuli with individual property settings

- **saveCurrentState()**:
  - Saves the current experiment configuration to localStorage
  - Captures all form inputs, mappings, and variable definitions
  - Ensures persistence between sessions

- **loadSavedState()**:
  - Restores a previously saved configuration from localStorage
  - Populates all form fields with saved values
  - Reconstructs stimulus-response mappings and variable definitions

###### Experiment Execution
- **beginExperiment()**:
  - Starts the experiment with current settings
  - Validates configuration and prepares stimuli
  - Sets up trial sequence and randomization
  - Initializes data collection if enabled

- **runTrial(trialStimulus, expectedResponse, trialIndex)**:
  - Executes a single trial with stimulus presentation
  - Handles timing for fixation, stimulus, and response window
  - Manages sequential and concurrent stimulus presentation
  - Records timing information for precise measurement

- **processResponse(event, expectedResponse, startTime)**:
  - Handles participant key presses during trials
  - Compares response to expected response
  - Calculates reaction time
  - Provides feedback if enabled
  - Records response data

- **calculateResults()**:
  - Computes accuracy and reaction time statistics
  - Calculates mean, median, and standard deviation
  - Prepares summary for display on completion screen
  - Formats data for export

###### Stimulus Handling
- **displayStimulus(stimulus, properties)**:
  - Renders a stimulus on the screen
  - Handles both text and image stimuli
  - Applies custom properties (position, color, size)
  - Manages stimulus visibility and timing

- **displaySequentialStimulus(stimulusArray, properties, callback)**:
  - Handles sequential stimulus presentation
  - Shows each stimulus in sequence with appropriate timing
  - Manages transitions between stimuli
  - Calls callback when sequence completes

- **displayConcurrentStimulus(stimuliArray, properties)**:
  - Handles concurrent stimulus presentation
  - Shows multiple stimuli simultaneously
  - Positions each stimulus according to its properties
  - Supports individual styling for each concurrent stimulus

- **preloadImages(imageList, callback)**:
  - Ensures images are loaded before experiment starts
  - Creates Image objects and tracks loading status
  - Prevents timing issues with image display
  - Calls callback when all images are loaded

###### Survey Functions
- **displaySurveyAnswerInput()**:
  - Creates the survey interface based on defined questions
  - Generates appropriate input elements for each answer type
  - Styles the survey for readability and usability
  - Adds event listeners for survey completion

- **completeSurvey()**:
  - Processes and saves survey responses
  - Collects answers from all question types
  - Formats data for storage and export
  - Handles survey completion and transitions

- **saveSurveyData(answers)**:
  - Stores survey responses in structured format
  - Creates downloadable data files
  - Adds survey data to study data in study mode
  - Provides download options for participants

###### Study Management
- **addCurrentConfigToStudy()**:
  - Adds current experiment settings as a block in the study
  - Captures all configuration parameters
  - Creates a unique ID for the configuration
  - Updates the study management UI

- **displayConfiguration(config)**:
  - Shows a study block in the UI
  - Creates draggable elements for reordering
  - Provides edit and delete options
  - Visualizes block type and settings

- **runStudy()**:
  - Executes a multi-block study
  - Loads each configuration in sequence
  - Manages transitions between blocks
  - Collects and organizes data from all blocks

- **advanceToNextConfiguration()**:
  - Moves to the next block in a study
  - Handles completion of the entire study
  - Manages data collection between blocks
  - Shows appropriate instructions for each block

###### Data Handling
- **saveExperimentData(trialData)**:
  - Stores trial data during an experiment
  - Formats data with timestamps and trial information
  - Adds to the cumulative data structure
  - Handles different data types for different experiment types

- **downloadData()**:
  - Creates and triggers download of experiment data
  - Formats data as JSON
  - Generates appropriate filenames with timestamps
  - Handles browser-specific download methods

- **exportMappingsToCSV()**:
  - Exports stimulus-response mappings to CSV format
  - Includes all custom properties for each stimulus
  - Handles special characters and formatting
  - Creates downloadable CSV file

- **importMappingsFromCSV(file)**:
  - Imports stimulus-response mappings from CSV file
  - Parses CSV format with proper handling of quotes and commas
  - Maps CSV columns to appropriate properties
  - Updates the mapping interface with imported data

###### Variable System
- **defineVariables()**:
  - Opens the variable definition interface
  - Manages the creation and editing of variable categories
  - Validates variable names and values
  - Updates the global variableCategories object

- **expandVariables(stimuliList)**:
  - Replaces variable placeholders with actual values
  - Handles variables in sequential and concurrent stimuli
  - Ensures balanced use of variable values
  - Maintains original structure of stimuli

- **cycleVariableValues(variableName)**:
  - Manages which value of a variable to use next
  - Ensures all values are used before repeating
  - Tracks usage counts for balanced presentation
  - Handles randomization if enabled

### Event Handling
The application uses event listeners to handle:
- **User Interface Interactions**: Button clicks, form submissions, modal dialogs
- **Keyboard Responses**: Key presses during experiments with timing precision
- **File Operations**: Uploads, downloads, and file reading
- **Drag and Drop**: For study block reordering and organization
- **Window Events**: Resize, focus/blur for proper experiment display

### State Management
- **localStorage**: Used to persist experiment configurations between sessions
- **Study Configurations**: Can be saved to localStorage or exported as files
- **Session Variables**: Track current state during experiment execution
- **Form State**: Synchronized with internal data structures
- **URL Parameters**: Can be used to load specific configurations (in some versions)

### Styling and Visual Design
The application uses CSS for:
- **Layout**: Flexbox and grid for responsive positioning
- **Visual Feedback**: Color changes and animations for experiment feedback
- **Modal Dialogs**: Overlay styling and focus management
- **Form Elements**: Consistent styling for input controls
- **Experiment Display**: Canvas styling and stimulus presentation
- **Accessibility**: Contrast, focus indicators, and readable text
- **Responsive Design**: Adaptations for different screen sizes

---

This guide provides an overview of the Psychology Experiment Builder's functionality and technical implementation. For specific questions or advanced usage, please refer to the application's documentation or contact the developers.

## Variable System

The variable system allows you to define categories of stimuli that can be used interchangeably in your experiment.

### Defining Variables

1. Click the "Define Variables" button to open the variable definition dialog
2. Enter a variable name (e.g., 'X', 'Y', 'Targets', 'Distractors')
3. Enter values for the variable, separated by commas
4. Click "Add Variable" to save this category
5. Repeat for additional variable categories
6. Click "Save Variables" when finished

### Using Variables in Stimuli

Once defined, variables can be used in your stimuli list by enclosing the variable name in single quotes:

```
'X', 'Y', ['X', 'Y'], ('X', 'Y')
```

During the experiment, each variable will be replaced with its actual values, cycling through all defined values.

### Variable Features

- **Persistence**: Defined variables are shown with a "Variables Defined" label
- **Clearing Variables**: Use the "Clear Variables" button to remove all defined variables
- **Variable in Sequences**: Variables can be used in both sequential and concurrent displays
- **Image Support**: Variable values can include image filenames

### Technical Implementation

The variable system uses:
- **variableCategories**: Object storing all defined variable categories and their values
- **expandVariables()**: Function that replaces variable placeholders with actual values
- **cycleVariableValues()**: Ensures all variable values are used in a balanced way

## Deployment Options

The Psychology Experiment Builder supports several deployment methods for running experiments with participants.

### Local Deployment

1. **Direct Use**: Run the experiment directly from the builder interface
   - Configure your experiment
   - Click "Begin Study" to start
   - Data is saved locally and can be downloaded

2. **Deployed HTML File**: Generate a standalone HTML file
   - Configure your experiment
   - Click "Deploy Study" to generate the file
   - Share the HTML file with participants
   - Participants open the file and complete the experiment
   - Data can be downloaded or emailed back to the researcher

### Online Deployment

1. **Web Hosting**: Host the deployed HTML file on a web server
   - Upload the generated HTML file to any web hosting service
   - Share the URL with participants
   - Participants access via browser and complete the experiment
   - Data can be downloaded or emailed back to the researcher

2. **Study Management**: Use the built-in study management system
   - Save studies to local storage
   - Load studies from local storage
   - Import/export studies as JSON files for sharing

### Data Collection in Deployed Experiments

- Deployed experiments maintain the same data collection capabilities
- Survey blocks in a study must be downloaded separately as they don't merge with experimental blocks
- The "Save Data" option must be enabled for data collection

## Troubleshooting

### Common Issues

1. **Stimuli Not Displaying**
   - Check that stimuli are correctly formatted in the input area
   - Ensure image files are in the correct location (same directory as the HTML file)
   - Verify that variable names are enclosed in single quotes

2. **Response Keys Not Working**
   - Confirm that response keys are correctly mapped in the S-R Mapping dialog
   - Check that the experiment window has focus when pressing keys
   - Ensure keyboard input is not being captured by browser extensions

3. **Data Not Saving**
   - Verify that the "Save Data" checkbox is enabled
   - Check browser permissions for downloading files
   - Ensure sufficient storage space is available

4. **Variable Issues**
   - Confirm variables are properly defined before use
   - Check that variable names in stimuli match defined variable names
   - Ensure variable values are correctly formatted

5. **Study Management Problems**
   - Clear browser cache if studies aren't loading correctly
   - Export important studies as files for backup
   - Check local storage permissions in your browser

### Browser Compatibility

The Psychology Experiment Builder works best with:
- Chrome (recommended)
- Firefox
- Edge
- Safari

Mobile browsers have limited support due to keyboard input requirements.

### Performance Optimization

For complex experiments or older devices:
- Reduce the number of trials
- Use simpler stimuli (text instead of images where possible)
- Avoid very large image files
- Limit the use of concurrent stimuli displays
