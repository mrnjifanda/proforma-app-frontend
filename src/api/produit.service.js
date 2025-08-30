import apiService from './api.service';

class ProduitService {
    create(data) {
        return apiService.post('/app/produit/create', data);
    }

    getAll(params) {
        return apiService.get('/app/produit/finds', params);
    }

    getById(id) {
        return apiService.get(`/app/produit/finds/${id}`);
    }

    update(id, data) {
        return apiService.put(`/app/produit/update/${id}`, data);
    }

    delete(id) {
        return apiService.delete(`/app/produit/delete/${id}`);
    }
}

const produitService = new ProduitService();
export default produitService;
