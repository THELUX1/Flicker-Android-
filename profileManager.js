class ProfileManager {
    constructor() {
        this.profiles = JSON.parse(localStorage.getItem('profiles')) || [];
        this.currentProfileId = localStorage.getItem('currentProfileId') || null;
        this.editingProfileId = null;
        this.currentAvatar = '';
        this.profileChangeCallbacks = [];
    }

    saveProfiles() {
        localStorage.setItem('profiles', JSON.stringify(this.profiles));
    }

    addProfile(name, avatar) {
        const newProfile = {
            id: Date.now().toString(),
            name,
            avatar,
            createdAt: new Date().toISOString()
        };
        this.profiles.push(newProfile);
        this.saveProfiles();
        if (this.profiles.length === 1) {
            this.setCurrentProfile(newProfile.id);
        }
        return newProfile;
    }

    updateProfile(id, name, avatar) {
        const profile = this.profiles.find(p => p.id === id);
        if (profile) {
            profile.name = name;
            profile.avatar = avatar;
            this.saveProfiles();
            this.notifyProfileChange();
            return true;
        }
        return false;
    }

    deleteProfile(id) {
        this.profiles = this.profiles.filter(p => p.id !== id);
        this.saveProfiles();
        if (id === this.currentProfileId) {
            this.currentProfileId = this.profiles.length > 0 ? this.profiles[0].id : null;
            localStorage.setItem('currentProfileId', this.currentProfileId);
            this.notifyProfileChange();
        }
        this.clearProfileData(id);
    }

    setCurrentProfile(id) {
        this.currentProfileId = id;
        localStorage.setItem('currentProfileId', id);
        this.notifyProfileChange();
    }

    getCurrentProfile() {
        return this.profiles.find(p => p.id === this.currentProfileId) || null;
    }

    getProfileData(key) {
        const profile = this.getCurrentProfile();
        if (!profile) return null;
        const profileKey = `profile_${profile.id}_${key}`;
        return localStorage.getItem(profileKey);
    }

    setProfileData(key, value) {
        const profile = this.getCurrentProfile();
        if (!profile) return;
        const profileKey = `profile_${profile.id}_${key}`;
        localStorage.setItem(profileKey, value);
        this.notifyProfileChange();
    }

    clearProfileData(profileId) {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`profile_${profileId}_`)) {
                localStorage.removeItem(key);
            }
        });
    }

    onProfileChange(callback) {
        this.profileChangeCallbacks.push(callback);
    }

    notifyProfileChange() {
        this.profileChangeCallbacks.forEach(callback => callback());
    }
}

const profileManager = new ProfileManager();

export { profileManager };