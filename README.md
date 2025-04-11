# Psychology Experiment Builder

A flexible web-based tool for creating and running psychology experiments, supporting both single-task and multi-configuration study modes.

## Core Features

### Study Mode
The builder supports two operational modes:
1. **Single Task Mode** ("Begin" button):
   - Run a single experimental configuration
   - Immediate data download upon completion
   - Suitable for testing and single-task experiments

2. **Study Mode** ("Add to Study" and "Begin Study" buttons):
   - Create a sequence of different experimental configurations
   - Run multiple configurations in succession
   - Collect data across all configurations
   - Download consolidated study data upon completion

### Stimulus Presentation
1. **Basic Stimuli**:
   - Text-based stimuli (comma-separated)
   - Optional randomization of stimulus sequence
   - Configurable stimulus size and color
   - Adjustable presentation timing

2. **Advanced Stimulus Types**:
   - Sequential stimuli using square brackets: `[apple, corn]`
   - Concurrent stimuli using curved brackets: `(apple, corn)`
   - Mixed types: `[apple, (corn, bean)], speed`

### Custom Stimulus-Response (S-R) Mappings
Access via the S-R Mapping dialog to set:
1. **Per-stimulus properties**:
   - Correct response key
   - Position (X and Y coordinates)
   - Presentation timing offset
   - Custom text color
   - Custom font size (in pixels)

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

## Future Development

Planned Features:
- Survey Form integration
- Enhanced timing precision
- Visual stimulus support (images/shapes)
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
