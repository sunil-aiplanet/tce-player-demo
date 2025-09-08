interface ApiConfig {
  baseURL: string;
  withCredentials: boolean;
  timeout: number;
}

const getApiConfig = (): ApiConfig => {
  const environment = import.meta.env.MODE;
  const isDevelopment = environment === "development";

  return {
    baseURL: isDevelopment ? "" : "http://127.0.0.1:8900",
    withCredentials: true,
    timeout: isDevelopment ? 10000 : 15000,
  };
};

export const apiConfig = getApiConfig();
