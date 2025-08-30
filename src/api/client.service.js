import apiService from './api.service';

class ClientService {
    create(data) {
        return apiService.post('/app/client/create', data);
    }

    getAll(params) {
        return apiService.get('/app/client/finds', params);
    }

    getById(id) {
        return apiService.get(`/app/client/finds/${id}`);
    }

    update(id, data) {
        return apiService.put(`/app/client/update/${id}`, data);
    }

    delete(id) {
        return apiService.delete(`/app/client/delete/${id}`);
    }
}

const clientService = new ClientService();
export default clientService;
