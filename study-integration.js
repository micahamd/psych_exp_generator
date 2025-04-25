// Check if required functions from script.js are available
document.addEventListener('DOMContentLoaded', function() {
    if (typeof displayConfiguration !== 'function') {
        console.error('displayConfiguration function is not defined. Make sure script.js is loaded before study-integration.js');
    } else {
        console.log('study-integration.js: displayConfiguration function is available');
    }

    if (typeof studyConfigurations === 'undefined') {
        console.error('studyConfigurations variable is not defined. Make sure script.js is loaded before study-integration.js');
    } else {
        console.log('study-integration.js: studyConfigurations variable is available');
    }
});

// Set up event listener for messages from the study manager
// This needs to be outside any function so it's always active
window.addEventListener('message', function(event) {
    console.log('Received message event:', event);

    if (event.data && event.data.type === 'loadStudy' && event.data.study) {
        console.log('Received study data via postMessage:', event.data.study);

        // Load the study data into the main experiment
        loadStudyFromData(event.data.study);

        // Focus the window to show the user that the study has been loaded
        window.focus();
    } else {
        console.log('Received message but not a loadStudy message or missing study data');
    }
});

// Function to open the study manager in a new window
function openStudyManager(mode) {
    // Check if there are study configurations when saving
    if (mode === 'save' && studyConfigurations.length === 0) {
        alert('Please add at least one configuration to the study before saving.');
        return;
    }

    // Open the study manager in a new window
    const studyManagerWindow = window.open('study-manager.html', 'StudyManager', 'width=800,height=800');

    // Wait for the study manager to load
    studyManagerWindow.onload = function() {
        if (mode === 'save') {
            // Create a study object
            const studyObject = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                name: 'Psychology Study ' + new Date().toLocaleDateString(),
                configurations: studyConfigurations
            };

            // Set the study data in the study manager
            studyManagerWindow.document.getElementById('study-name').value = studyObject.name;
            studyManagerWindow.document.getElementById('study-data').value = JSON.stringify(studyObject, null, 2);
        }
    };
}

// Function to load a study from data
function loadStudyFromData(studyData) {
    console.log('loadStudyFromData called with:', studyData);
    console.log('studyConfigurations exists:', typeof studyConfigurations !== 'undefined');
    console.log('displayConfiguration exists:', typeof displayConfiguration === 'function');
    console.log('Current studyConfigurations:', studyConfigurations);

    // Validate the study data
    if (!studyData.configurations || !Array.isArray(studyData.configurations)) {
        alert('Invalid study data format.');
        console.error('Invalid study data format:', studyData);
        return;
    }

    // Confirm with the user if they want to replace the current study
    if (studyConfigurations.length > 0) {
        if (!confirm('Loading this study will replace your current study configurations. Continue?')) {
            return;
        }
    }

    // Clear current configurations
    studyConfigurations = [];
    const studyWindow = document.getElementById('study-window');
    if (!studyWindow) {
        console.error('Could not find study-window element');
        alert('Error: Could not find the study window element. Please refresh the page and try again.');
        return;
    }
    studyWindow.innerHTML = '';

    console.log('Loading configurations:', studyData.configurations.length);

    // Load the configurations
    studyData.configurations.forEach((config, index) => {
        // Ensure the configuration has a unique ID
        if (!config.id) {
            config.id = Date.now() + Math.random().toString(36).substring(2, 11);
        }

        console.log(`Loading configuration ${index + 1}:`, config);

        // Add to the study configurations array
        studyConfigurations.push(config);

        try {
            // Check if displayConfiguration function exists
            if (typeof displayConfiguration !== 'function') {
                console.error('displayConfiguration function is not defined');
                alert('Error: displayConfiguration function is not defined. Please refresh the page and try again.');
                return;
            }

            // Display in the UI
            displayConfiguration(config);
        } catch (error) {
            console.error('Error displaying configuration:', error);
            alert(`Error displaying configuration ${index + 1}. See console for details.`);
        }
    });

    console.log('Study loaded with configurations:', studyConfigurations);

    // Show success message
    alert(`Study "${studyData.name}" loaded successfully with ${studyData.configurations.length} configuration(s).`);
}
