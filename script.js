document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const experimentForm = document.getElementById('experiment-form');
    const introScreen = document.getElementById('intro-screen');
    const experimentContainer = document.getElementById('experiment-container');
    const experimentScreen = document.getElementById('experiment-screen');
    const completionScreen = document.getElementById('completion-screen');
    const fixationPoint = document.getElementById('fixation-point');
    const stimulusText = document.getElementById('stimulus-text');
    const okBtn = document.getElementById('ok-btn');
    
    // Experiment variables
    let trialInterval;
    let fixationInterval;
    let trialBackground;
    let showFixation;
    let trialCount;
    let stimuli;
    let stimuliIndex;
    let randomizeStimuli;
    let responseKey;
    let currentTrial = 0;
    let experimentRunning = false;
    let stimuliUsed = []; // Track which stimuli have been used (for random mode)
    
    // Form submission event listener
    experimentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        trialInterval = parseInt(document.getElementById('trial-interval').value);
        fixationInterval = parseInt(document.getElementById('fixation-interval').value);
        trialBackground = document.getElementById('trial-background').value;
        showFixation = document.getElementById('fixation').value === 'yes';
        trialCount = parseInt(document.getElementById('trial-count').value);
        randomizeStimuli = document.getElementById('randomize-stimuli').checked;
        
        // Parse stimuli - trim each item to remove extra spaces
        const stimuliInput = document.getElementById('stimuli-text').value;
        stimuli = stimuliInput.split(',').map(item => item.trim()).filter(item => item !== '');
        
        if (stimuli.length === 0) {
            alert('Please enter at least one stimulus');
            return;
        }
        
        responseKey = document.getElementById('response-key').value.trim() || 'Space';
        
        // Validate inputs
        if (trialCount < 1 || trialCount > 999) {
            alert('Trial count must be between 1 and 999');
            return;
        }
        
        // Initialize stimuli index and tracking
        stimuliIndex = 0;
        stimuliUsed = [];
        
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
        
        // Initialize and hide both fixation and stimulus
        fixationPoint.classList.add('hidden');
        stimulusText.classList.add('hidden');
        
        // Start first trial
        currentTrial = 0;
        experimentRunning = true;
        
        // Listen for key press
        document.addEventListener('keydown', handleKeyPress);
        
        // Begin the trial sequence
        startTrial();
    }
    
    // Start a new trial
    function startTrial() {
        // Show fixation if enabled
        if (showFixation) {
            fixationPoint.classList.remove('hidden');
            stimulusText.classList.add('hidden');
            
            // After fixation interval, show stimulus
            setTimeout(showStimulus, fixationInterval);
        } else {
            // Skip fixation, show stimulus immediately
            showStimulus();
        }
    }
    
    // Get the next stimulus based on randomization setting
    function getNextStimulus() {
        if (randomizeStimuli) {
            // If all stimuli have been used, reset the tracking
            if (stimuliUsed.length >= stimuli.length) {
                stimuliUsed = [];
            }
            
            // Find an unused stimulus
            let availableStimuli = stimuli.filter(item => !stimuliUsed.includes(item));
            let selectedStimulus;
            
            if (availableStimuli.length > 0) {
                // Select a random stimulus from available ones
                const randomIndex = Math.floor(Math.random() * availableStimuli.length);
                selectedStimulus = availableStimuli[randomIndex];
            } else {
                // This shouldn't happen, but just in case
                selectedStimulus = stimuli[Math.floor(Math.random() * stimuli.length)];
            }
            
            // Mark this stimulus as used
            stimuliUsed.push(selectedStimulus);
            return selectedStimulus;
        } else {
            // Sequential mode: just advance the index
            const selectedStimulus = stimuli[stimuliIndex];
            stimuliIndex = (stimuliIndex + 1) % stimuli.length;
            return selectedStimulus;
        }
    }
    
    // Show the stimulus for this trial
    function showStimulus() {
        // Hide fixation
        fixationPoint.classList.add('hidden');
        
        // Get the current stimulus and set it
        const currentStimulus = getNextStimulus();
        stimulusText.textContent = currentStimulus;
        stimulusText.classList.remove('hidden');
    }
    
    // Handle key press during experiment
    function handleKeyPress(e) {
        if (!experimentRunning) return;
        
        const keyPressed = e.code === 'Space' ? 'Space' : e.key.toUpperCase();
        
        if (keyPressed.toUpperCase() === responseKey.toUpperCase()) {
            e.preventDefault(); // Prevent default action (like scrolling)
            
            // Only respond if stimulus is showing (not during fixation or interval)
            if (!stimulusText.classList.contains('hidden')) {
                advanceTrial();
            }
        }
    }
    
    // Advance to the next trial
    function advanceTrial() {
        // Hide stimulus during the inter-trial interval
        stimulusText.classList.add('hidden');
        
        setTimeout(function() {
            currentTrial++;
            
            if (currentTrial < trialCount) {
                // Start the next trial
                startTrial();
            } else {
                // End experiment
                endExperiment();
            }
        }, trialInterval);
    }
    
    // End the experiment
    function endExperiment() {
        experimentRunning = false;
        experimentContainer.classList.add('hidden');
        completionScreen.classList.remove('hidden');
        document.removeEventListener('keydown', handleKeyPress);
    }
    
    // OK button click
    okBtn.addEventListener('click', function() {
        completionScreen.classList.add('hidden');
        introScreen.classList.remove('hidden');
        
        // Reset form values to defaults
        document.getElementById('trial-interval').value = 200;
        document.getElementById('fixation-interval').value = 100;
        document.getElementById('trial-background').value = 'grey';
        document.getElementById('fixation').value = 'yes';
        document.getElementById('trial-count').value = 4;
        document.getElementById('stimuli-text').value = 'apple, corn, speed';
        document.getElementById('response-key').value = '';
        document.getElementById('randomize-stimuli').checked = true;
    });
});
