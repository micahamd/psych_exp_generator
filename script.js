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

    // Add new variables for study management
    let studyConfigurations = [];
    let currentStudyIndex = 0;

    let isStudyMode = false;      // Add with other state variables
    let studyData = []; // Add a variable to store all study data
    let isExperimentMode = true; // true = experiment, false = survey

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

        isStudyMode = true;  // Make sure this is set
        console.log('Beginning study mode:', isStudyMode);
        currentStudyIndex = 0;

        // Start the first configuration in the study
        startStudyConfiguration(currentStudyIndex);
    });

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
            document.getElementById('survey-save-data').checked = config.config.saveData;

            // Trigger the survey test
            document.getElementById('begin-btn').click();
        } else {
            // Handle experiment configuration (default)
            console.log('Starting experiment configuration');

            // Switch to experiment mode if needed
            if (!isExperimentMode) {
                isExperimentMode = true;
                document.getElementById('form-type-switch').checked = true;
                toggleFormMode(true);
            }

            // Load experiment configuration
            loadConfiguration(config.config);
            startExperiment();
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
                    document.getElementById('survey-save-data').checked = savedState.surveyState.saveData || false;

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
            if (savedState.saveData !== undefined) document.getElementById('save-data').checked = savedState.saveData;
            if (savedState.trialInterval) document.getElementById('trial-interval').value = savedState.trialInterval;

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

    // Parse stimuli input to handle sequences, concurrent stimuli, and images
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
                // Check if the item is an image (has .jpg, .png, etc. extension)
                const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(trimmed);
                const itemWithType = isImage ? { text: trimmed, type: 'image' } : trimmed;

                if (inSequence) {
                    currentSequence.push(itemWithType);
                } else if (inConcurrent) {
                    currentConcurrent.push(itemWithType);
                } else {
                    // Single item becomes a sequence of one
                    result.push([itemWithType]);
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
            // Sequential stimulus - handle potential image objects in the array
            const formattedItems = stimulusItem.map(item => {
                if (typeof item === 'object' && item.type === 'image') {
                    return item.text; // Just use the image filename
                }
                return item;
            });
            return formattedItems.length > 1 ? `[${formattedItems.join(', ')}]` : formattedItems[0];
        } else if (typeof stimulusItem === 'object' && stimulusItem.type === 'concurrent') {
            // Concurrent stimulus - handle potential image objects in the stimuli array
            const formattedItems = stimulusItem.stimuli.map(item => {
                if (typeof item === 'object' && item.type === 'image') {
                    return item.text; // Just use the image filename
                }
                return item;
            });
            return `(${formattedItems.join(', ')})`;
        } else if (typeof stimulusItem === 'object' && stimulusItem.type === 'image') {
            // Single image stimulus
            return stimulusItem.text;
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

            // Check if the stimulus is an image
            const isImage = typeof currentStimulus === 'object' && currentStimulus.type === 'image';

            // Format the stimulus display key for mapping lookup
            const stimulusDisplay = getFormattedStimulusKey(currentSequence);
            const mapping = stimuliResponses[stimulusDisplay] || {};

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
                const customWidth = mapping[`${stimKey}_width`] !== undefined ? mapping[`${stimKey}_width`] : (mapping.width !== undefined ? mapping.width : 400);
                const customHeight = mapping[`${stimKey}_height`] !== undefined ? mapping[`${stimKey}_height`] : (mapping.height !== undefined ? mapping.height : 400);

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

            // Get custom position if available
            const stimulusText = isImage ? stimulus.text : stimulus;
            const posKey = stimulusText.toLowerCase().replace(/\s+/g, '_');
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
            const saveDataEnabled = document.getElementById('survey-save-data').checked;
            if (saveDataEnabled) {
                saveSurveyData(answers);
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

            // When OK is clicked, it will advance to the next configuration
        } else {
            // In regular mode, return to the intro screen
            experimentContainer.classList.add('hidden');
            introScreen.classList.remove('hidden');
        }
    }

    // Function to save survey data
    function saveSurveyData(answers) {
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

        // Create a JSON blob and trigger download
        const dataStr = JSON.stringify(surveyData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create timestamp for filename
        const fileTimestamp = timestamp.replace(/:/g, '-').replace(/_/g, '_');
        const filename = `survey_data_${fileTimestamp}.json`;

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = filename;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
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
});
