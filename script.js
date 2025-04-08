document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const experimentForm = document.getElementById('experiment-form');
    const introScreen = document.getElementById('intro-screen');
    const experimentContainer = document.getElementById('experiment-container');
    const experimentScreen = document.getElementById('experiment-screen');
    const completionScreen = document.getElementById('completion-screen');
    const fixationPoint = document.getElementById('fixation-point');
    const stimulusText = document.getElementById('stimulus-text');
    const feedbackText = document.getElementById('feedback-text');
    const okBtn = document.getElementById('ok-btn');
    const srMappingBtn = document.getElementById('sr-mapping-btn');
    const srMappingModal = document.getElementById('sr-mapping-modal');
    const mappingTbody = document.getElementById('mapping-tbody');
    const saveMappingsBtn = document.getElementById('save-mappings-btn');
    const closeModalBtn = document.querySelector('.close-btn');
    
    // Experiment variables
    let trialInterval;
    let fixationInterval;
    let stimulusOffset;
    let trialBackground;
    let showFixation;
    let fixationColor;
    let trialCount;
    let stimuli;
    let stimuliIndex;
    let randomizeStimuli;
    let responseKey;
    let stimulusSize;
    let stimulusColor;
    let provideFeedback;
    let feedbackDuration;
    let currentTrial = 0;
    let experimentRunning = false;
    let stimuliUsed = [];
    let stimulusTimer = null;
    let feedbackTimer = null;
    let currentSequence = [];
    let sequenceIndex = 0;
    let stimuliResponses = {}; // Object to store stimulus-response mappings
    let hasCustomMappings = false; // Flag to check if custom mappings are in use
    
    // Form submission event listener
    experimentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        trialInterval = parseInt(document.getElementById('trial-interval').value);
        fixationInterval = parseInt(document.getElementById('fixation-interval').value);
        stimulusOffset = parseInt(document.getElementById('stimulus-offset').value);
        trialBackground = document.getElementById('trial-background').value;
        showFixation = document.getElementById('fixation').value === 'yes';
        fixationColor = document.getElementById('fixation-color').value;
        trialCount = parseInt(document.getElementById('trial-count').value);
        randomizeStimuli = document.getElementById('randomize-stimuli').checked;
        stimulusSize = parseInt(document.getElementById('stimulus-size').value);
        stimulusColor = document.getElementById('stimulus-color').value;
        provideFeedback = document.getElementById('provide-feedback').checked;
        
        feedbackDuration = parseInt(document.getElementById('feedback-duration').value);
        
        // Parse stimuli
        const stimuliInput = document.getElementById('stimuli-text').value;
        stimuli = parseStimuli(stimuliInput);
        
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
        
        // Initialize variables
        stimuliIndex = 0;
        stimuliUsed = [];
        sequenceIndex = 0;
        currentTrial = 0;
        
        // Start experiment
        startExperiment();
    });

    // Parse stimuli input to handle sequences
    function parseStimuli(input) {
        const result = [];
        let inSequence = false;
        let currentItem = '';
        let currentSequence = [];
        
        // Helper function to add an item to the result
        function addItem() {
            const trimmed = currentItem.trim();
            if (trimmed) {
                if (inSequence) {
                    currentSequence.push(trimmed);
                } else {
                    // Single item becomes a sequence of one
                    result.push([trimmed]);
                }
            }
            currentItem = '';
        }
        
        // Process each character in the input
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if (char === '[') {
                inSequence = true;
                // If there was text before the bracket, ignore it
                currentItem = '';
            } else if (char === ']') {
                // End of a sequence, add the current item if any
                addItem();
                inSequence = false;
                // Add the sequence to the result if not empty
                if (currentSequence.length > 0) {
                    result.push([...currentSequence]);
                    currentSequence = [];
                }
            } else if (char === ',' && !inSequence) {
                // End of an item outside a sequence
                addItem();
            } else {
                // Regular character
                if (inSequence) {
                    if (char === ',') {
                        // Within a sequence, comma separates items
                        addItem();
                    } else {
                        currentItem += char;
                    }
                } else {
                    currentItem += char;
                }
            }
        }
        
        // Add any remaining item
        addItem();
        
        // If no valid stimuli were found, create a default stimulus
        if (result.length === 0) {
            result.push(["default"]);
        }
        
        return result;
    }
    
    // Start the experiment
    function startExperiment() {
        // Hide intro screen and show experiment container
        introScreen.classList.add('hidden');
        experimentContainer.classList.remove('hidden');
        
        // Set background color
        experimentScreen.style.backgroundColor = trialBackground;
        
        // Set fixation color
        fixationPoint.style.color = fixationColor;
        
        // Hide all elements initially
        fixationPoint.classList.add('hidden');
        stimulusText.classList.add('hidden');
        feedbackText.classList.add('hidden');
        
        // Start first trial
        experimentRunning = true;
        
        // Listen for key press
        document.addEventListener('keydown', handleKeyPress);
        
        // Begin the trial sequence
        startTrial();
    }
    
    // Start a new trial
    function startTrial() {
        // Reset sequence index for the new trial
        sequenceIndex = 0;
        
        // Show fixation if enabled
        if (showFixation) {
            fixationPoint.classList.remove('hidden');
            stimulusText.classList.add('hidden');
            feedbackText.classList.add('hidden');
            
            // After fixation interval, show stimulus
            setTimeout(showStimulus, fixationInterval);
        } else {
            // Skip fixation, show stimulus immediately
            showStimulus();
        }
    }
    
    // Get the next stimulus sequence
    function getNextStimulusSequence() {
        if (randomizeStimuli) {
            // If all stimuli have been used, reset the tracking
            if (stimuliUsed.length >= stimuli.length) {
                stimuliUsed = [];
            }
            
            // Find an unused stimulus sequence
            let availableStimuli = stimuli.filter(function(_, index) {
                return !stimuliUsed.includes(index);
            });
            
            if (availableStimuli.length > 0) {
                // Select a random stimulus from available ones
                const randomIndex = Math.floor(Math.random() * availableStimuli.length);
                const selectedSequence = availableStimuli[randomIndex];
                
                // Find the original index of this sequence to mark as used
                const originalIndex = stimuli.findIndex(seq => 
                    JSON.stringify(seq) === JSON.stringify(selectedSequence));
                stimuliUsed.push(originalIndex);
                
                return selectedSequence;
            } else {
                // This shouldn't happen, but just in case
                return stimuli[Math.floor(Math.random() * stimuli.length)];
            }
        } else {
            // Sequential mode: just advance the index
            const selectedSequence = stimuli[stimuliIndex];
            stimuliIndex = (stimuliIndex + 1) % stimuli.length;
            return selectedSequence;
        }
    }
    
    // Show the stimulus for this trial
    function showStimulus() {
        clearAllTimers();
        fixationPoint.classList.add('hidden');
        feedbackText.classList.add('hidden');

        if (sequenceIndex === 0) {
            currentSequence = getNextStimulusSequence();
        }
        const currentStimulus = currentSequence[sequenceIndex];
        stimulusText.textContent = currentStimulus;
        stimulusText.style.fontSize = `${stimulusSize}px`;
        stimulusText.style.color = stimulusColor;
        stimulusText.classList.remove('hidden');

        if (stimulusOffset > 0) {
            stimulusTimer = setTimeout(() => {
                stimulusText.classList.add('hidden');
                if (sequenceIndex < currentSequence.length - 1) {
                    sequenceIndex++;
                    setTimeout(showStimulus, 10);
                } else if (!provideFeedback) {
                    setTimeout(() => {
                        advanceTrial();
                    }, 10);
                }
            }, stimulusOffset);
        }
    }

    // Corrected handleKeyPress function
    function handleKeyPress(e) {
        if (!experimentRunning) return;
        const keyPressed = (e.code === 'Space') ? 'SPACE' : e.key.toUpperCase();

        if (fixationPoint.classList.contains('hidden')) {
            e.preventDefault();

            // Determine if we're at the last item in the current sequence
            const isEndOfSequence = (sequenceIndex === currentSequence.length - 1);

            // Get correct key based on custom mappings or default
            let isCorrect = false;
            if (hasCustomMappings) {
                const stimulusDisplay = currentSequence.length > 1
                    ? `[${currentSequence.join(', ')}]`
                    : currentSequence[0];
                const correctKey = stimuliResponses[stimulusDisplay];
                if (correctKey) {
                    isCorrect = (keyPressed === correctKey.toUpperCase());
                } else {
                    isCorrect = (keyPressed === responseKey.toUpperCase());
                }
            } else {
                isCorrect = (keyPressed === responseKey.toUpperCase());
            }

            // If correct
            if (isCorrect) {
                // Move to the next item if not the last in the sequence
                if (!isEndOfSequence) {
                    sequenceIndex++;
                    showStimulus();
                } else {
                    // Only show feedback at the last item
                    if (provideFeedback) {
                        showFeedback(true);
                        feedbackTimer = setTimeout(() => {
                            hideFeedback();
                            processCorrectResponse();
                        }, feedbackDuration);
                    } else {
                        processCorrectResponse();
                    }
                }
            } else {
                // If incorrect, only show feedback at the last item
                if (provideFeedback && isEndOfSequence) {
                    showFeedback(false);
                    feedbackTimer = setTimeout(() => {
                        hideFeedback();
                    }, feedbackDuration);
                }
            }
        }
    }

    // Introduced helper to process correct responses in sequences
    function processCorrectResponse() {
        if (sequenceIndex < currentSequence.length - 1) {
            sequenceIndex++;
            showStimulus();
        } else {
            advanceTrial();
        }
    }

    // Hard-code the feedback text
    function showFeedback(isCorrect) {
        // Clear any existing feedback timer
        if (feedbackTimer) {
            clearTimeout(feedbackTimer);
            feedbackTimer = null;
        }

        // Hide stimulus
        stimulusText.classList.add('hidden');

        // Set feedback text
        feedbackText.textContent = isCorrect ? 'Correct' : 'X';
        
        // Set feedback color
        feedbackText.style.color = isCorrect ? '#4CAF50' : '#F44336'; // Green or Red
        
        // Show feedback
        feedbackText.classList.remove('hidden');
    }
    
    // Hide feedback
    function hideFeedback() {
        feedbackText.classList.add('hidden');
    }

    // Clean up advanceTrial
    function advanceTrial() {
        clearAllTimers();
        stimulusText.classList.add('hidden');
        feedbackText.classList.add('hidden');
        setTimeout(() => {
            currentTrial++;
            if (currentTrial < trialCount) {
                startTrial();
            } else {
                endExperiment();
            }
        }, trialInterval);
    }

    // Correct endExperiment
    function endExperiment() {
        experimentRunning = false;
        experimentContainer.classList.add('hidden');
        completionScreen.classList.remove('hidden');
        document.removeEventListener('keydown', handleKeyPress);
        clearAllTimers();
    }

    // Clear all timers
    function clearAllTimers() {
        if (stimulusTimer) {
            clearTimeout(stimulusTimer);
            stimulusTimer = null;
        }
        
        if (feedbackTimer) {
            clearTimeout(feedbackTimer);
            feedbackTimer = null;
        }
    }
    
    // OK button click
    okBtn.addEventListener('click', function() {
        completionScreen.classList.add('hidden');
        introScreen.classList.remove('hidden');
        
        // Reset form values to defaults
        document.getElementById('trial-interval').value = 200;
        document.getElementById('fixation-interval').value = 100;
        document.getElementById('stimulus-offset').value = 0;
        document.getElementById('trial-background').value = 'grey';
        document.getElementById('fixation').value = 'yes';
        document.getElementById('fixation-color').value = 'white';
        document.getElementById('trial-count').value = 4;
        document.getElementById('stimuli-text').value = 'apple, corn, speed';
        document.getElementById('stimulus-size').value = '42';
        document.getElementById('stimulus-color').value = 'white';
        document.getElementById('response-key').value = '';
        document.getElementById('randomize-stimuli').checked = true;
        document.getElementById('provide-feedback').checked = false;
        document.getElementById('feedback-text').value = 'Correct, X';
        document.getElementById('feedback-duration').value = 500;
        
        // Reset stimulus-response mappings
        stimuliResponses = {};
        hasCustomMappings = false;
        srMappingBtn.textContent = "Custom S-R Mappings";
    });
    
    // Add event listener for S-R mapping button
    srMappingBtn.addEventListener('click', function() {
        // Parse current stimuli to generate mapping table
        const stimuliInput = document.getElementById('stimuli-text').value;
        const parsedStimuli = parseStimuli(stimuliInput);
        
        // Generate table rows
        generateMappingTable(parsedStimuli);
        
        // Show modal
        srMappingModal.classList.remove('hidden');
    });
    
    // Close modal when clicking X
    closeModalBtn.addEventListener('click', function() {
        srMappingModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === srMappingModal) {
            srMappingModal.classList.add('hidden');
        }
    });
    
    // Save mappings button
    saveMappingsBtn.addEventListener('click', function() {
        // Save the mappings from the inputs
        const mappingRows = mappingTbody.querySelectorAll('tr');
        
        stimuliResponses = {};
        hasCustomMappings = false;
        
        mappingRows.forEach(row => {
            const stimulusText = row.getAttribute('data-stimulus');
            const responseInput = row.querySelector('input');
            const responseKey = responseInput.value.trim();
            
            if (responseKey) {
                stimuliResponses[stimulusText] = responseKey;
                hasCustomMappings = true;
            }
        });
        
        // Close the modal
        srMappingModal.classList.add('hidden');
        
        // Visual feedback that mappings were saved
        srMappingBtn.textContent = hasCustomMappings ? 
            "Custom S-R Mappings (Set)" : "Custom S-R Mappings";
    });
    
    // Generate mapping table based on stimuli
    function generateMappingTable(parsedStimuli) {
        // Clear existing rows
        mappingTbody.innerHTML = '';
        
        // Create a row for each stimulus or sequence
        parsedStimuli.forEach(stimulusSeq => {
            const row = document.createElement('tr');
            // Use "[apple, corn]" for multi-item sequences or "apple" for single-item
            const storedStimulus = (stimulusSeq.length > 1)
                ? `[${stimulusSeq.join(', ')}]`
                : stimulusSeq[0];

            row.setAttribute('data-stimulus', storedStimulus);

            const stimulusCell = document.createElement('td');
            stimulusCell.textContent = storedStimulus;
            row.appendChild(stimulusCell);

            const responseCell = document.createElement('td');
            const responseInput = document.createElement('input');
            responseInput.type = 'text';
            responseInput.placeholder = 'Enter key';
            
            // Set value if mapping exists
            if (stimuliResponses[storedStimulus]) {
                responseInput.value = stimuliResponses[storedStimulus];
            }
            
            responseCell.appendChild(responseInput);
            row.appendChild(responseCell);
            
            mappingTbody.appendChild(row);
        });
    }
});
