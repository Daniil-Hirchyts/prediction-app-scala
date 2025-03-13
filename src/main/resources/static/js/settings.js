document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM pour l'upload de fichiers
    const fileUploadInput = document.getElementById('file-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');
    const createNewModelRadio = document.getElementById('create-new-model');
    const addToExistingRadio = document.getElementById('add-to-existing');
    const newModelNameInput = document.getElementById('new-model-name');
    const modelsListContainer = document.getElementById('models-list-container');
    const selectedFilesDisplay = document.getElementById('selected-files');

    // Si les éléments essentiels n'existent pas sur cette page, sortir
    if (!uploadBtn || !fileUploadInput || !uploadStatus) return;

    // Charger la liste des modèles pour l'affichage détaillé
    loadModelsForSettings();

    // Gestionnaire d'événements pour le bouton d'upload
    uploadBtn.addEventListener('click', async () => {
        const files = fileUploadInput.files;
        if (files.length === 0) {
            uploadStatus.textContent = "Veuillez sélectionner au moins un fichier.";
            uploadStatus.className = "error";
            return;
        }

        uploadStatus.textContent = "Upload en cours...";
        uploadStatus.className = "loading";

        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        let url = '/api/upload';

        // Déterminer le modèle cible
        if (createNewModelRadio && createNewModelRadio.checked &&
            newModelNameInput && newModelNameInput.value.trim()) {
            // Créer un nouveau modèle
            url += `?modelId=${encodeURIComponent(newModelNameInput.value.trim())}&append=false`;
        } else {
            // Ajouter au modèle sélectionné
            url += `?modelId=${encodeURIComponent(currentModelId)}&append=true`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log("Upload response:", data);

            if (response.ok) {
                uploadStatus.textContent = "Fichiers uploadés et modèle mis à jour avec succès.";
                uploadStatus.className = "success";

                // Rafraîchir la liste des modèles
                await loadModels();

                // Rafraîchir aussi l'affichage détaillé des modèles
                await loadModelsForSettings();

                // Sélectionner le nouveau modèle si nous venons de le créer
                if (createNewModelRadio && createNewModelRadio.checked &&
                    newModelNameInput && newModelNameInput.value.trim()) {
                    const newModelId = newModelNameInput.value.trim();
                    currentModelId = newModelId;
                    const modelSelect = document.getElementById('model-select');
                    if (modelSelect && modelSelect.querySelector(`option[value="${newModelId}"]`)) {
                        modelSelect.value = newModelId;
                        // Déclencher l'événement change pour mettre à jour l'interface
                        modelSelect.dispatchEvent(new Event('change'));
                    }
                    // Réinitialiser le champ de nom de modèle
                    newModelNameInput.value = '';
                    createNewModelRadio.checked = false;
                    addToExistingRadio.checked = true;

                    // Mettre à jour l'affichage du formulaire
                    const existingModelInfo = document.getElementById('existing-model-info');
                    if (existingModelInfo) {
                        existingModelInfo.style.display = 'block';
                    }
                    newModelNameInput.parentElement.style.display = 'none';
                }

                // Réinitialiser le champ de fichier
                fileUploadInput.value = '';
                if (selectedFilesDisplay) {
                    selectedFilesDisplay.textContent = "Aucun fichier sélectionné";
                }
            } else {
                uploadStatus.textContent = `Erreur lors de l'upload: ${data.status || data.error || 'Erreur inconnue'}`;
                uploadStatus.className = "error";
            }
        } catch (error) {
            console.error("Erreur d'upload:", error);
            uploadStatus.textContent = "Erreur lors de l'upload. Vérifiez la console pour plus de détails.";
            uploadStatus.className = "error";
        }
    });

    // Fonction pour supprimer un modèle
    async function deleteModel(modelId) {
        try {
            // Afficher un indicateur de chargement dans la liste des modèles
            modelsListContainer.innerHTML = '<p>Suppression du modèle en cours...</p>';

            const response = await fetch(`/api/models/${modelId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            console.log("Delete response:", data);

            if (response.ok) {
                // Si le modèle supprimé était le modèle actuellement sélectionné,
                // revenir au modèle par défaut
                if (currentModelId === modelId) {
                    currentModelId = 'default';
                    localStorage.setItem('currentModelId', currentModelId);

                    // Mettre à jour la sélection dans le menu déroulant
                    const modelSelect = document.getElementById('model-select');
                    if (modelSelect) {
                        modelSelect.value = currentModelId;
                        modelSelect.dispatchEvent(new Event('change'));
                    }
                }

                // Afficher un message de succès temporaire
                uploadStatus.textContent = `Modèle "${modelId}" supprimé avec succès.`;
                uploadStatus.className = "success";

                // Effacer le message après 3 secondes
                setTimeout(() => {
                    uploadStatus.textContent = "";
                    uploadStatus.className = "";
                }, 3000);

                // Rafraîchir les listes de modèles
                await loadModels();
                await loadModelsForSettings();
            } else {
                // Afficher l'erreur
                uploadStatus.textContent = data.error || "Erreur lors de la suppression du modèle";
                uploadStatus.className = "error";

                // Recharger la liste des modèles (au cas où)
                await loadModelsForSettings();
            }
        } catch (error) {
            console.error("Erreur lors de la suppression du modèle:", error);
            uploadStatus.textContent = "Erreur lors de la suppression du modèle. Vérifiez la console pour plus de détails.";
            uploadStatus.className = "error";

            // Recharger la liste des modèles (au cas où)
            await loadModelsForSettings();
        }
    }

    // Fonction pour charger la liste des modèles avec plus de détails
    async function loadModelsForSettings() {
        if (!modelsListContainer) return;

        try {

            const response = await fetch('/api/models');
            const data = await response.json();

            if (data.models && data.models.length > 0) {
                modelsListContainer.innerHTML = '';

                data.models.forEach(model => {
                    const modelItem = document.createElement('div');
                    modelItem.classList.add('model-item');

                    // Ajouter une classe spéciale si c'est le modèle actuellement sélectionné
                    if (model.id === currentModelId) {
                        modelItem.classList.add('selected');
                    }

                    const modelInfo = document.createElement('div');
                    modelInfo.classList.add('model-name');
                    modelInfo.textContent = model.name;

                    // Ajouter un badge "Sélectionné" si c'est le modèle actuel
                    if (model.id === currentModelId) {
                        const currentBadge = document.createElement('span');
                        currentBadge.textContent = "Sélectionné";
                        currentBadge.classList.add('current-model-tag');
                        modelInfo.appendChild(currentBadge);
                    }

                    const modelActions = document.createElement('div');
                    modelActions.classList.add('model-actions');

                    // Bouton pour sélectionner le modèle
                    if (model.id !== currentModelId) {
                        const selectBtn = document.createElement('button');
                        selectBtn.textContent = 'Sélectionner';
                        selectBtn.classList.add('select-btn');
                        selectBtn.addEventListener('click', () => {
                            const modelSelect = document.getElementById('model-select');
                            if (modelSelect) {
                                modelSelect.value = model.id;
                                modelSelect.dispatchEvent(new Event('change'));
                            }

                            // Mettre à jour l'interface pour refléter le nouveau modèle sélectionné
                            loadModelsForSettings();
                        });
                        modelActions.appendChild(selectBtn);
                    }

                    // Ne pas permettre de supprimer le modèle par défaut
                    if (model.id !== 'default') {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Supprimer';
                        deleteBtn.classList.add('delete-btn');
                        deleteBtn.addEventListener('click', () => {
                            if (confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${model.name}" ?`)) {
                                deleteModel(model.id);
                            }
                        });
                        modelActions.appendChild(deleteBtn);
                    }

                    modelItem.appendChild(modelInfo);
                    modelItem.appendChild(modelActions);
                    modelsListContainer.appendChild(modelItem);
                });
            } else {
                modelsListContainer.innerHTML = '<p>Aucun modèle disponible</p>';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des modèles pour les paramètres:', error);
            modelsListContainer.innerHTML = '<p>Erreur lors du chargement des modèles</p>';
        }
    }
});