
class OciObjectStorageService {

    public async getFile(url: string, fileName: string): Promise<any> {
        try {
            const response = await fetch(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Convert the response to a Blob
            const blob = await response.blob();

            // Create a File object from the Blob
            const file = new File([blob], fileName, { type: response.headers.get('Content-Type') || '' });

            return file;
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    }

    public async putFile(url: string, file: File): Promise<any> {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                body: file
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response;
        } catch (error) {
            console.error('PUT request failed:', error);
            throw error;
        }
    }
}

const ociObjectStorageService = new OciObjectStorageService();
export default ociObjectStorageService;