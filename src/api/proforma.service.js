import apiService from './api.service';

class ProformaService {

    create(data, force = false) {
        return apiService.post(`/app/proforma/create?force=${force}`, data);
    }

    getAll(params = {}) {
        return apiService.get('/app/proforma/finds', params);
    }

    generatePDF(id) {
        return apiService.post(`/app/proforma/generate-pdf/${id}`);
    }

    delete(id) {
        return apiService.delete(`/app/proforma/delete/${id}`);
    }

    async downloadPDF(pdfUrl, filename) {

        try {
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }

            const blob = await response.blob();

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'proforma.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            throw new Error('Erreur lors du téléchargement: ' + error.message);
        }
    }

    update(id, data) {
        return apiService.put(`/app/proforma/update/${id}`, data);
    }

    sendMail(id) {
        return apiService.post(`/app/proforma/send-mail/${id}`);
    }


    getById(id) {
        return apiService.get(`/app/proforma/finds/${id}`);
    }
}

const proformaService = new ProformaService();
export default proformaService;
