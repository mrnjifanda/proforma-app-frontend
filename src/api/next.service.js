import apiService from './api.service';

class NextService {

    getIds(model) {
        return apiService.get(`/welcom/get-ids/${model}`);
    }
}

const nextService = new NextService();
export default nextService;
