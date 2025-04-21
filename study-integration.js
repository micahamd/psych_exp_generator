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
    
    // Handle messages from the study manager
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'loadStudy' && event.data.study) {
            loadStudyFromData(event.data.study);
        }
    });
}

// Function to load a study from data
function loadStudyFromData(studyData) {
    // Validate the study data
    if (!studyData.configurations || !Array.isArray(studyData.configurations)) {
        alert('Invalid study data format.');
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
    document.getElementById('study-window').innerHTML = '';
    
    // Load the configurations
    studyData.configurations.forEach(config => {
        // Ensure the configuration has a unique ID
        if (!config.id) {
            config.id = Date.now() + Math.random().toString(36).substring(2, 11);
        }
        
        // Add to the study configurations array
        studyConfigurations.push(config);
        
        // Display in the UI
        displayConfiguration(config);
    });
    
    // Show success message
    alert(`Study "${studyData.name}" loaded successfully with ${studyData.configurations.length} configuration(s).`);
}
