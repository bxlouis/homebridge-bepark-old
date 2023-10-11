const fetch = require('node-fetch');

const API_BASE_URL = 'https://api-v3.bepark.eu';

class BeParkGarageDoor {
    constructor(log, config) {
        this.log = log;
        this.name = config.name;
        this.username = config.username;
        this.password = config.password;
        this.client_secret = config.client_secret;
        this.autoCloseDuration = config.autoCloseDuration;
    }

    async authenticate() {
        return this.performRequest('/oauth/token', 'POST', {
            grant_type: 'password',
            client_id: 3,
            client_secret: this.client_secret,
            username: this.username,
            password: this.password
        });
    }

    async refreshToken() {
        return this.performRequest('/oauth/token', 'POST', {
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
            client_id: 3,
            client_secret: this.client_secret
        });
    }

    async getUserDetails() {
        return this.performRequest('/api/v3/user/by-token');
    }

    async getGateDetails() {
        return this.performRequest(`/api/v3/user/${this.user_id}/access`);
    }

    async openDoor() {
        const params = `coordinate%5Blat%5D=${this.latitude}&coordinate%5Blng%5D=${this.longitude}&pedestrian=1&purchase_id=${this.purchase_id}&user_id=${this.user_id}&way=pedestrian`;
        return this.performRequest(`/api/v3/gate/${this.gate_id}/open?${params}`, 'POST');
    }

    async performRequest(endpoint, method = 'GET', body = null) {
        await this.ensureAuthenticated();
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : null
        });
        
        return response.json();
    }

    async ensureAuthenticated() {
        if (!this.accessToken || Date.now() >= this.expiresIn) {
            const authData = await this.authenticate();
            this.setAuthData(authData);
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-localization': 'en',
            'Accept': 'application/json',
            'User-Agent': 'BePark/3.1.6 (com.bepark.iphone; build:1; iOS 17.0.3) Alamofire/4.8.1',
            'Accept-Language': 'en-US;q=1.0, fr-BE;q=0.9',
            'Accept-Encoding': 'gzip;q=1.0, compress;q=0.5'
        };
        
        if (this.accessToken) {
            headers['Authorization'] = `${this.tokenType} ${this.accessToken}`;
        }
        
        return headers;
    }

    setAuthData(data) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenType = data.token_type;
        this.expiresIn = Date.now() + (data.expires_in * 1000 - 60000);  // 60 seconds buffer
    }
}

module.exports = BeParkGarageDoor;
