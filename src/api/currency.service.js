import apiService from './api.service';

class CurrencyService {
    create(data) {
        return apiService.post('/app/currency/create', data);
    }

    getAll(params = {}) {

        if ('ids' in params && params.ids.length > 0) {
            const ids = params.ids.map(currency => currency._id).join(",");
            params.ids = ids;
        }

        return apiService.get('/app/currency/finds', params);
    }

    getById(id) {
        return apiService.get(`/app/currency/finds/${id}`);
    }
}

const currencyService = new CurrencyService();
export default currencyService;
