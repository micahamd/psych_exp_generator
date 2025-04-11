# Psychology Experiment Builder

A comprehensive web-based tool designed for researchers to build complex experimental protocols combining reaction-time studies and surveys without requiring programming knowledge.

## Core Features

### Application Modes
The application has two main components that can be switched across:

1. **Experiment Builder**:
   - Present individual, sequential or concurrent text and/or image stimuli
   - Configure stimulus timing, element properties (size, color, position) and allowable responses
   - Optional response feedback and responding-to-criterion thresholds

2. **Survey Builder**:
   - Create multi-question surveys with text input (single and multi-line), multiple-choice questions, and slider scales
   - Flexible question sequencing

### Operational Modes
The builder supports two ways to run experiments and surveys:

1. **Single Task Mode** ("Test" button):
   - Run a single experimental configuration or survey
   - Immediate data download upon completion (optional)
   - Response feedback (optional)
   - Suitable for testing and single-task experiments or individual trial blocks
   - **IMPORTANT** You must test the task before adding it to the study (see below)

2. **Study Mode** ("Add to Study" and "Begin Study" buttons):
   - Sequence of different tasks and surveys in any combination can be provided
   - Each configuration maintains its unique settings and parameters
   - Collect and organize data across all configurations
   - Reorder and rename study blocks using drag controls
   - Download consolidated study data upon completion

### Stimulus Presentation
   - Character strings entered as comma-separated values are registered as individual stimuli
   - Strings registered as images automatically if the following extensions are added: : .jpg, .jpeg, .png, .gif, .bmp, .webp
   - Images should be placed in the same directory as the HTML file, otherwise a placeholder text will be shown
   - For instance, the stimulus 'apple' will be registered as a string, whereas the stimulus 'apple.jpg' will be registered as an image
   - Optional randomization of stimulus sequence
   - Configurable font size and color for each text stimulus
   - Customizable width and height for each image stimulus (default: 400x400 pixels)
   - Adjustable stimulus offset 
   - Automatic centering with default positioning adjustments to preve
   - Maintains aspect ratio with configurable dimensions

3. **Stimulus Presentation Options**:
   - **Sequential Presentation**: To present stimuli one after another, enclose them inside *square* brackets
     - Example: `[apple, corn]` shows "apple" followed by "corn" as a single 'sequential' stimulus
     - Each stimulus advances with a predetermined correct response when stimulus offset = 0. 
     - If offset > 0, then items in a sequence advance automatically in accordance with the provided value.
     
   - **Concurrent Presentation**: To show multiple stimuli on screen simultaneously, enclose them inside *curved* brackets
     - Example: `(apple, corn)` shows both "apple" and "corn" on screen, equidistant from each other and their adjacent border edges.
     - Including additional stimuli automatically updates the default positioning to ensure symmetric spatial distribution.
     - Element positioning and styling (color, size) can also be manually set
     
   - **Mixed Presentation Types**: Combine sequential and concurrent presentations
     - Example: `[apple, (corn, bean)], speed.jpg` for complex sequences
     - Unlimited nesting of presentation types

### Custom Stimulus-Response (S-R) Mappings

The S-R Mapping dialog provides precise control over stimulus presentation and response requirements:

1. **Per-stimulus Properties**:
   - **Response Mapping**: Assign specific correct response keys to each stimulus
   - **Position Control**: Set exact X and Y coordinates for precise placement
   - **Timing Parameters**: Configure individual presentation timing and offset
   - **Appearance Settings**:
     - For text: Custom color and font size (in pixels)
     - For images: Custom width and height (in pixels)
   - **Automatic Detection**: System automatically detects stimulus type and shows relevant options

2. **Concurrent Stimuli Settings**:
   - Individual control for each stimulus within a concurrent group
   - Independent positioning with X and Y coordinates for each element
   - Custom colors and sizes for each concurrent stimulus
   - Individual timing offsets for staggered appearance
   - Maintain consistent response key or set individual keys

3. **Sequential Stimuli Control**:
   - Configure each step in a sequence independently
   - Set progression rules between sequence elements
   - Individual styling for each sequence step

### Response System

1. **Default Response Key**:
   - Primary response key (defaults to SPACEBAR)
   - Considered "correct" for feedback and data recording
   - Customizable globally or per stimulus/sequence
   - Used for advancing through sequential stimuli

2. **Additional Responses**:
   - Define multiple alternative valid response keys
   - Always accepted regardless of stimulus presented
   - Useful for multi-key experiments and choice tasks
   - Can be used for go/no-go paradigms
   - Recorded in data output for analysis

3. **Custom Response Mappings**:
   - Stimulus-specific correct responses for complex designs
   - Set individual mappings in the S-R Mappings dialog
   - Override default response key for specific stimuli
   - Create complex response rules for different stimuli
   - Supports sophisticated experimental designs like Stroop tasks

4. **Response Timing**:
   - Precise measurement of response times in milliseconds
   - Timing starts from stimulus onset
   - Accounts for stimulus offset in calculations
   - Detailed timing data included in experiment output

### Data Collection and Analysis

#### Experiment Data Collection

1. **Single Task Mode**:
   - Automatic data collection during experiment execution
   - Immediate data download after task completion
   - Individual trial data in structured JSON format
   - Download button available on completion screen
   - Includes accuracy and response time metrics

2. **Study Mode**:
   - Collects data across all configurations (experiments and surveys)
   - Maintains separation between different task blocks
   - Consolidated download at study completion
   - Includes comprehensive study metadata and configuration details
   - Preserves the relationship between tasks in sequence

#### Survey Data Collection

- Captures all question responses with timestamps
- Records question type and response format
- For slider responses, includes scale configuration details
- Integrates with experiment data in study mode

#### Data Structure

Experiment Data Format:
```json
{
  "studyMetadata": {
    "completionTime": "2023-...",
    "numberOfConfigurations": 3,
    "configurationDetails": [...]
  },
  "configurationData": [
    {
      "configurationIndex": 0,
      "configurationName": "Configuration 1",
      "data": [
        {
          "Timestamp": "13:45:22_15:06:2023",
          "Trial Number": 1,
          "Stimulus": "apple",
          "Stimulus_Offset": 0,
          "Response": "SPACE",
          "Accurate": 1,
          "ResponseTime_ms": 543
        },
        // ... more trials
      ]
    },
    // ... more configurations
  ]
}
```

Survey Data Format:
```json
[
  {
    "Timestamp": "14:30:45_16:06:2023",
    "QuestionNumber": "1",
    "Question": "How are you feeling today?",
    "Answer": "I'm feeling great!",
    "AnswerType": "textarea"
  },
  {
    "Timestamp": "14:30:45_16:06:2023",
    "QuestionNumber": "2",
    "Question": "Rate your satisfaction:",
    "Answer": "7 (on scale from 1 to 9, where 1 = \"Very Dissatisfied\" and 9 = \"Very Satisfied\")",
    "AnswerType": "slider"
  }
]
```

#### Data Analysis Compatibility

- JSON format compatible with common analysis tools
- Easily imported into R, Python, or Excel
- Structured format facilitates automated processing
- Timestamps enable session-level analysis

### Feedback System

The application provides configurable real-time feedback during experiments:

- **Visual Feedback**:
  - "Correct" (green) displayed for correct responses
  - "X" (red) displayed for incorrect responses
  - Centered feedback with configurable duration
  - Clear visual distinction between response types

- **Progression Control**:
  - Only correct/additional responses advance trials by default
  - Incorrect responses can be configured to advance or repeat
  - Configurable trial advancement timing

- **Performance Tracking**:
  - Tracks correct response count during experiment
  - Optional performance threshold for cycle completion
  - Automatic cycle repetition if threshold not met
  - Detailed performance summary at completion

### Position Control System

Precise control over stimulus positioning using a coordinate system:

- **Coordinate System**:
  - Relative to screen center for intuitive positioning
  - **X coordinate**: Left (-) to Right (+)
  - **Y coordinate**: Up (-) to Down (+)
  - Zero (0,0) centers elements perfectly

- **Global vs. Local Positioning**:
  - Global default position for all stimuli
  - Individual positioning for specific stimuli via S-R mapping
  - Precise pixel-level control for exact placement

- **Concurrent Stimuli Positioning**:
  - Independent X,Y coordinates for each concurrent stimulus
  - Default positions automatically calculated for even distribution
  - Manual override available for specific experimental designs

- **Fixation Point Positioning**:
  - Configurable fixation point location
  - Can be aligned with or offset from stimulus position

### State Persistence System

- **Session Persistence**:
  - All form values automatically persist between browser sessions
  - Custom S-R mappings preserved exactly as configured
  - Study configurations maintained across browser restarts
  - All settings saved securely in browser's localStorage

- **Configuration Management**:
  - Multiple experiment and survey configurations can be saved
  - Study sequences preserved with all settings intact
  - Automatic recovery from browser crashes or accidental closure
  - No server-side storage required - all data remains local

## How to Use

### Getting Started

1. **Launch the Application**:
   - Open the HTML file in any modern web browser
   - No installation or server setup required
   - Works offline once loaded

2. **Choose Application Mode**:
   - Toggle between Experiment Builder and Survey Builder using the switch at the top
   - Each mode has its own dedicated interface and options
   - Switch freely between modes at any time

3. **Configure and Test**:
   - Set up your experiment or survey with the desired parameters
   - Use the "Test" button to preview and validate your configuration
   - Make adjustments as needed before finalizing

4. **Run or Add to Study**:
   - For single tasks, click "Begin" to run immediately
   - For multi-phase studies, click "Add to Study" to include in sequence
   - Build complex protocols by combining multiple configurations

### Creating an Experiment

1. **Basic Setup**:
   - Switch to "Experiment" mode using the toggle
   - Configure general parameters (timing, colors, trial count)
   - Set fixation point options and background colors

2. **Stimulus Configuration**:
   - Enter stimuli in the text area using comma separation
   - Use brackets for sequential presentation: `[apple, corn]`
   - Use parentheses for concurrent presentation: `(apple, corn)`
   - Include image files by name: `apple.jpg` (place in same directory)

3. **Response Configuration**:
   - Set the primary response key (default is SPACEBAR)
   - Add additional valid response keys if needed
   - Configure feedback options and duration

4. **Advanced Configuration**:
   - Click "Custom S-R Mappings" to open the mapping dialog
   - Set stimulus-specific response keys, positions, and styling
   - Configure randomization and cycle threshold options

5. **Testing and Implementation**:
   - Click "Test" to preview the experiment
   - Verify all stimuli appear as expected
   - Confirm response keys work correctly
   - Click "Add to Study" to include in a study sequence

### Creating a Survey

1. **Question Creation**:
   - Switch to "Survey" mode using the toggle
   - Enter your first question text in the provided field
   - Select an answer type from the dropdown menu:
     - Text (single line)
     - Text Area (multi-line)
     - Multiple Choice (radio buttons)
     - Slider Scale (numeric rating)

2. **Response Type Configuration**:
   - For Multiple Choice: Add and customize options using the "Add Option" button
   - For Slider Scale: Set min/max values and customize anchor labels

3. **Multi-Question Surveys**:
   - Add additional questions using the "Add Another Question" button
   - Each question can have its own answer type
   - Reorder questions as needed

4. **Testing and Implementation**:
   - Click "Test" to preview the survey
   - Verify all questions and response options appear correctly
   - Click "Add to Study" to include in a study sequence

### Running a Study

1. **Building the Study Sequence**:
   - Create multiple experiments and/or surveys as needed
   - Add each configuration to the study using "Add to Study"
   - Each addition creates a block in the study window

2. **Organizing the Sequence**:
   - Rename blocks for clarity using the editable block names
   - Arrange the order using the up/down arrows in each block
   - Remove unwanted blocks using the X button

3. **Executing the Study**:
   - Click "Begin Study" to run the complete sequence
   - Each configuration will run in order with transition screens
   - Participants progress through all blocks automatically

4. **Data Collection**:
   - Data is collected throughout the entire study
   - Each configuration's data is stored separately but linked
   - At completion, download the consolidated dataset
   - Data is formatted for easy import into analysis software

## Technical Implementation

### Project Structure
```
psychology-experiment-builder/
├── index.html      # Main interface and structure
├── style.css       # Styling and layout
├── script.js       # Core functionality and logic
└── README.md       # Documentation
```

### Technologies Used
- **HTML5**: Semantic structure and form elements
- **CSS3**: Responsive styling and visual feedback
- **Vanilla JavaScript**: Core functionality without dependencies
- **Local Storage API**: State persistence between sessions
- **JSON**: Data structure and export format
- **Blob API**: File generation for data download

### Technical Features
- **No Dependencies**: Zero external libraries or frameworks required
- **Offline Functionality**: Works entirely offline after initial load
- **Responsive Design**: Adapts to different screen sizes
- **Cross-Browser Compatibility**: Works in all modern browsers
- **Modular Architecture**: Organized code structure for maintainability

### Browser Requirements
- Any modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Local storage permissions granted
- File download capability
- Minimum screen resolution: 1024x768

## Troubleshooting Guide

### Common Issues and Solutions

1. **Display Problems**:
   - **Issue**: Stimuli not appearing or misaligned
   - **Solution**: Verify all files are in the same directory and check browser console for errors
   - **Prevention**: Test on target device before full deployment

2. **Data Collection Issues**:
   - **Issue**: Data not downloading or incomplete
   - **Solution**: Ensure browser allows downloads and has sufficient permissions
   - **Prevention**: Enable "Save Data" option before starting experiment

3. **Image Loading Problems**:
   - **Issue**: Images not displaying, showing placeholder text
   - **Solution**: Verify image files are in the same directory as the HTML file
   - **Prevention**: Use supported image formats (.jpg, .png, .gif) and check filenames

4. **Study Mode Issues**:
   - **Issue**: Configurations not running correctly in sequence
   - **Solution**: Ensure each configuration is properly added to study before starting
   - **Prevention**: Test each configuration individually before adding to study

5. **Performance Issues**:
   - **Issue**: Slow response or timing inaccuracies
   - **Solution**: Close other browser tabs/applications and refresh the page
   - **Prevention**: Use a dedicated browser window for running experiments

## Experimental Paradigms Supported

The Psychology Experiment Builder supports a wide range of common experimental paradigms used in psychological research:

### Cognitive Psychology Paradigms
- **Stroop Task**: Using concurrent stimuli with custom response mappings
- **Lexical Decision**: Text stimuli with response time measurement
- **N-Back Task**: Sequential stimuli with performance tracking
- **Visual Search**: Using concurrent stimuli with positioning control
- **Flanker Task**: Using concurrent stimuli with custom positioning

### Memory and Learning Paradigms
- **Recognition Memory**: Stimulus presentation followed by survey questions
- **Serial Recall**: Sequential stimuli with custom response mappings
- **Paired Associate Learning**: Using concurrent or sequential stimuli
- **Implicit Learning Tasks**: Using complex stimulus sequences

### Attention and Perception Paradigms
- **Attentional Blink**: Precisely timed sequential stimuli
- **Change Blindness**: Using image stimuli with timing control
- **Visual Cueing**: Using sequential stimuli with position control
- **Inattentional Blindness**: Complex stimulus sequences with surveys

### Mixed-Methods Research
- **Experiment + Survey**: Combine reaction time tasks with questionnaires
- **Multi-Phase Studies**: Run different experimental protocols in sequence
- **Qualitative + Quantitative**: Collect both types of data in a single session

## Future Development Roadmap

### Completed Features
- ✓ Survey Form integration with multiple question types
- ✓ Slider scale response type for surveys with customizable anchors
- ✓ Visual stimulus support for images with automatic detection
- ✓ Advanced stimulus presentation (sequential, concurrent, mixed)
- ✓ Custom stimulus-response mappings with individual settings
- ✓ Study mode for multi-phase experimental protocols

### Planned Enhancements
- Enhanced timing precision using requestAnimationFrame
- Network data submission to remote servers
- Conditional branching based on participant responses
- Response criteria handling for advanced experimental control
- Additional trial types (go/no-go, forced choice, etc.)
- Custom appearance themes and styling options
- Built-in data visualization and analysis tools
- Export/import study configurations for sharing
- Mobile device optimization for tablet-based testing
- Audio stimulus support for auditory experiments
- Eye-tracking integration (where supported by browser)
- Multi-language support for international research

## Contributing

We welcome contributions to improve and extend the Psychology Experiment Builder!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Implement your changes with appropriate documentation
4. Test thoroughly across different browsers
5. Submit a pull request with detailed description of changes

### Development Guidelines
- Maintain vanilla JavaScript approach (no external dependencies)
- Follow existing code style and organization
- Include detailed comments for complex functionality
- Update documentation to reflect new features
- Add appropriate error handling and user feedback

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the needs of psychological researchers worldwide
- Developed to make sophisticated experimental design accessible without programming
- Special thanks to all contributors and testers who have helped improve this tool
