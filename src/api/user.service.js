import apiService from './api.service';

class UserService {

    getById(id) {
        return apiService.get(`/app/user/finds/${id}`);
    }

    update(id, data) {
        return apiService.put(`/app/user/update/${id}`, data);
    }

    changePassword(id, data) {
        return apiService.put(`/app/user/change-password/${id}`, data);
    }
}

const userService = new UserService();
export default userService;
