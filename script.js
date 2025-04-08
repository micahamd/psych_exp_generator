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
    let additionalResponses; // Array to store additional valid responses
    let stimulusSize;
    let stimulusColor;
    let provideFeedback;
    let feedbackDuration;
    let positionX;
    let positionY;
    let currentTrial = 0;
    let experimentRunning = false;
    let stimuliUsed = [];
    let stimulusTimer = null;
    let feedbackTimer = null;
    let currentSequence = [];
    let sequenceIndex = 0;
    let stimuliResponses = {}; // Object to store stimulus-response mappings and positions
    let hasCustomMappings = false; // Flag to check if custom mappings are in use

    // New variables for state persistence
    let lastStimuliText = '';
    let savedState = {};
    
    // Load saved state from localStorage if available
    try {
        const savedStateJSON = localStorage.getItem('experimentBuilderState');
        if (savedStateJSON) {
            savedState = JSON.parse(savedStateJSON);
            
            // Populate form with saved values
            if (savedState.trialInterval) document.getElementById('trial-interval').value = savedState.trialInterval;
            if (savedState.fixationInterval) document.getElementById('fixation-interval').value = savedState.fixationInterval;
            if (savedState.stimulusOffset) document.getElementById('stimulus-offset').value = savedState.stimulusOffset;
            if (savedState.trialBackground) document.getElementById('trial-background').value = savedState.trialBackground;
            if (savedState.fixation) document.getElementById('fixation').value = savedState.fixation;
            if (savedState.fixationColor) document.getElementById('fixation-color').value = savedState.fixationColor;
            if (savedState.trialCount) document.getElementById('trial-count').value = savedState.trialCount;
            if (savedState.stimuliText) document.getElementById('stimuli-text').value = savedState.stimuliText;
            if (savedState.randomizeStimuli !== undefined) document.getElementById('randomize-stimuli').checked = savedState.randomizeStimuli;
            if (savedState.stimulusSize) document.getElementById('stimulus-size').value = savedState.stimulusSize;
            if (savedState.stimulusColor) document.getElementById('stimulus-color').value = savedState.stimulusColor;
            if (savedState.responseKey) document.getElementById('response-key').value = savedState.responseKey;
            if (savedState.additionalResponses) document.getElementById('additional-responses').value = savedState.additionalResponses;
            if (savedState.provideFeedback !== undefined) document.getElementById('provide-feedback').checked = savedState.provideFeedback;
            if (savedState.feedbackDuration) document.getElementById('feedback-duration').value = savedState.feedbackDuration;
            if (savedState.positionX !== undefined) document.getElementById('position-x').value = savedState.positionX;
            if (savedState.positionY !== undefined) document.getElementById('position-y').value = savedState.positionY;
            
            // Restore S-R mappings
            if (savedState.stimuliResponses) {
                stimuliResponses = savedState.stimuliResponses;
                hasCustomMappings = Object.keys(stimuliResponses).length > 0;
                if (hasCustomMappings) {
                    srMappingBtn.textContent = "Custom S-R Mappings (Set)";
                }
            }
            
            // Remember last stimuli text to track changes
            lastStimuliText = document.getElementById('stimuli-text').value;
        }
    } catch (e) {
        console.error("Error loading saved state:", e);
        // If there's an error, we'll just use the default values
    }
    
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
        positionX = parseInt(document.getElementById('position-x').value) || 0;
        positionY = parseInt(document.getElementById('position-y').value) || 0;
        
        // Parse stimuli
        const stimuliInput = document.getElementById('stimuli-text').value;
        stimuli = parseStimuli(stimuliInput);
        
        if (stimuli.length === 0) {
            alert('Please enter at least one stimulus');
            return;
        }
        
        responseKey = document.getElementById('response-key').value.trim() || 'Space';
        
        // Parse additional responses
        const additionalResponsesInput = document.getElementById('additional-responses').value.trim();
        additionalResponses = additionalResponsesInput ? 
            additionalResponsesInput.split(',').map(r => r.trim().toUpperCase()) : 
            ['A']; // Default to 'A' if empty
        
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
        
        // Save current state before starting experiment
        saveCurrentState();
        
        // Start experiment
        startExperiment();
    });

    // Function to save current state to localStorage
    function saveCurrentState() {
        const currentState = {
            trialInterval: parseInt(document.getElementById('trial-interval').value),
            fixationInterval: parseInt(document.getElementById('fixation-interval').value),
            stimulusOffset: parseInt(document.getElementById('stimulus-offset').value),
            trialBackground: document.getElementById('trial-background').value,
            fixation: document.getElementById('fixation').value,
            fixationColor: document.getElementById('fixation-color').value,
            trialCount: parseInt(document.getElementById('trial-count').value),
            stimuliText: document.getElementById('stimuli-text').value,
            randomizeStimuli: document.getElementById('randomize-stimuli').checked,
            stimulusSize: document.getElementById('stimulus-size').value,
            stimulusColor: document.getElementById('stimulus-color').value,
            responseKey: document.getElementById('response-key').value.trim(),
            additionalResponses: document.getElementById('additional-responses').value.trim(),
            provideFeedback: document.getElementById('provide-feedback').checked,
            feedbackDuration: parseInt(document.getElementById('feedback-duration').value),
            positionX: parseInt(document.getElementById('position-x').value) || 0,
            positionY: parseInt(document.getElementById('position-y').value) || 0,
            stimuliResponses: stimuliResponses
        };
        
        localStorage.setItem('experimentBuilderState', JSON.stringify(currentState));
        savedState = currentState;
    }

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
        
        // Apply the position offset correctly - the transform needs to maintain
        // the initial -50% centering while adding the user's desired offset
        fixationPoint.style.transform = `translate(calc(-50% + ${positionX}px), calc(-50% + ${positionY}px))`;
        stimulusText.style.transform = `translate(calc(-50% + ${positionX}px), calc(-50% + ${positionY}px))`;
        feedbackText.style.transform = `translate(-50%, -50%)`; // Keep feedback at center
        
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
        
        // Check for custom settings for this stimulus
        const stimulusDisplay = currentSequence.length > 1
            ? `[${currentSequence.join(', ')}]`
            : currentSequence[0];
            
        const mapping = stimuliResponses[stimulusDisplay] || {};
        
        // Apply custom or default stimulus size
        const customSize = mapping.size !== undefined ? mapping.size : stimulusSize;
        stimulusText.style.fontSize = `${customSize}px`;
        
        // Apply custom or default stimulus color
        const customColor = mapping.color || stimulusColor;
        stimulusText.style.color = customColor;
        
        // Apply custom position if available, otherwise use global position
        const customX = mapping.x !== undefined ? mapping.x : positionX;
        const customY = mapping.y !== undefined ? mapping.y : positionY;
        stimulusText.style.transform = `translate(calc(-50% + ${customX}px), calc(-50% + ${customY}px))`;
        
        // Also update fixation position if we're at the start of a sequence
        if (sequenceIndex === 0 && showFixation) {
            fixationPoint.style.transform = `translate(calc(-50% + ${customX}px), calc(-50% + ${customY}px))`;
        }
        
        stimulusText.classList.remove('hidden');

        // Use custom offset if available, otherwise use global offset
        const customOffset = mapping.offset !== undefined ? mapping.offset : stimulusOffset;
        
        if (customOffset > 0) {
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
            }, customOffset);
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
            let isAdditionalResponse = false;
            
            // Check if the pressed key is in additionalResponses
            isAdditionalResponse = additionalResponses.includes(keyPressed);
            
            if (hasCustomMappings) {
                const stimulusDisplay = currentSequence.length > 1
                    ? `[${currentSequence.join(', ')}]`
                    : currentSequence[0];
                const mappingInfo = stimuliResponses[stimulusDisplay];
                if (mappingInfo && mappingInfo.key) {
                    isCorrect = (keyPressed === mappingInfo.key.toUpperCase());
                } else {
                    isCorrect = (keyPressed === responseKey.toUpperCase());
                }
            } else {
                isCorrect = (keyPressed === responseKey.toUpperCase());
            }

            // If correct or it's an additional response key
            if (isCorrect || isAdditionalResponse) {
                // Move to the next item if not the last in the sequence
                if (!isEndOfSequence) {
                    sequenceIndex++;
                    showStimulus();
                } else {
                    // Only show feedback at the last item
                    if (provideFeedback) {
                        showFeedback(isCorrect); // Only show "correct" feedback for the specific correct key
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
        
        // Reset experiment-specific variables but keep configurations
        currentTrial = 0;
        experimentRunning = false;
        stimuliUsed = [];
        clearAllTimers();
        
        // Save current state
        saveCurrentState();
    });
    
    // Add event listener for S-R mapping button
    srMappingBtn.addEventListener('click', function() {
        // Parse current stimuli to generate mapping table
        const stimuliInput = document.getElementById('stimuli-text').value;
        
        // Check if stimuli have changed
        const stimuliChanged = (stimuliInput !== lastStimuliText);
        
        // If stimuli changed, we need to regenerate mappings
        if (stimuliChanged) {
            lastStimuliText = stimuliInput;
            
            // If stimuli changed, clear old mappings that no longer apply
            const newParsedStimuli = parseStimuli(stimuliInput);
            const newStimuliKeys = newParsedStimuli.map(seq => {
                return seq.length > 1 ? `[${seq.join(', ')}]` : seq[0];
            });
            
            // Create a new stimuliResponses with only valid keys
            const updatedResponses = {};
            for (const key of newStimuliKeys) {
                if (stimuliResponses[key]) {
                    updatedResponses[key] = stimuliResponses[key];
                }
            }
            
            // Update with new mappings object
            stimuliResponses = updatedResponses;
        }
        
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
            const responseInput = row.querySelector('input[data-type="key"]');
            const xPosInput = row.querySelector('input[data-type="x-pos"]');
            const yPosInput = row.querySelector('input[data-type="y-pos"]');
            const offsetInput = row.querySelector('input[data-type="offset"]');
            const colorInput = row.querySelector('input[data-type="color"]');
            const sizeInput = row.querySelector('input[data-type="size"]');
            
            // Get values, use default if empty
            const responseKey = responseInput.value.trim() || responseInput.getAttribute('data-default');
            const xPos = xPosInput.value.trim() ? parseInt(xPosInput.value) : parseInt(xPosInput.getAttribute('data-default'));
            const yPos = yPosInput.value.trim() ? parseInt(yPosInput.value) : parseInt(yPosInput.getAttribute('data-default'));
            const offset = offsetInput.value.trim() ? parseInt(offsetInput.value) : parseInt(offsetInput.getAttribute('data-default'));
            const color = colorInput.value.trim() || colorInput.getAttribute('data-default');
            const size = sizeInput.value.trim() ? parseInt(sizeInput.value) : parseInt(sizeInput.getAttribute('data-default'));
            
            // Store the custom values (only if different from form defaults)
            const customMapping = {};
            
            const defaultResponseKey = document.getElementById('response-key').value.trim() || 'Space';
            const defaultSize = parseInt(document.getElementById('stimulus-size').value);
            const defaultColor = document.getElementById('stimulus-color').value;
            const defaultOffset = parseInt(document.getElementById('stimulus-offset').value);
            const defaultX = parseInt(document.getElementById('position-x').value) || 0;
            const defaultY = parseInt(document.getElementById('position-y').value) || 0;
            
            if (responseKey !== defaultResponseKey) customMapping.key = responseKey;
            if (xPos !== defaultX) customMapping.x = xPos;
            if (yPos !== defaultY) customMapping.y = yPos;
            if (offset !== defaultOffset) customMapping.offset = offset;
            if (color !== defaultColor) customMapping.color = color;
            if (size !== defaultSize) customMapping.size = size;
            
            // Only save if there's at least one custom setting
            if (Object.keys(customMapping).length > 0) {
                stimuliResponses[stimulusText] = customMapping;
                hasCustomMappings = true;
            }
        });
        
        // Close the modal
        srMappingModal.classList.add('hidden');
        
        // Visual feedback that mappings were saved
        srMappingBtn.textContent = hasCustomMappings ? 
            "Custom S-R Mappings (Set)" : "Custom S-R Mappings";
            
        // Save state with updated mappings
        saveCurrentState();
    });
    
    // Generate mapping table with default values
    function generateMappingTable(parsedStimuli) {
        // Clear existing rows
        mappingTbody.innerHTML = '';
        
        // Get default values from current form settings
        const defaultResponseKey = document.getElementById('response-key').value.trim() || 'Space';
        const defaultSize = document.getElementById('stimulus-size').value;
        const defaultColor = document.getElementById('stimulus-color').value;
        const defaultOffset = document.getElementById('stimulus-offset').value;
        const defaultX = document.getElementById('position-x').value || '0';
        const defaultY = document.getElementById('position-y').value || '0';
        
        // Create a row for each stimulus or sequence
        parsedStimuli.forEach(stimulusSeq => {
            const row = document.createElement('tr');
            // Use "[apple, corn]" for multi-item sequences or "apple" for single-item
            const storedStimulus = (stimulusSeq.length > 1)
                ? `[${stimulusSeq.join(', ')}]`
                : stimulusSeq[0];

            row.setAttribute('data-stimulus', storedStimulus);

            // Stimulus cell
            const stimulusCell = document.createElement('td');
            stimulusCell.textContent = storedStimulus;
            row.appendChild(stimulusCell);

            // Response key cell
            const responseCell = document.createElement('td');
            const responseInput = document.createElement('input');
            responseInput.type = 'text';
            responseInput.placeholder = defaultResponseKey;
            responseInput.setAttribute('data-type', 'key');
            responseInput.setAttribute('data-default', defaultResponseKey);
            responseCell.appendChild(responseInput);
            
            // X position cell
            const xPosCell = document.createElement('td');
            const xPosInput = document.createElement('input');
            xPosInput.type = 'number';
            xPosInput.placeholder = defaultX;
            xPosInput.setAttribute('data-type', 'x-pos');
            xPosInput.setAttribute('data-default', defaultX);
            xPosCell.appendChild(xPosInput);
            
            // Y position cell
            const yPosCell = document.createElement('td');
            const yPosInput = document.createElement('input');
            yPosInput.type = 'number';
            yPosInput.placeholder = defaultY;
            yPosInput.setAttribute('data-type', 'y-pos');
            yPosInput.setAttribute('data-default', defaultY);
            yPosCell.appendChild(yPosInput);
            
            // Offset cell
            const offsetCell = document.createElement('td');
            const offsetInput = document.createElement('input');
            offsetInput.type = 'number';
            offsetInput.placeholder = defaultOffset;
            offsetInput.setAttribute('data-type', 'offset');
            offsetInput.setAttribute('data-default', defaultOffset);
            offsetCell.appendChild(offsetInput);
            
            // Color cell
            const colorCell = document.createElement('td');
            const colorInput = document.createElement('input');
            colorInput.type = 'text';
            colorInput.placeholder = defaultColor;
            colorInput.setAttribute('data-type', 'color');
            colorInput.setAttribute('data-default', defaultColor);
            colorCell.appendChild(colorInput);
            
            // Size cell
            const sizeCell = document.createElement('td');
            const sizeInput = document.createElement('input');
            sizeInput.type = 'number';
            sizeInput.placeholder = defaultSize;
            sizeInput.setAttribute('data-type', 'size');
            sizeInput.setAttribute('data-default', defaultSize);
            sizeCell.appendChild(sizeInput);
            
            // Set values if mapping exists
            if (stimuliResponses[storedStimulus]) {
                const mapping = stimuliResponses[storedStimulus];
                if (mapping.key) responseInput.value = mapping.key;
                if (mapping.x !== undefined) xPosInput.value = mapping.x;
                if (mapping.y !== undefined) yPosInput.value = mapping.y;
                if (mapping.offset !== undefined) offsetInput.value = mapping.offset;
                if (mapping.color) colorInput.value = mapping.color;
                if (mapping.size !== undefined) sizeInput.value = mapping.size;
            }
            
            // Append all cells to the row
            row.appendChild(responseCell);
            row.appendChild(xPosCell);
            row.appendChild(yPosCell);
            row.appendChild(offsetCell);
            row.appendChild(colorCell);
            row.appendChild(sizeCell);
            
            mappingTbody.appendChild(row);
        });
    }

    // Listen for changes to stimuli text and update last known value
    document.getElementById('stimuli-text').addEventListener('change', function() {
        const newValue = this.value;
        if (newValue !== lastStimuliText) {
            lastStimuliText = newValue;
            // We don't clear mappings immediately, only when opening the mapping dialog
        }
    });
    
    // Add event listener for all form inputs to save state when changed
    const formInputs = document.querySelectorAll('#experiment-form input, #experiment-form select, #experiment-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', saveCurrentState);
    });
});
