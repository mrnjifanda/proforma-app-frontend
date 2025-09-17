import apiService from './api.service';

class EntrepriseService {
    getById(id) {
        return apiService.get(`/app/entreprise/finds/${id}`);
    }

    update(id, data) {
        return apiService.put(`/app/entreprise/update/${id}`, data);
    }
}

const entrepriseService = new EntrepriseService();
export default entrepriseService;
