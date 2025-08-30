import apiService from './api.service';

class PanierService {
    create(data) {
        return apiService.post('/app/panier/create', data);
    }

    getAll(params) {
        return apiService.get('/app/panier/finds', params);
    }

    getIds() {
        return apiService.get('/app/panier/get-ids');
    }

    getById(id) {
        return apiService.get(`/app/panier/finds/${id}`);
    }

    update(id, data) {
        return apiService.put(`/app/panier/update/${id}`, data);
    }

    saveUpdate(id, data) {
        return apiService.put(`/app/panier/save-update/${id}`, data);
    }

    delete(id) {
        return apiService.delete(`/app/panier/delete/${id}`);
    }

    addLigne(panierId, produitId, quantite) {
        return apiService.post(`/app/panier/add-ligne/${panierId}`, {
            produitId, quantite
        });
    }
}

const panierService = new PanierService();
export default panierService;