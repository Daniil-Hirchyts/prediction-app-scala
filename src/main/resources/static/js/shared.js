let currentModelId = 'default';

// Charger les modèles
async function loadModels() {
    try {
        console.log("Chargement des modèles...");

        // Mettre à jour les indicateurs de chargement
        const currentModelDisplay = document.getElementById('current-model-display');
        if (currentModelDisplay) {
            currentModelDisplay.textContent = "Chargement...";
        }

        const response = await fetch('/api/models');
        const data = await response.json();
        console.log("Modèles chargés:", data);

        const modelSelect = document.getElementById('model-select');
        if (!modelSelect) return; // Si l'élément n'existe pas sur cette page

        modelSelect.innerHTML = '';

        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });

            // Essayer de restaurer la sélection précédente depuis localStorage
            const savedModelId = localStorage.getItem('currentModelId');
            if (savedModelId && modelSelect.querySelector(`option[value="${savedModelId}"]`)) {
                currentModelId = savedModelId;
                modelSelect.value = currentModelId;
            } else {
                // Si le modèle sauvegardé n'existe pas, prendre le premier
                currentModelId = modelSelect.options[0].value;
            }

            updateSelectedModelName();

            // Déclencher un événement pour notifier les autres composants
            document.dispatchEvent(new CustomEvent('modelChanged', {
                detail: { modelId: currentModelId }
            }));
        } else {
            // Ajouter un modèle par défaut si aucun n'est disponible
            const option = document.createElement('option');
            option.value = 'default';
            option.textContent = 'Modèle par défaut';
            modelSelect.appendChild(option);
            currentModelId = 'default';

            // Mettre à jour l'interface ici aussi
            updateSelectedModelName();

            document.dispatchEvent(new CustomEvent('modelChanged', {
                detail: { modelId: currentModelId }
            }));
        }

        console.log("Modèle sélectionné:", currentModelId);
    } catch (error) {
        console.error("Erreur lors du chargement des modèles:", error);

        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            modelSelect.innerHTML = '';
            const option = document.createElement('option');
            option.value = 'default';
            option.textContent = 'Modèle par défaut';
            modelSelect.appendChild(option);
            currentModelId = 'default';

            // Mettre à jour l'interface même en cas d'erreur
            updateSelectedModelName();

            document.dispatchEvent(new CustomEvent('modelChanged', {
                detail: { modelId: currentModelId }
            }));
        }
    }
}

// Mettre à jour le nom du modèle sélectionné dans l'interface
function updateSelectedModelName() {
    const selectedModelNameSpan = document.getElementById('selected-model-name');
    const currentModelDisplay = document.getElementById('current-model-display');
    const modelSelect = document.getElementById('model-select');

    if (modelSelect && modelSelect.selectedIndex >= 0) {
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];

        // Mettre à jour l'affichage du modèle dans la page settings
        if (currentModelDisplay) {
            currentModelDisplay.textContent = selectedOption.textContent;
        }

        if (selectedModelNameSpan) {
            selectedModelNameSpan.textContent = selectedOption.textContent;
        }
    } else {
        // Valeur par défaut si aucun modèle n'est sélectionné
        if (currentModelDisplay) {
            currentModelDisplay.textContent = "Modèle par défaut";
        }
        if (selectedModelNameSpan) {
            selectedModelNameSpan.textContent = "par défaut";
        }
    }
}

// Initialiser les gestionnaires d'événements communs
function initializeSharedEvents() {
    // Gestionnaire d'événement pour le changement de modèle
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', () => {
            currentModelId = modelSelect.value;
            // Sauvegarder la sélection dans localStorage
            localStorage.setItem('currentModelId', currentModelId);
            console.log("Modèle sélectionné:", currentModelId);

            // Mettre à jour l'interface
            updateSelectedModelName();

            // Déclencher un événement personnalisé
            document.dispatchEvent(new CustomEvent('modelChanged', {
                detail: { modelId: currentModelId }
            }));
        });
    }

    const createNewModelRadio = document.getElementById('create-new-model');
    const addToExistingRadio = document.getElementById('add-to-existing');
    const newModelNameInput = document.getElementById('new-model-name');

    if (createNewModelRadio && addToExistingRadio && newModelNameInput) {
        const toggleModelFormOptions = () => {
            newModelNameInput.parentElement.style.display =
                createNewModelRadio.checked ? 'block' : 'none';

            const existingModelInfo = document.getElementById('existing-model-info');
            if (existingModelInfo) {
                existingModelInfo.style.display =
                    createNewModelRadio.checked ? 'none' : 'block';
            }
        };

        createNewModelRadio.addEventListener('change', toggleModelFormOptions);
        addToExistingRadio.addEventListener('change', toggleModelFormOptions);

        // Initialiser l'état
        toggleModelFormOptions();
    }

    // Ancienne version pour compatibilité
    const createNewModelCheckbox = document.getElementById('create-new-model-checkbox');
    if (createNewModelCheckbox && newModelNameInput) {
        createNewModelCheckbox.addEventListener('change', () => {
            newModelNameInput.parentElement.style.display =
                createNewModelCheckbox.checked ? 'block' : 'none';

            // Afficher ou masquer l'info du modèle existant
            const existingModelInfo = document.getElementById('existing-model-info');
            if (existingModelInfo) {
                existingModelInfo.style.display =
                    createNewModelCheckbox.checked ? 'none' : 'block';
            }
        });

        // Initialiser l'état
        newModelNameInput.parentElement.style.display =
            createNewModelCheckbox.checked ? 'block' : 'none';
    }
}

// Fonction utilitaire pour limiter les appels fréquents (debounce)
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initialiser la page au chargement
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation de la page partagée");
    loadModels();
    initializeSharedEvents();

    // Mise à jour de l'affichage des fichiers sélectionnés si disponible
    const fileUploadInput = document.getElementById('file-upload');
    const selectedFilesDisplay = document.getElementById('selected-files');

    if (fileUploadInput && selectedFilesDisplay) {
        fileUploadInput.addEventListener('change', () => {
            const files = fileUploadInput.files;
            if (files.length === 0) {
                selectedFilesDisplay.textContent = "Aucun fichier sélectionné";
                return;
            }

            if (files.length === 1) {
                selectedFilesDisplay.textContent = `Fichier sélectionné : ${files[0].name}`;
            } else {
                selectedFilesDisplay.textContent = `${files.length} fichiers sélectionnés`;
            }
        });
    }
});