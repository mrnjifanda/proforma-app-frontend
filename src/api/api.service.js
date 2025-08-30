import axios from 'axios';
import { AUTH_STORAGE_KEY } from '@/utils/constants'

class ApiService {

    constructor(baseURL, apiKey) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.client.interceptors.request.use((config) => {
            if (apiKey) {
                config.headers['X-API-KEY'] = apiKey;
            }
            return config;
        }, (error) => Promise.reject(error));
    }

    isBrowser() {
        return typeof window !== 'undefined';
    }

    getAuth() {
        try {
            if (this.isBrowser()) {
                const data = localStorage.getItem(AUTH_STORAGE_KEY);
                if (data) {
                    return JSON.parse(data);
                }
            }
        } catch (error) {
            console.log('Failed to parse auth data:', error);
        }
        return null;
    }

    getToken() {

        const auth = this.getAuth();
        if (auth && "token" in auth) {
            return auth.token;
        }

        return null;
    }

    getAuthorization() {
        const token = this.getToken();
        return { Authorization: (token ? 'Bearer ' + token : undefined) };
    }

    get(url, params = {}, useToken = true) {
        const headers = useToken ? this.getAuthorization() : {};
        return this.client.get(url, { params, headers });
    }

    post(url, data, useToken = true) {
        const headers = useToken ? this.getAuthorization() : {};
        return this.client.post(url, data, { headers });
    }

    put(url, data, useToken = true) {
        const headers = useToken ? this.getAuthorization() : {};
        return this.client.put(url, data, { headers });
    }

    delete(url, useToken = true) {
        const headers = useToken ? this.getAuthorization() : {};
        return this.client.delete(url, { headers });
    }
}

const apiService = new ApiService(process.env.NEXT_PUBLIC_API_BASE_URL, process.env.NEXT_PUBLIC_API_KEY);

export default apiService;