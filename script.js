// This file contains a single large DOMContentLoaded event handler with multiple function declarations
// The linter may show comma errors between function declarations, but these are false positives
// as these are separate function declarations, not object literal methods
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
    const exportMappingsBtn = document.getElementById('export-mappings-btn');
    const importMappingsBtn = document.getElementById('import-mappings-btn');
    const csvFileInput = document.getElementById('csv-file-input');

    // Introduced Form Switching
    document.getElementById('form-type-switch').addEventListener('change', function(e) {
        isExperimentMode = e.target.checked;
        toggleFormMode(isExperimentMode);
    });

    document.getElementById('begin-btn').addEventListener('click', function() {
        // Set a flag to indicate that a configuration has been tested
        // This is used to ensure the UI is properly initialized before running a study
        window.studyConfigTested = true;
        console.log('Test button clicked, studyConfigTested set to true');

        if (isExperimentMode) {
            // For experiment mode, trigger the experiment form submission
            document.getElementById('experiment-form').requestSubmit();
        } else {
            // For survey mode, handle survey test
            const questionItems = document.querySelectorAll('.question-item');
            let isValid = true;

            // Validate all questions
            questionItems.forEach(item => {
                const questionText = item.querySelector('.question-text').value;
                if (!questionText.trim()) {
                    isValid = false;
                }
            });

            if (!isValid) {
                alert('Please enter text for all questions');
                return;
            }

            // Save current state before starting
            saveCurrentState();

            // Update the global saveData variable from the survey save data checkbox
            saveData = document.getElementById('survey-save-data').checked;
            console.log('Survey test started with saveData =', saveData);

            // Hide intro screen and show survey test interface
            introScreen.classList.add('hidden');
            experimentContainer.classList.remove('hidden');
            experimentScreen.classList.remove('hidden');

            // Set background colors for survey mode
            experimentContainer.style.backgroundColor = '#f5f5f5';
            experimentScreen.style.backgroundColor = 'white';

            // Hide fixation point and feedback text
            fixationPoint.classList.add('hidden');
            feedbackText.classList.add('hidden');

            // Hide the stimulus text (we'll use the survey container instead)
            stimulusText.classList.add('hidden');

            // Create and display the survey form with all questions
            displaySurveyAnswerInput();

            // Add event listener for survey completion
            document.addEventListener('keydown', handleSurveyKeyPress);

            console.log('Starting survey test with multiple questions');
        }
    });

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
    let responseStartTime = null;

    // Add new variables for variable categories
    let variableCategories = {}; // Object to store variable categories and their values
    let currentVariableCategory = null; // Currently selected variable category
    let variableCategoryModes = {}; // Store selection modes for each category

    // Add new variables for high-precision timing
    let animationFrameId = null;
    let lastFrameTimestamp = 0;
    let stimulusStartTime = 0;
    let stimulusDuration = 0;
    let isWaitingForStimulus = false;
    let pendingAnimationCallback = null;
    let targetFrameRate = 60; // Assumed frame rate (will be measured)

    // Add new variables for study management
    let studyConfigurations = [];
    let currentStudyIndex = 0;

    let isStudyMode = false;      // Add with other state variables
    let studyData = []; // Add a variable to store all study data
    let isExperimentMode = true; // true = experiment, false = survey
    let currentExperimentConfig = null; // Store the current experiment configuration

    // Function to get current configuration as JSON
    function getCurrentConfiguration() {
        if (isExperimentMode) {
            // Experiment mode configuration
            return {
                id: Date.now(), // unique identifier for this configuration
                name: `Experiment ${studyConfigurations.length + 1}`,
                type: 'experiment',
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
        } else {
            // Survey mode configuration
            const questions = [];
            const questionItems = document.querySelectorAll('.question-item');

            questionItems.forEach(item => {
                const questionId = item.dataset.questionId;
                const questionText = item.querySelector('.question-text').value;
                const answerType = item.querySelector('.answer-type').value;

                // Get slider configuration if applicable
                let sliderConfig = null;
                if (answerType === 'slider') {
                    sliderConfig = {
                        min: parseInt(item.querySelector(`.slider-min`).value) || 1,
                        max: parseInt(item.querySelector(`.slider-max`).value) || 9,
                        leftLabel: item.querySelector(`.slider-left-label`).value || 'Left',
                        rightLabel: item.querySelector(`.slider-right-label`).value || 'Right'
                    };
                }

                questions.push({
                    id: questionId,
                    text: questionText,
                    answerType: answerType,
                    options: answerType === 'radio' ? getMultipleChoiceOptions(questionId) : [],
                    sliderConfig: sliderConfig
                });
            });

            return {
                id: Date.now(),
                name: `Survey ${studyConfigurations.length + 1}`,
                type: 'survey',
                config: {
                    questions: questions,
                    saveData: document.getElementById('survey-save-data').checked
                }
            };
        }
    }

    // Include the Toggle Form Function
    function toggleFormMode(isExperiment) {
        // Save current state before switching
        saveCurrentState();

        const experimentForm = document.getElementById('experiment-form');
        const surveyForm = document.getElementById('survey-form');

        if (isExperiment) {
            experimentForm.classList.remove('hidden');
            surveyForm.classList.add('hidden');
            console.log('Switching to Experiment mode');
        } else {
            experimentForm.classList.add('hidden');
            surveyForm.classList.remove('hidden');
            console.log('Switching to Survey mode');

            // Check if we need to show multiple choice options
            toggleMultipleChoiceOptions();
        }

        // Update state persistence to include form type
        savedState.isExperimentMode = isExperiment;
        if (!isExperiment) {
            // Save survey-specific state
            const questions = [];
            const questionItems = document.querySelectorAll('.question-item');

            questionItems.forEach(item => {
                const questionId = item.dataset.questionId;
                const questionText = item.querySelector('.question-text').value;
                const answerType = item.querySelector('.answer-type').value;

                // Get slider configuration if applicable
                let sliderConfig = null;
                if (answerType === 'slider') {
                    sliderConfig = {
                        min: parseInt(item.querySelector(`.slider-min`).value) || 1,
                        max: parseInt(item.querySelector(`.slider-max`).value) || 9,
                        leftLabel: item.querySelector(`.slider-left-label`).value || 'Left',
                        rightLabel: item.querySelector(`.slider-right-label`).value || 'Right'
                    };
                }

                questions.push({
                    id: questionId,
                    text: questionText,
                    answerType: answerType,
                    options: answerType === 'radio' ? getMultipleChoiceOptions(questionId) : [],
                    sliderConfig: sliderConfig
                });
            });

            savedState.surveyState = {
                questions: questions,
                saveData: document.getElementById('survey-save-data').checked
            };
        }
        localStorage.setItem('experimentBuilderState', JSON.stringify(savedState));

        console.log('State saved:', isExperiment ? 'Experiment mode' : 'Survey mode');
    }

    // Function to toggle answer type specific options visibility
    function toggleMultipleChoiceOptions(selectElement) {
        // If no element is provided, use the default one
        if (!selectElement) {
            selectElement = document.getElementById('answer-type-1');
        }

        // Get the question item container
        const questionItem = selectElement.closest('.question-item');
        if (!questionItem) return;

        const questionId = questionItem.dataset.questionId;
        const answerType = selectElement.value;
        const multipleChoiceContainer = document.getElementById(`multiple-choice-options-${questionId}`);
        const sliderContainer = document.getElementById(`slider-options-${questionId}`);

        // Hide all option containers first
        if (multipleChoiceContainer) multipleChoiceContainer.classList.add('hidden');
        if (sliderContainer) sliderContainer.classList.add('hidden');

        // Show the appropriate container based on answer type
        if (answerType === 'radio') {
            multipleChoiceContainer.classList.remove('hidden');

            // If no options exist, add default options
            const container = document.getElementById(`options-container-${questionId}`);
            if (container.children.length === 0) {
                addMultipleChoiceOption(container, 'Option 1');
                addMultipleChoiceOption(container, 'Option 2');
                addMultipleChoiceOption(container, 'Option 3');
            }
        } else if (answerType === 'slider') {
            sliderContainer.classList.remove('hidden');
        }
    }

    // Function to add a multiple choice option
    function addMultipleChoiceOption(container, value = '') {
        // If container is a string, it's an ID
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }

        if (!container) return null;

        const optionIndex = container.children.length + 1;

        const optionContainer = document.createElement('div');
        optionContainer.className = 'option-item';
        optionContainer.style.display = 'flex';
        optionContainer.style.marginBottom = '10px';
        optionContainer.style.alignItems = 'center';

        const optionInput = document.createElement('input');
        optionInput.type = 'text';
        optionInput.className = 'option-input';
        optionInput.value = value || `Option ${optionIndex}`;
        optionInput.style.flex = '1';
        optionInput.style.marginRight = '10px';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-option-btn';
        removeBtn.textContent = '×';
        removeBtn.style.padding = '5px 10px';
        removeBtn.style.backgroundColor = '#f44336';
        removeBtn.style.color = 'white';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '4px';
        removeBtn.style.cursor = 'pointer';

        removeBtn.addEventListener('click', function() {
            container.removeChild(optionContainer);
            saveCurrentState();
        });

        optionContainer.appendChild(optionInput);
        optionContainer.appendChild(removeBtn);
        container.appendChild(optionContainer);

        // Add change listener to save state
        optionInput.addEventListener('change', saveCurrentState);

        return optionContainer;
    }

    // Function to get all multiple choice options for a specific question
    function getMultipleChoiceOptions(questionId = '1') {
        const options = [];
        const container = document.getElementById(`options-container-${questionId}`);

        if (container) {
            const optionInputs = container.querySelectorAll('.option-input');
            optionInputs.forEach(input => {
                options.push(input.value);
            });
        }

        return options;
    }

    // Function to add a new question
    function addQuestion() {
        const questionsContainer = document.getElementById('questions-container');
        const questionCount = questionsContainer.children.length + 1;
        const questionId = questionCount;

        // Create question item
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.dataset.questionId = questionId;

        // Create question header
        const questionHeader = document.createElement('div');
        questionHeader.className = 'question-header';

        const questionTitle = document.createElement('h4');
        questionTitle.textContent = `Question ${questionId}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-question-btn secondary-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', function() {
            questionsContainer.removeChild(questionItem);
            renumberQuestions();
            saveCurrentState();
        });

        questionHeader.appendChild(questionTitle);
        questionHeader.appendChild(removeBtn);

        // Create question text group
        const questionTextGroup = document.createElement('div');
        questionTextGroup.className = 'form-group';

        const questionTextLabel = document.createElement('label');
        questionTextLabel.htmlFor = `question-text-${questionId}`;
        questionTextLabel.textContent = 'Question Text:';

        const questionTextArea = document.createElement('textarea');
        questionTextArea.id = `question-text-${questionId}`;
        questionTextArea.className = 'question-text';
        questionTextArea.rows = 3;
        questionTextArea.required = true;
        questionTextArea.value = 'Enter your question here';
        questionTextArea.addEventListener('change', saveCurrentState);

        questionTextGroup.appendChild(questionTextLabel);
        questionTextGroup.appendChild(questionTextArea);

        // Create answer type group
        const answerTypeGroup = document.createElement('div');
        answerTypeGroup.className = 'form-group';

        const answerTypeLabel = document.createElement('label');
        answerTypeLabel.htmlFor = `answer-type-${questionId}`;
        answerTypeLabel.textContent = 'Answer Type:';

        const answerTypeSelect = document.createElement('select');
        answerTypeSelect.id = `answer-type-${questionId}`;
        answerTypeSelect.className = 'answer-type';
        answerTypeSelect.required = true;

        const textOption = document.createElement('option');
        textOption.value = 'text';
        textOption.textContent = 'Text (single line)';
        textOption.selected = true;

        const textareaOption = document.createElement('option');
        textareaOption.value = 'textarea';
        textareaOption.textContent = 'Text (multi-line)';

        const radioOption = document.createElement('option');
        radioOption.value = 'radio';
        radioOption.textContent = 'Multiple Choice';

        const sliderOption = document.createElement('option');
        sliderOption.value = 'slider';
        sliderOption.textContent = 'Slider Scale';

        answerTypeSelect.appendChild(textOption);
        answerTypeSelect.appendChild(textareaOption);
        answerTypeSelect.appendChild(radioOption);
        answerTypeSelect.appendChild(sliderOption);

        answerTypeSelect.addEventListener('change', function() {
            toggleMultipleChoiceOptions(this);
            saveCurrentState();
        });

        const helperText = document.createElement('p');
        helperText.className = 'helper-text';
        helperText.textContent = 'Select the type of answer input to display to participants.';

        answerTypeGroup.appendChild(answerTypeLabel);
        answerTypeGroup.appendChild(answerTypeSelect);
        answerTypeGroup.appendChild(helperText);

        // Create multiple choice options group
        const multipleChoiceGroup = document.createElement('div');
        multipleChoiceGroup.id = `multiple-choice-options-${questionId}`;
        multipleChoiceGroup.className = 'multiple-choice-options form-group hidden';

        const optionsLabel = document.createElement('label');
        optionsLabel.textContent = 'Multiple Choice Options:';

        const optionsContainer = document.createElement('div');
        optionsContainer.id = `options-container-${questionId}`;
        optionsContainer.className = 'options-container';

        const addOptionBtn = document.createElement('button');
        addOptionBtn.type = 'button';
        addOptionBtn.className = 'add-option-btn secondary-btn';
        addOptionBtn.textContent = 'Add Option';
        addOptionBtn.addEventListener('click', function() {
            addMultipleChoiceOption(optionsContainer);
            saveCurrentState();
        });

        const optionsHelperText = document.createElement('p');
        optionsHelperText.className = 'helper-text';
        optionsHelperText.textContent = 'Add the options that participants can choose from.';

        multipleChoiceGroup.appendChild(optionsLabel);
        multipleChoiceGroup.appendChild(optionsContainer);
        multipleChoiceGroup.appendChild(addOptionBtn);
        multipleChoiceGroup.appendChild(optionsHelperText);

        // Create slider options group
        const sliderOptionsGroup = document.createElement('div');
        sliderOptionsGroup.id = `slider-options-${questionId}`;
        sliderOptionsGroup.className = 'slider-options form-group hidden';

        sliderOptionsGroup.innerHTML = `
            <label>Slider Scale Options:</label>
            <div class="slider-config">
                <div class="slider-row">
                    <div class="slider-field">
                        <label for="slider-min-${questionId}">Min Value:</label>
                        <input type="number" id="slider-min-${questionId}" class="slider-min" value="1" min="0" max="100">
                    </div>
                    <div class="slider-field">
                        <label for="slider-max-${questionId}">Max Value:</label>
                        <input type="number" id="slider-max-${questionId}" class="slider-max" value="9" min="1" max="100">
                    </div>
                </div>
                <div class="slider-row">
                    <div class="slider-field">
                        <label for="slider-left-label-${questionId}">Left Label:</label>
                        <input type="text" id="slider-left-label-${questionId}" class="slider-left-label" value="Left">
                    </div>
                    <div class="slider-field">
                        <label for="slider-right-label-${questionId}">Right Label:</label>
                        <input type="text" id="slider-right-label-${questionId}" class="slider-right-label" value="Right">
                    </div>
                </div>
            </div>
            <p class="helper-text">Configure the slider scale range and labels.</p>
        `;

        // Add change event listeners to slider inputs
        sliderOptionsGroup.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', saveCurrentState);
        });

        // Assemble question item
        questionItem.appendChild(questionHeader);
        questionItem.appendChild(questionTextGroup);
        questionItem.appendChild(answerTypeGroup);
        questionItem.appendChild(multipleChoiceGroup);
        questionItem.appendChild(sliderOptionsGroup);

        // Add to questions container
        questionsContainer.appendChild(questionItem);

        // Show remove buttons if there's more than one question
        updateRemoveButtons();

        return questionItem;
    }

    // Function to renumber questions
    function renumberQuestions() {
        const questionItems = document.querySelectorAll('.question-item');
        questionItems.forEach((item, index) => {
            const questionNumber = index + 1;
            item.dataset.questionId = questionNumber;

            // Update title
            const title = item.querySelector('h4');
            if (title) title.textContent = `Question ${questionNumber}`;

            // Update IDs and labels
            const questionText = item.querySelector('.question-text');
            const answerType = item.querySelector('.answer-type');
            const multipleChoiceOptions = item.querySelector('.multiple-choice-options');
            const optionsContainer = item.querySelector('.options-container');
            const sliderOptions = item.querySelector('.slider-options');
            const sliderMin = item.querySelector('.slider-min');
            const sliderMax = item.querySelector('.slider-max');
            const sliderLeftLabel = item.querySelector('.slider-left-label');
            const sliderRightLabel = item.querySelector('.slider-right-label');

            if (questionText) {
                questionText.id = `question-text-${questionNumber}`;
                const label = item.querySelector('label[for^="question-text"]');
                if (label) label.htmlFor = `question-text-${questionNumber}`;
            }

            if (answerType) {
                answerType.id = `answer-type-${questionNumber}`;
                const label = item.querySelector('label[for^="answer-type"]');
                if (label) label.htmlFor = `answer-type-${questionNumber}`;
            }

            if (multipleChoiceOptions) {
                multipleChoiceOptions.id = `multiple-choice-options-${questionNumber}`;
            }

            if (optionsContainer) {
                optionsContainer.id = `options-container-${questionNumber}`;
            }

            // Update slider options IDs
            if (sliderOptions) {
                sliderOptions.id = `slider-options-${questionNumber}`;
            }

            if (sliderMin) {
                sliderMin.id = `slider-min-${questionNumber}`;
                const label = item.querySelector(`label[for^="slider-min"]`);
                if (label) label.htmlFor = `slider-min-${questionNumber}`;
            }

            if (sliderMax) {
                sliderMax.id = `slider-max-${questionNumber}`;
                const label = item.querySelector(`label[for^="slider-max"]`);
                if (label) label.htmlFor = `slider-max-${questionNumber}`;
            }

            if (sliderLeftLabel) {
                sliderLeftLabel.id = `slider-left-label-${questionNumber}`;
                const label = item.querySelector(`label[for^="slider-left-label"]`);
                if (label) label.htmlFor = `slider-left-label-${questionNumber}`;
            }

            if (sliderRightLabel) {
                sliderRightLabel.id = `slider-right-label-${questionNumber}`;
                const label = item.querySelector(`label[for^="slider-right-label"]`);
                if (label) label.htmlFor = `slider-right-label-${questionNumber}`;
            }
        });

        // Update remove buttons visibility
        updateRemoveButtons();
    }

    // Function to update remove buttons visibility
    function updateRemoveButtons() {
        const questionItems = document.querySelectorAll('.question-item');
        const removeButtons = document.querySelectorAll('.remove-question-btn');

        if (questionItems.length > 1) {
            removeButtons.forEach(btn => btn.style.display = 'block');
        } else {
            removeButtons.forEach(btn => btn.style.display = 'none');
        }
    }

    // Function to display configuration in study window
    function displayConfiguration(config) {
        const studyWindow = document.getElementById('study-window');
        const configElement = document.createElement('div');
        configElement.className = 'study-config-item';
        configElement.dataset.configId = config.id;

        // Different display for experiment vs survey blocks
        let detailsHTML = '';

        if (config.type === 'survey') {
            // Survey block details
            let questionCount = 1;
            let questionPreview = '';

            // Handle both new format (with questions array) and old format
            if (config.config.questions && config.config.questions.length > 0) {
                questionCount = config.config.questions.length;
                questionPreview = config.config.questions[0].text.substring(0, 30) +
                                 (config.config.questions[0].text.length > 30 ? '...' : '');
            } else if (config.config.questionText) {
                // Legacy support
                questionPreview = config.config.questionText.substring(0, 30) +
                                (config.config.questionText.length > 30 ? '...' : '');
            }

            detailsHTML = `
                <small>Type: Survey</small>
                <small>Questions: ${questionCount}</small>
                <small>Preview: ${questionPreview}</small>
                <small>Save Data: ${config.config.saveData ? 'Yes' : 'No'}</small>
            `;
        } else {
            // Experiment block details (default)
            detailsHTML = `
                <small>Type: Experiment</small>
                <small>Block: ${config.config.trialCount} trials</small>
                <small>Stimuli: ${config.config.stimuliText.substring(0, 30)}${config.config.stimuliText.length > 30 ? '...' : ''}</small>
                <small>Feedback: ${config.config.provideFeedback ? 'Yes' : 'No'}</small>
                <small>Save Data: ${config.config.saveData ? 'Yes' : 'No'}</small>
                ${config.config.provideFeedback ?
                    `<small>Feedback Duration: ${config.config.feedbackDuration}ms</small>` : ''}
            `;
        }

        configElement.innerHTML = `
            <div class="config-header">
                <input type="text"
                       class="block-name-input"
                       value="${config.name || 'Block ' + (studyConfigurations.length)}"
                       placeholder="Enter block name"
                       title="Click to edit block name">
                <div class="block-controls">
                    <button class="move-up-btn" title="Move Up">↑</button>
                    <button class="move-down-btn" title="Move Down">↓</button>
                    <button class="remove-config-btn" title="Remove">×</button>
                </div>
            </div>
            <div class="config-details">
                ${detailsHTML}
            </div>
        `;

        // Name input handlers
        const nameInput = configElement.querySelector('.block-name-input');
        nameInput.addEventListener('blur', function() {
            updateBlockName(this);
        });
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });

        // Move up button handler
        const moveUpBtn = configElement.querySelector('.move-up-btn');
        moveUpBtn.addEventListener('click', function() {
            const currentIndex = Array.from(studyWindow.children).indexOf(configElement);
            if (currentIndex > 0) {
                // Update the array
                const temp = studyConfigurations[currentIndex];
                studyConfigurations[currentIndex] = studyConfigurations[currentIndex - 1];
                studyConfigurations[currentIndex - 1] = temp;

                // Update the DOM
                studyWindow.insertBefore(configElement, studyWindow.children[currentIndex - 1]);

                // Update move buttons visibility
                updateMoveButtonsVisibility();
            }
        });

        // Move down button handler
        const moveDownBtn = configElement.querySelector('.move-down-btn');
        moveDownBtn.addEventListener('click', function() {
            const currentIndex = Array.from(studyWindow.children).indexOf(configElement);
            if (currentIndex < studyWindow.children.length - 1) {
                // Update the array
                const temp = studyConfigurations[currentIndex];
                studyConfigurations[currentIndex] = studyConfigurations[currentIndex + 1];
                studyConfigurations[currentIndex + 1] = temp;

                // Update the DOM
                if (studyWindow.children[currentIndex + 2]) {
                    studyWindow.insertBefore(configElement, studyWindow.children[currentIndex + 2]);
                } else {
                    studyWindow.appendChild(configElement);
                }

                // Update move buttons visibility
                updateMoveButtonsVisibility();
            }
        });

        // Remove button handler
        const removeBtn = configElement.querySelector('.remove-config-btn');
        removeBtn.addEventListener('click', function() {
            const currentIndex = Array.from(studyWindow.children).indexOf(configElement);
            studyConfigurations.splice(currentIndex, 1);
            configElement.remove();
            updateMoveButtonsVisibility();
        });

        studyWindow.appendChild(configElement);
        updateMoveButtonsVisibility();

        function updateBlockName(input) {
            const configIndex = studyConfigurations.findIndex(c => c.id === config.id);
            if (configIndex !== -1) {
                const newName = input.value.trim() || `Block ${configIndex + 1}`;
                input.value = newName;
                studyConfigurations[configIndex].name = newName;
            }
        }
    }

    // Function to update visibility of move buttons
    function updateMoveButtonsVisibility() {
        const studyWindow = document.getElementById('study-window');
        const configs = Array.from(studyWindow.children);

        configs.forEach((config, index) => {
            const moveUpBtn = config.querySelector('.move-up-btn');
            const moveDownBtn = config.querySelector('.move-down-btn');

            // First item can't move up
            if (moveUpBtn) {
                moveUpBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
            }

            // Last item can't move down
            if (moveDownBtn) {
                moveDownBtn.style.visibility = index === configs.length - 1 ? 'hidden' : 'visible';
            }
        });
    }

    // Add to Study button click handler
    document.getElementById('add-to-study-btn').addEventListener('click', () => {
        const config = getCurrentConfiguration();
        config.name = `Block ${studyConfigurations.length + 1}`;
        studyConfigurations.push(config);
        displayConfiguration(config);
    });

    // Begin Study button click handler
    document.getElementById('begin-study-btn').addEventListener('click', function() {
        if (studyConfigurations.length === 0) {
            alert('Please add at least one configuration to the study.');
            return;
        }

        // Check if the study configuration has been tested
        // This is to ensure the UI is properly initialized before running the study
        const studyConfigTested = window.studyConfigTested || false;
        if (!studyConfigTested) {
            alert('Please click the "TEST (run first)" button before beginning the study. This ensures the UI is properly initialized.');
            return;
        }

        isStudyMode = true;  // Make sure this is set
        console.log('Beginning study mode:', isStudyMode);
        currentStudyIndex = 0;

        // Start the first configuration in the study
        startStudyConfiguration(currentStudyIndex);
    });

    // Simple Study Management Functions

    // Save Study button click handler
    const saveStudyBtn = document.getElementById('save-study-btn');
    if (saveStudyBtn) {
        saveStudyBtn.addEventListener('click', function() {
            if (studyConfigurations.length === 0) {
                alert('Please add at least one configuration to the study before saving.');
                return;
            }

            // Show the simple study modal
            showSimpleStudyModal();
        });
    }

    // Load Study button click handler
    const loadStudyBtn = document.getElementById('load-study-btn');
    if (loadStudyBtn) {
        loadStudyBtn.addEventListener('click', function() {
            // Show the simple study modal and populate the study list
            showSimpleStudyModal();
        });
    }

    // Function to show the simple study modal
    function showSimpleStudyModal() {
        // Get the modal element
        const modal = document.getElementById('simple-study-modal');
        if (!modal) return;

        // Set default study name
        const studyNameInput = document.getElementById('simple-study-name');
        if (studyNameInput) {
            studyNameInput.value = 'Psychology Study ' + new Date().toLocaleDateString();
        }

        // Populate the study list
        populateStudyList();

        // Show the modal
        modal.classList.remove('hidden');
    }

    // Function to hide the simple study modal
    function hideSimpleStudyModal() {
        const modal = document.getElementById('simple-study-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Function to populate the study list
    function populateStudyList() {
        const studyList = document.getElementById('simple-study-list');
        if (!studyList) return;

        // Clear the list
        studyList.innerHTML = '';

        // Get saved studies
        let savedStudies = [];
        try {
            const savedStudiesJSON = localStorage.getItem('savedStudies');
            if (savedStudiesJSON) {
                savedStudies = JSON.parse(savedStudiesJSON);
            }
        } catch (error) {
            console.error('Error loading saved studies:', error);
        }

        // If no studies found, show message
        if (savedStudies.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No saved studies found';
            studyList.appendChild(option);
            return;
        }

        // Sort studies by timestamp (newest first)
        savedStudies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Add each study to the list
        savedStudies.forEach(study => {
            const option = document.createElement('option');
            option.value = study.id;

            // Format the date
            const date = new Date(study.timestamp);
            const formattedDate = date.toLocaleDateString();

            option.textContent = `${study.name} (${formattedDate}) - ${study.configurations.length} config(s)`;
            studyList.appendChild(option);
        });
    }

    // Function to save the current study to localStorage
    function saveStudyToLocalStorage() {
        const studyNameInput = document.getElementById('simple-study-name');
        if (!studyNameInput) return;

        const studyName = studyNameInput.value.trim();
        if (!studyName) {
            alert('Please enter a name for your study.');
            return;
        }

        // Create a study object
        const studyObject = {
            id: Date.now().toString(),
            version: '1.0',
            timestamp: new Date().toISOString(),
            name: studyName,
            configurations: studyConfigurations
        };

        // Get existing saved studies
        let savedStudies = [];
        try {
            const savedStudiesJSON = localStorage.getItem('savedStudies');
            if (savedStudiesJSON) {
                savedStudies = JSON.parse(savedStudiesJSON);
            }
        } catch (error) {
            console.error('Error loading saved studies:', error);
        }

        // Check if a study with this name already exists
        const existingStudyIndex = savedStudies.findIndex(study => study.name === studyName);
        if (existingStudyIndex !== -1) {
            if (confirm(`A study named "${studyName}" already exists. Do you want to overwrite it?`)) {
                savedStudies[existingStudyIndex] = studyObject;
            } else {
                return;
            }
        } else {
            savedStudies.push(studyObject);
        }

        // Save to localStorage
        localStorage.setItem('savedStudies', JSON.stringify(savedStudies));

        // Update the study list
        populateStudyList();

        // Show success message
        alert(`Study "${studyName}" saved successfully.`);
    }

    // Function to load a study from localStorage
    function loadStudyFromLocalStorage() {
        const studyList = document.getElementById('simple-study-list');
        if (!studyList || !studyList.value) {
            alert('Please select a study to load.');
            return;
        }

        const studyId = studyList.value;

        // Get saved studies
        let savedStudies = [];
        try {
            const savedStudiesJSON = localStorage.getItem('savedStudies');
            if (savedStudiesJSON) {
                savedStudies = JSON.parse(savedStudiesJSON);
            }
        } catch (error) {
            console.error('Error loading saved studies:', error);
            return;
        }

        // Find the selected study
        const study = savedStudies.find(s => s.id === studyId);
        if (!study) {
            alert('Selected study not found.');
            return;
        }

        // Confirm if there are existing configurations
        if (studyConfigurations.length > 0) {
            if (!confirm('Loading this study will replace your current study configurations. Continue?')) {
                return;
            }
        }

        // Clear current configurations
        studyConfigurations = [];
        document.getElementById('study-window').innerHTML = '';

        // Load the configurations
        study.configurations.forEach(config => {
            // Ensure the configuration has a unique ID
            if (!config.id) {
                config.id = Date.now() + Math.random().toString(36).substring(2, 11);
            }

            // Add to the study configurations array
            studyConfigurations.push(config);

            // Display in the UI
            displayConfiguration(config);
        });

        // Hide the modal
        hideSimpleStudyModal();

        // Show success message
        alert(`Study "${study.name}" loaded successfully with ${studyConfigurations.length} configuration(s).`);
    }

    // Function to delete a study from localStorage
    function deleteStudyFromLocalStorage() {
        const studyList = document.getElementById('simple-study-list');
        if (!studyList || !studyList.value) {
            alert('Please select a study to delete.');
            return;
        }

        const studyId = studyList.value;

        // Get saved studies
        let savedStudies = [];
        try {
            const savedStudiesJSON = localStorage.getItem('savedStudies');
            if (savedStudiesJSON) {
                savedStudies = JSON.parse(savedStudiesJSON);
            }
        } catch (error) {
            console.error('Error loading saved studies:', error);
            return;
        }

        // Find the selected study
        const studyIndex = savedStudies.findIndex(s => s.id === studyId);
        if (studyIndex === -1) {
            alert('Selected study not found.');
            return;
        }

        // Confirm deletion
        const studyName = savedStudies[studyIndex].name;
        if (!confirm(`Are you sure you want to delete the study "${studyName}"? This cannot be undone.`)) {
            return;
        }

        // Remove the study
        savedStudies.splice(studyIndex, 1);

        // Save to localStorage
        localStorage.setItem('savedStudies', JSON.stringify(savedStudies));

        // Update the study list
        populateStudyList();

        // Show success message
        alert(`Study "${studyName}" deleted successfully.`);
    }

    // Add event listeners for the simple study modal
    document.addEventListener('DOMContentLoaded', function() {
        // Close button
        const closeBtn = document.getElementById('simple-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideSimpleStudyModal);
        }

        // Save button
        const saveBtn = document.getElementById('simple-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveStudyToLocalStorage);
        }

        // Load button
        const loadBtn = document.getElementById('simple-load-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', loadStudyFromLocalStorage);
        }

        // Delete button
        const deleteBtn = document.getElementById('simple-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', deleteStudyFromLocalStorage);
        }

        // Close modal when clicking outside of it
        const modal = document.getElementById('simple-study-modal');
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    hideSimpleStudyModal();
                }
            });
        }

        // Import button handler
        const importBtn = document.getElementById('simple-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', function() {
                // Trigger the file input
                const fileInput = document.getElementById('simple-study-file-input');
                if (fileInput) {
                    fileInput.click();
                }
            });
        }

        // File input change handler for simple modal
        const simpleFileInput = document.getElementById('simple-study-file-input');
        if (simpleFileInput) {
            simpleFileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    loadStudyFromFile(file);
                }
            });
        }

        // File input change handler for main interface
        const mainFileInput = document.getElementById('main-study-file-input');
        if (mainFileInput) {
            mainFileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    loadStudyFromFile(file);
                }
            });
        }
    });

    // Function to load a study from a file
    function loadStudyFromFile(file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                // Parse the JSON content
                const studyObject = JSON.parse(event.target.result);

                // Validate the study object
                if (!studyObject.configurations || !Array.isArray(studyObject.configurations)) {
                    throw new Error('Invalid study file format');
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
                studyObject.configurations.forEach(config => {
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
                alert(`Study loaded successfully with ${studyConfigurations.length} configuration(s).`);

                // Reset the file input
                document.getElementById('study-file-input').value = '';

            } catch (error) {
                console.error('Error loading study:', error);
                alert('Error loading study file. Please make sure it is a valid study configuration file.');
            }
        };

        reader.onerror = function() {
            alert('Error reading the file. Please try again.');
        };

        reader.readAsText(file);
    }

    // Function to start a specific configuration in the study
    function startStudyConfiguration(configIndex) {
        if (configIndex >= studyConfigurations.length) {
            // All configurations completed
            alert('Study completed!');
            return;
        }

        const config = studyConfigurations[configIndex];
        console.log('Starting configuration:', config);

        if (config.type === 'survey') {
            // Handle survey configuration
            console.log('Starting survey configuration');

            // Switch to survey mode if needed
            if (isExperimentMode) {
                isExperimentMode = false;
                document.getElementById('form-type-switch').checked = false;
                toggleFormMode(false);
            }

            // Load survey configuration
            const questionsContainer = document.getElementById('questions-container');
            questionsContainer.innerHTML = ''; // Clear existing questions

            // Handle both new format (with questions array) and old format
            if (config.config.questions && config.config.questions.length > 0) {
                // New format with multiple questions
                config.config.questions.forEach((question, index) => {
                    let questionItem;

                    if (index === 0) {
                        // Create the first question
                        questionItem = document.createElement('div');
                        questionItem.className = 'question-item';
                        questionItem.dataset.questionId = question.id || '1';

                        questionItem.innerHTML = `
                            <div class="question-header">
                                <h4>Question 1</h4>
                                <button type="button" class="remove-question-btn secondary-btn" style="display: none;">Remove</button>
                            </div>
                            <div class="form-group">
                                <label for="question-text-1">Question Text:</label>
                                <textarea id="question-text-1" class="question-text" rows="3" required>${question.text}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="answer-type-1">Answer Type:</label>
                                <select id="answer-type-1" class="answer-type" required>
                                    <option value="text" ${question.answerType === 'text' ? 'selected' : ''}>Text (single line)</option>
                                    <option value="textarea" ${question.answerType === 'textarea' ? 'selected' : ''}>Text (multi-line)</option>
                                    <option value="radio" ${question.answerType === 'radio' ? 'selected' : ''}>Multiple Choice</option>
                                    <option value="slider" ${question.answerType === 'slider' ? 'selected' : ''}>Slider Scale</option>
                                </select>
                                <p class="helper-text">Select the type of answer input to display to participants.</p>
                            </div>
                            <div id="multiple-choice-options-1" class="multiple-choice-options form-group ${question.answerType === 'radio' ? '' : 'hidden'}">
                                <label>Multiple Choice Options:</label>
                                <div id="options-container-1" class="options-container"></div>
                                <button type="button" class="add-option-btn secondary-btn">Add Option</button>
                                <p class="helper-text">Add the options that participants can choose from.</p>
                            </div>
                            <div id="slider-options-1" class="slider-options form-group ${question.answerType === 'slider' ? '' : 'hidden'}">
                                <label>Slider Scale Options:</label>
                                <div class="slider-config">
                                    <div class="slider-row">
                                        <div class="slider-field">
                                            <label for="slider-min-1">Min Value:</label>
                                            <input type="number" id="slider-min-1" class="slider-min" value="${question.sliderConfig ? question.sliderConfig.min : '1'}" min="0" max="100">
                                        </div>
                                        <div class="slider-field">
                                            <label for="slider-max-1">Max Value:</label>
                                            <input type="number" id="slider-max-1" class="slider-max" value="${question.sliderConfig ? question.sliderConfig.max : '9'}" min="1" max="100">
                                        </div>
                                    </div>
                                    <div class="slider-row">
                                        <div class="slider-field">
                                            <label for="slider-left-label-1">Left Label:</label>
                                            <input type="text" id="slider-left-label-1" class="slider-left-label" value="${question.sliderConfig ? question.sliderConfig.leftLabel : 'Left'}">
                                        </div>
                                        <div class="slider-field">
                                            <label for="slider-right-label-1">Right Label:</label>
                                            <input type="text" id="slider-right-label-1" class="slider-right-label" value="${question.sliderConfig ? question.sliderConfig.rightLabel : 'Right'}">
                                        </div>
                                    </div>
                                </div>
                                <p class="helper-text">Configure the slider scale range and labels.</p>
                            </div>
                        `;

                        questionsContainer.appendChild(questionItem);

                        // Add event listeners
                        const answerTypeSelect = questionItem.querySelector('.answer-type');
                        answerTypeSelect.addEventListener('change', function() {
                            toggleMultipleChoiceOptions(this);
                            saveCurrentState();
                        });

                        const addOptionBtn = questionItem.querySelector('.add-option-btn');
                        addOptionBtn.addEventListener('click', function() {
                            const container = document.getElementById(`options-container-1`);
                            addMultipleChoiceOption(container);
                            saveCurrentState();
                        });

                        // Add options if it's a radio type
                        if (question.answerType === 'radio' && question.options && question.options.length > 0) {
                            const optionsContainer = document.getElementById('options-container-1');
                            question.options.forEach(option => {
                                addMultipleChoiceOption(optionsContainer, option);
                            });
                        }
                    } else {
                        // Add additional questions
                        questionItem = addQuestion();

                        // Update the question with saved data
                        const questionText = questionItem.querySelector('.question-text');
                        const answerType = questionItem.querySelector('.answer-type');

                        if (questionText) questionText.value = question.text || '';
                        if (answerType) {
                            answerType.value = question.answerType || 'text';

                            // Add options if it's a radio type
                            if (question.answerType === 'radio' && question.options && question.options.length > 0) {
                                const questionId = questionItem.dataset.questionId;
                                const optionsContainer = document.getElementById(`options-container-${questionId}`);
                                if (optionsContainer) {
                                    optionsContainer.innerHTML = '';

                                    question.options.forEach(option => {
                                        addMultipleChoiceOption(optionsContainer, option);
                                    });

                                    // Show options container
                                    document.getElementById(`multiple-choice-options-${questionId}`).classList.remove('hidden');
                                }
                            }

                            // Configure slider if it's a slider type
                            if (question.answerType === 'slider' && question.sliderConfig) {
                                const questionId = questionItem.dataset.questionId;
                                const sliderOptions = document.getElementById(`slider-options-${questionId}`);
                                if (sliderOptions) {
                                    // Set slider values
                                    const minInput = document.getElementById(`slider-min-${questionId}`);
                                    const maxInput = document.getElementById(`slider-max-${questionId}`);
                                    const leftLabelInput = document.getElementById(`slider-left-label-${questionId}`);
                                    const rightLabelInput = document.getElementById(`slider-right-label-${questionId}`);

                                    if (minInput) minInput.value = question.sliderConfig.min || 1;
                                    if (maxInput) maxInput.value = question.sliderConfig.max || 9;
                                    if (leftLabelInput) leftLabelInput.value = question.sliderConfig.leftLabel || 'Left';
                                    if (rightLabelInput) rightLabelInput.value = question.sliderConfig.rightLabel || 'Right';

                                    // Show slider options container
                                    sliderOptions.classList.remove('hidden');
                                }
                            }
                        }
                    }
                });
            } else if (config.config.questionText) {
                // Legacy support for old format with single question
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                questionItem.dataset.questionId = '1';

                questionItem.innerHTML = `
                    <div class="question-header">
                        <h4>Question 1</h4>
                        <button type="button" class="remove-question-btn secondary-btn" style="display: none;">Remove</button>
                    </div>
                    <div class="form-group">
                        <label for="question-text-1">Question Text:</label>
                        <textarea id="question-text-1" class="question-text" rows="3" required>${config.config.questionText}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="answer-type-1">Answer Type:</label>
                        <select id="answer-type-1" class="answer-type" required>
                            <option value="text" ${config.config.answerType === 'text' ? 'selected' : ''}>Text (single line)</option>
                            <option value="textarea" ${config.config.answerType === 'textarea' ? 'selected' : ''}>Text (multi-line)</option>
                            <option value="radio" ${config.config.answerType === 'radio' ? 'selected' : ''}>Multiple Choice</option>
                            <option value="slider" ${config.config.answerType === 'slider' ? 'selected' : ''}>Slider Scale</option>
                        </select>
                        <p class="helper-text">Select the type of answer input to display to participants.</p>
                    </div>
                    <div id="multiple-choice-options-1" class="multiple-choice-options form-group ${config.config.answerType === 'radio' ? '' : 'hidden'}">
                        <label>Multiple Choice Options:</label>
                        <div id="options-container-1" class="options-container"></div>
                        <button type="button" class="add-option-btn secondary-btn">Add Option</button>
                        <p class="helper-text">Add the options that participants can choose from.</p>
                    </div>
                    <div id="slider-options-1" class="slider-options form-group ${config.config.answerType === 'slider' ? '' : 'hidden'}">
                        <label>Slider Scale Options:</label>
                        <div class="slider-config">
                            <div class="slider-row">
                                <div class="slider-field">
                                    <label for="slider-min-1">Min Value:</label>
                                    <input type="number" id="slider-min-1" class="slider-min" value="${config.config.sliderConfig ? config.config.sliderConfig.min : '1'}" min="0" max="100">
                                </div>
                                <div class="slider-field">
                                    <label for="slider-max-1">Max Value:</label>
                                    <input type="number" id="slider-max-1" class="slider-max" value="${config.config.sliderConfig ? config.config.sliderConfig.max : '9'}" min="1" max="100">
                                </div>
                            </div>
                            <div class="slider-row">
                                <div class="slider-field">
                                    <label for="slider-left-label-1">Left Label:</label>
                                    <input type="text" id="slider-left-label-1" class="slider-left-label" value="${config.config.sliderConfig ? config.config.sliderConfig.leftLabel : 'Left'}">
                                </div>
                                <div class="slider-field">
                                    <label for="slider-right-label-1">Right Label:</label>
                                    <input type="text" id="slider-right-label-1" class="slider-right-label" value="${config.config.sliderConfig ? config.config.sliderConfig.rightLabel : 'Right'}">
                                </div>
                            </div>
                        </div>
                        <p class="helper-text">Configure the slider scale range and labels.</p>
                    </div>
                `;

                questionsContainer.appendChild(questionItem);

                // Add event listeners
                const answerTypeSelect = questionItem.querySelector('.answer-type');
                answerTypeSelect.addEventListener('change', function() {
                    toggleMultipleChoiceOptions(this);
                    saveCurrentState();
                });

                const addOptionBtn = questionItem.querySelector('.add-option-btn');
                addOptionBtn.addEventListener('click', function() {
                    const container = document.getElementById(`options-container-1`);
                    addMultipleChoiceOption(container);
                    saveCurrentState();
                });

                // Add options if it's a radio type and options exist
                if (config.config.answerType === 'radio' && config.config.options) {
                    const optionsContainer = document.getElementById('options-container-1');
                    config.config.options.forEach(option => {
                        addMultipleChoiceOption(optionsContainer, option);
                    });
                }
            }

            // Set save data checkbox
            const configSaveData = config.config.saveData !== undefined ? config.config.saveData : false;
            document.getElementById('survey-save-data').checked = configSaveData;

            // Update the global saveData variable to match the checkbox state
            saveData = configSaveData;
            console.log('Survey saveData set to:', saveData);

            // Trigger the survey test
            document.getElementById('begin-btn').click();
        } else {
            // Handle experiment configuration (default)
            console.log('Starting experiment configuration:', config);

            // Switch to experiment mode if needed
            if (!isExperimentMode) {
                isExperimentMode = true;
                document.getElementById('form-type-switch').checked = true;
                toggleFormMode(true);
            }

            // Load experiment configuration and get the parsed stimuli
            const parsedStimuli = loadConfiguration(config.config);

            // Update the UI to reflect the loaded configuration
            // This ensures the UI matches the configuration that's about to run
            document.getElementById('canvas-background').value = config.config.canvasBackground || '#f0f0f0';
            document.getElementById('trial-interval').value = config.config.trialInterval || 1000;
            document.getElementById('fixation-interval').value = config.config.fixationInterval || 500;
            document.getElementById('stimulus-offset').value = config.config.stimulusOffset || 0;
            document.getElementById('trial-background').value = config.config.trialBackground || 'white';
            document.getElementById('fixation').value = config.config.fixation || 'yes';
            document.getElementById('fixation-color').value = config.config.fixationColor || 'black';
            document.getElementById('trial-count').value = config.config.trialCount || 10;
            document.getElementById('cycle-threshold').value = config.config.cycleThreshold !== undefined ? config.config.cycleThreshold : 0;
            document.getElementById('stimuli-text').value = config.config.stimuliText || '';
            document.getElementById('randomize-stimuli').checked = config.config.randomizeStimuli !== undefined ? config.config.randomizeStimuli : false;
            document.getElementById('stimulus-size').value = config.config.stimulusSize || 24;
            document.getElementById('stimulus-color').value = config.config.stimulusColor || 'black';
            document.getElementById('response-key').value = config.config.responseKey || '';
            document.getElementById('additional-responses').value = config.config.additionalResponses || '';
            document.getElementById('provide-feedback').checked = config.config.provideFeedback !== undefined ? config.config.provideFeedback : true;
            document.getElementById('feedback-duration').value = config.config.feedbackDuration || 500;
            document.getElementById('save-data').checked = config.config.saveData !== undefined ? config.config.saveData : false;

            // Store the current configuration for reference during the experiment
            currentExperimentConfig = config.config;

            // Update the global saveData variable to match the checkbox state
            saveData = document.getElementById('save-data').checked;
            console.log('Experiment saveData set to:', saveData);

            // Start the experiment with this configuration
            startExperiment(parsedStimuli);
        }
    }

    // Function to handle the end of an experiment
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

    // This is a placeholder comment to maintain line numbers

    // Function to load a configuration into the form
    function loadConfiguration(config) {
        console.log('Loading configuration:', config);

        // Reset stimuliResponses to avoid carrying over mappings from previous configurations
        stimuliResponses = {};
        hasCustomMappings = false;

        // Set global variables from the configuration
        if (config.canvasBackground) canvasBackground = config.canvasBackground;
        if (config.trialInterval) trialInterval = parseInt(config.trialInterval);
        if (config.fixationInterval) fixationInterval = parseInt(config.fixationInterval);
        if (config.stimulusOffset) stimulusOffset = parseInt(config.stimulusOffset);
        if (config.trialBackground) trialBackground = config.trialBackground;
        if (config.fixation) showFixation = config.fixation === 'yes';
        if (config.fixationColor) fixationColor = config.fixationColor;
        if (config.trialCount) trialCount = parseInt(config.trialCount);
        if (config.cycleThreshold !== undefined) cycleThreshold = parseInt(config.cycleThreshold);
        if (config.randomizeStimuli !== undefined) randomizeStimuli = config.randomizeStimuli;
        if (config.stimulusSize) stimulusSize = config.stimulusSize;
        if (config.stimulusColor) stimulusColor = config.stimulusColor;
        if (config.responseKey) responseKey = config.responseKey;
        if (config.additionalResponses) additionalResponses = config.additionalResponses;
        if (config.provideFeedback !== undefined) provideFeedback = config.provideFeedback;
        if (config.feedbackDuration) feedbackDuration = parseInt(config.feedbackDuration);
        if (config.saveData !== undefined) saveData = config.saveData;

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

            // Update the S-R mapping button text
            const srMappingBtn = document.getElementById('sr-mapping-btn');
            if (srMappingBtn) {
                srMappingBtn.textContent = hasCustomMappings ? "Custom S-R Mappings (Set)" : "Custom S-R Mappings";
            }
        }

        // Parse stimuli text to update the stimuli array
        let parsedStimuliArray = [];
        if (config.stimuliText) {
            // Parse the stimuli text to get the stimuli array
            parsedStimuliArray = parseStimuli(config.stimuliText);
        }

        // Return the parsed stimuli for use in startExperiment
        return parsedStimuliArray;
    }

    // Add event listener for answer type change (for the first question)
    document.getElementById('answer-type-1').addEventListener('change', function() {
        toggleMultipleChoiceOptions(this);
        saveCurrentState();
    });

    // Add event listener for add option button (for the first question)
    document.querySelector('.add-option-btn').addEventListener('click', function() {
        const questionItem = this.closest('.question-item');
        const questionId = questionItem.dataset.questionId;
        const container = document.getElementById(`options-container-${questionId}`);
        addMultipleChoiceOption(container);
        saveCurrentState();
    });

    // Add event listener for add question button
    document.getElementById('add-question-btn').addEventListener('click', function() {
        addQuestion();
        saveCurrentState();
    });

    // Load saved state from localStorage if available
    try {
        const savedStateJSON = localStorage.getItem('experimentBuilderState');
        if (savedStateJSON) {
            savedState = JSON.parse(savedStateJSON);

            if (savedState.isExperimentMode !== undefined) {
                isExperimentMode = savedState.isExperimentMode;
                document.getElementById('form-type-switch').checked = isExperimentMode;
                toggleFormMode(isExperimentMode);

                // Load survey state if it exists
                if (savedState.surveyState) {
                    // Set save data checkbox
                    const surveyStateData = savedState.surveyState.saveData || false;
                    document.getElementById('survey-save-data').checked = surveyStateData;

                    // Update the global saveData variable if we're in survey mode
                    if (!isExperimentMode) {
                        saveData = surveyStateData;
                        console.log('Loaded survey saveData from saved state:', saveData);
                    }

                    // Load questions if they exist
                    if (savedState.surveyState.questions && savedState.surveyState.questions.length > 0) {
                        // Clear existing questions except the first one
                        const questionsContainer = document.getElementById('questions-container');
                        const firstQuestion = questionsContainer.querySelector('.question-item');

                        if (firstQuestion) {
                            // Keep only the first question
                            questionsContainer.innerHTML = '';
                            questionsContainer.appendChild(firstQuestion);

                            // Update the first question with saved data
                            const firstQuestionData = savedState.surveyState.questions[0];
                            if (firstQuestionData) {
                                const questionText = firstQuestion.querySelector('.question-text');
                                const answerType = firstQuestion.querySelector('.answer-type');

                                if (questionText) questionText.value = firstQuestionData.text || '';
                                if (answerType) {
                                    answerType.value = firstQuestionData.answerType || 'text';

                                    // Load options if it's a radio type
                                    if (firstQuestionData.answerType === 'radio' && firstQuestionData.options) {
                                        const optionsContainer = document.getElementById('options-container-1');
                                        if (optionsContainer) {
                                            optionsContainer.innerHTML = '';

                                            firstQuestionData.options.forEach(option => {
                                                addMultipleChoiceOption(optionsContainer, option);
                                            });

                                            // Show options container
                                            document.getElementById('multiple-choice-options-1').classList.remove('hidden');
                                        }
                                    }
                                }
                            }

                            // Add the rest of the questions
                            for (let i = 1; i < savedState.surveyState.questions.length; i++) {
                                const questionData = savedState.surveyState.questions[i];
                                const newQuestion = addQuestion();

                                // Update the new question with saved data
                                const questionText = newQuestion.querySelector('.question-text');
                                const answerType = newQuestion.querySelector('.answer-type');

                                if (questionText) questionText.value = questionData.text || '';
                                if (answerType) {
                                    answerType.value = questionData.answerType || 'text';

                                    // Load options if it's a radio type
                                    if (questionData.answerType === 'radio' && questionData.options) {
                                        const questionId = newQuestion.dataset.questionId;
                                        const optionsContainer = document.getElementById(`options-container-${questionId}`);
                                        if (optionsContainer) {
                                            optionsContainer.innerHTML = '';

                                            questionData.options.forEach(option => {
                                                addMultipleChoiceOption(optionsContainer, option);
                                            });

                                            // Show options container
                                            document.getElementById(`multiple-choice-options-${questionId}`).classList.remove('hidden');
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // Legacy support for old format with single question
                        if (savedState.surveyState.questionText) {
                            document.getElementById('question-text-1').value = savedState.surveyState.questionText;
                        }

                        if (savedState.surveyState.answerType) {
                            document.getElementById('answer-type-1').value = savedState.surveyState.answerType;

                            // Load options if it's a radio type and options exist
                            if (savedState.surveyState.answerType === 'radio' && savedState.surveyState.options) {
                                const optionsContainer = document.getElementById('options-container-1');
                                if (optionsContainer) {
                                    optionsContainer.innerHTML = '';

                                    savedState.surveyState.options.forEach(option => {
                                        addMultipleChoiceOption(optionsContainer, option);
                                    });

                                    // Show options container
                                    document.getElementById('multiple-choice-options-1').classList.remove('hidden');
                                }
                            }
                        }
                    }
                }
            }

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
            if (savedState.saveData !== undefined) {
                document.getElementById('save-data').checked = savedState.saveData;
                // Update the global saveData variable
                saveData = savedState.saveData;
                console.log('Loaded saveData from saved state:', saveData);
            }
            if (savedState.trialInterval) document.getElementById('trial-interval').value = savedState.trialInterval;

            // Restore S-R mappings
            if (savedState.stimuliResponses) {
                stimuliResponses = savedState.stimuliResponses;
                hasCustomMappings = Object.keys(stimuliResponses).length > 0;
                if (hasCustomMappings) {
                    srMappingBtn.textContent = "Custom S-R Mappings (Set)";
                }
            }

            // Restore variable categories if they exist
            if (savedState.variableCategories) {
                variableCategories = savedState.variableCategories;
                console.log('Loaded variable categories from saved state:', variableCategories);
            }

            // Restore variable category selection modes if they exist
            if (savedState.variableCategoryModes) {
                variableCategoryModes = savedState.variableCategoryModes;
                console.log('Loaded variable category modes from saved state:', variableCategoryModes);
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

        // Start experiment with no pre-parsed stimuli (will parse from form)
        startExperiment(null);
    });

    // Function to save current state to localStorage
    function saveCurrentState() {
        // Update the global saveData variable based on the current form mode
        if (isExperimentMode) {
            saveData = document.getElementById('save-data').checked;
            console.log('saveCurrentState: updated experiment saveData =', saveData);
        } else {
            saveData = document.getElementById('survey-save-data').checked;
            console.log('saveCurrentState: updated survey saveData =', saveData);
        }

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
            saveData: saveData, // Use the global variable
            stimuliResponses: stimuliResponses,
            variableCategories: variableCategories, // Add variable categories
            variableCategoryModes: variableCategoryModes, // Add variable category selection modes
            isExperimentMode: isExperimentMode // Add experiment mode flag
        };

        localStorage.setItem('experimentBuilderState', JSON.stringify(currentState));
        savedState = currentState;
    }

    // Parse stimuli input to handle sequences, concurrent stimuli, images, and variable categories
    function parseStimuli(input) {
        const result = [];
        let bracketStack = []; // Stack to track nested brackets
        let currentItem = '';
        let currentSequence = [];
        let currentConcurrent = [];
        let nestedStructures = []; // Stack to track nested structures
        let inSingleQuotes = false; // Track if we're inside single quotes (for variable categories)

        // Helper function to add an item to the appropriate container
        function addItem() {
            const trimmed = currentItem.trim();
            if (trimmed) {
                let itemToAdd;

                // Check if the item is a variable category (enclosed in single quotes or just the category name)
                const isSingleQuoted = trimmed.startsWith("'") && trimmed.endsWith("'");
                const categoryName = isSingleQuoted ? trimmed.substring(1, trimmed.length - 1) : trimmed;

                if (variableCategories[categoryName]) {
                    // Create a variable category object
                    itemToAdd = {
                        type: 'variable',
                        category: categoryName,
                        values: variableCategories[categoryName],
                        selectionMode: variableCategoryModes[categoryName] || (randomizeStimuli ? 'random' : 'sequential')
                    };
                    console.log(`Created variable category object for '${categoryName}'`, itemToAdd);
                } else if (isSingleQuoted) {
                    // If the category doesn't exist but was in quotes, use the text as is
                    itemToAdd = trimmed;
                    console.log(`No variable category found for '${categoryName}', using as text`);
                } else {
                    // Check if the item is an image (has .jpg, .png, etc. extension)
                    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(trimmed);
                    if (isImage) {
                        itemToAdd = { text: trimmed, type: 'image' };
                    } else {
                        // Just a regular text item
                        itemToAdd = trimmed;
                    }
                }

                // Check if we're inside brackets
                if (bracketStack.length > 0) {
                    const currentBracket = bracketStack[bracketStack.length - 1];

                    if (currentBracket === '[') {
                        // We're in a sequence
                        currentSequence.push(itemToAdd);
                    } else if (currentBracket === '(') {
                        // We're in a concurrent group
                        currentConcurrent.push(itemToAdd);
                    }
                } else {
                    // Not in any brackets, add as a single item
                    result.push([itemToAdd]);
                }
            }
            currentItem = '';
        }

        // Helper function to handle nested structures
        function processNestedStructure() {
            const lastBracket = bracketStack.pop();

            if (lastBracket === '[') {
                // End of a sequence
                if (currentSequence.length > 0) {
                    const sequenceArray = [...currentSequence];
                    currentSequence = [];

                    // If we're still inside another bracket, add this sequence to that structure
                    if (bracketStack.length > 0) {
                        const parentBracket = bracketStack[bracketStack.length - 1];
                        if (parentBracket === '[') {
                            // Add sequence to parent sequence
                            currentSequence = nestedStructures.pop();
                            currentSequence.push(sequenceArray);
                        } else if (parentBracket === '(') {
                            // Add sequence to parent concurrent group
                            currentConcurrent = nestedStructures.pop();
                            currentConcurrent.push(sequenceArray);
                        }
                    } else {
                        // Not nested, add to result
                        result.push(sequenceArray);
                    }
                }
            } else if (lastBracket === '(') {
                // End of a concurrent group
                if (currentConcurrent.length > 0) {
                    const concurrentObj = {
                        type: 'concurrent',
                        stimuli: [...currentConcurrent]
                    };

                    // Debug output to help diagnose issues
                    console.log('Created concurrent object:', concurrentObj);
                    currentConcurrent = [];

                    // If we're still inside another bracket, add this concurrent group to that structure
                    if (bracketStack.length > 0) {
                        const parentBracket = bracketStack[bracketStack.length - 1];
                        if (parentBracket === '[') {
                            // Add concurrent group to parent sequence
                            currentSequence = nestedStructures.pop();
                            currentSequence.push(concurrentObj);
                        } else if (parentBracket === '(') {
                            // Add concurrent group to parent concurrent group (rare case)
                            currentConcurrent = nestedStructures.pop();
                            currentConcurrent.push(concurrentObj);
                        }
                    } else {
                        // Not nested, add to result
                        result.push(concurrentObj);
                    }
                }
            }
        }

        // Process each character in the input
        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            // Handle single quotes for variable categories
            if (char === "'") {
                // Toggle single quote state
                inSingleQuotes = !inSingleQuotes;
                currentItem += char;
                continue;
            }

            // If we're inside single quotes, just add the character and continue
            if (inSingleQuotes) {
                currentItem += char;
                continue;
            }

            if (char === '[') {
                // Start of a sequence
                if (bracketStack.length > 0) {
                    // We're already inside brackets, save current state before starting new sequence
                    if (bracketStack[bracketStack.length - 1] === '[') {
                        nestedStructures.push([...currentSequence]);
                        currentSequence = [];
                    } else if (bracketStack[bracketStack.length - 1] === '(') {
                        nestedStructures.push([...currentConcurrent]);
                        currentConcurrent = [];
                    }
                }
                bracketStack.push('[');
                currentItem = '';
            } else if (char === '(') {
                // Start of a concurrent group
                if (bracketStack.length > 0) {
                    // We're already inside brackets, save current state before starting new concurrent group
                    if (bracketStack[bracketStack.length - 1] === '[') {
                        nestedStructures.push([...currentSequence]);
                        currentSequence = [];
                    } else if (bracketStack[bracketStack.length - 1] === '(') {
                        nestedStructures.push([...currentConcurrent]);
                        currentConcurrent = [];
                    }
                }
                bracketStack.push('(');
                currentItem = '';
            } else if (char === ']') {
                // End of a sequence
                addItem(); // Add any current item
                processNestedStructure();
            } else if (char === ')') {
                // End of a concurrent group
                addItem(); // Add any current item
                processNestedStructure();
            } else if (char === ',' && bracketStack.length === 0) {
                // Comma outside any brackets
                addItem();
            } else {
                // Regular character or comma inside brackets
                if (bracketStack.length > 0 && char === ',') {
                    // Comma inside brackets separates items
                    addItem();
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

    // Generate formatted stimulus key for storage/retrieval with support for nested structures
    function getFormattedStimulusKey(stimulusItem) {
        // Helper function to format any type of stimulus item recursively
        function formatItem(item) {
            // Debug output to help diagnose issues
            console.log('Formatting item:', item);

            if (Array.isArray(item)) {
                // Sequential stimulus - handle potential nested structures
                const formattedItems = item.map(subItem => formatItem(subItem));
                return formattedItems.length > 1 ? `[${formattedItems.join(', ')}]` : formattedItems[0];
            } else if (typeof item === 'object' && item.type === 'concurrent') {
                // Concurrent stimulus - handle potential nested structures
                if (!item.stimuli || !Array.isArray(item.stimuli)) {
                    console.error('Invalid concurrent item, missing stimuli array:', item);
                    return '(invalid)'; // Return a placeholder to avoid errors
                }
                const formattedItems = item.stimuli.map(subItem => formatItem(subItem));
                return `(${formattedItems.join(', ')})`;
            } else if (typeof item === 'object' && item.type === 'image') {
                // Image stimulus
                return item.text;
            } else if (typeof item === 'object' && item.type === 'variable') {
                // Variable category
                return `'${item.category}'`;
            } else {
                // Regular text stimulus
                return String(item);
            }
        }

        try {
            return formatItem(stimulusItem);
        } catch (error) {
            console.error('Error formatting stimulus key:', error, stimulusItem);
            return String(stimulusItem); // Return a simple string representation as fallback
        }
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
    function startExperiment(parsedStimuliArray) {
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

        // If we have parsed stimuli from a study configuration, use those
        if (parsedStimuliArray && Array.isArray(parsedStimuliArray)) {
            // Use the parsed stimuli from the study configuration
            stimuli = parsedStimuliArray;
        } else {
            // Otherwise parse the stimuli from the form
            const stimuliText = document.getElementById('stimuli-text').value;
            stimuli = parseStimuli(stimuliText);
        }

        // Reset variable category trial counts when starting a new experiment
        variableCategoryTrialCount = {};
        trialVariableIndices = {};

        // Start first trial
        experimentRunning = true;

        // Listen for key press
        document.addEventListener('keydown', handleKeyPress);

        // Begin the trial sequence
        startTrial();
    }

    // Track the current trial's variable indices
    let trialVariableIndices = {};

    // Track the current trial number for each variable category
    let variableCategoryTrialCount = {};

    // Start a new trial with high-precision timing
    function startTrial() {
        // Reset sequence index for the new trial
        sequenceIndex = 0;

        // For each variable category, advance to the next value for this trial
        for (const categoryName in variableCategories) {
            // Initialize trial count for this category if not exists
            if (variableCategoryTrialCount[categoryName] === undefined) {
                variableCategoryTrialCount[categoryName] = 0;
            } else {
                // Increment the trial count for this category
                variableCategoryTrialCount[categoryName]++;
            }

            // Get the values for this category
            const values = variableCategories[categoryName];

            // Calculate the index for this trial based on the trial count
            // This ensures we cycle through all values sequentially across trials
            if (values && values.length > 0) {
                const trialIndex = variableCategoryTrialCount[categoryName] % values.length;
                trialVariableIndices[categoryName] = trialIndex;

                // Log the current value for this trial
                const currentValue = values[trialIndex];
                console.log(`Trial ${currentTrial + 1}: Category '${categoryName}' using value at index ${trialIndex}: ${JSON.stringify(currentValue)}`);
            }
        }

        // Reset the per-sequence indices to use our trial indices
        variableCategoryIndices = {...trialVariableIndices};
        variableCategoryUsedValues = {};

        console.log('Starting new trial with indices:', trialVariableIndices);

        // Show fixation if enabled
        if (showFixation) {
            fixationPoint.classList.remove('hidden');
            stimulusText.classList.add('hidden');
            feedbackText.classList.add('hidden');

            // After fixation interval, show stimulus using high-precision timing
            scheduleWithPrecision(showStimulus, fixationInterval);

            // Record the start time of the fixation for precise timing calculations
            lastFrameTimestamp = performance.now();
        } else {
            // Skip fixation, show stimulus immediately
            showStimulus();
        }
    }

    // Track variable category indices for sequential presentation
    let variableCategoryIndices = {};

    // Track used values for random without replacement
    let variableCategoryUsedValues = {};

    // Get the next stimulus sequence
    function getNextStimulusSequence() {
        // Helper function to expand variable categories in a sequence
        function expandVariableCategories(sequence) {
            // If it's not an array, return as is
            if (!Array.isArray(sequence)) return sequence;

            // Process each item in the sequence
            return sequence.map(item => {
                // If it's a variable category, replace with the next value from the category
                if (typeof item === 'object' && item.type === 'variable') {
                    const categoryName = item.category;
                    const values = item.values;

                    if (values && values.length > 0) {
                        // Get the selection mode for variables (default to the global randomize setting)
                        const variableSelectionMode = item.selectionMode || (randomizeStimuli ? 'random' : 'sequential');

                        if (variableSelectionMode === 'sequential') {
                            // Use the trial index for this category
                            const currentIndex = variableCategoryIndices[categoryName];

                            // Get the value at the current index
                            const value = values[currentIndex];

                            // Log the selection for debugging
                            console.log(`Using sequential value for '${categoryName}': ${value} (index ${currentIndex})`);

                            return value;
                        } else { // Random or random without replacement
                            if (variableSelectionMode === 'random-no-repeat') {
                                // Initialize used values array for this category if not exists
                                if (!variableCategoryUsedValues[categoryName]) {
                                    variableCategoryUsedValues[categoryName] = [];
                                }

                                // If all values have been used, reset
                                if (variableCategoryUsedValues[categoryName].length >= values.length) {
                                    variableCategoryUsedValues[categoryName] = [];
                                }

                                // Get unused values
                                const unusedValues = values.filter(v =>
                                    !variableCategoryUsedValues[categoryName].includes(v));

                                // Select a random unused value
                                const randomIndex = Math.floor(Math.random() * unusedValues.length);
                                const selectedValue = unusedValues[randomIndex];

                                // Mark as used
                                variableCategoryUsedValues[categoryName].push(selectedValue);

                                return selectedValue;
                            } else { // Pure random
                                // Select a random value from the category
                                const randomIndex = Math.floor(Math.random() * values.length);
                                return values[randomIndex];
                            }
                        }
                    } else {
                        // If no values, return the category name as fallback
                        return item.category;
                    }
                } else if (typeof item === 'object' && item.type === 'concurrent') {
                    // For concurrent stimuli, expand variables in each stimulus
                    const expandedStimuli = item.stimuli.map(stimulus => {
                        if (typeof stimulus === 'object' && stimulus.type === 'variable') {
                            const categoryName = stimulus.category;
                            const values = stimulus.values;

                            if (values && values.length > 0) {
                                // Get the selection mode for variables (default to the global randomize setting)
                                const variableSelectionMode = stimulus.selectionMode || (randomizeStimuli ? 'random' : 'sequential');

                                if (variableSelectionMode === 'sequential') {
                                    // Use the trial index for this category
                                    const currentIndex = variableCategoryIndices[categoryName];

                                    // Get the value at the current index
                                    const value = values[currentIndex];

                                    // Log the selection for debugging
                                    console.log(`Using sequential value for concurrent '${categoryName}': ${value} (index ${currentIndex})`);

                                    return value;
                                } else { // Random or random without replacement
                                    if (variableSelectionMode === 'random-no-repeat') {
                                        // Initialize used values array for this category if not exists
                                        if (!variableCategoryUsedValues[categoryName]) {
                                            variableCategoryUsedValues[categoryName] = [];
                                        }

                                        // If all values have been used, reset
                                        if (variableCategoryUsedValues[categoryName].length >= values.length) {
                                            variableCategoryUsedValues[categoryName] = [];
                                        }

                                        // Get unused values
                                        const unusedValues = values.filter(v =>
                                            !variableCategoryUsedValues[categoryName].includes(v));

                                        // Select a random unused value
                                        const randomIndex = Math.floor(Math.random() * unusedValues.length);
                                        const selectedValue = unusedValues[randomIndex];

                                        // Mark as used
                                        variableCategoryUsedValues[categoryName].push(selectedValue);

                                        return selectedValue;
                                    } else { // Pure random
                                        // Select a random value from the category
                                        const randomIndex = Math.floor(Math.random() * values.length);
                                        return values[randomIndex];
                                    }
                                }
                            } else {
                                // If no values, return the category name as fallback
                                return stimulus.category;
                            }
                        }
                        return stimulus;
                    });

                    // Make sure we return a properly formatted concurrent object
                    return {
                        type: 'concurrent',
                        stimuli: expandedStimuli
                    };
                } else if (Array.isArray(item)) {
                    // For nested sequences, recursively expand
                    return expandVariableCategories(item);
                }
                // Return other items as is
                return item;
            });
        }

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

                // Expand any variable categories in the sequence
                return expandVariableCategories(selectedSequence);
            } else {
                // This shouldn't happen, but just in case
                const selectedSequence = stimuli[Math.floor(Math.random() * stimuli.length)];
                return expandVariableCategories(selectedSequence);
            }
        } else {
            // Sequential mode: just advance the index
            const selectedSequence = stimuli[stimuliIndex];
            stimuliIndex = (stimuliIndex + 1) % stimuli.length;

            // Expand any variable categories in the sequence
            return expandVariableCategories(selectedSequence);
        }
    }

    // Show the stimulus for this trial with support for nested structures
    function showStimulus() {
        // Reset all concurrent elements to ensure clean state
        clearConcurrentStimuli();

        // Get sequence if needed
        if (sequenceIndex === 0) {
            currentSequence = getNextStimulusSequence();
        }

        // Helper function to determine if an item is a concurrent group
        function isConcurrentGroup(item) {
            return typeof item === 'object' && item.type === 'concurrent';
        }

        // Helper function to determine if an item is a nested sequence
        function isNestedSequence(item) {
            return Array.isArray(item) && item.length > 0;
        }

        // Helper function to determine if an item is an image
        function isImageItem(item) {
            return typeof item === 'object' && item.type === 'image';
        }

        // Check if we're handling a concurrent stimulus group
        const isConcurrent = isConcurrentGroup(currentSequence);

        // Get the current stimulus based on the sequence index
        let currentStimulus = null;
        if (!isConcurrent && Array.isArray(currentSequence)) {
            currentStimulus = currentSequence[sequenceIndex];
        }

        // Check if the current item in a sequence is a concurrent group
        const isCurrentItemConcurrent = currentStimulus && isConcurrentGroup(currentStimulus);

        // Check if the current item in a sequence is itself a nested sequence
        const isCurrentItemSequence = currentStimulus && isNestedSequence(currentStimulus);

        // For concurrent stimuli, we want to preserve the flag status
        if (!isConcurrent && !isCurrentItemConcurrent) {
            clearAllTimers();
        }

        fixationPoint.classList.add('hidden');
        feedbackText.classList.add('hidden');

        // Format the stimulus display key for mapping lookup
        const stimulusDisplay = getFormattedStimulusKey(currentSequence);

        // For individual items in a sequence, we need to get the mapping for the current item
        let mapping;
        if (!isConcurrent && Array.isArray(currentSequence) && currentStimulus) {
            // Get the formatted key for the current item in the sequence
            const currentItemDisplay = getFormattedStimulusKey(currentStimulus);
            // Try to get mapping for the current item first, fall back to sequence mapping
            mapping = stimuliResponses[currentItemDisplay] || stimuliResponses[stimulusDisplay] || {};
            console.log(`Using mapping for current item: ${currentItemDisplay}`, mapping);
        } else {
            // For concurrent or non-sequence stimuli, use the regular mapping
            mapping = stimuliResponses[stimulusDisplay] || {};
        }

        if (isConcurrent) {
            // Handle top-level concurrent stimulus group
            displayConcurrentStimuli(currentSequence);
        } else if (isCurrentItemConcurrent) {
            // Handle concurrent stimulus group within a sequence
            displayConcurrentStimuli(currentStimulus);
        } else if (isCurrentItemSequence) {
            // Handle nested sequence - create a temporary display for it
            // This is a complex case that would require recursive handling
            // For now, we'll just display it as text
            stimulusText.textContent = getFormattedStimulusKey(currentStimulus);
            stimulusText.classList.remove('hidden');

            // Apply styling
            const customSize = mapping.size !== undefined ? mapping.size : stimulusSize;
            stimulusText.style.fontSize = `${customSize}px`;
            const customColor = mapping.color || stimulusColor;
            stimulusText.style.color = customColor;

            // Apply positioning
            const customX = mapping.x !== undefined ? mapping.x : positionX;
            const customY = mapping.y !== undefined ? mapping.y : positionY;
            stimulusText.style.transform = `translate(calc(-50% + ${customX}px), calc(-50% + ${customY}px))`;
        } else if (currentStimulus) {
            // Handle regular stimulus (text or image)
            const isImage = isImageItem(currentStimulus);

            if (isImage) {
                // Handle image stimulus
                const imageName = currentStimulus.text;

                // Clear text content
                stimulusText.textContent = '';

                // Check if an image already exists, if so remove it
                const existingImage = stimulusText.querySelector('img');
                if (existingImage) {
                    existingImage.remove();
                }

                // Create image element
                const imageElement = document.createElement('img');
                imageElement.alt = imageName;

                // Check for custom width and height in mapping
                const customWidth = mapping.width !== undefined ? mapping.width : 400; // Default width
                const customHeight = mapping.height !== undefined ? mapping.height : 400; // Default height

                // Apply width and height
                imageElement.style.width = `${customWidth}px`;
                imageElement.style.height = `${customHeight}px`;
                imageElement.style.display = 'block';
                imageElement.style.objectFit = 'contain'; // Maintain aspect ratio

                // Set image source - look for the file in the current directory
                imageElement.src = imageName;

                // Handle image loading errors
                imageElement.onerror = function() {
                    // If image fails to load, show placeholder text
                    imageElement.style.display = 'none';
                    stimulusText.textContent = `[no '${imageName}' image]`;
                };

                // Add the image to the stimulus text element
                stimulusText.appendChild(imageElement);
            } else {
                // Handle regular text stimulus
                stimulusText.textContent = currentStimulus;
            }

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
        }

        // Use custom offset if available, otherwise use global offset
        const customOffset = mapping.offset !== undefined ? mapping.offset : stimulusOffset;

        // Log the offset being used for debugging
        console.log(`Using offset for ${getFormattedStimulusKey(currentStimulus || currentSequence)}: ${customOffset}ms`);
        console.log(`Mapping:`, mapping);
        console.log(`Global offset: ${stimulusOffset}ms`);

        // Record stimulus start time for timing data with high precision
        stimulusStartTime = performance.now();
        responseStartTime = stimulusStartTime; // For backward compatibility

        // Store the duration for this stimulus
        stimulusDuration = customOffset;

        if (customOffset > 0) {
            // Use high-precision timing for stimulus offset
            scheduleWithPrecision(() => {
                stimulusText.classList.add('hidden');
                clearConcurrentStimuli(); // Clear any concurrent stimuli

                if (!isConcurrent && Array.isArray(currentSequence) && sequenceIndex < currentSequence.length - 1) {
                    sequenceIndex++;
                    // Use requestAnimationFrame for smoother transitions between stimuli
                    requestAnimationFrame(showStimulus);
                } else if (!provideFeedback) {
                    // Use requestAnimationFrame for smoother transitions
                    requestAnimationFrame(advanceTrial);
                }
            }, customOffset);
        }
    }

    // Display concurrent stimuli - SIMPLIFIED to always wait for response
    function displayConcurrentStimuli(currentSequence) {
        // Make sure we have the stimuli array
        if (!currentSequence || !currentSequence.stimuli) {
            console.error('Invalid concurrent sequence:', currentSequence);
            return;
        }

        const stimuli = currentSequence.stimuli || [];

        // Debug output to help diagnose issues
        console.log('Displaying concurrent stimuli:', stimuli);

        // Check if any stimulus is still a variable category (should have been expanded already)
        for (let i = 0; i < stimuli.length; i++) {
            if (typeof stimuli[i] === 'object' && stimuli[i].type === 'variable') {
                console.warn('Found unexpanded variable in concurrent stimuli:', stimuli[i]);
                // Try to expand it now
                const values = stimuli[i].values;
                if (values && values.length > 0) {
                    const randomIndex = Math.floor(Math.random() * values.length);
                    stimuli[i] = values[randomIndex];
                    console.log('Expanded variable to:', stimuli[i]);
                }
            }
        }

        // Create a display key for mapping lookup
        const stimulusDisplay = `(${stimuli.map(s => {
            if (typeof s === 'object' && s.type === 'image') {
                return s.text;
            }
            return s;
        }).join(', ')})`;

        // Get mapping for the entire concurrent group
        const groupMapping = stimuliResponses[stimulusDisplay] || {};

        // Store individual stimulus mappings
        const individualMappings = {};

        // Get individual mappings for each stimulus
        stimuli.forEach(s => {
            const stimKey = typeof s === 'object' && s.type === 'image' ? s.text : s;
            if (stimuliResponses[stimKey]) {
                individualMappings[stimKey] = stimuliResponses[stimKey];
                console.log(`Found individual mapping for ${stimKey}:`, individualMappings[stimKey]);
            }
        });

        // Use group mapping as fallback
        const mapping = groupMapping;

        // More debug output
        console.log('Stimulus display key:', stimulusDisplay);
        console.log('Mapping:', mapping);

        // Get default positions for the stimuli
        const defaultPositions = generateConcurrentPositions(stimuli.length);

        // Create DOM elements for each stimulus
        for (let i = 0; i < stimuli.length; i++) {
            const stimulus = stimuli[i];
            const stimElement = document.createElement('div');
            stimElement.className = 'concurrent-stimulus';

            // Check if the stimulus is an image
            const isImage = typeof stimulus === 'object' && stimulus.type === 'image';

            if (isImage) {
                // Handle image stimulus
                const imageName = stimulus.text;

                // Create image element
                const imageElement = document.createElement('img');
                imageElement.alt = imageName;

                // Check for custom width and height in mapping
                const stimKey = imageName.toLowerCase().replace(/\s+/g, '_');

                // Check if we have individual mapping for this image
                const individualMapping = individualMappings[imageName] || {};

                // Priority: individual mapping > group specific mapping > group general mapping > default
                const customWidth = individualMapping.width !== undefined ? individualMapping.width :
                                  mapping[`${stimKey}_width`] !== undefined ? mapping[`${stimKey}_width`] :
                                  mapping.width !== undefined ? mapping.width :
                                  400;

                const customHeight = individualMapping.height !== undefined ? individualMapping.height :
                                   mapping[`${stimKey}_height`] !== undefined ? mapping[`${stimKey}_height`] :
                                   mapping.height !== undefined ? mapping.height :
                                   400;

                // Apply width and height
                imageElement.style.width = `${customWidth}px`;
                imageElement.style.height = `${customHeight}px`;
                imageElement.style.display = 'block';
                imageElement.style.objectFit = 'contain'; // Maintain aspect ratio

                // Set image source - look for the file in the current directory
                imageElement.src = imageName;

                // Handle image loading errors
                imageElement.onerror = function() {
                    // If image fails to load, show placeholder text
                    imageElement.style.display = 'none';
                    stimElement.textContent = `[no '${imageName}' image]`;
                };

                // Add the image to the stimulus element
                stimElement.appendChild(imageElement);
            } else {
                // Handle regular text stimulus
                stimElement.textContent = stimulus;
            }

            // Apply styling
            stimElement.style.position = 'absolute';
            stimElement.style.top = '50%';
            stimElement.style.left = '50%';

            // Get the stimulus text/key
            const stimulusText = isImage ? stimulus.text : stimulus;
            const posKey = stimulusText.toLowerCase().replace(/\s+/g, '_');

            // Check if we have individual mapping for this stimulus
            const individualMapping = individualMappings[stimulusText] || {};

            // Use individual mapping first, then group mapping, then default
            const customX = individualMapping.x !== undefined ? individualMapping.x :
                           mapping[`${posKey}_x`] !== undefined ? mapping[`${posKey}_x`] :
                           defaultPositions[i][0];

            const customY = individualMapping.y !== undefined ? individualMapping.y :
                           mapping[`${posKey}_y`] !== undefined ? mapping[`${posKey}_y`] :
                           defaultPositions[i][1];

            // Apply global offset plus specific offset for this item
            const totalX = (positionX || 0) + customX;
            const totalY = (positionY || 0) + customY;

            stimElement.style.transform = `translate(calc(-50% + ${totalX}px), calc(-50% + ${totalY}px))`;

            // Apply custom or default color and size
            // Priority: individual mapping > group specific mapping > group general mapping > global default
            const customColor = individualMapping.color !== undefined ? individualMapping.color :
                              mapping[`${posKey}_color`] !== undefined ? mapping[`${posKey}_color`] :
                              mapping.color !== undefined ? mapping.color :
                              stimulusColor;

            const customSize = individualMapping.size !== undefined ? individualMapping.size :
                             mapping[`${posKey}_size`] !== undefined ? mapping[`${posKey}_size`] :
                             mapping.size !== undefined ? mapping.size :
                             stimulusSize;

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

    // Enhanced handleKeyPress function with support for nested structures
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

            // Helper functions to determine stimulus types
            function isConcurrentGroup(item) {
                return typeof item === 'object' && item.type === 'concurrent';
            }

            function isNestedSequence(item) {
                return Array.isArray(item) && item.length > 0;
            }

            // Check if we're handling a concurrent stimulus group
            const isConcurrent = isConcurrentGroup(currentSequence);

            // Get the current stimulus based on the sequence index
            let currentStimulus = null;
            if (!isConcurrent && Array.isArray(currentSequence)) {
                currentStimulus = currentSequence[sequenceIndex];
            }

            // Check if the current item in a sequence is a concurrent group
            const isCurrentItemConcurrent = currentStimulus && isConcurrentGroup(currentStimulus);

            // Check if the current item in a sequence is itself a nested sequence
            const isCurrentItemSequence = currentStimulus && isNestedSequence(currentStimulus);

            // Determine if we're at the last item in a sequence
            const isEndOfSequence =
                Array.isArray(currentSequence) ?
                (sequenceIndex === currentSequence.length - 1) :
                true; // For concurrent stimuli, always consider it the end

            // Get stimulus display key using the enhanced formatter that handles nested structures
            const stimulusDisplay = getFormattedStimulusKey(currentSequence);

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
                        // For nested structures, use the formatted key for the current item
                        const currentItemDisplay = isCurrentItemConcurrent || isCurrentItemSequence ?
                            getFormattedStimulusKey(currentStimulus) :
                            currentStimulus;

                        saveTrialData(currentItemDisplay, keyPressed, isCorrect);
                    }

                    sequenceIndex++;
                    showStimulus();
                }
                else if (isEndOfSequence) {
                    // At the end of a sequence or for concurrent stimuli

                    // Explicitly clear concurrent stimuli on valid key press
                    if (hasConcurrentWithZeroOffset || isCurrentItemConcurrent) {
                        clearConcurrentStimuli();
                        hasConcurrentWithZeroOffset = false;
                    }

                    // Save data if option is enabled
                    if (saveData) {
                        // For nested structures at the end of a sequence, use the formatted key
                        const finalItemDisplay = isCurrentItemConcurrent || isCurrentItemSequence ?
                            getFormattedStimulusKey(currentStimulus) :
                            stimulusDisplay;

                        saveTrialData(finalItemDisplay, keyPressed, isCorrect);
                    }

                    if (provideFeedback) {
                        showFeedback(isCorrect);
                        // Use high-precision timing for feedback duration
                        scheduleWithPrecision(() => {
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
                        // For nested structures at the end of a sequence, use the formatted key
                        const finalItemDisplay = isCurrentItemConcurrent || isCurrentItemSequence ?
                            getFormattedStimulusKey(currentStimulus) :
                            stimulusDisplay;

                        saveTrialData(finalItemDisplay, keyPressed, false);
                    }

                    showFeedback(false);
                    // Use high-precision timing for feedback duration
                    scheduleWithPrecision(() => {
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

    // Function to save trial data with high-precision timing
    function saveTrialData(stimulus, response, accurate) {
        // Use high-precision timing for response time calculation
        const now = performance.now();
        const responseTime = now - stimulusStartTime; // Calculate response time in ms with high precision

        // For backward compatibility, also create a Date object
        const dateNow = new Date();

        // Format timestamp as HH:MM:SS_DD:MM:YYYY
        const timestamp = formatDateTime(dateNow);

        // Calculate the absolute trial number (including past cycles)
        const absoluteTrialNumber = currentTrial + 1; // +1 because currentTrial is 0-indexed

        // Create data object with enhanced timing information
        const trialData = {
            Timestamp: timestamp,
            "Trial Number": absoluteTrialNumber,
            Stimulus: stimulus,
            Stimulus_Offset: stimulusOffset,
            Response: response,
            Accurate: accurate ? 1 : 0,
            ResponseTime_ms: Math.round(responseTime * 100) / 100, // Round to 2 decimal places for readability
            PreciseTimingUsed: true // Flag to indicate high-precision timing was used
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

    // Modify advanceTrial to check threshold at cycle end with high-precision timing
    function advanceTrial() {
        clearAllTimers();
        hasConcurrentWithZeroOffset = false; // Reset flag when advancing trials
        stimulusText.classList.add('hidden');
        feedbackText.classList.add('hidden');

        // Use high-precision timing for trial interval
        scheduleWithPrecision(() => {
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

    // Updated showCycleMessage to display for fixed duration with high-precision timing
    function showCycleMessage() {
        // Show message that we're starting a new cycle
        feedbackText.textContent = `Correct: ${currentCycleCorrect}/${cycleThreshold} - Starting new cycle`;
        feedbackText.style.color = '#2196F3'; // Blue color for cycle message
        feedbackText.classList.remove('hidden');

        // Clear stimulus text to prevent overlap
        stimulusText.classList.add('hidden');

        console.log(`Cycle completed. Correct responses: ${currentCycleCorrect}/${cycleThreshold}`);

        // Automatically hide message and start new cycle after fixed duration using high-precision timing
        scheduleWithPrecision(() => {
            // Hide message
            feedbackText.classList.add('hidden');

            // Reset for new cycle
            currentTrial = 0;
            sequenceIndex = 0;
            currentCycleCorrect = 0;

            // Reset variable category trial counts to start fresh
            variableCategoryTrialCount = {};
            trialVariableIndices = {};

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
                console.log('In study mode, adding experiment data to study data array');
                console.log('Current study index:', currentStudyIndex);
                console.log('Study configurations:', studyConfigurations);

                // Create the experiment data entry
                const experimentDataEntry = {
                    configurationIndex: currentStudyIndex,
                    configurationName: studyConfigurations[currentStudyIndex]?.name || `Configuration ${currentStudyIndex + 1}`,
                    type: 'experiment', // Mark this as experiment data for proper handling
                    data: experimentData
                };

                // Check if we already have data for this configuration index
                const existingIndex = studyData.findIndex(item =>
                    item.configurationIndex === currentStudyIndex && item.type === 'experiment');

                if (existingIndex >= 0) {
                    // Replace existing data
                    console.log('Replacing existing experiment data at index', existingIndex);
                    studyData[existingIndex] = experimentDataEntry;
                } else {
                    // Add new data
                    studyData.push(experimentDataEntry);
                }

                console.log('Added/updated experiment data in study:', experimentDataEntry);
                console.log('Current study data array:', studyData);
            } else {
                // Single task mode - download data immediately
                downloadExperimentData();
            }
        }

        if (isStudyMode) {
            if (currentStudyIndex < studyConfigurations.length - 1) {
                messageElement.textContent = `Block ${currentStudyIndex + 1} Complete`;
                statsElement.classList.add('hidden');
            } else {
                // Study completion screen
                messageElement.textContent = 'Study Complete!';
                statsElement.classList.remove('hidden');

                // Show study completion stats
                let statsHtml = `
                    <div class="study-completion-stats">
                        <h3>Study Summary:</h3>
                        <p>Completed ${studyConfigurations.length} blocks</p>
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

        // Remove any existing experiment download buttons to prevent duplicates
        const existingButtons = completionScreen.querySelectorAll('button.secondary-btn');
        existingButtons.forEach(button => {
            if (button.textContent === 'Download Data') {
                button.remove();
            }
        });

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

        // No automatic download
    }

    // Add function to download study data with support for both experiment and survey data
    function downloadStudyData() {
        console.log('downloadStudyData called');
        console.log('studyData length =', studyData.length);
        console.log('studyData contents =', JSON.stringify(studyData, null, 2));
        console.log('saveData =', saveData);
        console.log('isStudyMode =', isStudyMode);

        if (studyData.length === 0) {
            console.log('No study data to download');
            alert('No study data available to download. Make sure "Save Data" is checked for each configuration.');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `study_data_${timestamp}.json`;

        // Create enhanced configuration details with type information
        const enhancedConfigDetails = studyConfigurations.map(config => ({
            name: config.name || 'Unnamed Configuration',
            type: config.type || 'experiment', // Include the type (experiment or survey)
            id: config.id, // Include the ID for reference
            saveData: config.config.saveData !== undefined ? config.config.saveData : false // Include saveData setting
        }));

        // Log the types of data in the study data array
        const dataTypes = studyData.map(item => item.type || 'unknown');
        console.log('Study data types:', dataTypes);

        // Sort the study data by configuration index
        studyData.sort((a, b) => a.configurationIndex - b.configurationIndex);
        console.log('Sorted study data:', studyData);

        // Check if we're missing any configurations in the study data
        // This can happen if a configuration didn't save data or if there was an error
        const configIndices = studyData.map(item => item.configurationIndex);
        const missingConfigs = [];

        for (let i = 0; i < studyConfigurations.length; i++) {
            if (!configIndices.includes(i) && studyConfigurations[i].config.saveData) {
                console.warn(`Missing data for configuration index ${i}: ${studyConfigurations[i].name}`);
                missingConfigs.push(i);
            }
        }

        if (missingConfigs.length > 0) {
            console.warn('Missing data for some configurations:', missingConfigs);
            // Add a warning to the user
            const warningMessage = `Note: Data for ${missingConfigs.length} configuration(s) could not be found. ` +
                                  `This may be because the configuration did not save data or there was an error.`;
            alert(warningMessage);
        }

        // Create a combined data structure that includes both experiment and survey data
        const studyDataObject = {
            studyMetadata: {
                completionTime: new Date().toISOString(),
                numberOfConfigurations: studyConfigurations.length,
                configurationDetails: enhancedConfigDetails,
                missingConfigurations: missingConfigs
            },
            configurationData: studyData
        };

        // Add a note about the data structure for easier analysis
        studyDataObject.studyMetadata.dataStructureNote =
            "This study contains both experiment and survey data. Each configuration in configurationData has a 'type' field indicating its type.";

        const dataStr = JSON.stringify(studyDataObject, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = filename;

        // Trigger the download when the button is clicked
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        console.log('Downloaded study data including experiments and surveys:', studyDataObject);
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

        // Cancel any animation frames
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Reset animation state
        pendingAnimationCallback = null;
        isWaitingForStimulus = false;

        // Only clear concurrent stimuli when explicitly called for
        if (!hasConcurrentWithZeroOffset) {
            clearConcurrentStimuli();
        }
    }

    // High-precision timing functions

    // Schedule a function to run after a precise delay using requestAnimationFrame
    function scheduleWithPrecision(callback, delayMs) {
        const startTime = performance.now();
        const targetTime = startTime + delayMs;
        isWaitingForStimulus = true;
        pendingAnimationCallback = callback;

        function checkTime(timestamp) {
            if (!isWaitingForStimulus) return; // Cancelled

            if (timestamp >= targetTime) {
                isWaitingForStimulus = false;
                pendingAnimationCallback = null;
                callback();
            } else {
                animationFrameId = requestAnimationFrame(checkTime);
            }
        }

        animationFrameId = requestAnimationFrame(checkTime);
        return animationFrameId;
    }

    // High-precision timing is handled directly with performance.now() in the code

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

            // Start the next configuration in the study
            startStudyConfiguration(currentStudyIndex);
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

            // Save the current state to localStorage
            saveCurrentState();

            console.log('Returned to intro screen, state reset');
        }
    });

    // Get variable definition modal elements
    const variableDefinitionModal = document.getElementById('variable-definition-modal');
    const defineVariablesBtn = document.getElementById('define-variables-btn');
    const variableCategoriesList = document.getElementById('variable-categories-list');
    const variableValuesContainer = document.getElementById('variable-values-container');
    const currentVariableName = document.getElementById('current-variable-name');
    const newVariableNameInput = document.getElementById('new-variable-name');
    const newValueInput = document.getElementById('new-value');
    const addVariableBtn = document.getElementById('add-variable-btn');
    const addValueBtn = document.getElementById('add-value-btn');
    const saveVariablesBtn = document.getElementById('save-variables-btn');
    const variableModalCloseBtn = document.querySelector('.variable-modal-close');

    // Add event listener for Define Variables button
    defineVariablesBtn.addEventListener('click', function() {
        // Refresh the variable categories list
        refreshVariableCategoriesList();

        // Show the modal
        variableDefinitionModal.classList.remove('hidden');
    });

    // Close variable modal when clicking X
    variableModalCloseBtn.addEventListener('click', function() {
        variableDefinitionModal.classList.add('hidden');
    });

    // Close variable modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === variableDefinitionModal) {
            variableDefinitionModal.classList.add('hidden');
        }
    });

    // Add new variable category
    addVariableBtn.addEventListener('click', function() {
        const variableName = newVariableNameInput.value.trim();
        if (variableName) {
            // Add the new variable category
            if (!variableCategories[variableName]) {
                variableCategories[variableName] = [];
                refreshVariableCategoriesList();
                selectVariableCategory(variableName);
                newVariableNameInput.value = '';

                // Update the sequence builder
                updateSequenceBuilder();
            } else {
                alert(`Variable category '${variableName}' already exists.`);
            }
        }
    });

    // Add new value to current variable category
    addValueBtn.addEventListener('click', function() {
        const value = newValueInput.value.trim();
        if (value && currentVariableCategory) {
            // Check if the value is an image (has .jpg, .png, etc. extension)
            const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(value);

            // Create the appropriate value object
            const valueToAdd = isImage ? { text: value, type: 'image' } : value;

            // Check if the value already exists in the category
            const valueExists = variableCategories[currentVariableCategory].some(existingValue => {
                if (typeof existingValue === 'object' && existingValue.type === 'image') {
                    return existingValue.text === value;
                }
                return existingValue === value;
            });

            // Add the value if it doesn't exist
            if (!valueExists) {
                variableCategories[currentVariableCategory].push(valueToAdd);
                refreshVariableValuesList();
                newValueInput.value = '';

                // Update the sequence builder
                updateSequenceBuilder();
            } else {
                alert(`Value '${value}' already exists in this category.`);
            }
        } else if (!currentVariableCategory) {
            alert('Please select a variable category first.');
        }
    });

    // Initialize the sequence builder when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Display available variables in the sequence builder
        displayAvailableVariables();

        // Update the variable buttons based on the current state
        const defineVariablesBtn = document.getElementById('define-variables-btn');
        const clearVariablesBtn = document.getElementById('clear-variables-btn');

        if (Object.keys(variableCategories).length > 0) {
            defineVariablesBtn.textContent = 'Variables Defined';
            clearVariablesBtn.classList.remove('hidden');
        } else {
            defineVariablesBtn.textContent = 'Define Variables';
            clearVariablesBtn.classList.add('hidden');
        }
    });

    // Update the sequence builder when variables are modified
    function updateSequenceBuilder() {
        // Display available variables in the sequence builder
        displayAvailableVariables();

        // Save the current state
        saveCurrentState();
    }

    // Save variables button
    saveVariablesBtn.addEventListener('click', function() {
        // Save the variable categories to the state
        saveCurrentState();

        // Update the sequence builder
        updateSequenceBuilder();

        // Close the modal
        variableDefinitionModal.classList.add('hidden');

        // Show a confirmation message
        alert('Variable categories saved successfully.');
    });

    // Function to refresh the variable categories list
    function refreshVariableCategoriesList() {
        variableCategoriesList.innerHTML = '';

        for (const category in variableCategories) {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'variable-category-item';
            if (category === currentVariableCategory) {
                categoryItem.classList.add('selected');
            }

            const categoryName = document.createElement('span');
            categoryName.textContent = category;
            categoryName.className = 'variable-name';

            const actionButtons = document.createElement('div');
            actionButtons.className = 'variable-action-buttons';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'secondary-btn';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the variable category '${category}'?`)) {
                    delete variableCategories[category];
                    if (currentVariableCategory === category) {
                        currentVariableCategory = null;
                        currentVariableName.textContent = 'Select a category';
                        variableValuesContainer.innerHTML = '';
                    }
                    refreshVariableCategoriesList();

                    // Update the sequence builder
                    updateSequenceBuilder();

                    // Update the stimulus text to remove references to this category
                    const stimuliText = document.getElementById('stimuli-text');
                    if (stimuliText) {
                        const regex = new RegExp(`'${category}'`, 'g');
                        stimuliText.value = stimuliText.value.replace(regex, `'deleted-${category}'`);

                        // Save the current state
                        saveCurrentState();
                    }
                }
            });

            actionButtons.appendChild(deleteBtn);
            categoryItem.appendChild(categoryName);
            categoryItem.appendChild(actionButtons);

            // Add click event to select this category
            categoryItem.addEventListener('click', function() {
                selectVariableCategory(category);
            });

            variableCategoriesList.appendChild(categoryItem);
        }

        // If no categories, show a message
        if (Object.keys(variableCategories).length === 0) {
            const noCategories = document.createElement('p');
            noCategories.textContent = 'No variable categories defined. Add one below.';
            noCategories.style.fontStyle = 'italic';
            noCategories.style.color = '#666';
            variableCategoriesList.appendChild(noCategories);
        }
    }

    // Function to refresh the variable values list
    function refreshVariableValuesList() {
        variableValuesContainer.innerHTML = '';

        if (!currentVariableCategory) {
            const noCategory = document.createElement('p');
            noCategory.textContent = 'Select a category to view and edit its values.';
            noCategory.style.fontStyle = 'italic';
            noCategory.style.color = '#666';
            variableValuesContainer.appendChild(noCategory);
            return;
        }

        const values = variableCategories[currentVariableCategory];

        if (values.length === 0) {
            const noValues = document.createElement('p');
            noValues.textContent = 'No values in this category. Add some below.';
            noValues.style.fontStyle = 'italic';
            noValues.style.color = '#666';
            variableValuesContainer.appendChild(noValues);
            return;
        }

        // Add a helper label
        const helperLabel = document.createElement('p');
        helperLabel.textContent = 'Add one value per row. Image files will be recognized automatically.';
        helperLabel.className = 'helper-text';
        helperLabel.style.marginBottom = '10px';
        variableValuesContainer.appendChild(helperLabel);

        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const valueItem = document.createElement('div');
            valueItem.className = 'variable-value-item';

            const valueText = document.createElement('span');

            // Check if the value is an image object
            if (typeof value === 'object' && value.type === 'image') {
                valueText.textContent = value.text + ' (image)';
                valueText.style.color = '#2196F3'; // Blue color to indicate image
            } else {
                valueText.textContent = value;
            }

            valueText.className = 'variable-value';

            const actionButtons = document.createElement('div');
            actionButtons.className = 'variable-action-buttons';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'secondary-btn';
            deleteBtn.addEventListener('click', function() {
                const displayValue = typeof value === 'object' && value.type === 'image' ? value.text : value;
                if (confirm(`Are you sure you want to delete the value '${displayValue}'?`)) {
                    variableCategories[currentVariableCategory].splice(i, 1);
                    refreshVariableValuesList();

                    // Update the sequence builder
                    updateSequenceBuilder();
                }
            });

            actionButtons.appendChild(deleteBtn);
            valueItem.appendChild(valueText);
            valueItem.appendChild(actionButtons);

            variableValuesContainer.appendChild(valueItem);
        }
    }

    // Get the variable mode select element
    const variableModeSelect = document.getElementById('variable-mode-select');

    // Add event listener for selection mode change
    variableModeSelect.addEventListener('change', function() {
        if (currentVariableCategory) {
            // Save the selection mode for this category
            variableCategoryModes[currentVariableCategory] = this.value;
            console.log(`Selection mode for '${currentVariableCategory}' set to ${this.value}`);

            // Save the current state
            saveCurrentState();
        }
    });

    // Function to select a variable category
    function selectVariableCategory(category) {
        // Update the current category
        currentVariableCategory = category;

        // Update the UI
        currentVariableName.textContent = category;

        // Set the selection mode dropdown to the saved value or default
        if (variableModeSelect) {
            const savedMode = variableCategoryModes[category] || 'sequential';
            variableModeSelect.value = savedMode;
        }

        // Refresh the lists to update selection highlighting
        refreshVariableCategoriesList();
        refreshVariableValuesList();
    }

    // Get the clear variables button
    const clearVariablesBtn = document.getElementById('clear-variables-btn');

    // Add event listener for clear variables button
    clearVariablesBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all variable categories? This cannot be undone.')) {
            // Clear all variable categories
            variableCategories = {};
            variableCategoryModes = {};
            currentVariableCategory = null;

            // Update the UI
            refreshVariableCategoriesList();
            displayAvailableVariables();

            // Save the current state
            saveCurrentState();

            // Show confirmation
            alert('All variable categories have been cleared.');
        }
    });

    // Function to display available variable categories in the sequence builder
    function displayAvailableVariables() {
        const variableCategoriesList = document.getElementById('variable-categories-list');
        const defineVariablesBtn = document.getElementById('define-variables-btn');
        const clearVariablesBtn = document.getElementById('clear-variables-btn');

        variableCategoriesList.innerHTML = '';

        // Create a list item for each variable category
        for (const category in variableCategories) {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'variable-category-item';

            const categoryName = document.createElement('span');
            categoryName.textContent = category;
            categoryName.className = 'variable-name';

            // Add click event to insert the variable into the sequence builder
            categoryItem.addEventListener('click', function() {
                insertVariableIntoSequence(category);
            });

            categoryItem.appendChild(categoryName);
            variableCategoriesList.appendChild(categoryItem);
        }

        // If no categories, show a message and update button text
        if (Object.keys(variableCategories).length === 0) {
            const noCategories = document.createElement('p');
            noCategories.textContent = 'No variable categories defined. Click "Define Variables" to create some.';
            noCategories.style.fontStyle = 'italic';
            noCategories.style.color = '#666';
            variableCategoriesList.appendChild(noCategories);

            // Update button text and visibility
            defineVariablesBtn.textContent = 'Define Variables';
            clearVariablesBtn.classList.add('hidden');
        } else {
            // Update button text and visibility
            defineVariablesBtn.textContent = 'Variables Defined';
            clearVariablesBtn.classList.remove('hidden');
        }
    }

    // Function to insert a variable into the sequence builder
    function insertVariableIntoSequence(category) {
        const stimuliText = document.getElementById('stimuli-text');
        const cursorPos = stimuliText.selectionStart;
        const textBefore = stimuliText.value.substring(0, cursorPos);
        const textAfter = stimuliText.value.substring(cursorPos);

        // Insert the variable with proper formatting
        const variableText = `'${category}'`;

        // Check if we need to add a comma
        let insertText = variableText;
        if (cursorPos > 0 && textBefore.trim().length > 0 && !textBefore.trim().endsWith(',') &&
            !textBefore.trim().endsWith('[') && !textBefore.trim().endsWith('(')) {
            insertText = ', ' + variableText;
        }

        stimuliText.value = textBefore + insertText + textAfter;

        // Update the cursor position after the inserted text
        const newCursorPos = cursorPos + insertText.length;
        stimuliText.setSelectionRange(newCursorPos, newCursorPos);
        stimuliText.focus();

        // Save the current state
        saveCurrentState();
    }

    // Initialize the available variables display when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Display available variables in the sequence builder
        displayAvailableVariables();
    });

    // Update available variables when variables are saved
    saveVariablesBtn.addEventListener('click', function() {
        // Save the variable categories to the state
        saveCurrentState();

        // Update the available variables display
        displayAvailableVariables();

        // Close the modal
        variableDefinitionModal.classList.add('hidden');

        // Show a confirmation message
        alert('Variable categories saved successfully.');
    });

    // Get DOM elements for the new mapping buttons and modals
    const textMappingBtn = document.getElementById('text-mapping-btn');
    const imageMappingBtn = document.getElementById('image-mapping-btn');
    const textMappingModal = document.getElementById('text-mapping-modal');
    const imageMappingModal = document.getElementById('image-mapping-modal');
    const textMappingTbody = document.getElementById('text-mapping-tbody');
    const imageMappingTbody = document.getElementById('image-mapping-tbody');
    const saveTextMappingsBtn = document.getElementById('save-text-mappings-btn');
    const saveImageMappingsBtn = document.getElementById('save-image-mappings-btn');
    const textModalCloseBtn = document.querySelector('.text-modal-close');
    const imageModalCloseBtn = document.querySelector('.image-modal-close');
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    const switchCategoryBtn = document.getElementById('switch-category-btn');

    // Add event listener for Text-Resp mapping button
    textMappingBtn.addEventListener('click', function() {
        // Parse current stimuli to generate mapping table
        const stimuliInput = document.getElementById('stimuli-text').value;

        // Check if any variables are defined
        if (Object.keys(variableCategories).length === 0) {
            alert('You need to define variables first. Click "Define Variables" to create some.');
            return;
        }

        try {
            // Generate text mapping table
            generateTextMappingTable();

            // Show modal
            textMappingModal.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating text mapping table:', error);
            alert('There was an error generating the text mapping table. Please check the console for details.');
        }
    });

    // Add event listener for Image-Resp mapping button
    imageMappingBtn.addEventListener('click', function() {
        // Parse current stimuli to generate mapping table
        const stimuliInput = document.getElementById('stimuli-text').value;

        // Check if any variables are defined
        if (Object.keys(variableCategories).length === 0) {
            alert('You need to define variables first. Click "Define Variables" to create some.');
            return;
        }

        try {
            // Generate image mapping table
            generateImageMappingTable();

            // Show modal
            imageMappingModal.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating image mapping table:', error);
            alert('There was an error generating the image mapping table. Please check the console for details.');
        }
    });

    // Close text mapping modal when clicking X
    textModalCloseBtn.addEventListener('click', function() {
        textMappingModal.classList.add('hidden');
    });

    // Close image mapping modal when clicking X
    imageModalCloseBtn.addEventListener('click', function() {
        imageMappingModal.classList.add('hidden');
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === textMappingModal) {
            textMappingModal.classList.add('hidden');
        } else if (e.target === imageMappingModal) {
            imageMappingModal.classList.add('hidden');
        }
    });

    // Add event listeners for save mapping buttons
    saveTextMappingsBtn.addEventListener('click', function() {
        saveTextMappings();
    });

    saveImageMappingsBtn.addEventListener('click', function() {
        saveImageMappings();
    });

    // Add event listeners for variable category management
    deleteCategoryBtn.addEventListener('click', function() {
        deleteCurrentCategory();
    });

    switchCategoryBtn.addEventListener('click', function() {
        switchCategory();
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

    // Function to generate text mapping table
    function generateTextMappingTable() {
        // Clear existing rows
        textMappingTbody.innerHTML = '';

        // Get default values from current form settings
        const defaultResponseKey = document.getElementById('response-key').value.trim() || 'Space';
        const defaultSize = document.getElementById('stimulus-size').value;
        const defaultColor = document.getElementById('stimulus-color').value;
        const defaultOffset = document.getElementById('stimulus-offset').value;
        const defaultX = document.getElementById('position-x').value || '0';
        const defaultY = document.getElementById('position-y').value || '0';

        // Process each variable category
        for (const category in variableCategories) {
            // Get the values for this category
            const values = variableCategories[category];

            // Filter out image values
            const textValues = values.filter(value => {
                return typeof value !== 'object' || value.type !== 'image';
            });

            // Skip if no text values
            if (textValues.length === 0) continue;

            // Add a header row for the category
            const headerRow = document.createElement('tr');
            headerRow.className = 'category-header-row';

            const headerCell = document.createElement('td');
            headerCell.colSpan = 7;
            headerCell.textContent = `Category: '${category}' (${textValues.length} text values)`;
            headerCell.style.fontWeight = 'bold';
            headerCell.style.backgroundColor = '#e3f2fd';
            headerCell.style.color = '#2196F3';
            headerRow.appendChild(headerCell);

            textMappingTbody.appendChild(headerRow);

            // Add a row for each text value
            textValues.forEach(value => {
                const valueText = typeof value === 'object' ? value.text : value;
                const row = document.createElement('tr');
                row.setAttribute('data-stimulus', valueText);
                row.setAttribute('data-category', category);

                // Stimulus cell
                const stimulusCell = document.createElement('td');
                stimulusCell.textContent = valueText;
                row.appendChild(stimulusCell);

                // Response key input
                const keyCell = document.createElement('td');
                const keyInput = document.createElement('input');
                keyInput.type = 'text';
                keyInput.setAttribute('data-type', 'key');
                keyInput.setAttribute('data-default', defaultResponseKey);
                keyInput.placeholder = defaultResponseKey;

                // Check if we have a saved mapping
                if (stimuliResponses[valueText] && stimuliResponses[valueText].key) {
                    keyInput.value = stimuliResponses[valueText].key;
                }

                keyCell.appendChild(keyInput);
                row.appendChild(keyCell);

                // X position input
                const xCell = document.createElement('td');
                const xInput = document.createElement('input');
                xInput.type = 'number';
                xInput.setAttribute('data-type', 'x');
                xInput.setAttribute('data-default', defaultX);
                xInput.placeholder = defaultX;

                if (stimuliResponses[valueText] && stimuliResponses[valueText].x !== undefined) {
                    xInput.value = stimuliResponses[valueText].x;
                }

                xCell.appendChild(xInput);
                row.appendChild(xCell);

                // Y position input
                const yCell = document.createElement('td');
                const yInput = document.createElement('input');
                yInput.type = 'number';
                yInput.setAttribute('data-type', 'y');
                yInput.setAttribute('data-default', defaultY);
                yInput.placeholder = defaultY;

                if (stimuliResponses[valueText] && stimuliResponses[valueText].y !== undefined) {
                    yInput.value = stimuliResponses[valueText].y;
                }

                yCell.appendChild(yInput);
                row.appendChild(yCell);

                // Offset input
                const offsetCell = document.createElement('td');
                const offsetInput = document.createElement('input');
                offsetInput.type = 'number';
                offsetInput.setAttribute('data-type', 'offset');
                offsetInput.setAttribute('data-default', defaultOffset);
                offsetInput.placeholder = defaultOffset;

                if (stimuliResponses[valueText] && stimuliResponses[valueText].offset !== undefined) {
                    offsetInput.value = stimuliResponses[valueText].offset;
                }

                offsetCell.appendChild(offsetInput);
                row.appendChild(offsetCell);

                // Color input
                const colorCell = document.createElement('td');
                const colorInput = document.createElement('input');
                colorInput.type = 'text';
                colorInput.setAttribute('data-type', 'color');
                colorInput.setAttribute('data-default', defaultColor);
                colorInput.placeholder = defaultColor;

                if (stimuliResponses[valueText] && stimuliResponses[valueText].color) {
                    colorInput.value = stimuliResponses[valueText].color;
                }

                colorCell.appendChild(colorInput);
                row.appendChild(colorCell);

                // Size input
                const sizeCell = document.createElement('td');
                const sizeInput = document.createElement('input');
                sizeInput.type = 'number';
                sizeInput.setAttribute('data-type', 'size');
                sizeInput.setAttribute('data-default', defaultSize);
                sizeInput.placeholder = defaultSize;

                if (stimuliResponses[valueText] && stimuliResponses[valueText].size !== undefined) {
                    sizeInput.value = stimuliResponses[valueText].size;
                }

                sizeCell.appendChild(sizeInput);
                row.appendChild(sizeCell);

                textMappingTbody.appendChild(row);
            });
        }

        // If no rows were added, show a message
        if (textMappingTbody.children.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 7;
            emptyCell.textContent = 'No text stimuli found in any variable category.';
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyRow.appendChild(emptyCell);
            textMappingTbody.appendChild(emptyRow);
        }
    }

    // Function to generate image mapping table
    function generateImageMappingTable() {
        // Clear existing rows
        imageMappingTbody.innerHTML = '';

        // Get default values from current form settings
        const defaultResponseKey = document.getElementById('response-key').value.trim() || 'Space';
        const defaultWidth = 400; // Default width for images
        const defaultHeight = 400; // Default height for images
        const defaultOffset = document.getElementById('stimulus-offset').value;
        const defaultX = document.getElementById('position-x').value || '0';
        const defaultY = document.getElementById('position-y').value || '0';

        // Process each variable category
        for (const category in variableCategories) {
            // Get the values for this category
            const values = variableCategories[category];

            // Filter out non-image values
            const imageValues = values.filter(value => {
                return typeof value === 'object' && value.type === 'image';
            });

            // Skip if no image values
            if (imageValues.length === 0) continue;

            // Add a header row for the category
            const headerRow = document.createElement('tr');
            headerRow.className = 'category-header-row';

            const headerCell = document.createElement('td');
            headerCell.colSpan = 7;
            headerCell.textContent = `Category: '${category}' (${imageValues.length} image values)`;
            headerCell.style.fontWeight = 'bold';
            headerCell.style.backgroundColor = '#e3f2fd';
            headerCell.style.color = '#2196F3';
            headerRow.appendChild(headerCell);

            imageMappingTbody.appendChild(headerRow);

            // Add a row for each image value
            imageValues.forEach(value => {
                const imageText = value.text;
                const row = document.createElement('tr');
                row.setAttribute('data-stimulus', imageText);
                row.setAttribute('data-category', category);

                // Stimulus cell
                const stimulusCell = document.createElement('td');
                stimulusCell.textContent = imageText;
                row.appendChild(stimulusCell);

                // Response key input
                const keyCell = document.createElement('td');
                const keyInput = document.createElement('input');
                keyInput.type = 'text';
                keyInput.setAttribute('data-type', 'key');
                keyInput.setAttribute('data-default', defaultResponseKey);
                keyInput.placeholder = defaultResponseKey;

                // Check if we have a saved mapping
                if (stimuliResponses[imageText] && stimuliResponses[imageText].key) {
                    keyInput.value = stimuliResponses[imageText].key;
                }

                keyCell.appendChild(keyInput);
                row.appendChild(keyCell);

                // X position input
                const xCell = document.createElement('td');
                const xInput = document.createElement('input');
                xInput.type = 'number';
                xInput.setAttribute('data-type', 'x');
                xInput.setAttribute('data-default', defaultX);
                xInput.placeholder = defaultX;

                if (stimuliResponses[imageText] && stimuliResponses[imageText].x !== undefined) {
                    xInput.value = stimuliResponses[imageText].x;
                }

                xCell.appendChild(xInput);
                row.appendChild(xCell);

                // Y position input
                const yCell = document.createElement('td');
                const yInput = document.createElement('input');
                yInput.type = 'number';
                yInput.setAttribute('data-type', 'y');
                yInput.setAttribute('data-default', defaultY);
                yInput.placeholder = defaultY;

                if (stimuliResponses[imageText] && stimuliResponses[imageText].y !== undefined) {
                    yInput.value = stimuliResponses[imageText].y;
                }

                yCell.appendChild(yInput);
                row.appendChild(yCell);

                // Width input
                const widthCell = document.createElement('td');
                const widthInput = document.createElement('input');
                widthInput.type = 'number';
                widthInput.setAttribute('data-type', 'width');
                widthInput.setAttribute('data-default', defaultWidth);
                widthInput.placeholder = defaultWidth;

                if (stimuliResponses[imageText] && stimuliResponses[imageText].width !== undefined) {
                    widthInput.value = stimuliResponses[imageText].width;
                }

                widthCell.appendChild(widthInput);
                row.appendChild(widthCell);

                // Height input
                const heightCell = document.createElement('td');
                const heightInput = document.createElement('input');
                heightInput.type = 'number';
                heightInput.setAttribute('data-type', 'height');
                heightInput.setAttribute('data-default', defaultHeight);
                heightInput.placeholder = defaultHeight;

                if (stimuliResponses[imageText] && stimuliResponses[imageText].height !== undefined) {
                    heightInput.value = stimuliResponses[imageText].height;
                }

                heightCell.appendChild(heightInput);
                row.appendChild(heightCell);

                // Offset input
                const offsetCell = document.createElement('td');
                const offsetInput = document.createElement('input');
                offsetInput.type = 'number';
                offsetInput.setAttribute('data-type', 'offset');
                offsetInput.setAttribute('data-default', defaultOffset);
                offsetInput.placeholder = defaultOffset;

                if (stimuliResponses[imageText] && stimuliResponses[imageText].offset !== undefined) {
                    offsetInput.value = stimuliResponses[imageText].offset;
                }

                offsetCell.appendChild(offsetInput);
                row.appendChild(offsetCell);

                imageMappingTbody.appendChild(row);
            });
        }

        // If no rows were added, show a message
        if (imageMappingTbody.children.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 7;
            emptyCell.textContent = 'No image stimuli found in any variable category.';
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyRow.appendChild(emptyCell);
            imageMappingTbody.appendChild(emptyRow);
        }
    }

    // Function to save text mappings
    function saveTextMappings() {
        const mappingRows = textMappingTbody.querySelectorAll('tr[data-stimulus]');

        // Process each mapping row
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
        textMappingModal.classList.add('hidden');

        // Visual feedback that mappings were saved
        textMappingBtn.textContent = hasCustomMappings ?
            "Text-Resp Mapping (Set)" : "Text-Resp Mapping";

        // Save state with updated mappings
        saveCurrentState();

        // Show confirmation
        alert('Text mappings saved successfully.');
    }

    // Function to save image mappings
    function saveImageMappings() {
        const mappingRows = imageMappingTbody.querySelectorAll('tr[data-stimulus]');

        // Process each mapping row
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
        imageMappingModal.classList.add('hidden');

        // Visual feedback that mappings were saved
        imageMappingBtn.textContent = hasCustomMappings ?
            "Image-Resp Mapping (Set)" : "Image-Resp Mapping";

        // Save state with updated mappings
        saveCurrentState();

        // Show confirmation
        alert('Image mappings saved successfully.');
    }

    // Function to delete the current variable category
    function deleteCurrentCategory() {
        if (!currentVariableCategory) {
            alert('Please select a category first.');
            return;
        }

        if (confirm(`Are you sure you want to delete the variable category '${currentVariableCategory}'?`)) {
            delete variableCategories[currentVariableCategory];
            currentVariableCategory = null;
            currentVariableName.textContent = 'Select a category';
            variableValuesContainer.innerHTML = '';
            refreshVariableCategoriesList();

            // Update the sequence builder
            updateSequenceBuilder();

            // Update the stimulus text to remove references to this category
            const stimuliText = document.getElementById('stimuli-text');
            if (stimuliText) {
                const regex = new RegExp(`'${currentVariableCategory}'`, 'g');
                stimuliText.value = stimuliText.value.replace(regex, `'deleted-category'`);

                // Save the current state
                saveCurrentState();
            }
        }
    }

    // Function to switch between variable categories
    function switchCategory() {
        // Create a dropdown to select a category
        const categories = Object.keys(variableCategories);

        if (categories.length === 0) {
            alert('No categories defined yet. Please create a category first.');
            return;
        }

        // Create a select element with options for each category
        let html = '<select id="category-select">';
        categories.forEach(category => {
            const selected = category === currentVariableCategory ? 'selected' : '';
            html += `<option value="${category}" ${selected}>${category}</option>`;
        });
        html += '</select>';

        // Show a dialog with the select element
        const categorySelect = document.createElement('div');
        categorySelect.innerHTML = html;

        // Use a custom dialog
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Switch Category</h3>
                <p>Select a category to switch to:</p>
                ${html}
                <div class="dialog-buttons">
                    <button id="switch-ok" class="primary-btn">OK</button>
                    <button id="switch-cancel" class="secondary-btn">Cancel</button>
                </div>
            </div>
        `;

        // Add the dialog to the page
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('switch-ok').addEventListener('click', function() {
            const selectedCategory = document.getElementById('category-select').value;
            selectVariableCategory(selectedCategory);
            document.body.removeChild(dialog);
        });

        document.getElementById('switch-cancel').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
    }

    // Function to generate mapping table with columns for concurrent stimuli
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
        parsedStimuli.forEach(stimulusItem => {
            const row = document.createElement('tr');

            // Determine the type of stimulus and create formatted key
            let storedStimulus;
            let isConcurrent = false;
            let concurrentStimuli = [];

            if (Array.isArray(stimulusItem)) {
                // Sequential stimulus - handle potential image objects in the array
                const formattedItems = stimulusItem.map(item => {
                    if (typeof item === 'object' && item.type === 'image') {
                        return item.text; // Just use the image filename
                    }
                    return item;
                });

                storedStimulus = formattedItems.length > 1 ?
                    `[${formattedItems.join(', ')}]` :
                    formattedItems[0];
            } else if (typeof stimulusItem === 'object' && stimulusItem.type === 'concurrent') {
                // Concurrent stimulus - handle potential image objects in the stimuli array
                const formattedItems = stimulusItem.stimuli.map(item => {
                    if (typeof item === 'object' && item.type === 'image') {
                        return item.text; // Just use the image filename
                    }
                    return item;
                });

                storedStimulus = `(${formattedItems.join(', ')})`;
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
                    // Handle image objects in concurrent stimuli
                    const stimText = typeof stim === 'object' && stim.type === 'image' ? stim.text : stim;
                    const posKey = stimText.toLowerCase().replace(/\s+/g, '_');
                    const defaultPosX = defaultPositions[index][0];
                    const defaultPosY = defaultPositions[index][1];

                    // X position cell
                    const xPosCell = document.createElement('td');
                    const xPosInput = document.createElement('input');
                    xPosInput.type = 'number';
                    xPosInput.placeholder = defaultPosX;
                    xPosInput.setAttribute('data-type', `${posKey}_x`);
                    xPosInput.setAttribute('data-default', defaultPosX);
                    xPosInput.title = `${stimText} X Position`;
                    xPosCell.appendChild(xPosInput);
                    row.appendChild(xPosCell);

                    // Y position cell
                    const yPosCell = document.createElement('td');
                    const yPosInput = document.createElement('input');
                    yPosInput.type = 'number';
                    yPosInput.placeholder = defaultPosY;
                    yPosInput.setAttribute('data-type', `${posKey}_y`);
                    yPosInput.setAttribute('data-default', defaultPosY);
                    yPosInput.title = `${stimText} Y Position`;
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

            // Check if this is an image stimulus (contains .jpg, .png, etc.)
            const isImageStimulus = storedStimulus.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);

            if (isImageStimulus) {
                // Width cell - for image stimuli
                const widthCell = document.createElement('td');
                const widthInput = document.createElement('input');
                widthInput.type = 'number';
                widthInput.placeholder = '400'; // Default width for images
                widthInput.setAttribute('data-type', 'width');
                widthInput.setAttribute('data-default', '400');
                widthInput.title = 'Image Width (px)';
                widthCell.appendChild(widthInput);
                row.appendChild(widthCell);

                // Height cell - for image stimuli
                const heightCell = document.createElement('td');
                const heightInput = document.createElement('input');
                heightInput.type = 'number';
                heightInput.placeholder = '400'; // Default height for images
                heightInput.setAttribute('data-type', 'height');
                heightInput.setAttribute('data-default', '400');
                heightInput.title = 'Image Height (px)';
                heightCell.appendChild(heightInput);
                row.appendChild(heightCell);
            } else {
                // Size cell - for text stimuli
                const sizeCell = document.createElement('td');
                const sizeInput = document.createElement('input');
                sizeInput.type = 'number';
                sizeInput.placeholder = defaultSize;
                sizeInput.setAttribute('data-type', 'size');
                sizeInput.setAttribute('data-default', defaultSize);
                sizeCell.appendChild(sizeInput);
                row.appendChild(sizeCell);
            }

            // Individual color and size for concurrent stimuli
            if (isConcurrent) {
                concurrentStimuli.forEach(stim => {
                    // Handle image objects in concurrent stimuli
                    const stimText = typeof stim === 'object' && stim.type === 'image' ? stim.text : stim;
                    const posKey = stimText.toLowerCase().replace(/\s+/g, '_');

                    // Individual color
                    const colorCell = document.createElement('td');
                    const colorInput = document.createElement('input');
                    colorInput.type = 'text';
                    colorInput.placeholder = defaultColor;
                    colorInput.setAttribute('data-type', `${posKey}_color`);
                    colorInput.setAttribute('data-default', defaultColor);
                    colorInput.title = `${stimText} Color`;
                    colorCell.appendChild(colorInput);
                    row.appendChild(colorCell);

                    // Individual size
                    const sizeCell = document.createElement('td');
                    const sizeInput = document.createElement('input');
                    sizeInput.type = 'number';
                    sizeInput.placeholder = defaultSize;
                    sizeInput.setAttribute('data-type', `${posKey}_size`);
                    sizeInput.setAttribute('data-default', defaultSize);
                    sizeInput.title = `${stimText} Size`;
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

        // Check for image stimuli
        let hasImageStimuli = false;
        parsedStimuli.forEach(item => {
            if (Array.isArray(item)) {
                // Check each item in the array for image type
                item.forEach(subItem => {
                    if (typeof subItem === 'object' && subItem.type === 'image') {
                        hasImageStimuli = true;
                    } else if (typeof subItem === 'string' && subItem.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                        hasImageStimuli = true;
                    }
                });
            }
        });

        if (!hasConcurrent) {
            // Add standard headers for regular stimuli
            let standardHeaders;
            if (hasImageStimuli) {
                standardHeaders = ['X Position', 'Y Position', 'Offset (ms)', 'Color', 'Width (px)', 'Height (px)'];
            } else {
                standardHeaders = ['X Position', 'Y Position', 'Offset (ms)', 'Color', 'Size (px)'];
            }
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
            stimulusText.style.opacity = '0.9'; // Reduce opacity rather than hide completely
        }
    }

    function hideFeedback() {
        feedbackText.classList.add('hidden');
        // Restore stimulus text visibility if it was reduced
        stimulusText.style.opacity = '1';
    }

    // Function to display survey answer input based on answer type
    function displaySurveyAnswerInput() {
        // Remove any existing answer input
        const existingInput = document.getElementById('survey-answer-input');
        if (existingInput) {
            existingInput.remove();
        }

        // Get all questions from the form
        const questionItems = document.querySelectorAll('.question-item');
        if (questionItems.length === 0) return;

        // Create a container for the survey
        const surveyContainer = document.createElement('div');
        surveyContainer.id = 'survey-answer-input';
        surveyContainer.style.position = 'absolute';
        surveyContainer.style.top = '10%';
        surveyContainer.style.left = '50%';
        surveyContainer.style.transform = 'translateX(-50%)';
        surveyContainer.style.width = '80%';
        surveyContainer.style.maxWidth = '600px';
        surveyContainer.style.backgroundColor = 'white';
        surveyContainer.style.padding = '20px';
        surveyContainer.style.borderRadius = '8px';
        surveyContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        surveyContainer.style.maxHeight = '80vh';
        surveyContainer.style.overflowY = 'auto';

        // Create a form element
        const form = document.createElement('form');
        form.id = 'survey-form-display';
        form.style.width = '100%';

        // Add each question to the form
        questionItems.forEach((item, index) => {
            const questionId = item.dataset.questionId;
            const questionText = item.querySelector('.question-text').value;
            const answerType = item.querySelector('.answer-type').value;

            // Create question container
            const questionContainer = document.createElement('div');
            questionContainer.className = 'survey-question';
            questionContainer.style.marginBottom = '30px';
            questionContainer.dataset.questionId = questionId;

            // Create question label
            const questionLabel = document.createElement('h3');
            questionLabel.textContent = `${index + 1}. ${questionText}`;
            questionLabel.style.marginBottom = '15px';
            questionLabel.style.color = '#2196F3';

            questionContainer.appendChild(questionLabel);

            // Create input based on answer type
            let inputElement;

            switch(answerType.toLowerCase()) {
                case 'text':
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                    inputElement.name = `question-${questionId}`;
                    inputElement.placeholder = 'Type your answer here...';
                    inputElement.style.width = '100%';
                    inputElement.style.padding = '10px';
                    inputElement.style.fontSize = '16px';
                    inputElement.style.borderRadius = '4px';
                    inputElement.style.border = '1px solid #ccc';
                    break;

                case 'textarea':
                    inputElement = document.createElement('textarea');
                    inputElement.name = `question-${questionId}`;
                    inputElement.placeholder = 'Type your answer here...';
                    inputElement.rows = 4;
                    inputElement.style.width = '100%';
                    inputElement.style.padding = '10px';
                    inputElement.style.fontSize = '16px';
                    inputElement.style.borderRadius = '4px';
                    inputElement.style.border = '1px solid #ccc';
                    break;

                case 'radio':
                    // Create a fieldset for radio options
                    inputElement = document.createElement('fieldset');
                    inputElement.style.border = 'none';
                    inputElement.style.padding = '10px';
                    inputElement.style.margin = '0';
                    inputElement.style.textAlign = 'left';

                    // Get custom options from the form
                    const options = getMultipleChoiceOptions(questionId);

                    // If no options are defined, use defaults
                    if (options.length === 0) {
                        options.push('Option 1', 'Option 2', 'Option 3');
                    }

                    options.forEach((option, optIndex) => {
                        const container = document.createElement('div');
                        container.style.margin = '10px 0';

                        const radio = document.createElement('input');
                        radio.type = 'radio';
                        radio.name = `question-${questionId}`;
                        radio.id = `question-${questionId}-option-${optIndex}`;
                        radio.value = option;
                        radio.style.marginRight = '10px';

                        const label = document.createElement('label');
                        label.htmlFor = `question-${questionId}-option-${optIndex}`;
                        label.textContent = option;
                        label.style.fontSize = '16px';

                        container.appendChild(radio);
                        container.appendChild(label);
                        inputElement.appendChild(container);
                    });
                    break;

                case 'slider':
                    // Create a container for the slider
                    inputElement = document.createElement('div');
                    inputElement.className = 'slider-container';
                    inputElement.style.width = '100%';
                    inputElement.style.padding = '10px';

                    // Get slider configuration from the form
                    const questionItem = document.querySelector(`.question-item[data-question-id="${questionId}"]`);
                    const minValue = parseInt(questionItem.querySelector('.slider-min').value) || 1;
                    const maxValue = parseInt(questionItem.querySelector('.slider-max').value) || 9;
                    const leftLabel = questionItem.querySelector('.slider-left-label').value || 'Left';
                    const rightLabel = questionItem.querySelector('.slider-right-label').value || 'Right';

                    // Create the slider input
                    const slider = document.createElement('input');
                    slider.type = 'range';
                    slider.name = `question-${questionId}`;
                    slider.min = minValue;
                    slider.max = maxValue;
                    slider.value = Math.floor((maxValue + minValue) / 2); // Start in the middle
                    slider.style.width = '100%';

                    // Create labels container
                    const labelsContainer = document.createElement('div');
                    labelsContainer.className = 'slider-labels';

                    // Create left label
                    const leftLabelSpan = document.createElement('span');
                    leftLabelSpan.textContent = leftLabel;

                    // Create right label
                    const rightLabelSpan = document.createElement('span');
                    rightLabelSpan.textContent = rightLabel;

                    // Add labels to container
                    labelsContainer.appendChild(leftLabelSpan);
                    labelsContainer.appendChild(rightLabelSpan);

                    // Create value display
                    const valueDisplay = document.createElement('div');
                    valueDisplay.className = 'slider-value-display';
                    valueDisplay.textContent = slider.value;

                    // Update value display when slider changes
                    slider.addEventListener('input', function() {
                        valueDisplay.textContent = this.value;
                    });

                    // Add all elements to the container
                    inputElement.appendChild(slider);
                    inputElement.appendChild(labelsContainer);
                    inputElement.appendChild(valueDisplay);
                    break;

                default:
                    // Default to text input
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                    inputElement.name = `question-${questionId}`;
                    inputElement.placeholder = 'Type your answer here...';
                    inputElement.style.width = '100%';
                    inputElement.style.padding = '10px';
                    inputElement.style.fontSize = '16px';
                    inputElement.style.borderRadius = '4px';
                    inputElement.style.border = '1px solid #ccc';
            }

            // Add the input to the question container
            questionContainer.appendChild(inputElement);

            // Add the question container to the form
            form.appendChild(questionContainer);
        });

        // Add a submit button
        const submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.textContent = 'Submit Survey';
        submitButton.style.marginTop = '20px';
        submitButton.style.padding = '12px 24px';
        submitButton.style.fontSize = '18px';
        submitButton.style.backgroundColor = '#4CAF50';
        submitButton.style.color = 'white';
        submitButton.style.border = 'none';
        submitButton.style.borderRadius = '4px';
        submitButton.style.cursor = 'pointer';
        submitButton.style.display = 'block';
        submitButton.style.margin = '20px auto';

        // Add event listener to the submit button
        submitButton.addEventListener('click', completeSurvey);

        form.appendChild(submitButton);
        surveyContainer.appendChild(form);

        // Add the container to the experiment screen
        experimentScreen.appendChild(surveyContainer);

        // Focus on the first input element
        const firstInput = form.querySelector('input, textarea');
        if (firstInput) {
            firstInput.focus();
        }
    }

    // Function to handle key press events in survey mode
    function handleSurveyKeyPress(e) {
        // If Enter key is pressed, complete the survey
        if (e.key === 'Enter') {
            completeSurvey();
        }
    }

    // Function to complete the survey and return to the intro screen
    function completeSurvey() {
        // Get the answer input container
        const surveyContainer = document.getElementById('survey-answer-input');
        const answers = {};

        if (surveyContainer) {
            // Get all question containers
            const questionContainers = surveyContainer.querySelectorAll('.survey-question');

            // Process each question
            questionContainers.forEach(container => {
                const questionId = container.dataset.questionId;
                let answer = '';

                // Get the input element based on what's in the container
                const textInput = container.querySelector('input[type="text"]');
                const textareaInput = container.querySelector('textarea');
                const radioInputs = container.querySelectorAll('input[type="radio"]');
                const sliderInput = container.querySelector('input[type="range"]');

                if (textInput) {
                    answer = textInput.value;
                } else if (textareaInput) {
                    answer = textareaInput.value;
                } else if (radioInputs.length > 0) {
                    // Find the selected radio button
                    radioInputs.forEach(radio => {
                        if (radio.checked) {
                            answer = radio.value;
                        }
                    });
                } else if (sliderInput) {
                    // Get the slider value
                    answer = sliderInput.value;

                    // Get the slider configuration for additional context
                    const questionItem = document.querySelector(`.question-item[data-question-id="${questionId}"]`);
                    if (questionItem) {
                        const minValue = questionItem.querySelector('.slider-min')?.value || '1';
                        const maxValue = questionItem.querySelector('.slider-max')?.value || '9';
                        const leftLabel = questionItem.querySelector('.slider-left-label')?.value || 'Left';
                        const rightLabel = questionItem.querySelector('.slider-right-label')?.value || 'Right';

                        // Add context to the answer
                        answer = `${answer} (on scale from ${minValue} to ${maxValue}, where ${minValue} = "${leftLabel}" and ${maxValue} = "${rightLabel}")`;
                    }
                }

                // Store the answer
                answers[questionId] = answer;
            });

            // Save the survey data if enabled
            // Use the global saveData variable which is kept in sync with the checkbox
            if (saveData) {
                console.log('Saving survey data, saveData =', saveData, 'isStudyMode =', isStudyMode);
                saveSurveyData(answers);
            } else {
                console.log('Not saving survey data, saveData =', saveData, 'isStudyMode =', isStudyMode);
            }

            // Remove the survey container
            surveyContainer.remove();
        }

        // Remove the keydown event listener
        document.removeEventListener('keydown', handleSurveyKeyPress);

        // Reset the stimulus text
        stimulusText.classList.add('hidden');

        console.log('Survey completed with answers:', answers);

        if (isStudyMode) {
            // In study mode, proceed to the next configuration
            experimentContainer.classList.add('hidden');
            completionScreen.classList.remove('hidden');
            document.getElementById('completion-message').textContent = `Survey ${currentStudyIndex + 1} Complete`;
            document.getElementById('completion-stats').classList.add('hidden');

            // Add a download button for this survey's data even in study mode
            // This addresses the issue where survey blocks don't merge with experimental blocks
            if (saveData) {
                // Create a download button for just this survey's data
                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Download This Survey Data';
                downloadBtn.className = 'secondary-btn';
                downloadBtn.style.marginTop = '20px';

                // Find the survey data for this configuration
                const surveyDataEntry = studyData.find(item =>
                    item.configurationIndex === currentStudyIndex && item.type === 'survey');

                if (surveyDataEntry) {
                    // Create a blob with just this survey's data
                    const dataStr = JSON.stringify(surveyDataEntry.data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });

                    // Create timestamp for filename
                    const timestamp = formatDateTime(new Date()).replace(/:/g, '-').replace(/_/g, '_');
                    const filename = `survey_data_block${currentStudyIndex+1}_${timestamp}.json`;

                    // Create download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(dataBlob);
                    downloadLink.download = filename;

                    // Add click event to button
                    downloadBtn.addEventListener('click', function() {
                        downloadLink.click();
                    });

                    // Add button to completion screen
                    completionScreen.insertBefore(downloadBtn, okBtn);
                }
            }

            // When OK is clicked, it will advance to the next configuration
        } else if (saveData) {
            // In regular mode with save data enabled, show completion screen with download button
            experimentContainer.classList.add('hidden');
            completionScreen.classList.remove('hidden');
            document.getElementById('completion-message').textContent = 'Survey Complete!';
            document.getElementById('completion-stats').classList.add('hidden');

            // When OK is clicked, it will return to the intro screen
            // The download button will be added by the saveSurveyData function
        } else {
            // In regular mode without save data, return to the intro screen
            experimentContainer.classList.add('hidden');
            introScreen.classList.remove('hidden');
        }
    }

    // Function to save survey data
    function saveSurveyData(answers) {
        console.log('saveSurveyData called with saveData =', saveData);

        // In study mode, we need to check the saveData value from the configuration
        if (isStudyMode) {
            const currentConfig = studyConfigurations[currentStudyIndex];
            if (currentConfig && currentConfig.config) {
                // Override the global saveData with the configuration's saveData setting
                saveData = currentConfig.config.saveData !== undefined ? currentConfig.config.saveData : false;
                console.log('In study mode, using configuration saveData setting:', saveData);
            }
        }

        // If saveData is false, don't save anything
        if (!saveData) {
            console.log('saveData is false, not saving survey data');
            return;
        }

        const now = new Date();
        const timestamp = formatDateTime(now);

        // Get all questions from the form
        const questionItems = document.querySelectorAll('.question-item');
        const surveyData = [];

        // Process each question
        questionItems.forEach(item => {
            const questionId = item.dataset.questionId;
            const questionText = item.querySelector('.question-text').value;
            const answerType = item.querySelector('.answer-type').value;

            // Add the question and answer to the survey data
            surveyData.push({
                Timestamp: timestamp,
                QuestionNumber: questionId,
                Question: questionText,
                Answer: answers[questionId] || '',
                AnswerType: answerType
            });
        });

        console.log('Processed survey data:', surveyData);

        // If in study mode, add the survey data to the study data array
        if (isStudyMode) {
            console.log('In study mode, adding survey data to study data array');
            console.log('Current study index:', currentStudyIndex);
            console.log('Study configurations:', studyConfigurations);

            // Add this survey's data to the study data array
            const surveyDataEntry = {
                configurationIndex: currentStudyIndex,
                configurationName: studyConfigurations[currentStudyIndex]?.name || `Survey ${currentStudyIndex + 1}`,
                type: 'survey', // Mark this as survey data for proper handling
                data: surveyData
            };

            // Check if we already have data for this configuration index
            const existingIndex = studyData.findIndex(item =>
                item.configurationIndex === currentStudyIndex && item.type === 'survey');

            if (existingIndex >= 0) {
                // Replace existing data
                console.log('Replacing existing survey data at index', existingIndex);
                studyData[existingIndex] = surveyDataEntry;
            } else {
                // Add new data
                studyData.push(surveyDataEntry);
            }

            console.log('Added/updated survey data in study:', surveyDataEntry);
            console.log('Current study data array:', studyData);

            // In study mode, we still want to provide a way to download individual survey data
            // Create a JSON blob for this specific survey
            const surveyDataStr = JSON.stringify(surveyData, null, 2);
            const surveyDataBlob = new Blob([surveyDataStr], { type: 'application/json' });

            // Create timestamp for filename
            const fileTimestamp = timestamp.replace(/:/g, '-').replace(/_/g, '_');
            const filename = `survey_${currentStudyIndex + 1}_data_${fileTimestamp}.json`;

            // Add a download button to the completion screen
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download This Survey Data';
            downloadBtn.className = 'secondary-btn';
            downloadBtn.style.marginTop = '20px';

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(surveyDataBlob);
            downloadLink.download = filename;

            // Add click event to button
            downloadBtn.addEventListener('click', function() {
                downloadLink.click();
            });

            // Add button to completion screen before the OK button
            const okBtn = document.getElementById('ok-btn');
            if (okBtn && !completionScreen.querySelector('button.secondary-btn')) {
                completionScreen.insertBefore(downloadBtn, okBtn);
                console.log('Added download button for individual survey data in study mode');
            }

            return;
        }

        // Only for non-study mode: create a JSON blob and prepare download for individual survey data
        const dataStr = JSON.stringify(surveyData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create timestamp for filename
        const fileTimestamp = timestamp.replace(/:/g, '-').replace(/_/g, '_');
        const filename = `survey_data_${fileTimestamp}.json`;

        // Make sure the completion screen is visible
        if (!completionScreen.classList.contains('hidden')) {
            // Remove any existing survey download buttons to prevent duplicates
            const existingButtons = completionScreen.querySelectorAll('button.secondary-btn');
            existingButtons.forEach(button => {
                if (button.textContent === 'Download Survey Data') {
                    button.remove();
                }
            });

            // Create download button and add to completion screen
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download Survey Data';
            downloadBtn.className = 'secondary-btn';
            downloadBtn.style.marginTop = '20px';

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(dataBlob);
            downloadLink.download = filename;

            // Add click event to button
            downloadBtn.addEventListener('click', function() {
                downloadLink.click();
            });

            // Add button to completion screen
            completionScreen.insertBefore(downloadBtn, okBtn);
            console.log('Added download button for survey data');
        } else {
            // Completion screen is not visible yet, we need to show it
            console.log('Completion screen not visible, showing it with download button');

            // Store the data for the download button
            window.surveyDataBlob = dataBlob;
            window.surveyDataFilename = filename;

            // Show the completion screen
            experimentContainer.classList.add('hidden');
            completionScreen.classList.remove('hidden');
            document.getElementById('completion-message').textContent = 'Survey Complete!';
            document.getElementById('completion-stats').classList.add('hidden');

            // Create download button and add to completion screen
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download Survey Data';
            downloadBtn.className = 'secondary-btn';
            downloadBtn.style.marginTop = '20px';

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(dataBlob);
            downloadLink.download = filename;

            // Add click event to button
            downloadBtn.addEventListener('click', function() {
                downloadLink.click();
            });

            // Add button to completion screen
            completionScreen.insertBefore(downloadBtn, okBtn);
            console.log('Added download button for survey data to newly shown completion screen');
        }
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

        csvFileInput.addEventListener('change', function() {
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

    // Add event listener for survey save data checkbox
    const surveySaveDataCheckbox = document.getElementById('survey-save-data');
    if (surveySaveDataCheckbox) {
        surveySaveDataCheckbox.addEventListener('change', function() {
            // Update the global saveData variable when the checkbox is changed
            saveData = this.checked;
            console.log('Survey saveData updated to:', saveData);
        });
    }

    // Add event listener for experiment save data checkbox
    const experimentSaveDataCheckbox = document.getElementById('save-data');
    if (experimentSaveDataCheckbox) {
        experimentSaveDataCheckbox.addEventListener('change', function() {
            // Update the global saveData variable when the checkbox is changed
            saveData = this.checked;
            console.log('Experiment saveData updated to:', saveData);
        });
    }

    // Initialize Study Management Modal Event Listeners
    function initStudyManagementModalListeners() {
        console.log('Initializing study management modal listeners');

        // Close button
        const studyModalClose = document.querySelector('.study-modal-close');
        console.log('Study modal close button:', studyModalClose);
        if (studyModalClose) {
            studyModalClose.addEventListener('click', hideStudyManagementModal);
        }

        // Save study to localStorage button
        const saveStudyLocalBtn = document.getElementById('save-study-local-btn');
        console.log('Save study local button:', saveStudyLocalBtn);
        if (saveStudyLocalBtn) {
            saveStudyLocalBtn.addEventListener('click', saveStudyToLocalStorage);
        }

        // Export study to file button
        const exportStudyBtn = document.getElementById('export-study-btn');
        console.log('Export study button:', exportStudyBtn);
        if (exportStudyBtn) {
            exportStudyBtn.addEventListener('click', exportStudyToFile);
        }

        // Import study from file button
        const importStudyBtn = document.getElementById('import-study-btn');
        console.log('Import study button:', importStudyBtn);
        if (importStudyBtn) {
            importStudyBtn.addEventListener('click', function() {
                // Trigger the hidden file input
                document.getElementById('study-file-input').click();
            });
        }

        // Close modal when clicking outside of it
        const studyManagementModal = document.getElementById('study-management-modal');
        console.log('Study management modal:', studyManagementModal);
        if (studyManagementModal) {
            studyManagementModal.addEventListener('click', function(event) {
                if (event.target === studyManagementModal) {
                    hideStudyManagementModal();
                }
            });
        }

        console.log('Study management modal listeners initialized');
    }

    // Initialize the study management modal listeners after a short delay to ensure DOM is fully loaded
    setTimeout(initStudyManagementModalListeners, 500);
});

// Direct Study Management Functions

// Show the direct modal
function showDirectModal(mode) {
    if (mode === 'save' && studyConfigurations.length === 0) {
        alert('Please add at least one configuration to the study before saving.');
        return;
    }

    const modal = document.getElementById('direct-study-modal');
    if (!modal) return;

    // Set default study name
    if (mode === 'save') {
        const nameInput = document.getElementById('direct-study-name');
        if (nameInput) {
            nameInput.value = 'Psychology Study ' + new Date().toLocaleDateString();
        }
    }

    // Populate the study list
    if (mode === 'load') {
        populateDirectStudyList();
    }

    // Show the modal
    modal.classList.remove('hidden');

    // Focus on appropriate section
    if (mode === 'load') {
        document.getElementById('direct-load-section').scrollIntoView();
    } else {
        document.getElementById('direct-save-section').scrollIntoView();
    }
}

// Hide the direct modal
function hideDirectModal() {
    const modal = document.getElementById('direct-study-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Populate the direct study list
function populateDirectStudyList() {
    const studyList = document.getElementById('direct-study-list');
    if (!studyList) return;

    // Clear the list
    studyList.innerHTML = '';

    // Get saved studies
    let savedStudies = [];
    try {
        const savedStudiesJSON = localStorage.getItem('savedStudies');
        if (savedStudiesJSON) {
            savedStudies = JSON.parse(savedStudiesJSON);
        }
    } catch (error) {
        console.error('Error loading saved studies:', error);
    }

    // If no studies found, show message
    if (savedStudies.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No saved studies found';
        studyList.appendChild(option);
        return;
    }

    // Sort studies by timestamp (newest first)
    savedStudies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Add each study to the list
    savedStudies.forEach(study => {
        const option = document.createElement('option');
        option.value = study.id;

        // Format the date
        const date = new Date(study.timestamp);
        const formattedDate = date.toLocaleDateString();

        option.textContent = `${study.name} (${formattedDate}) - ${study.configurations.length} config(s)`;
        studyList.appendChild(option);
    });
}

// Save study directly
function directSaveStudy() {
    const nameInput = document.getElementById('direct-study-name');
    if (!nameInput) return;

    const studyName = nameInput.value.trim();
    if (!studyName) {
        alert('Please enter a name for your study.');
        return;
    }

    // Create a study object
    const studyObject = {
        id: Date.now().toString(),
        version: '1.0',
        timestamp: new Date().toISOString(),
        name: studyName,
        configurations: studyConfigurations
    };

    // Get existing saved studies
    let savedStudies = [];
    try {
        const savedStudiesJSON = localStorage.getItem('savedStudies');
        if (savedStudiesJSON) {
            savedStudies = JSON.parse(savedStudiesJSON);
        }
    } catch (error) {
        console.error('Error loading saved studies:', error);
    }

    // Check if a study with this name already exists
    const existingStudyIndex = savedStudies.findIndex(study => study.name === studyName);
    if (existingStudyIndex !== -1) {
        if (confirm(`A study named "${studyName}" already exists. Do you want to overwrite it?`)) {
            savedStudies[existingStudyIndex] = studyObject;
        } else {
            return;
        }
    } else {
        savedStudies.push(studyObject);
    }

    // Save to localStorage
    localStorage.setItem('savedStudies', JSON.stringify(savedStudies));

    // Show success message
    alert(`Study "${studyName}" saved successfully.`);

    // Hide the modal
    hideDirectModal();
}

// Load study directly
function directLoadStudy() {
    const studyList = document.getElementById('direct-study-list');
    if (!studyList || !studyList.value) {
        alert('Please select a study to load.');
        return;
    }

    const studyId = studyList.value;

    // Get saved studies
    let savedStudies = [];
    try {
        const savedStudiesJSON = localStorage.getItem('savedStudies');
        if (savedStudiesJSON) {
            savedStudies = JSON.parse(savedStudiesJSON);
        }
    } catch (error) {
        console.error('Error loading saved studies:', error);
        return;
    }

    // Find the selected study
    const study = savedStudies.find(s => s.id === studyId);
    if (!study) {
        alert('Selected study not found.');
        return;
    }

    // Confirm if there are existing configurations
    if (studyConfigurations.length > 0) {
        if (!confirm('Loading this study will replace your current study configurations. Continue?')) {
            return;
        }
    }

    // Clear current configurations
    studyConfigurations = [];
    document.getElementById('study-window').innerHTML = '';

    // Load the configurations
    study.configurations.forEach(config => {
        // Ensure the configuration has a unique ID
        if (!config.id) {
            config.id = Date.now() + Math.random().toString(36).substring(2, 11);
        }

        // Add to the study configurations array
        studyConfigurations.push(config);

        // Display in the UI
        displayConfiguration(config);
    });

    // Hide the modal
    hideDirectModal();

    // Show success message
    alert(`Study "${study.name}" loaded successfully with ${studyConfigurations.length} configuration(s).`);
}

// Delete study directly
function directDeleteStudy() {
    const studyList = document.getElementById('direct-study-list');
    if (!studyList || !studyList.value) {
        alert('Please select a study to delete.');
        return;
    }

    const studyId = studyList.value;

    // Get saved studies
    let savedStudies = [];
    try {
        const savedStudiesJSON = localStorage.getItem('savedStudies');
        if (savedStudiesJSON) {
            savedStudies = JSON.parse(savedStudiesJSON);
        }
    } catch (error) {
        console.error('Error loading saved studies:', error);
        return;
    }

    // Find the selected study
    const studyIndex = savedStudies.findIndex(s => s.id === studyId);
    if (studyIndex === -1) {
        alert('Selected study not found.');
        return;
    }

    // Confirm deletion
    const studyName = savedStudies[studyIndex].name;
    if (!confirm(`Are you sure you want to delete the study "${studyName}"? This cannot be undone.`)) {
        return;
    }

    // Remove the study
    savedStudies.splice(studyIndex, 1);

    // Save to localStorage
    localStorage.setItem('savedStudies', JSON.stringify(savedStudies));

    // Update the study list
    populateDirectStudyList();

    // Show success message
    alert(`Study "${studyName}" deleted successfully.`);
}

// Load file directly
function directLoadFile(fileInput) {
    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            // Parse the JSON content
            const studyObject = JSON.parse(event.target.result);

            // Validate the study object
            if (!studyObject.configurations || !Array.isArray(studyObject.configurations)) {
                throw new Error('Invalid study file format');
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
            studyObject.configurations.forEach(config => {
                // Ensure the configuration has a unique ID
                if (!config.id) {
                    config.id = Date.now() + Math.random().toString(36).substring(2, 11);
                }

                // Add to the study configurations array
                studyConfigurations.push(config);

                // Display in the UI
                displayConfiguration(config);
            });

            // Hide the modal
            hideDirectModal();

            // Show success message
            alert(`Study loaded successfully with ${studyConfigurations.length} configuration(s).`);

            // Reset the file input
            fileInput.value = '';

        } catch (error) {
            console.error('Error loading study:', error);
            alert('Error loading study file. Please make sure it is a valid study configuration file.');
        }
    };

    reader.onerror = function() {
        alert('Error reading the file. Please try again.');
    };

    reader.readAsText(file);
}