// src/services/WordPressService.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export interface WPLogEntry {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  latency?: number;
  success: boolean;
  error?: string;
  payloadSize?: number;
}

type LogListener = (log: WPLogEntry) => void;

class WordPressServiceClass {
  private api: AxiosInstance;
  private tokenKey = 'wp_jwt_token';
  private apiUrlKey = 'VITE_WP_API_URL';
  private logListeners: LogListener[] = [];

  constructor() {
    const baseURL = (import.meta as any).env?.[this.apiUrlKey] || 'https://your-wordpress-site.com/wp-json';
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    // Request interceptor for JWT Auth header
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        (config as any).metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for live SyncLogger telemetry
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const startTime = (response.config as any).metadata?.startTime || Date.now();
        const latency = Date.now() - startTime;
        const logEntry: WPLogEntry = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          method: response.config.method?.toUpperCase() || 'GET',
          url: response.config.url || '',
          status: response.status,
          statusText: response.statusText,
          latency,
          success: true,
          payloadSize: JSON.stringify(response.data || '').length,
        };
        this.notifyListeners(logEntry);
        return response;
      },
      (error: AxiosError) => {
        const startTime = (error.config as any)?.metadata?.startTime || Date.now();
        const latency = Date.now() - startTime;
        const logEntry: WPLogEntry = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          method: error.config?.method?.toUpperCase() || 'UNKNOWN',
          url: error.config?.url || '',
          status: error.response?.status,
          statusText: error.response?.statusText || error.message,
          latency,
          success: false,
          error: error.response?.data ? JSON.stringify(error.response.data) : error.message,
        };
        this.notifyListeners(logEntry);
        return Promise.reject(error);
      }
    );
  }

  public subscribe(listener: LogListener) {
    this.logListeners.push(listener);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(log: WPLogEntry) {
    this.logListeners.forEach((l) => {
      try {
        l(log);
      } catch {}
    });
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  public setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  public clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
    }
  }

  // --- Authentication & Health ---
  async login(username: string, password: string) {
    const res = await this.api.post('/jwt-auth/v1/token', { username, password });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async validateToken() {
    try {
      const res = await this.api.post('/jwt-auth/v1/token/validate');
      return res.data;
    } catch (err) {
      this.clearToken();
      throw err;
    }
  }

  async checkHealth() {
    const res = await this.api.get('/');
    return res.data;
  }

  // --- MySQL-backed Logo / Asset Sync Operations ---
  async getLogo(assetId: string) {
    try {
      const res = await this.api.get(`/mahash/v1/assets/${assetId}`);
      return res.data;
    } catch {
      return null;
    }
  }

  async saveLogo(assetId: string, logoData: string, category: string = 'logo', assetName: string = '') {
    const res = await this.api.post(`/mahash/v1/assets/${assetId}`, {
      asset_id: assetId,
      logo_data: logoData,
      category,
      asset_name: assetName,
      updated_at: new Date().toISOString(),
    });
    return res.data;
  }

  async deleteLogo(assetId: string) {
    const res = await this.api.delete(`/mahash/v1/assets/${assetId}`);
    return res.data;
  }

  // --- MySQL-backed Reports CRUD Operations ---
  async getReports(page = 1, perPage = 10) {
    const res = await this.api.get(`/wp/v2/posts?page=${page}&per_page=${perPage}&_embed`);
    return res.data;
  }

  async createReport(title: string, content: string, status: 'publish' | 'draft' = 'publish') {
    const res = await this.api.post('/wp/v2/posts', { title, content, status });
    return res.data;
  }

  async updateReport(id: number, updates: any) {
    const res = await this.api.post(`/wp/v2/posts/${id}`, updates);
    return res.data;
  }

  async deleteReport(id: number) {
    const res = await this.api.delete(`/wp/v2/posts/${id}`);
    return res.data;
  }

  // --- MySQL-backed Media Operations ---
  async getMedia(page = 1, perPage = 50) {
    const res = await this.api.get(`/wp/v2/media?page=${page}&per_page=${perPage}`);
    return res.data;
  }

  async uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.api.post('/wp/v2/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }

  async cleanupDuplicates() {
    const res = await this.api.post('/wp/media/cleanup-duplicates');
    return res.data;
  }
}

export const WordPressService = new WordPressServiceClass();
