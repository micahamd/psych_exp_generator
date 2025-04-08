document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const experimentForm = document.getElementById('experiment-form');
    const introScreen = document.getElementById('intro-screen');
    const experimentContainer = document.getElementById('experiment-container');
    const experimentScreen = document.getElementById('experiment-screen');
    const completionScreen = document.getElementById('completion-screen');
    const fixationPoint = document.getElementById('fixation-point');
    const okBtn = document.getElementById('ok-btn');
    
    // Experiment variables
    let trialInterval;
    let trialBackground;
    let showFixation;
    let trialCount;
    let responseKey;
    let currentTrial = 0;
    let experimentRunning = false;
    
    // Form submission event listener
    experimentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        trialInterval = parseInt(document.getElementById('trial-interval').value);
        trialBackground = document.getElementById('trial-background').value;
        showFixation = document.getElementById('fixation').value === 'yes';
        trialCount = parseInt(document.getElementById('trial-count').value);
        responseKey = document.getElementById('response-key').value.trim() || 'Space';
        
        // Validate inputs
        if (trialCount < 1 || trialCount > 999) {
            alert('Trial count must be between 1 and 999');
            return;
        }
        
        // Start experiment
        startExperiment();
    });
    
    // Start the experiment
    function startExperiment() {
        // Hide intro screen and show experiment container
        introScreen.classList.add('hidden');
        experimentContainer.classList.remove('hidden');
        
        // Set background color
        experimentScreen.style.backgroundColor = trialBackground;
        
        // Show/hide fixation point based on settings
        if (showFixation) {
            fixationPoint.classList.remove('hidden');
        } else {
            fixationPoint.classList.add('hidden');
        }
        
        // Start first trial
        currentTrial = 0;
        experimentRunning = true;
        
        // Listen for key press
        document.addEventListener('keydown', handleKeyPress);
    }
    
    // Handle key press during experiment
    function handleKeyPress(e) {
        if (!experimentRunning) return;
        
        const keyPressed = e.code === 'Space' ? 'Space' : e.key.toUpperCase();
        
        if (keyPressed.toUpperCase() === responseKey.toUpperCase()) {
            e.preventDefault(); // Prevent default action (like scrolling)
            advanceTrial();
        }
    }
    
    // Advance to the next trial
    function advanceTrial() {
        // Hide fixation for the inter-trial interval
        fixationPoint.classList.add('hidden');
        
        setTimeout(function() {
            currentTrial++;
            
            if (currentTrial < trialCount) {
                // Show fixation again for the next trial if enabled
                if (showFixation) {
                    fixationPoint.classList.remove('hidden');
                }
            } else {
                // End experiment
                endExperiment();
            }
        }, trialInterval);
    }
    
    // End the experiment
    function endExperiment() {
        // Stop the experiment and clean up
        experimentRunning = false;
        experimentContainer.classList.add('hidden');
        
        // Make sure intro screen is hidden before showing completion
        introScreen.classList.add('hidden');
        
        // Show completion screen
        completionScreen.classList.remove('hidden');
        
        // Remove event listener
        document.removeEventListener('keydown', handleKeyPress);
    }
    
    // OK button click handler
    okBtn.addEventListener('click', function() {
        // Hide completion screen
        completionScreen.classList.add('hidden');
        
        // Show intro screen again
        introScreen.classList.remove('hidden');
        
        // Reset form values to defaults
        document.getElementById('trial-interval').value = 200;
        document.getElementById('trial-background').value = 'grey';
        document.getElementById('fixation').value = 'yes';
        document.getElementById('trial-count').value = 4;
        document.getElementById('response-key').value = '';
    });
});
