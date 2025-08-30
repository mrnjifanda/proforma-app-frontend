import apiService from './api.service';

class AuthService {
    login(credentials) {
        return apiService.post('/auth/login', credentials);
    }

    logout() {
        return apiService.post('/auth/logout', true);
    }

    me(storage = {}) {
        return apiService.post('/auth/verify-auth', storage, true);
    }
}

const authService = new AuthService();
export default authService;
