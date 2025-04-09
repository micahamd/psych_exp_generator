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
    // Add new button references
    const exportMappingsBtn = document.getElementById('export-mappings-btn');
    const importMappingsBtn = document.getElementById('import-mappings-btn');
    const csvFileInput = document.getElementById('csv-file-input');
    
    // Experiment variables
    let trialInterval;
    let fixationInterval;
    let stimulusOffset;
    let trialBackground;
    let canvasBackground; // New variable for canvas background
    let showFixation;
    let fixationColor;
    let trialCount;
    let cycleThreshold = 0; // Add new variable for cycle threshold
    let currentCycleCorrect = 0; // Track correct responses in current cycle
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

    // Add new flag to track zero-offset concurrent stimuli
    let hasConcurrentWithZeroOffset = false;

    // New variables for state persistence
    let lastStimuliText = '';
    let savedState = {};

    // Add new variables for data collection
    let saveData = false;
    let experimentData = [];
    let currentResponse = '';
    let responseStartTime = null;

    // Add new variables for study management
    let studyConfigurations = [];
    let currentStudyIndex = 0;

    // Add this with your other state variables
    let isStudyMode = false;

    // Add a variable to store all study data
    let studyData = [];

    // Function to get current configuration as JSON
    function getCurrentConfiguration() {
        return {
            id: Date.now(), // unique identifier for this configuration
            name: `Task ${studyConfigurations.length + 1}`,
            config: {
                canvasBackground: document.getElementById('canvas-background').value,
                trialInterval: parseInt(document.getElementById('trial-interval').value),
                fixationInterval: parseInt(document.getElementById('fixation-interval').value),
                stimulusOffset: parseInt(document.getElementById('stimulus-offset').value),
                trialBackground: document.getElementById('trial-background').value,
                fixation: document.getElementById('fixation').value,
                fixationColor: document.getElementById('fixation-color').value,
                trialCount: parseInt(document.getElementById('trial-count').value),
                cycleThreshold: parseInt(document.getElementById('cycle-threshold').value),
                stimuliText: document.getElementById('stimuli-text').value,
                randomizeStimuli: document.getElementById('randomize-stimuli').checked,
                stimulusSize: document.getElementById('stimulus-size').value,
                stimulusColor: document.getElementById('stimulus-color').value,
                responseKey: document.getElementById('response-key').value.trim(),
                additionalResponses: document.getElementById('additional-responses').value.trim(),
                provideFeedback: document.getElementById('provide-feedback').checked,
                feedbackDuration: parseInt(document.getElementById('feedback-duration').value),
                saveData: document.getElementById('save-data').checked,
                stimuliResponses: stimuliResponses
            }
        };
    }

    // Function to display configuration in study window
    function displayConfiguration(config) {
        const studyWindow = document.getElementById('study-window');
        const configElement = document.createElement('div');
        configElement.className = 'study-config-item';
        configElement.dataset.configId = config.id;
        
        configElement.innerHTML = `
            <div class="config-header">
                <span>${config.name}</span>
                <button class="remove-config-btn">×</button>
            </div>
            <div class="config-details">
                <small>Trials: ${config.config.trialCount}</small>
                <small>Stimuli: ${config.config.stimuliText.substring(0, 30)}...</small>
            </div>
        `;
        
        // Add remove button functionality
        configElement.querySelector('.remove-config-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            studyConfigurations = studyConfigurations.filter(c => c.id !== config.id);
            configElement.remove();
        });
        
        studyWindow.appendChild(configElement);
    }

    // Add to Study button click handler
    document.getElementById('add-to-study-btn').addEventListener('click', () => {
        const config = getCurrentConfiguration();
        studyConfigurations.push(config);
        displayConfiguration(config);
    });

    // Begin Study button click handler
    document.getElementById('begin-study-btn').addEventListener('click', function() {
        if (studyConfigurations.length === 0) {
            alert('Please add at least one configuration to the study.');
            return;
        }
        
        isStudyMode = true;  // Make sure this is set
        console.log('Beginning study mode:', isStudyMode);
        currentStudyIndex = 0;
        
        // Load first configuration
        const firstConfig = studyConfigurations[0].config;  // Make sure to access .config
        console.log('Loading first configuration:', firstConfig);
        loadConfiguration(firstConfig);
        startExperiment();
    });

    // Function to start the next configuration in the study
    function startNextConfiguration() {
        if (currentStudyIndex >= studyConfigurations.length) {
            // All configurations completed
            alert('Study completed!');
            return;
        }
        
        const config = studyConfigurations[currentStudyIndex];
        
        // Load configuration into form
        loadConfiguration(config.config);
        
        // Start the experiment using the correct function name
        startExperiment();  // Changed from beginExperiment to startExperiment
    }

    // First, store the original endExperiment function
    const originalEndExperiment = window.endExperiment || function() {
        experimentRunning = false;
        experimentContainer.classList.add('hidden');
        completionScreen.classList.remove('hidden');
        document.removeEventListener('keydown', handleKeyPress);
        clearAllTimers();
        
        // Download data if save option is enabled and we have data
        if (saveData && experimentData.length > 0) {
            downloadExperimentData();
        }
    };

    // Then redefine endExperiment with study progression functionality
    function endExperiment() {
        experimentRunning = false;
        experimentContainer.classList.add('hidden');
        clearAllTimers();
        document.removeEventListener('keydown', handleKeyPress);
        
        const messageElement = document.getElementById('completion-message');
        const statsElement = document.getElementById('completion-stats');
        
        // If save data is enabled, store the current configuration's data
        if (saveData && experimentData.length > 0) {
            if (isStudyMode) {
                // Add this configuration's data to the study data array
                studyData.push({
                    configurationIndex: currentStudyIndex,
                    configurationName: studyConfigurations[currentStudyIndex].name || `Configuration ${currentStudyIndex + 1}`,
                    data: experimentData
                });
            } else {
                // Single task mode - download data immediately
                downloadExperimentData();
            }
        }
        
        if (isStudyMode) {
            if (currentStudyIndex < studyConfigurations.length - 1) {
                messageElement.textContent = `Configuration ${currentStudyIndex + 1} Complete`;
                statsElement.classList.add('hidden');
            } else {
                // Study completion screen
                messageElement.textContent = 'Study Complete!';
                statsElement.classList.remove('hidden');
                
                // Show study completion stats
                let statsHtml = `
                    <div class="study-completion-stats">
                        <h3>Study Summary:</h3>
                        <p>Completed ${studyConfigurations.length} configurations</p>
                    `;
                
                if (saveData && studyData.length > 0) {
                    statsHtml += `
                        <div class="download-section">
                            <button id="download-study-data" class="download-btn">
                                Download Study Data
                            </button>
                        </div>
                    `;
                }
                
                statsHtml += '</div>';
                statsElement.innerHTML = statsHtml;
                
                // Add event listener for the download button
                const downloadBtn = document.getElementById('download-study-data');
                if (downloadBtn) {
                    downloadBtn.addEventListener('click', downloadStudyData);
                }
            }
        } else {
            messageElement.textContent = 'Task Complete!';
            statsElement.classList.add('hidden');
        }
        
        completionScreen.classList.remove('hidden');
    }

    // Function to load a configuration into the form
    function loadConfiguration(config) {
        console.log('Loading configuration:', config);
        
        // Load all saved values back into the form
        for (const [key, value] of Object.entries(config)) {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        }
        
        // Restore stimulus-response mappings if they exist
        if (config.stimuliResponses) {
            stimuliResponses = config.stimuliResponses;
            hasCustomMappings = Object.keys(stimuliResponses).length > 0;
        }
    }
    
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
            if (savedState.canvasBackground) document.getElementById('canvas-background').value = savedState.canvasBackground;
            if (savedState.fixation) document.getElementById('fixation').value = savedState.fixation;
            if (savedState.fixationColor) document.getElementById('fixation-color').value = savedState.fixationColor;
            if (savedState.trialCount) document.getElementById('trial-count').value = savedState.trialCount;
            if (savedState.cycleThreshold !== undefined) document.getElementById('cycle-threshold').value = savedState.cycleThreshold;
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
            if (savedState.saveData !== undefined) document.getElementById('save-data').checked = savedState.saveData;
            
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
        canvasBackground = document.getElementById('canvas-background').value;
        trialInterval = parseInt(document.getElementById('trial-interval').value);
        fixationInterval = parseInt(document.getElementById('fixation-interval').value);
        stimulusOffset = parseInt(document.getElementById('stimulus-offset').value);
        trialBackground = document.getElementById('trial-background').value;
        showFixation = document.getElementById('fixation').value === 'yes';
        fixationColor = document.getElementById('fixation-color').value;
        trialCount = parseInt(document.getElementById('trial-count').value);
        cycleThreshold = parseInt(document.getElementById('cycle-threshold').value);
        randomizeStimuli = document.getElementById('randomize-stimuli').checked;
        stimulusSize = parseInt(document.getElementById('stimulus-size').value);
        stimulusColor = document.getElementById('stimulus-color').value;
        provideFeedback = document.getElementById('provide-feedback').checked;
        feedbackDuration = parseInt(document.getElementById('feedback-duration').value);
        positionX = parseInt(document.getElementById('position-x').value) || 0;
        positionY = parseInt(document.getElementById('position-y').value) || 0;
        saveData = document.getElementById('save-data').checked;
        
        // Validate threshold is not greater than trial count
        if (cycleThreshold > trialCount && cycleThreshold !== 0) {
            alert('Cycle Trials threshold cannot exceed Trial count');
            return;
        }
        
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
        currentCycleCorrect = 0; // Reset correct count for new cycle
        
        // Reset experiment data
        experimentData = [];
        
        // Save current state before starting experiment
        saveCurrentState();
        
        // Start experiment
        startExperiment();
    });

    // Function to save current state to localStorage
    function saveCurrentState() {
        const currentState = {
            canvasBackground: document.getElementById('canvas-background').value,
            trialInterval: parseInt(document.getElementById('trial-interval').value),
            fixationInterval: parseInt(document.getElementById('fixation-interval').value),
            stimulusOffset: parseInt(document.getElementById('stimulus-offset').value),
            trialBackground: document.getElementById('trial-background').value,
            fixation: document.getElementById('fixation').value,
            fixationColor: document.getElementById('fixation-color').value,
            trialCount: parseInt(document.getElementById('trial-count').value),
            cycleThreshold: parseInt(document.getElementById('cycle-threshold').value),
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
            saveData: document.getElementById('save-data').checked,
            stimuliResponses: stimuliResponses
        };
        
        localStorage.setItem('experimentBuilderState', JSON.stringify(currentState));
        savedState = currentState;
    }

    // Parse stimuli input to handle sequences and concurrent stimuli
    function parseStimuli(input) {
        const result = [];
        let inSequence = false;
        let inConcurrent = false;
        let currentItem = '';
        let currentSequence = [];
        let currentConcurrent = [];
        
        // Helper function to add an item to the result
        function addItem() {
            const trimmed = currentItem.trim();
            if (trimmed) {
                if (inSequence) {
                    currentSequence.push(trimmed);
                } else if (inConcurrent) {
                    currentConcurrent.push(trimmed);
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
            } else if (char === '(') {
                inConcurrent = true;
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
            } else if (char === ')') {
                // End of a concurrent group, add the current item if any
                addItem();
                inConcurrent = false;
                // Add the concurrent group to the result if not empty
                if (currentConcurrent.length > 0) {
                    // Use object to mark this as concurrent stimuli
                    result.push({
                        type: 'concurrent',
                        stimuli: [...currentConcurrent]
                    });
                    currentConcurrent = [];
                }
            } else if (char === ',' && !inSequence && !inConcurrent) {
                // End of an item outside brackets
                addItem();
            } else {
                // Regular character
                if (inSequence || inConcurrent) {
                    if (char === ',') {
                        // Within brackets, comma separates items
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

    // Generate formatted stimulus key for storage/retrieval
    function getFormattedStimulusKey(stimulusItem) {
        if (Array.isArray(stimulusItem)) {
            // Sequential stimulus
            return stimulusItem.length > 1 ? `[${stimulusItem.join(', ')}]` : stimulusItem[0];
        } else if (typeof stimulusItem === 'object' && stimulusItem.type === 'concurrent') {
            // Concurrent stimulus
            return `(${stimulusItem.stimuli.join(', ')})`;
        }
        // Default case (shouldn't happen)
        return String(stimulusItem);
    }
    
    // Generate default positions for concurrent stimuli
    function generateConcurrentPositions(stimuliCount) {
        const positions = [];
        
        // Skip if only one stimulus (will use center position)
        if (stimuliCount <= 1) return [[0, 0]];
        
        // Distance from center in pixels
        const distance = 150;
        
        if (stimuliCount === 2) {
            // Place horizontally left and right
            positions.push([-distance, 0]);
            positions.push([distance, 0]);
        } else {
            // Place in a circle
            for (let i = 0; i < stimuliCount; i++) {
                const angle = (i / stimuliCount) * 2 * Math.PI; // Distribute around circle
                const x = Math.sin(angle) * distance;
                const y = -Math.cos(angle) * distance; // Negative to start from top
                positions.push([Math.round(x), Math.round(y)]);
            }
        }
        
        return positions;
    }

    // Start the experiment
    function startExperiment() {
        // Hide intro screen and show experiment container
        introScreen.classList.add('hidden');
        experimentContainer.classList.remove('hidden');
        
        // Set background colors
        experimentContainer.style.backgroundColor = canvasBackground;
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
        // Reset all concurrent elements to ensure clean state
        clearConcurrentStimuli();
        
        // Get sequence if needed
        if (sequenceIndex === 0) {
            currentSequence = getNextStimulusSequence();
        }
        
        // Check if we're handling a concurrent stimulus group
        const isConcurrent = typeof currentSequence === 'object' && currentSequence.type === 'concurrent';
        
        // For concurrent stimuli, we want to preserve the flag status
        if (!isConcurrent) {
            clearAllTimers();
        }
        
        fixationPoint.classList.add('hidden');
        feedbackText.classList.add('hidden');
        
        if (isConcurrent) {
            displayConcurrentStimuli(currentSequence);
        } else {
            const currentStimulus = currentSequence[sequenceIndex];
            stimulusText.textContent = currentStimulus;
            
            // Check for custom settings for this stimulus
            const stimulusDisplay = Array.isArray(currentSequence) && currentSequence.length > 1
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
        
        // Record stimulus start time for timing data
        responseStartTime = new Date();
    }

    // Display concurrent stimuli - SIMPLIFIED to always wait for response
    function displayConcurrentStimuli(currentSequence) {
        const stimuli = currentSequence.stimuli;
        const stimulusDisplay = `(${stimuli.join(', ')})`;
        const mapping = stimuliResponses[stimulusDisplay] || {};
        
        // Get default positions for the stimuli
        const defaultPositions = generateConcurrentPositions(stimuli.length);
        
        // Create DOM elements for each stimulus
        for (let i = 0; i < stimuli.length; i++) {
            const stimulus = stimuli[i];
            const stimElement = document.createElement('div');
            stimElement.className = 'concurrent-stimulus';
            stimElement.textContent = stimulus;
            
            // Apply styling
            stimElement.style.position = 'absolute';
            stimElement.style.top = '50%';
            stimElement.style.left = '50%';
            
            // Get custom position if available
            const posKey = stimulus.toLowerCase().replace(/\s+/g, '_');
            const customX = mapping[`${posKey}_x`] !== undefined ? 
                mapping[`${posKey}_x`] : defaultPositions[i][0];
            const customY = mapping[`${posKey}_y`] !== undefined ? 
                mapping[`${posKey}_y`] : defaultPositions[i][1];
            
            // Apply global offset plus specific offset for this item
            const totalX = (positionX || 0) + customX;
            const totalY = (positionY || 0) + customY;
            
            stimElement.style.transform = `translate(calc(-50% + ${totalX}px), calc(-50% + ${totalY}px))`;
            
            // Apply custom or default color and size
            const customColor = mapping[`${posKey}_color`] || mapping.color || stimulusColor;
            const customSize = mapping[`${posKey}_size`] !== undefined ? 
                mapping[`${posKey}_size`] : (mapping.size !== undefined ? mapping.size : stimulusSize);
            
            stimElement.style.color = customColor;
            stimElement.style.fontSize = `${customSize}px`;
            stimElement.style.fontFamily = 'Consolas, monospace';
            stimElement.style.zIndex = '1';
            stimElement.style.textAlign = 'center';
            
            // Add to experiment screen
            experimentScreen.appendChild(stimElement);
        }
        
        // Update fixation position to match global position
        if (showFixation) {
            fixationPoint.style.transform = `translate(calc(-50% + ${positionX}px), calc(-50% + ${positionY}px))`;
        }
        
        // Always set flag to true - concurrent stimuli always wait for response
        hasConcurrentWithZeroOffset = true;
    }

    // Clear concurrent stimuli
    function clearConcurrentStimuli() {
        const concurrentElements = document.querySelectorAll('.concurrent-stimulus');
        concurrentElements.forEach(el => el.remove());
    }

    // Add function to record correct response
    function recordCorrectResponse() {
        // Only increment if using cycle threshold
        if (cycleThreshold > 0) {
            currentCycleCorrect++;
            console.log(`Correct response recorded. Current count: ${currentCycleCorrect}/${cycleThreshold}`);
        }
    }

    // Corrected handleKeyPress function
    function handleKeyPress(e) {
        // Skip all keypresses during cycle feedback display
        if (feedbackText.textContent.includes("Starting new cycle") && 
            !feedbackText.classList.contains('hidden')) {
            return;
        }

        if (!experimentRunning) return;
        const keyPressed = (e.code === 'Space') ? 'SPACE' : e.key.toUpperCase();

        if (fixationPoint.classList.contains('hidden')) {
            e.preventDefault();

            // Determine if we're at the last item in a sequence
            const isEndOfSequence = 
                Array.isArray(currentSequence) ? 
                (sequenceIndex === currentSequence.length - 1) : 
                true; // For concurrent stimuli, always consider it the end

            // Get stimulus display key
            const stimulusDisplay = 
                typeof currentSequence === 'object' && currentSequence.type === 'concurrent' ?
                `(${currentSequence.stimuli.join(', ')})` :
                (Array.isArray(currentSequence) && currentSequence.length > 1 ?
                    `[${currentSequence.join(', ')}]` :
                    currentSequence[0]);

            // Determine if the key pressed is correct
            let isCorrect = false;
            let isAdditionalResponse = false;
            
            // Check if the pressed key is in additionalResponses
            isAdditionalResponse = additionalResponses.includes(keyPressed);
            
            if (hasCustomMappings) {
                const mappingInfo = stimuliResponses[stimulusDisplay];
                if (mappingInfo && mappingInfo.key) {
                    isCorrect = (keyPressed === mappingInfo.key.toUpperCase());
                } else {
                    isCorrect = (keyPressed === responseKey.toUpperCase());
                }
            } else {
                isCorrect = (keyPressed === responseKey.toUpperCase());
            }

            // Record correct response if the key is correct (regardless of being an additional response)
            if (isCorrect) {
                recordCorrectResponse();
            }

            // If correct or it's an additional response key
            if (isCorrect || isAdditionalResponse) {
                // For sequential presentations, progress through the sequence
                if (!isEndOfSequence && Array.isArray(currentSequence)) {
                    // Save response data for non-end sequence items if data saving is enabled
                    if (saveData) {
                        saveTrialData(currentSequence[sequenceIndex], keyPressed, isCorrect);
                    }
                    
                    sequenceIndex++;
                    showStimulus();
                }
                else if (isEndOfSequence) {
                    // At the end of a sequence or for concurrent stimuli
                    
                    // Explicitly clear concurrent stimuli on valid key press
                    if (hasConcurrentWithZeroOffset) {
                        clearConcurrentStimuli();
                        hasConcurrentWithZeroOffset = false;
                    }
                    
                    // Save data if option is enabled
                    if (saveData) {
                        saveTrialData(stimulusDisplay, keyPressed, isCorrect);
                    }
                    
                    if (provideFeedback) {
                        showFeedback(isCorrect);
                        feedbackTimer = setTimeout(() => {
                            hideFeedback();
                            advanceTrial();
                        }, feedbackDuration);
                    } else {
                        advanceTrial();
                    }
                }
            } else {
                if (provideFeedback && isEndOfSequence) {
                    // Save data for incorrect response if option is enabled
                    if (saveData && isEndOfSequence) {
                        saveTrialData(stimulusDisplay, keyPressed, false);
                    }
                    
                    showFeedback(false);
                    feedbackTimer = setTimeout(() => {
                        hideFeedback();
                        // Important fix: Advance the trial after incorrect feedback too
                        advanceTrial();
                    }, feedbackDuration);
                } else if (isEndOfSequence) {
                    // Critical fix: If no feedback, still advance trial on incorrect responses
                    advanceTrial();
                }
            }
        }
    }
    
    // Function to save trial data
    function saveTrialData(stimulus, response, accurate) {
        const now = new Date();
        const responseTime = now - responseStartTime; // Calculate response time in ms
        
        // Format timestamp as HH:MM:SS_DD:MM:YYYY
        const timestamp = formatDateTime(now);
        
        // Calculate the absolute trial number (including past cycles)
        const absoluteTrialNumber = currentTrial + 1; // +1 because currentTrial is 0-indexed
        
        // Create data object
        const trialData = {
            Timestamp: timestamp,
            "Trial Number": absoluteTrialNumber,
            Stimulus: stimulus,
            Stimulus_Offset: stimulusOffset,
            Response: response,
            Accurate: accurate ? 1 : 0,
            ResponseTime_ms: responseTime
        };
        
        // Add to experiment data array
        experimentData.push(trialData);
    }
    
    // Helper function to format date as HH:MM:SS_DD:MM:YYYY
    function formatDateTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        
        return `${hours}:${minutes}:${seconds}_${day}:${month}:${year}`;
    }
    
    // Modify advanceTrial to check threshold at cycle end
    function advanceTrial() {
        clearAllTimers();
        hasConcurrentWithZeroOffset = false; // Reset flag when advancing trials
        stimulusText.classList.add('hidden');
        feedbackText.classList.add('hidden');
        setTimeout(() => {
            currentTrial++;
            console.log(`Advancing to trial ${currentTrial}/${trialCount}`);
            
            if (currentTrial < trialCount) {
                // Continue current cycle
                startTrial();
            } else {
                console.log(`Cycle complete. Checking threshold: ${currentCycleCorrect}/${cycleThreshold}`);
                // End of cycle - check if threshold is reached
                if (cycleThreshold === 0 || currentCycleCorrect >= cycleThreshold) {
                    // Threshold met or not using threshold - end experiment
                    console.log("Threshold met or not required. Ending experiment.");
                    endExperiment();
                } else {
                    // Threshold not met - show cycle message and start a new cycle automatically
                    console.log("Threshold not met. Starting new cycle.");
                    showCycleMessage();
                }
            }
        }, trialInterval);
    }

    // Updated showCycleMessage to display for fixed duration without requiring keypress
    function showCycleMessage() {
        // Show message that we're starting a new cycle
        feedbackText.textContent = `Correct: ${currentCycleCorrect}/${cycleThreshold} - Starting new cycle`;
        feedbackText.style.color = '#2196F3'; // Blue color for cycle message
        feedbackText.classList.remove('hidden');
        
        // Clear stimulus text to prevent overlap
        stimulusText.classList.add('hidden');
        
        console.log(`Cycle completed. Correct responses: ${currentCycleCorrect}/${cycleThreshold}`);
        
        // Automatically hide message and start new cycle after fixed duration
        setTimeout(() => {
            // Hide message
            feedbackText.classList.add('hidden');
            
            // Reset for new cycle
            currentTrial = 0;
            sequenceIndex = 0;
            currentCycleCorrect = 0;
            
            // Reset stimulus usage if randomizing
            if (randomizeStimuli) {
                stimuliUsed = [];
            }
            
            // Start new cycle automatically
            startTrial();
        }, 2000); // Show message for fixed 2 seconds
    }
    
    // Correct endExperiment
    function endExperiment() {
        experimentRunning = false;
        experimentContainer.classList.add('hidden');
        completionScreen.classList.remove('hidden');
        document.removeEventListener('keydown', handleKeyPress);
        clearAllTimers();
        
        const messageElement = document.getElementById('completion-message');
        const statsElement = document.getElementById('completion-stats');
        
        // If save data is enabled, store the current configuration's data
        if (saveData && experimentData.length > 0) {
            if (isStudyMode) {
                // Add this configuration's data to the study data array
                studyData.push({
                    configurationIndex: currentStudyIndex,
                    configurationName: studyConfigurations[currentStudyIndex].name || `Configuration ${currentStudyIndex + 1}`,
                    data: experimentData
                });
            } else {
                // Single task mode - download data immediately
                downloadExperimentData();
            }
        }
        
        if (isStudyMode) {
            if (currentStudyIndex < studyConfigurations.length - 1) {
                messageElement.textContent = `Configuration ${currentStudyIndex + 1} Complete`;
                statsElement.classList.add('hidden');
            } else {
                // Study completion screen
                messageElement.textContent = 'Study Complete!';
                statsElement.classList.remove('hidden');
                
                // Show study completion stats
                let statsHtml = `
                    <div class="study-completion-stats">
                        <h3>Study Summary:</h3>
                        <p>Completed ${studyConfigurations.length} configurations</p>
                    `;
                
                if (saveData && studyData.length > 0) {
                    statsHtml += `
                        <div class="download-section">
                            <button id="download-study-data" class="download-btn">
                                Download Study Data
                            </button>
                        </div>
                    `;
                }
                
                statsHtml += '</div>';
                statsElement.innerHTML = statsHtml;
                
                // Add event listener for the download button
                const downloadBtn = document.getElementById('download-study-data');
                if (downloadBtn) {
                    downloadBtn.addEventListener('click', downloadStudyData);
                }
            }
        } else {
            messageElement.textContent = 'Task Complete!';
            statsElement.classList.add('hidden');
        }
        
        completionScreen.classList.remove('hidden');
    }

    // Function to download experiment data as JSON
    function downloadExperimentData() {
        const dataStr = JSON.stringify(experimentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create timestamp for filename
        const timestamp = formatDateTime(new Date()).replace(/:/g, '-').replace(/_/g, '_');
        const filename = `experiment_data_${timestamp}.json`;
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = filename;
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Data';
        downloadBtn.className = 'secondary-btn';
        downloadBtn.style.marginTop = '20px';
        
        downloadBtn.addEventListener('click', function() {
            downloadLink.click();
        });
        
        // Add button to completion screen
        completionScreen.insertBefore(downloadBtn, okBtn);
        
        // Auto download
        downloadLink.click();
    }

    // Add function to download study data
    function downloadStudyData() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `study_data_${timestamp}.json`;
        
        const studyDataObject = {
            studyMetadata: {
                completionTime: new Date().toISOString(),
                numberOfConfigurations: studyConfigurations.length,
                configurationDetails: studyConfigurations.map(config => ({
                    name: config.name || 'Unnamed Configuration',
                    // Add any other relevant configuration metadata
                }))
            },
            configurationData: studyData
        };
        
        const dataStr = JSON.stringify(studyDataObject, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    // Clear all timers and elements
    function clearAllTimers() {
        if (stimulusTimer) {
            clearTimeout(stimulusTimer);
            stimulusTimer = null;
        }
        
        if (feedbackTimer) {
            clearTimeout(feedbackTimer);
            feedbackTimer = null;
        }
        
        // Only clear concurrent stimuli when explicitly called for
        if (!hasConcurrentWithZeroOffset) {
            clearConcurrentStimuli();
        }
    }
    
    // OK button click
    okBtn.addEventListener('click', function() {
        if (isStudyMode && currentStudyIndex < studyConfigurations.length - 1) {
            // Continue to next configuration
            completionScreen.classList.add('hidden');
            currentStudyIndex++;
            
            // Reset configuration-specific state
            currentTrial = 0;
            experimentRunning = false;
            stimuliUsed = [];
            experimentData = []; // Reset experiment data for next configuration
            clearAllTimers();
            
            // Load and start next configuration
            loadConfiguration(studyConfigurations[currentStudyIndex].config);
            startExperiment();
        } else {
            // Study or task complete - reset everything
            completionScreen.classList.add('hidden');
            introScreen.classList.remove('hidden');
            
            // Reset all state variables
            currentTrial = 0;
            experimentRunning = false;
            stimuliUsed = [];
            currentStudyIndex = 0;
            isStudyMode = false;
            experimentData = [];
            studyData = []; // Reset study data
            clearAllTimers();
            
            saveCurrentState();
        }
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
                return getFormattedStimulusKey(seq);
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
        const mappingRows = mappingTbody.querySelectorAll('tr');
        
        stimuliResponses = {};
        hasCustomMappings = false;
        
        mappingRows.forEach(row => {
            const stimulusText = row.getAttribute('data-stimulus');
            const customMapping = {};
            
            // Get all input values based on data-type attribute
            row.querySelectorAll('input').forEach(input => {
                const dataType = input.getAttribute('data-type');
                const defaultValue = input.getAttribute('data-default');
                const value = input.value.trim();
                
                if (value && value !== defaultValue) {
                    // Check if it's a number type
                    if (input.type === 'number') {
                        customMapping[dataType] = parseInt(value);
                    } else {
                        customMapping[dataType] = value;
                    }
                }
            });
            
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
    
    // Generate mapping table with columns for concurrent stimuli
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
        
        // Update header columns first to match the inputs we'll create
        updateMappingTableHeader(parsedStimuli);
        
        // Create a row for each stimulus or sequence
        parsedStimuli.forEach(stimulusItem => {
            const row = document.createElement('tr');
            
            // Determine the type of stimulus and create formatted key
            let storedStimulus;
            let isConcurrent = false;
            let concurrentStimuli = [];
            
            if (Array.isArray(stimulusItem)) {
                // Sequential stimulus
                storedStimulus = stimulusItem.length > 1 ?
                    `[${stimulusItem.join(', ')}]` :
                    stimulusItem[0];
            } else if (typeof stimulusItem === 'object' && stimulusItem.type === 'concurrent') {
                // Concurrent stimulus
                storedStimulus = `(${stimulusItem.stimuli.join(', ')})`;
                isConcurrent = true;
                concurrentStimuli = stimulusItem.stimuli;
            }

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
            row.appendChild(responseCell);
            
            if (!isConcurrent) {
                // Regular stimulus - add normal position columns
                
                // X position cell
                const xPosCell = document.createElement('td');
                const xPosInput = document.createElement('input');
                xPosInput.type = 'number';
                xPosInput.placeholder = defaultX;
                xPosInput.setAttribute('data-type', 'x-pos');
                xPosInput.setAttribute('data-default', defaultX);
                xPosCell.appendChild(xPosInput);
                row.appendChild(xPosCell);
                
                // Y position cell
                const yPosCell = document.createElement('td');
                const yPosInput = document.createElement('input');
                yPosInput.type = 'number';
                yPosInput.placeholder = defaultY;
                yPosInput.setAttribute('data-type', 'y-pos');
                yPosInput.setAttribute('data-default', defaultY);
                yPosCell.appendChild(yPosInput);
                row.appendChild(yPosCell);
            } else {
                // Concurrent stimulus - add position columns for each stimulus
                
                // Calculate default positions
                const defaultPositions = generateConcurrentPositions(concurrentStimuli.length);
                
                // Create position fields for each item
                concurrentStimuli.forEach((stim, index) => {
                    const posKey = stim.toLowerCase().replace(/\s+/g, '_');
                    const defaultPosX = defaultPositions[index][0];
                    const defaultPosY = defaultPositions[index][1];
                    
                    // X position cell
                    const xPosCell = document.createElement('td');
                    const xPosInput = document.createElement('input');
                    xPosInput.type = 'number';
                    xPosInput.placeholder = defaultPosX;
                    xPosInput.setAttribute('data-type', `${posKey}_x`);
                    xPosInput.setAttribute('data-default', defaultPosX);
                    xPosInput.title = `${stim} X Position`;
                    xPosCell.appendChild(xPosInput);
                    row.appendChild(xPosCell);
                    
                    // Y position cell
                    const yPosCell = document.createElement('td');
                    const yPosInput = document.createElement('input');
                    yPosInput.type = 'number';
                    yPosInput.placeholder = defaultPosY;
                    yPosInput.setAttribute('data-type', `${posKey}_y`);
                    yPosInput.setAttribute('data-default', defaultPosY);
                    yPosInput.title = `${stim} Y Position`;
                    yPosCell.appendChild(yPosInput);
                    row.appendChild(yPosCell);
                });
            }
            
            // Offset cell
            const offsetCell = document.createElement('td');
            const offsetInput = document.createElement('input');
            offsetInput.type = 'number';
            offsetInput.placeholder = defaultOffset;
            offsetInput.setAttribute('data-type', 'offset');
            offsetInput.setAttribute('data-default', defaultOffset);
            offsetCell.appendChild(offsetInput);
            row.appendChild(offsetCell);
            
            // Color cell - Universal color for all stimuli in the group
            const colorCell = document.createElement('td');
            const colorInput = document.createElement('input');
            colorInput.type = 'text';
            colorInput.placeholder = defaultColor;
            colorInput.setAttribute('data-type', 'color');
            colorInput.setAttribute('data-default', defaultColor);
            colorCell.appendChild(colorInput);
            row.appendChild(colorCell);
            
            // Size cell - Universal size for all stimuli in the group
            const sizeCell = document.createElement('td');
            const sizeInput = document.createElement('input');
            sizeInput.type = 'number';
            sizeInput.placeholder = defaultSize;
            sizeInput.setAttribute('data-type', 'size');
            sizeInput.setAttribute('data-default', defaultSize);
            sizeCell.appendChild(sizeInput);
            row.appendChild(sizeCell);
            
            // Individual color and size for concurrent stimuli
            if (isConcurrent) {
                concurrentStimuli.forEach(stim => {
                    const posKey = stim.toLowerCase().replace(/\s+/g, '_');
                    
                    // Individual color
                    const colorCell = document.createElement('td');
                    const colorInput = document.createElement('input');
                    colorInput.type = 'text';
                    colorInput.placeholder = defaultColor;
                    colorInput.setAttribute('data-type', `${posKey}_color`);
                    colorInput.setAttribute('data-default', defaultColor);
                    colorInput.title = `${stim} Color`;
                    colorCell.appendChild(colorInput);
                    row.appendChild(colorCell);
                    
                    // Individual size
                    const sizeCell = document.createElement('td');
                    const sizeInput = document.createElement('input');
                    sizeInput.type = 'number';
                    sizeInput.placeholder = defaultSize;
                    sizeInput.setAttribute('data-type', `${posKey}_size`);
                    sizeInput.setAttribute('data-default', defaultSize);
                    sizeInput.title = `${stim} Size`;
                    sizeCell.appendChild(sizeInput);
                    row.appendChild(sizeCell);
                });
            }
            
            // Set values if mapping exists
            if (stimuliResponses[storedStimulus]) {
                const mapping = stimuliResponses[storedStimulus];
                
                // Set each input based on data-type attribute
                row.querySelectorAll('input').forEach(input => {
                    const dataType = input.getAttribute('data-type');
                    if (mapping[dataType] !== undefined) {
                        input.value = mapping[dataType];
                    }
                });
            }
            
            mappingTbody.appendChild(row);
        });
    }
    
    // Update the mapping table header to include columns for concurrent stimuli
    function updateMappingTableHeader(parsedStimuli) {
        const headerRow = document.querySelector('#mapping-table thead tr');
        
        // Clear existing headers, keeping just the first two columns (Stimulus and Response Key)
        while (headerRow.children.length > 2) {
            headerRow.removeChild(headerRow.lastElementChild);
        }
        
        // Check for concurrent stimuli to determine additional headers
        let hasConcurrent = false;
        let maxConcurrentCount = 0;
        
        parsedStimuli.forEach(item => {
            if (typeof item === 'object' && item.type === 'concurrent') {
                hasConcurrent = true;
                // Keep track of the maximum number of concurrent stimuli
                maxConcurrentCount = Math.max(maxConcurrentCount, item.stimuli.length);
            }
        });
        
        if (!hasConcurrent) {
            // Add standard headers for regular stimuli
            const standardHeaders = ['X Position', 'Y Position', 'Offset (ms)', 'Color', 'Size (px)'];
            standardHeaders.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
        } else {
            // First add position headers for each possible item
            for (let i = 0; i < maxConcurrentCount; i++) {
                const xHeader = document.createElement('th');
                xHeader.textContent = `Item ${i+1} X`;
                headerRow.appendChild(xHeader);
                
                const yHeader = document.createElement('th');
                yHeader.textContent = `Item ${i+1} Y`;
                headerRow.appendChild(yHeader);
            }
            
            // Add common property headers
            const commonHeaders = ['Offset (ms)', 'Group Color', 'Group Size (px)'];
            commonHeaders.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            
            // Add individual property headers for each possible item
            for (let i = 0; i < maxConcurrentCount; i++) {
                const colorHeader = document.createElement('th');
                colorHeader.textContent = `Item ${i+1} Color`;
                headerRow.appendChild(colorHeader);
                
                const sizeHeader = document.createElement('th');
                sizeHeader.textContent = `Item ${i+1} Size`;
                headerRow.appendChild(sizeHeader);
            }
        }
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

    // Set up color preview functionality
    setupColorPreviews();

    // Function to set up color previews
    function setupColorPreviews() {
        // For each color select element
        const colorSelects = ['canvas-background', 'trial-background', 'fixation-color', 'stimulus-color'];
        
        colorSelects.forEach(id => {
            const select = document.getElementById(id);
            const preview = document.getElementById(`${id}-preview`);
            
            // Set initial color preview
            if (preview) preview.style.backgroundColor = select.value;
            
            // Update preview when selection changes
            select.addEventListener('change', function() {
                if (preview) preview.style.backgroundColor = this.value;
                saveCurrentState();
            });
        });
    }

    // Update feedback functions to ensure visibility
    function showFeedback(isCorrect) {
        if (isCorrect) {
            feedbackText.textContent = "Correct";
            feedbackText.style.color = "#4CAF50"; // Green color
        } else {
            feedbackText.textContent = "X";
            feedbackText.style.color = "#F44336"; // Red color
        }
        
        // Make sure feedback is centered and visible
        feedbackText.style.transform = `translate(-50%, -50%)`; // Keep feedback at center
        feedbackText.classList.remove('hidden');
        
        // Hide stimulus text temporarily for clearer feedback (if showing feedback on incorrect responses)
        if (!isCorrect) {
            stimulusText.style.opacity = '0.2'; // Reduce opacity rather than hide completely
        }
    }
    
    function hideFeedback() {
        feedbackText.classList.add('hidden');
        // Restore stimulus text visibility if it was reduced
        stimulusText.style.opacity = '1';
    }

    // Export mappings to CSV file - modified to include default values
    function exportMappingsToCSV() {
        const mappingRows = mappingTbody.querySelectorAll('tr');
        const headers = [];
        const csvRows = [];
        
        // Get all header cells from the table
        const headerCells = document.querySelectorAll('#mapping-table thead th');
        headerCells.forEach(cell => {
            headers.push(cell.textContent);
        });
        
        // Add headers as first row
        csvRows.push(headers.join(','));
        
        // Process each mapping row
        mappingRows.forEach(row => {
            const csvRow = [];
            const stimulusText = row.getAttribute('data-stimulus');
            csvRow.push('"' + stimulusText.replace(/"/g, '""') + '"'); // Escape quotes
            
            // Get all inputs in the row
            const inputs = row.querySelectorAll('input');
            
            // Track input index to map to correct header
            let inputIndex = 0;
            
            // Process each header after the stimulus column
            for (let i = 1; i < headers.length; i++) {
                if (inputIndex < inputs.length) {
                    const input = inputs[inputIndex];
                    // Get value or default value if empty
                    let value = input.value.trim();
                    if (!value) {
                        value = input.placeholder || input.getAttribute('data-default') || '';
                    }
                    
                    // Add the value, properly escaped if it contains commas or quotes
                    if (value.includes(',') || value.includes('"')) {
                        csvRow.push('"' + value.replace(/"/g, '""') + '"');
                    } else {
                        csvRow.push(value);
                    }
                    
                    inputIndex++;
                } else {
                    // Add empty cell if we don't have an input for this column
                    csvRow.push('');
                }
            }
            
            // Add the row to our CSV data
            csvRows.push(csvRow.join(','));
        });
        
        // Create blob and download
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `sr-mappings-${timestamp}.csv`;
        
        // Set up download
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Helper function to detect and properly format stimulus structure from import
    function detectStimulusStructure(stimulusText) {
        // Trim whitespace
        stimulusText = stimulusText.trim();
        
        // Check if it's a sequential stimulus (enclosed in square brackets)
        if (stimulusText.startsWith('[') && stimulusText.endsWith(']')) {
            return {
                type: 'sequential',
                text: stimulusText, // Keep original format for display
                valid: true
            };
        }
        
        // Check if it's a concurrent stimulus (enclosed in parentheses)
        if (stimulusText.startsWith('(') && stimulusText.endsWith(')')) {
            return {
                type: 'concurrent',
                text: stimulusText, // Keep original format for display
                valid: true
            };
        }
        
        // It's a single stimulus
        return {
            type: 'single',
            text: stimulusText,
            valid: !stimulusText.includes('[') && !stimulusText.includes(']') && 
                  !stimulusText.includes('(') && !stimulusText.includes(')')
        };
    }
    
    // Helper function to properly add new stimuli to the text input
    function addNewStimuliToInput(currentInput, newStimuli) {
        let updatedInput = currentInput.trim();
        let newValidStimuli = [];
        
        // Process each new stimulus
        newStimuli.forEach(stimulus => {
            const structure = detectStimulusStructure(stimulus);
            if (structure.valid) {
                newValidStimuli.push(structure.text);
            }
        });
        
        // Add all valid new stimuli to the input
        if (newValidStimuli.length > 0) {
            if (updatedInput) {
                updatedInput += ', ' + newValidStimuli.join(', ');
            } else {
                updatedInput = newValidStimuli.join(', ');
            }
        }
        
        return updatedInput;
    }

    // Enhanced import function to handle the S-R mapping import
    function importMappingsFromCSV(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const contents = e.target.result;
                const lines = contents.split(/\r\n|\n/);
                
                if (lines.length < 2) {
                    throw new Error('CSV file has insufficient data');
                }
                
                // Parse header row
                const headers = parseCSVLine(lines[0]);
                if (headers.length < 2 || headers[0].toLowerCase() !== 'stimulus') {
                    throw new Error('Invalid CSV format: First column must be "Stimulus"');
                }
                
                // Get current stimuli to identify new ones
                const currentStimuliInput = document.getElementById('stimuli-text').value;
                const currentParsedStimuli = parseStimuli(currentStimuliInput);
                const currentStimuliKeys = currentParsedStimuli.map(seq => getFormattedStimulusKey(seq));
                
                // Process data rows to find new stimuli
                const importedMappings = {};
                const newStimuliList = [];
                let validRowCount = 0;
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue; // Skip empty lines
                    
                    const values = parseCSVLine(lines[i]);
                    if (values.length < 1) continue; // Skip invalid rows
                    
                    const stimulus = values[0].trim();
                    if (!stimulus) continue; // Skip rows without stimulus
                    
                    // Check if this is a new stimulus not in the current list
                    if (!currentStimuliKeys.includes(stimulus)) {
                        newStimuliList.push(stimulus);
                    }
                    
                    // Create mapping for this stimulus regardless of whether it's new
                    const mapping = {};
                    let hasValidMapping = false;
                    
                    // Process each column
                    headers.forEach((header, index) => {
                        if (index === 0) return; // Skip stimulus column
                        
                        if (index < values.length) {
                            const value = values[index].trim();
                            if (!value) return; // Skip empty values
                            
                            // Convert numeric values
                            let processedValue;
                            if (/^\-?\d+$/.test(value)) {
                                processedValue = parseInt(value);
                            } else {
                                processedValue = value;
                            }
                            
                            // Determine the correct data type based on header
                            const headerLower = header.toLowerCase();
                            let dataType;
                            
                            if (headerLower === 'correct response key') {
                                dataType = 'key';
                            } else if (headerLower === 'x position') {
                                dataType = 'x';
                            } else if (headerLower === 'y position') {
                                dataType = 'y';
                            } else if (headerLower.includes('item') && headerLower.includes('x')) {
                                // Extract item identifier for concurrent stimuli
                                const match = headerLower.match(/item\s+(\d+)\s+x/i);
                                if (match) {
                                    const itemNum = parseInt(match[1]) - 1;
                                    dataType = `item${itemNum}_x`;
                                } else {
                                    // Try to extract item name
                                    const nameMatch = headerLower.match(/(.+)_x$/i);
                                    if (nameMatch) {
                                        dataType = `${nameMatch[1]}_x`;
                                    } else {
                                        dataType = headerLower;
                                    }
                                }
                            } else if (headerLower.includes('item') && headerLower.includes('y')) {
                                const match = headerLower.match(/item\s+(\d+)\s+y/i);
                                if (match) {
                                    const itemNum = parseInt(match[1]) - 1;
                                    dataType = `item${itemNum}_y`;
                                } else {
                                    const nameMatch = headerLower.match(/(.+)_y$/i);
                                    if (nameMatch) {
                                        dataType = `${nameMatch[1]}_y`;
                                    } else {
                                        dataType = headerLower;
                                    }
                                }
                            } else if (headerLower === 'offset (ms)') {
                                dataType = 'offset';
                            } else if (headerLower === 'color' || headerLower === 'group color') {
                                dataType = 'color';
                            } else if (headerLower.includes('item') && headerLower.includes('color')) {
                                const match = headerLower.match(/item\s+(\d+)\s+color/i);
                                if (match) {
                                    const itemNum = parseInt(match[1]) - 1;
                                    dataType = `item${itemNum}_color`;
                                } else {
                                    dataType = headerLower;
                                }
                            } else if (headerLower === 'size (px)' || headerLower === 'group size (px)') {
                                dataType = 'size';
                            } else if (headerLower.includes('item') && headerLower.includes('size')) {
                                const match = headerLower.match(/item\s+(\d+)\s+size/i);
                                if (match) {
                                    const itemNum = parseInt(match[1]) - 1;
                                    dataType = `item${itemNum}_size`;
                                } else {
                                    dataType = headerLower;
                                }
                            } else {
                                // Unknown header, use as is
                                dataType = headerLower.replace(/\s+/g, '_');
                            }
                            
                            mapping[dataType] = processedValue;
                            hasValidMapping = true;
                        }
                    });
                    
                    // Store the mapping if we have valid data
                    if (hasValidMapping || newStimuliList.includes(stimulus)) {
                        importedMappings[stimulus] = mapping;
                        validRowCount++;
                    }
                }
                
                // Update the stimuli text area if new stimuli were found
                if (newStimuliList.length > 0) {
                    // Add new stimuli with proper structure detection
                    const updatedStimuliText = addNewStimuliToInput(currentStimuliInput, newStimuliList);
                    
                    // Update the stimuli textarea
                    const stimuliTextArea = document.getElementById('stimuli-text');
                    stimuliTextArea.value = updatedStimuliText;
                    lastStimuliText = updatedStimuliText; // Update the last known value
                }
                
                // Update stimuliResponses with imported data
                if (validRowCount > 0) {
                    // Merge with existing responses rather than replacing completely
                    Object.keys(importedMappings).forEach(key => {
                        stimuliResponses[key] = importedMappings[key];
                    });
                    
                    hasCustomMappings = true;
                    
                    // Parse the updated stimuli input to get the full current set including new items
                    const updatedStimuliInput = document.getElementById('stimuli-text').value;
                    const updatedParsedStimuli = parseStimuli(updatedStimuliInput);
                    
                    // Regenerate the entire mapping table with the updated stimuli set
                    generateMappingTable(updatedParsedStimuli);
                    
                    // Update button text to indicate custom mappings are set
                    srMappingBtn.textContent = "Custom S-R Mappings (Set)";
                    
                    // Save state with imported mappings
                    saveCurrentState();
                    
                    // Show success message with details
                    const newStimuliMsg = newStimuliList.length > 0 ? 
                        `Added ${newStimuliList.length} new stimuli. ` : '';
                    alert(`${newStimuliMsg}Successfully imported ${validRowCount} mapping(s).`);
                } else if (newStimuliList.length > 0) {
                    // Only new stimuli were added but no mappings
                    // We still need to regenerate the mapping table with the updated stimuli
                    const updatedStimuliInput = document.getElementById('stimuli-text').value;
                    const updatedParsedStimuli = parseStimuli(updatedStimuliInput);
                    generateMappingTable(updatedParsedStimuli);
                    
                    saveCurrentState();
                    alert(`Added ${newStimuliList.length} new stimuli.`);
                } else {
                    throw new Error('No valid mappings or new stimuli found in the CSV');
                }
                
            } catch (error) {
                alert(`Error importing mappings: ${error.message}`);
                console.error('Import error:', error);
            }
        };
        
        reader.onerror = function() {
            alert('Error reading the file');
        };
        
        reader.readAsText(file);
    }

    // Parse CSV line function (missing implementation)
    function parseCSVLine(text) {
        // This function handles CSV parsing with proper quote handling
        const result = [];
        let cell = '';
        let inQuote = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '"') {
                // Handle quotes - toggle quote state
                if (inQuote && i + 1 < text.length && text[i + 1] === '"') {
                    // Double quotes inside quoted string = escaped quote
                    cell += '"';
                    i++; // Skip the next quote
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                // End of field, add to result
                result.push(cell);
                cell = '';
            } else {
                cell += char;
            }
        }
        
        // Add the last cell
        result.push(cell);
        return result;
    }
    
    if (importMappingsBtn && csvFileInput) {
        importMappingsBtn.addEventListener('click', function() {
            csvFileInput.click(); // Trigger file input dialog
        });
        
        csvFileInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                importMappingsFromCSV(this.files[0]);
                // Clear the input so the same file can be selected again
                this.value = '';
            }
        });
    }
    
    // Add event listener for export button
    if (exportMappingsBtn) {
        exportMappingsBtn.addEventListener('click', function() {
            exportMappingsToCSV();
        });
    }
});
