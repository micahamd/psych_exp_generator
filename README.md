# Psychology Experiment Builder

A flexible web-based tool that allows researchers to build complex experimental protocols combining both reaction-time experiments and survey questions in a seamless sequence.

## Core Features

### Application Modes
The application has two main components:

1. **Experiment Builder**:
   - Create reaction-time experiments with customizable stimuli
   - Configure timing, feedback, and response mappings
   - Collect precise timing data for responses

2. **Survey Builder**:
   - Create multi-question surveys with various response types
   - Support for text, textarea, and multiple-choice questions
   - Customizable options for multiple-choice questions

### Study Mode
The builder supports two operational modes:
1. **Single Task Mode** ("Begin" button):
   - Run a single experimental configuration or survey
   - Immediate data download upon completion
   - Suitable for testing and single-task experiments

2. **Study Mode** ("Add to Study" and "Begin Study" buttons):
   - Create a sequence of different experiments and surveys
   - Run multiple configurations in succession
   - Collect data across all configurations
   - Download consolidated study data upon completion

### Stimulus Presentation
1. **Basic Stimuli**:
   - Text-based stimuli (comma-separated)
   - Optional randomization of stimulus sequence
   - Configurable stimulus size and color
   - Adjustable presentation timing

2. **Image Stimuli**:
   - Image files with extensions: .jpg, .jpeg, .png, .gif, .bmp, .webp
   - Example: "apple.jpg" will be displayed as an image
   - Customizable width and height (default: 400x400 pixels)
   - Images should be placed in the same directory as the HTML file
   - Fallback text shown if image cannot be loaded

3. **Advanced Stimulus Types**:
   - Sequential stimuli using square brackets: `[apple, corn]`
   - Concurrent stimuli using curved brackets: `(apple, corn)`
   - Mixed types: `[apple, (corn, bean)], speed`
   - Mixed media: `apple, corn, speed.jpg` (two text stimuli and one image)

### Custom Stimulus-Response (S-R) Mappings
Access via the S-R Mapping dialog to set:
1. **Per-stimulus properties**:
   - Correct response key
   - Position (X and Y coordinates)
   - Presentation timing offset
   - Custom text color
   - Custom font size (for text stimuli, in pixels)
   - Custom width and height (for image stimuli, in pixels)

2. **Concurrent Stimuli Settings**:
   - Individual X and Y positions
   - Individual colors
   - Individual sizes
   - Individual timing offsets

### Response System

1. **Default Response Key**:
   - Primary response key (defaults to SPACEBAR)
   - Considered "correct" for feedback
   - Customizable per stimulus/sequence

2. **Additional Responses**:
   - Alternative valid response keys
   - Always accepted regardless of stimulus
   - Useful for multi-key experiments

3. **Custom Response Mappings**:
   - Stimulus-specific correct responses
   - Set in S-R Mappings dialog
   - Override default response key

### Data Collection

#### Single Task Mode
- Automatic data download after task completion
- Individual trial data in JSON format
- Download button available on completion screen

#### Study Mode
- Collects data across all configurations
- Consolidated download at study completion
- Includes study metadata and configuration details

Data Structure:
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

### Feedback System
When enabled:
- "Correct" (green) for correct responses
- "X" (red) for incorrect responses
- Configurable feedback duration
- Only correct/additional responses advance trials

### Position Control
Coordinate system relative to screen center:
- **X coordinate**: Left (-) to Right (+)
- **Y coordinate**: Up (-) to Down (+)
- Zero (0,0) centers elements
- Individual positioning for concurrent stimuli

### State Persistence
- Form values persist between sessions
- Custom S-R mappings preserved
- Study configurations maintained
- Settings saved in browser's localStorage

## How to Use

### Getting Started
1. Open the application in a modern web browser
2. Choose between Experiment Builder and Survey Builder using the toggle switch at the top
3. Configure your experiment or survey as needed
4. Test your configuration using the "Test" button
5. Add to study or run immediately

### Creating an Experiment
1. Switch to "Experiment" mode using the toggle
2. Configure the experiment parameters (timing, colors, etc.)
3. Enter stimuli in the text area (comma-separated)
4. Set response keys and feedback options
5. Click "Test" to preview the experiment
6. Click "Add to Study" to add to the study sequence

### Creating a Survey
1. Switch to "Survey" mode using the toggle
2. Enter your first question text
3. Select an answer type (text, textarea, or multiple choice)
4. For multiple choice, add and customize options as needed
5. Add additional questions using the "Add Another Question" button
6. Click "Test" to preview the survey
7. Click "Add to Study" to add to the study sequence

### Running a Study
1. Create multiple experiments and/or surveys
2. Add each configuration to the study using "Add to Study"
3. Arrange the order using the up/down arrows in the study window
4. Click "Begin Study" to run the complete sequence
5. Data will be collected throughout the study
6. Download the complete dataset at the end

## Technical Implementation

### Project Structure
```
psychology-experiment-builder/
├── index.html      # Main interface and structure
├── style.css       # Styling and layout
├── script.js       # Core functionality and logic
└── README.md       # Documentation
```

### Technologies
- HTML5
- CSS3
- Vanilla JavaScript
- Local Storage API

### Browser Requirements
- Modern browser with localStorage support
- JavaScript enabled
- File download capability
- Local storage permissions

## Troubleshooting

### Common Issues
1. **Screen Display Problems**:
   - Verify all files are in same directory
   - Check browser JavaScript support
   - Enable localStorage

2. **Data Collection Issues**:
   - Enable browser downloads
   - Check storage permissions
   - Verify JSON handling support

3. **Study Mode Issues**:
   - Add configurations before starting
   - Wait for completion messages
   - Check console for errors

## Survey Builder Features

### Question Types
1. **Text Input**:
   - Single-line text responses
   - Suitable for short answers, names, etc.

2. **Text Area**:
   - Multi-line text responses
   - Suitable for longer answers, comments, etc.

3. **Multiple Choice**:
   - Radio button selection from predefined options
   - Customizable option labels
   - Add/remove options as needed

4. **Slider Scale**:
   - Numeric scale with customizable range (default: 1-9)
   - Customizable anchor labels (default: "Left" and "Right")
   - Real-time value display
   - Ideal for Likert scales and rating questions

### Multiple Questions
- Add multiple questions to a single survey
- Each question can have its own answer type
- Questions are presented in sequence
- All responses collected in a single submission

### Data Collection
- Optional data saving for survey responses
- JSON format with timestamp and question details
- Individual question responses tracked
- Integration with study mode for sequential data collection

Survey Data Structure:
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
    "Question": "Which color do you prefer?",
    "Answer": "Blue",
    "AnswerType": "radio"
  }
]
```

## Future Development

Planned Features:
- ✓ Survey Form integration (Completed!)
- ✓ Slider scale response type for surveys (Completed!)
- ✓ Visual stimulus support (images) (Completed!)
- Enhanced timing precision
- Network data submission
- Conditional branching
- Response criteria handling
- Additional trial types
- Custom appearance themes
- Data analysis tools
- Export/import study configurations

## Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Follow coding standards
5. Include documentation updates

## License

[Add your license information here]
