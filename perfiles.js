import { profileManager } from './profileManager.js';

// Configuración de avatares predeterminados
const defaultAvatars = [
    'https://i.pinimg.com/736x/a6/5b/31/a65b3103f4cf5b197dcae3683cba2980.jpg',
    'https://i.pinimg.com/736x/85/24/ff/8524ff446cca05ff14b9fbff861e1677.jpg',
    'https://i.pinimg.com/564x/23/cc/a5/23cca59c25e4561e02e4d9ae584c2c82.jpg',
    'https://i.pinimg.com/474x/01/04/51/01045145873eaac669d5e9bb400d703d.jpg',
    'https://i.pinimg.com/736x/3a/b8/66/3ab86626ef6f8c0173648136100dc333.jpg',
    'https://i.pinimg.com/736x/bf/7d/c3/bf7dc3c03265aab4c2929c0306b7856e.jpg',
    'https://i.pinimg.com/236x/33/99/00/339900e41301a012bf525ed40327e298.jpg',
    'https://i.pinimg.com/736x/e4/f2/8c/e4f28c9baf24be08806da05294db1399.jpg',
    'https://i.pinimg.com/736x/9b/e6/45/9be645c8322c99cde6559ac3d11be457.jpg',
    'https://i.pinimg.com/736x/04/14/45/041445926fea15d45e76d673310964e8.jpg',
    'https://i.pinimg.com/474x/c6/8c/3e/c68c3e51a317b9d3a660ac02470d758a.jpg',
    'https://i.pinimg.com/736x/32/26/6d/32266d06aa2c93e951c2f10c19bc888d.jpg',
    'https://i.pinimg.com/736x/83/83/01/838301e705a30554b6fc68ef7f5f62b4.jpg',
    'https://i.pinimg.com/736x/99/fc/79/99fc799b715d93570c4f4d4afb5431c1.jpg',
    'https://i.pinimg.com/736x/2d/75/d4/2d75d4083c6f76291ae8c6ae7b2608b3.jpg',
    'https://i.pinimg.com/564x/34/e2/d2/34e2d2ae44a7ba46a984c968536472e0.jpg',
    'https://i.pinimg.com/736x/0b/9f/19/0b9f194824fe70d5822bc38beb4e2c87.jpg',
    'https://i.pinimg.com/736x/0f/ee/5f/0fee5f303f9d4fdd2b62bd8b143fde60.jpg',
    'https://i.pinimg.com/736x/7b/7f/23/7b7f235d2b80198672c12eb541e1ffe2.jpg',
    'https://i.pinimg.com/736x/47/ad/4f/47ad4f8c398d83bc6c4c8abb9df08276.jpg'
];

// Estado global optimizado
const state = {
    selectedAvatarUrl: '',
    isDefaultAvatarSelected: false,
    dom: {
        profileModal: null,
        importFileInput: null,
        loadingSpinner: null,
        addProfileBtn: null,
        importBtn: null
    },
    cache: {
        avatarsLoaded: false,
        modalInitialized: false
    }
};

// Precargar imágenes
function preloadImages(urls) {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Mostrar/ocultar spinner
function toggleLoading(show) {
    state.dom.loadingSpinner?.classList.toggle('active', show);
}

// Mostrar toast de notificación
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Cargar avatares predeterminados
async function loadDefaultAvatars() {
    if (!state.cache.avatarsLoaded) {
        preloadImages(defaultAvatars);
        state.cache.avatarsLoaded = true;
    }

    const avatarsGrid = document.getElementById('avatars-grid');
    if (!avatarsGrid) return;

    avatarsGrid.innerHTML = '';
    
    defaultAvatars.forEach(avatarUrl => {
        const avatarOption = document.createElement('div');
        avatarOption.className = 'avatar-option';
        avatarOption.innerHTML = `<img src="${avatarUrl}" alt="Avatar" loading="lazy">`;
        
        avatarOption.addEventListener('click', function() {
            document.querySelectorAll('.avatar-option').forEach(el => {
                el.classList.remove('selected');
            });
            
            this.classList.add('selected');
            state.selectedAvatarUrl = avatarUrl;
            state.isDefaultAvatarSelected = true;
            hideError('avatar-error');
            
            document.getElementById('avatar-preview').innerHTML = 
                `<img src="${avatarUrl}" alt="Preview">`;
        });
        
        avatarsGrid.appendChild(avatarOption);
    });
}

// Mostrar/ocultar errores
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.remove('show');
}

// Verificar si el nombre de perfil existe
function profileNameExists(name) {
    return profileManager.profiles.some(
        profile => profile.name.toLowerCase() === name.toLowerCase()
    );
}

// Renderizar perfiles
function renderProfiles() {
    const profilesGrid = document.getElementById('profiles-grid');
    if (!profilesGrid) return;
    
    profilesGrid.innerHTML = '';
    
    profileManager.profiles.forEach(profile => {
        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card';
        profileCard.innerHTML = `
            <div class="profile-avatar">
                <img src="${profile.avatar}" alt="${profile.name}">
            </div>
            <h3 class="profile-name">${profile.name}</h3>
            <div class="profile-actions">
                <button class="edit-profile" data-id="${profile.id}">✏️</button>
                <button class="delete-profile" data-id="${profile.id}">🗑️</button>
            </div>
        `;
        
        profileCard.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-actions')) {
                profileManager.setCurrentProfile(profile.id);
                window.location.href = 'index.html';
            }
        });
        
        profileCard.querySelector('.edit-profile')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditProfileModal(profile.id);
        });
        
        profileCard.querySelector('.delete-profile')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(profile.id);
        });
        
        profilesGrid.appendChild(profileCard);
    });
}

// Abrir modal de edición
function openEditProfileModal(profileId) {
    const profile = profileManager.profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    profileManager.editingProfileId = profileId;
    document.getElementById('modal-title').textContent = 'Editar Perfil';
    document.getElementById('profile-name').value = profile.name;
    
    state.selectedAvatarUrl = profile.avatar;
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
        avatarPreview.innerHTML = `<img src="${profile.avatar}" alt="Preview">`;
    }
    
    const isDefault = defaultAvatars.includes(profile.avatar);
    if (isDefault) {
        document.getElementById('default-avatars-btn')?.click();
        setTimeout(() => {
            const avatarOptions = document.querySelectorAll('.avatar-option');
            avatarOptions.forEach(option => {
                if (option.querySelector('img')?.src === profile.avatar) {
                    option.click();
                }
            });
        }, 0);
    } else {
        document.getElementById('custom-avatar-btn')?.click();
    }
    
    if (state.dom.profileModal) {
        state.dom.profileModal.style.display = 'flex';
        state.dom.profileModal.classList.add('active');
    }
}

// Mostrar confirmación de eliminación
function showDeleteConfirmation(profileId) {
    const confirmModal = document.getElementById('confirm-modal');
    if (!confirmModal) return;
    
    confirmModal.style.display = 'flex';
    
    document.getElementById('confirm-yes').onclick = () => {
        profileManager.deleteProfile(profileId);
        confirmModal.style.display = 'none';
        renderProfiles();
    };
    
    document.getElementById('confirm-no').onclick = () => {
        confirmModal.style.display = 'none';
    };
}

// Exportar datos
async function exportData() {
    toggleLoading(true);
    
    try {
        // 1. Preparar datos para exportar
        const dataToExport = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            dataToExport[key] = localStorage.getItem(key);
        }
        
        // 2. Crear el archivo JSON con cabecera de descarga
        const jsonData = JSON.stringify(dataToExport, null, 2);
        const fileName = `flicker_backup_${new Date().toISOString().split('T')[0]}.json`;
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 3. Crear iframe invisible para forzar descarga
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        // 4. Crear enlace como respaldo
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // 5. Limpieza después de la descarga
        setTimeout(() => {
            document.body.removeChild(a);
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            showToast('<i class="fas fa-check-circle"></i> Descarga iniciada');
        }, 1000);
        
    } catch (error) {
        console.error('Error en exportación:', error);
        showToast('<i class="fas fa-exclamation-triangle"></i> Error al exportar datos', 'error');
    } finally {
        toggleLoading(false);
    }
}

// Importar datos
function importData() {
    state.dom.importFileInput.click();

    state.dom.importFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        toggleLoading(true);
       
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                showImportConfirmation(importedData);
            } catch (error) {
                showToast('<i class="fas fa-exclamation-triangle"></i> Error: Archivo no válido', 'error');
                console.error('Error al importar:', error);
            } finally {
                toggleLoading(false);
            }
        };
        reader.readAsText(file);
    };
}

// Mostrar confirmación de importación
function showImportConfirmation(importedData) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'import-confirm-overlay';
    modalOverlay.innerHTML = `
        <div class="import-confirm-modal">
            <div class="import-confirm-message">
                <i class="fas fa-exclamation-triangle" style="color: var(--accent); font-size: 2rem; margin-bottom: 1rem;"></i>
                <div>¿Importar datos de respaldo?</div>
                <small>Esta acción sobrescribirá <strong>todos</strong> los perfiles y configuraciones actuales. Esta operación no se puede deshacer.</small>
            </div>
            <div class="import-confirm-buttons">
                <button id="import-confirm-yes" class="import-confirm-btn import-confirm-yes">
                     Confirmar
                </button>
                <button id="import-confirm-no" class="import-confirm-btn import-confirm-no">
                     Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Bloquear el scroll del cuerpo
    document.body.style.overflow = 'hidden';
    
    document.getElementById('import-confirm-yes').onclick = () => {
        modalOverlay.innerHTML = `
            <div class="import-confirm-modal">
                <div class="import-confirm-message">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent); margin-bottom: 1rem;"></i>
                    <div>Importando datos...</div>
                    <small>Por favor, no cierres la página</small>
                </div>
            </div>
        `;
        
        // Proceso de importación con retraso para mejor UX
        setTimeout(() => {
            try {
                localStorage.clear();
                Object.keys(importedData).forEach(key => {
                    localStorage.setItem(key, importedData[key]);
                });
                
                modalOverlay.innerHTML = `
                    <div class="import-confirm-modal">
                        <div class="import-confirm-message">
                            <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--accent); margin-bottom: 1rem;"></i>
                            <div>¡Datos importados con éxito!</div>
                            <small>La página se recargará automáticamente</small>
                        </div>
                    </div>
                `;
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                modalOverlay.innerHTML = `
                    <div class="import-confirm-modal">
                        <div class="import-confirm-message">
                            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                            <div>Error al importar datos</div>
                            <small>${error.message}</small>
                        </div>
                        <button id="import-confirm-close" class="import-confirm-btn import-confirm-no" style="margin-top: 1.5rem;">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                `;
                
                document.getElementById('import-confirm-close').onclick = () => {
                    modalOverlay.style.animation = 'fadeIn 0.3s ease-out reverse';
                    setTimeout(() => {
                        modalOverlay.remove();
                        document.body.style.overflow = '';
                    }, 300);
                };
            }
        }, 500);
    };
    
    document.getElementById('import-confirm-no').onclick = () => {
        modalOverlay.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => {
            modalOverlay.remove();
            document.body.style.overflow = '';
        }, 300);
    };
}

// Mostrar modal de nuevo perfil
function showProfileModal() {
    if (!state.cache.modalInitialized) {
        initializeModal();
        state.cache.modalInitialized = true;
    }

    profileManager.editingProfileId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Perfil';
    document.getElementById('profile-name').value = '';
    document.getElementById('avatar-preview').innerHTML = '';
    state.selectedAvatarUrl = '';
    state.isDefaultAvatarSelected = false;
    
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(el => el.classList.remove('selected'));
    
    document.getElementById('avatar-input').value = '';
    hideError('name-error');
    hideError('avatar-error');
    
    state.dom.profileModal.style.display = 'flex';
    setTimeout(() => {
        state.dom.profileModal.classList.add('active');
    }, 10);
    
    // Cargar avatares en segundo plano
    requestIdleCallback(() => {
        loadDefaultAvatars();
    });
}

// Inicializar modal
function initializeModal() {
    const profileModal = state.dom.profileModal;
    if (!profileModal) return;

    // Configurar eventos del modal
    document.getElementById('default-avatars-btn')?.addEventListener('click', function() {
        document.getElementById('default-avatars-section').style.display = 'block';
        document.getElementById('custom-avatar-section').style.display = 'none';
        this.classList.add('active');
        document.getElementById('custom-avatar-btn').classList.remove('active');
        state.isDefaultAvatarSelected = false;
        state.selectedAvatarUrl = '';
        document.getElementById('avatar-preview').innerHTML = '';
        hideError('avatar-error');
        loadDefaultAvatars();
    });
    
    document.getElementById('custom-avatar-btn')?.addEventListener('click', function() {
        document.getElementById('default-avatars-section').style.display = 'none';
        document.getElementById('custom-avatar-section').style.display = 'block';
        this.classList.add('active');
        document.getElementById('default-avatars-btn').classList.remove('active');
        state.isDefaultAvatarSelected = false;
    });
    
    document.getElementById('avatar-input')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                state.selectedAvatarUrl = event.target.result;
                document.getElementById('avatar-preview').innerHTML = 
                    `<img src="${state.selectedAvatarUrl}" alt="Preview">`;
                hideError('avatar-error');
            };
            reader.readAsDataURL(file);
        }
    });
    
    document.getElementById('profile-name')?.addEventListener('input', function() {
        hideError('name-error');
    });
    
    document.getElementById('modal-confirm')?.addEventListener('click', function() {
        const profileName = document.getElementById('profile-name').value.trim();
        let isValid = true;
        
        if (!profileName) {
            showError('name-error', 'Por favor ingresa un nombre para el perfil');
            isValid = false;
        } else if (profileNameExists(profileName) && !profileManager.editingProfileId) {
            showError('name-error', 'Ya existe un perfil con este nombre');
            isValid = false;
        }
        
        if (!state.selectedAvatarUrl) {
            showError('avatar-error', 'Por favor selecciona un avatar');
            isValid = false;
        }
        
        if (!isValid) return;
        
        if (profileManager.editingProfileId) {
            profileManager.updateProfile(profileManager.editingProfileId, profileName, state.selectedAvatarUrl);
        } else {
            profileManager.addProfile(profileName, state.selectedAvatarUrl);
        }
        
        profileModal.style.display = 'none';
        renderProfiles();
    });
    
    document.getElementById('modal-cancel')?.addEventListener('click', function() {
        profileModal.style.display = 'none';
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Cachear elementos del DOM
    state.dom = {
        profileModal: document.getElementById('profile-modal'),
        importFileInput: document.getElementById('import-file-input'),
        loadingSpinner: document.getElementById('loading-spinner'),
        addProfileBtn: document.getElementById('add-profile-btn'),
        importBtn: document.getElementById('import-data-btn')
    };

    // Precargar recursos
    preloadImages(defaultAvatars);
    loadDefaultAvatars();

    // Asignar eventos
    state.dom.addProfileBtn?.addEventListener('click', showProfileModal);
    state.dom.importBtn?.addEventListener('click', importData);
    document.getElementById('export-data-btn')?.addEventListener('click', exportData);

    // Renderizar perfiles
    renderProfiles();
});