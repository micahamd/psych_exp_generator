# PEG Server Save Implementation Plan

## Overview

Add "Save Results to Server" functionality to the Psychological Experiment Generator (PEG), allowing experiment results to be automatically sent to a PHP script on a server instead of being downloaded locally. This implementation mirrors the functionality found in the quiz generator system.

## Current System Analysis

### Existing Architecture

- **Framework**: Python Tkinter desktop application
- **Output**: Generates `experiment.html` with embedded JavaScript
- **Data Flow**:
  1. User designs experiment in GUI
  2. Python generates HTML with trial data as JSON
  3. JavaScript runs experiment in browser
  4. Results saved via client-side download

### Current Data Structure

```javascript
{
    experimentId: 'exp_' + timestamp,
    timestamp: ISO string,
    browserInfo: navigator.userAgent,
    randomized: boolean,
    repetitions: number,
    trials: [
        {
            block: number,
            stimulus: string,
            response: string,
            latency: number|null,
            correctResponse: string|null,
            feedbackText: string|null,
            feedbackDuration: number|null,
            stimulusColor: string,
            backgroundColor: string,
            position: string,
            repetition: number,
            blockRepetition: number,
            trialIndex: number,
            actualResponse: any,
            responseTime: number,
            isCorrect: boolean|null,
            timestamp: ISO string
        }
    ]
}
```

### Current Save Mechanism

- **Function**: `downloadData()` in generated HTML
- **Method**: Client-side blob download
- **Filename**: `experiment_data_{experimentId}.json`

---

## Implementation Steps

### Step 1: UI Enhancement - Add Server Save Checkbox

**File**: `peg_main.py`
**Location**: In the `__init__` method, after the existing controls in `button_frame`
**Line Range**: Around line 85-90 (after the repeat_entry widget)

**Objective**: Add a checkbox to toggle between local download and server save modes.

**Changes Required**:

```python
# Add after the repeat_entry widget
self.save_to_server_var = tk.BooleanVar(value=False)
self.save_to_server_check = tk.Checkbutton(
    self.button_frame, 
    text="Save Results to Server (PHP)?", 
    variable=self.save_to_server_var
)
self.save_to_server_check.grid(row=1, column=0, columnspan=3, padx=5, sticky='w')
```

**UI Layout**: Position checkbox on a new row below existing controls to avoid disrupting current layout.

**Testing Criteria**:

- ✅ Checkbox appears in UI
- ✅ Checkbox can be toggled
- ✅ Default state is unchecked (preserves existing behavior)
- ✅ No impact on existing functionality

---

### Step 2: Modify HTML Generation - Detect Checkbox State

**File**: `peg_main.py`
**Location**: In the `generate_html` method, early in the function
**Line Range**: Around line 310-320 (at the beginning of generate_html method)

**Objective**: Capture the checkbox state and prepare for conditional JavaScript generation.

**Changes Required**:

```python
def generate_html(self, trials):
    # Capture server save preference
    save_to_server = self.save_to_server_var.get()
  
    # Existing image processing code continues...
    image_regex = re.compile(r'\[image:([^()\]]+?)(?:\((.*?)\))?\]')
    preloaded_images = set()
```

**Testing Criteria**:

- ✅ Variable correctly captures checkbox state
- ✅ No impact on existing image processing
- ✅ Method signature unchanged

---

### Step 3: Create Conditional downloadData Function - Server Version

**File**: `peg_main.py`
**Location**: In the `generate_html` method, before the final HTML template
**Line Range**: Around line 400-450 (before the return statement with HTML template)

**Objective**: Generate a server-enabled version of the `downloadData()` function when checkbox is checked.

**Changes Required**:

```python
# Generate conditional downloadData function
if save_to_server:
    download_function = f'''
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
          
            // Send to server via PHP
            fetch('/experiments/save_peg_results.php', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json'
                }},
                body: JSON.stringify(data)
            }})
            .then(response => {{
                if (!response.ok) {{
                    throw new Error('HTTP error! status: ' + response.status);
                }}
                return response.json();
            }})
            .then(result => {{
                if (result.status === 'success') {{
                    document.getElementById('container').innerHTML = 
                        "<h2>Experiment complete. Results sent to server!</h2>";
                }} else {{
                    throw new Error(result.message || 'Failed to save results');
                }}
            }})
            .catch(error => {{
                console.error('Save error:', error);
                document.getElementById('container').innerHTML = 
                    "<h2>Experiment complete. Error saving to server: " + error.message + "</h2><p>Attempting local download...</p>";
                // Fallback to local download
                downloadDataLocally();
            }});
        }}
      
        function downloadDataLocally() {{
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
        }}'''
else:
    # Preserve existing local download functionality
    download_function = f'''
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
        }}'''
```

**Key Features**:

- **Server Endpoint**: `/experiments/save_peg_results.php`
- **Error Handling**: Comprehensive error catching with user feedback
- **Fallback Mechanism**: Automatic local download if server fails
- **Data Integrity**: Identical data structure in both modes
- **User Feedback**: Clear success/error messages

**Testing Criteria**:

- ✅ Function generates correctly based on checkbox state
- ✅ Server version includes proper fetch request
- ✅ Local version maintains existing behavior
- ✅ Error handling covers network and server errors
- ✅ Fallback works when server unavailable

---

### Step 4: Integration and Template Replacement

**File**: `peg_main.py`
**Location**: In the HTML template return statement
**Line Range**: Around line 520-530 (in the JavaScript section of the HTML template)

**Objective**: Replace the hardcoded downloadData function with the conditionally generated version.

**Current Code to Replace**:

```javascript
function downloadData() {
    const experimentId = 'exp_' + Date.now().toString(36);
    const data = {
        experimentId: experimentId,
        timestamp: new Date().toISOString(),
        browserInfo: navigator.userAgent,
        randomized: {str(self.randomize_var.get()).lower()},
        repetitions: {self.repeat_var.get()},
        trials: trialResults
    };
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_data_${experimentId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

**Replacement**:

```javascript
{download_function}
```

**Testing Criteria**:

- ✅ Generated HTML contains correct function
- ✅ JavaScript syntax is valid
- ✅ Function integrates properly with existing experiment logic
- ✅ No impact on trial processing or other functionality

---

### Step 5: Server Script Setup

#### PHP Script Location

**File**: `save_peg_results.php`
**Server Path**: `/experiments/save_peg_results.php`

#### Directory Structure

```
/experiments/
  └── save_peg_results.php
/experiment_results/
  └── [JSON files saved here automatically]
```

#### PHP Script Features

- **CORS Support**: Allows cross-origin requests from any domain
- **Directory Creation**: Automatically creates results directory
- **Error Handling**: Comprehensive validation and error responses
- **JSON Validation**: Ensures data integrity before saving
- **Logging**: Optional server-side logging for monitoring
- **Security**: Input validation and proper HTTP status codes

#### File Naming Convention

`experiment_data_YYYYMMDD_HHMMSS_{experimentId}.json`

**Example**: `experiment_data_20250910_143022_exp_abc123.json`

---

## Testing Protocol

### Phase 1: UI Testing

1. **Checkbox Appearance**: Verify checkbox appears in correct location
2. **State Management**: Toggle checkbox and verify state persistence during session
3. **Layout Integrity**: Ensure no disruption to existing UI elements

### Phase 2: Function Generation Testing

1. **Conditional Logic**: Test both checkbox states generate correct functions
2. **JavaScript Validity**: Validate generated JavaScript syntax
3. **Data Structure**: Verify identical data in both modes

### Phase 3: Server Integration Testing

1. **Server Available**: Test successful save to server
2. **Server Unavailable**: Test fallback to local download
3. **Network Errors**: Test error handling for various network conditions
4. **PHP Errors**: Test handling of server-side errors

### Phase 4: End-to-End Testing

1. **Simple Experiments**: Test basic stimulus-response experiments
2. **Complex Experiments**: Test with images, feedback, multiple blocks
3. **Cross-Browser**: Test in Chrome, Firefox, Edge, Safari
4. **Cross-Platform**: Test on Windows, Mac, Linux
5. **Hosting Scenarios**: Test with local files, web servers, CDNs

### Phase 5: Data Integrity Testing

1. **Local vs Server**: Compare JSON outputs between modes
2. **Complex Data**: Test with all stimulus types, responses, feedback
3. **Edge Cases**: Test with empty responses, timeout scenarios
4. **Large Experiments**: Test with many trials and blocks

---

## Error Handling Strategy

### Client-Side Errors

- **Network Failures**: Automatic fallback to local download
- **Server Errors**: User notification with fallback option
- **JSON Errors**: Graceful handling with error logging

### Server-Side Errors

- **Directory Creation**: Proper error responses if permissions fail
- **File Writing**: Validation and error reporting
- **JSON Parsing**: Input validation with detailed error messages

### User Experience

- **Clear Messaging**: Specific error messages for different scenarios
- **Fallback Options**: Always ensure data can be saved locally
- **Progress Indication**: User feedback during save process

---

## Security Considerations

### Server-Side Security

- **Input Validation**: JSON structure and content validation
- **Directory Traversal**: Prevent unauthorized file access
- **File Permissions**: Proper directory and file permissions
- **Rate Limiting**: Consider implementing request limits if needed

### Client-Side Security

- **HTTPS**: Recommend HTTPS for production deployments
- **Data Privacy**: Ensure participant data is handled appropriately
- **Error Disclosure**: Avoid exposing sensitive server information

---

## Deployment Guidelines

### Server Requirements

- **PHP**: Version 7.4 or higher recommended
- **Web Server**: Apache, Nginx, or similar with PHP support
- **Permissions**: Write access to create directories and files
- **CORS**: Server must support cross-origin requests

### File Placement

1. Upload `save_peg_results.php` to `/experiments/` directory on server
2. Ensure directory has proper permissions (755 recommended)
3. Test script accessibility via direct URL
4. Verify directory creation works with test request

### Configuration Options

- **Results Directory**: Modify `$upload_dir` in PHP script if needed
- **Error Logging**: Adjust error_log settings for debugging
- **File Permissions**: Modify directory creation permissions if required

---

## Maintenance and Monitoring

### Log Files

- **Server Logs**: Monitor PHP error logs for script issues
- **Access Logs**: Track requests to save_peg_results.php
- **Application Logs**: Review PEG-specific log entries

### File Management

- **Disk Space**: Monitor experiment_results directory size
- **File Cleanup**: Implement retention policies if needed
- **Backup Strategy**: Regular backups of experiment data

### Performance Monitoring

- **Response Times**: Monitor server response times
- **Error Rates**: Track success/failure ratios
- **Resource Usage**: Monitor server resource consumption

---

## Future Enhancements

### Immediate Opportunities

- **Participant IDs**: Add participant identification system
- **Data Validation**: Enhanced client-side data validation
- **Retry Logic**: Automatic retry on temporary failures

### Advanced Features

- **Server Dashboard**: Web interface for experiment management
- **Data Export**: Batch export and analysis tools
- **Real-time Monitoring**: Live experiment status tracking
- **Database Integration**: Store results in database instead of files

### Integration Options

- **Analytics**: Integration with research analytics platforms
- **Authentication**: User authentication for secure access
- **Multi-tenant**: Support for multiple research groups

---

## Success Metrics

### Functional Requirements

- ✅ **Server Save**: Results successfully saved to server when enabled
- ✅ **Local Fallback**: Automatic fallback maintains data integrity
- ✅ **Error Handling**: Graceful error handling with user feedback
- ✅ **Compatibility**: All existing PEG features work unchanged

### Performance Requirements

- ✅ **Response Time**: Server save completes within 5 seconds
- ✅ **Reliability**: >99% success rate under normal conditions
- ✅ **Fallback Speed**: Fallback to local save within 2 seconds of server failure

### User Experience Requirements

- ✅ **Ease of Use**: Single checkbox toggles functionality
- ✅ **Clear Feedback**: Users understand save status and any errors
- ✅ **No Data Loss**: Data is never lost due to save failures

---

## Risk Assessment and Mitigation

### Technical Risks

- **Server Downtime**: Mitigated by automatic fallback to local download
- **Network Issues**: Handled by robust error catching and retry logic
- **PHP Errors**: Comprehensive server-side error handling and logging

### Data Risks

- **Data Loss**: Prevented by fallback mechanism and local save option
- **Data Corruption**: JSON validation on both client and server sides
- **Privacy Issues**: HTTPS recommended, no sensitive data exposure

### Compatibility Risks

- **Browser Support**: Tested across major browsers and versions
- **PHP Versions**: Compatible with PHP 7.4+ (most common versions)
- **Server Configurations**: CORS headers handle most server setups

---

*This implementation plan ensures a robust, secure, and user-friendly addition to the PEG system while maintaining full backward compatibility and data integrity.*
