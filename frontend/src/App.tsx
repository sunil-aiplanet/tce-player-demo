import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import TCEPlayer from "./components/TCEPlayer";
import api from "./services/api";

export interface ICookieConfig {
  value: string;
  httponly: boolean;
  max_age: number;
  secure: boolean;
  samesite: "lax" | "strict" | "none";
}

export interface IClientID {
  apiVersion: string;
  sessionTimeout: string;
  clientTimeout: string;
  defaultSchool: string;
  tstamp: number;
}

export interface IToken {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  mode: string;
  tstamp: number;
}

export interface IAsset {
  assetId: string;
  tpId: string;
  lcmsSubjectId?: string | null;
  lcmsGradeId?: string | null;
  title: string;
  mimeType: string;
  assetType: string;
  thumbFileName?: string | null;
  fileName?: string | null;
  ansKeyId?: string | null;
  copyright?: string | null;
  subType?: string | null;
  description?: string | null;
  keywords?: string | null;
  encryptedFilePath?: string | null;
  [k: string]: unknown;
}

export interface IAssetResponse {
  playlistJson: string;
  totalPageCount: number;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error("Axios error:", error.response?.data || error.message);
  } else if (error instanceof Error) {
    console.error("Error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
};

function setCookiesInBrowser(cookies: {
  JSESSIONID: ICookieConfig;
  ctoken: ICookieConfig;
}) {
  for (const [key, config] of Object.entries(cookies)) {
    let cookieStr = `${key}=${config.value}; path=/; max-age=${config.max_age}; samesite=${config.samesite}`;

    if (config.secure) {
      cookieStr += "; secure";
    }

    document.cookie = cookieStr;
  }
}

function App() {
  const [isFetchingClient, setIsFetchingClient] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [isFetchingAssets, setIsFetchingAssets] = useState(false);
  const [client, setClient] = useState<IClientID | null>(null);
  const [token, setToken] = useState<IToken | null>(null);
  const [assets, setAssets] = useState<Array<IAsset>>([]);
  const [selectedAsset, setSelectedAsset] = useState<IAsset | null>(null);

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        setIsFetchingClient(true);
        const response = await api.get<{
          cookies: {
            JSESSIONID: ICookieConfig;
            ctoken: ICookieConfig;
          };
          clientId: IClientID;
        }>("/api/clientid");
        setClient(response.data.clientId);
        console.log("clientId response :", response.data);
        setCookiesInBrowser(response.data.cookies);
        console.log("Cookies after setting:", document.cookie);
      } catch (error: unknown) {
        getErrorMessage(error);
      } finally {
        setIsFetchingClient(false);
      }
    };
    fetchClientId();
  }, []);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsFetchingToken(true);
        const params = new URLSearchParams();
        params.append("school_name", "Azvasa Demo School");
        params.append("role", "Teacher");
        params.append("grant_type", "password");
        params.append("user_name", "sunil");

        const response = await api.post<IToken>("/api/token", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        setToken(response.data);
        console.log("token:", response.data);
      } catch (error: unknown) {
        getErrorMessage(error);
      } finally {
        setIsFetchingToken(false);
      }
    };

    if (client) fetchToken();
  }, [client]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsFetchingAssets(true);
        const ids = [
          "2EEDD094-9067-4BA5-8D34-B63FAC83A80D",
          // "4dd22862-764d-44a1-941a-98329a47f44b",
          "059ac1d8-4076-404c-b325-52f0b0e9b0ab",
          "6EC7A7C1-55A1-4D9E-9271-FF527505BDFC",
          // "29e283ca-f97e-4414-b832-27837aed49db",
          // "64d1764d-b101-42b4-8a9c-0509514cf409",
          "e17048d5-d759-466a-9155-73269d9139a7",
        ];

        const response = await api.get<Array<IAssetResponse>>("/api/assets", {
          params: {
            ids: ids.join(","),
          },
          headers: {
            Authorization: `Bearer ${token?.access_token}`,
          },
        });

        const raw = response.data[0].playlistJson;

        const playlist = JSON.parse(raw);
        setAssets(playlist.asset);
        setSelectedAsset(playlist.asset[0]);

        console.log("assets:", playlist.asset);
      } catch (error: unknown) {
        getErrorMessage(error);
      } finally {
        setIsFetchingAssets(false);
      }
    };

    if (token) {
      fetchAssets();
    }
  }, [token]);

  const expiryTime =
    token?.tstamp || 0 + parseInt(client?.clientTimeout || "0");

  return (
    <div>
      {/* Client */}
      <h2>Client</h2>
      <pre className="response-box">
        {isFetchingClient ? (
          <div className="loader" />
        ) : (
          JSON.stringify(client, null, 2)
        )}
      </pre>

      {/* Token */}
      {!isFetchingClient && !!client && (
        <>
          <h2>Token</h2>
          <pre>
            {isFetchingToken ? (
              <div className="loader" />
            ) : (
              JSON.stringify(token, null, 2)
            )}
          </pre>
        </>
      )}

      {/* Assets */}
      {!isFetchingToken && !!token && (
        <>
          <h2>Assets</h2>
          {isFetchingAssets ? (
            <div className="loader" />
          ) : (
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {assets.map((asset, idx) => (
                <button
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    rowGap: "4px",
                    padding: "8px",
                    cursor: "pointer",
                    backgroundColor:
                      !!selectedAsset &&
                      selectedAsset?.assetId === asset.assetId
                        ? "green"
                        : "",
                    color:
                      !!selectedAsset &&
                      selectedAsset?.assetId === asset.assetId
                        ? "white"
                        : "",
                  }}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <span>Title : {asset.title}</span>
                  <span>MimeType : {asset.mimeType}</span>
                  <span>SubType : {asset.subType}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <>
        {!!client && !!token && assets.length > 0 && (
          <TCEPlayer
            accessToken={token.access_token}
            expiryTime={expiryTime}
            expiresIn={token.expires_in}
            asset={selectedAsset}
          />
        )}
      </>
    </div>
  );
}

export default App;
