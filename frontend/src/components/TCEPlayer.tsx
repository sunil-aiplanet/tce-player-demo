/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useCallback, useEffect, useState, useRef } from "react";
import type { IAsset } from "../App";

const TCEPlayer = ({
  accessToken,
  expiryTime,
  expiresIn,
  asset,
}: {
  accessToken: string;
  expiryTime: number;
  expiresIn: number;
  asset: IAsset | null;
}) => {
  const environment = import.meta.env.MODE;
  const isDevelopment = environment === "development";

  const [isResourcesLoaded, setIsResourcesLoaded] = useState(false);
  const [_isPlayerInitialized, setIsPlayerInitialized] = useState(false);

  const playerContainerRef = useRef(null);
  const tcePlayerIdRef = useRef(null);
  const angularReferenceRef = useRef(null);
  const isPlayerInitializedRef = useRef(false);

  const loadScript = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }, []);

  const loadStyle = useCallback((href: string) => {
    return new Promise<void>((resolve, reject) => {
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (existingLink) {
        resolve();
        return;
      }
      const link = document.createElement("link");
      link.href = href;
      link.rel = "stylesheet";
      link.onload = () => resolve();
      link.onerror = () => reject();
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      try {
        console.log("Loading TCE Player resources...");

        console.log("Loading styles...");
        await loadStyle(`/tceplayer-two/styles.css`);

        console.log("Loading resizePlayer script...");
        await loadScript(
          `/tceplayer-two/assets/tcemedia/external/player-html/player/js/shell/common/resizePlayer.js`
        );

        console.log("Loading tce-player-hybrid script...");
        await loadScript(`/tceplayer-two/tce-player-hybrid.js`);

        console.log("All resources loaded successfully");

        setIsResourcesLoaded(true);
      } catch (error) {
        console.error("Failed to load TCE Player resources:", error);
      }
    };

    loadResources();
  }, [loadScript, loadStyle]);

  const handleLoadPlayer = useCallback(
    (event: { detail: unknown }) => {
      console.log("loadplayer event received!", event);

      const playerId = event.detail;
      console.log("Player ID:", playerId);

      if (
        tcePlayerIdRef.current === playerId &&
        isPlayerInitializedRef.current
      ) {
        console.log("Player already initialized, skipping...");
        return;
      }

      tcePlayerIdRef.current = playerId;

      const configData = {
        detail: {
          tcePlayerId: playerId,
          resourceData: asset,
          iFrameCss: {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "993px",
            height: "610px",
            overflowX: "hidden",
            overflowY: "hidden",
          },
          baseUrl: isDevelopment ? "" : "https://ce-dev-azvasa.devstudi.com",
          gateway: "",
          minEraserArea: 50,
        },
      };

      const angularReference = window.angularReference?.[playerId];

      angularReferenceRef.current = angularReference;

      const zone = angularReference.zone;

      // Configure player
      zone.run(() => {
        angularReference.tceplayerTokenFn({
          detail: {
            access_token: accessToken,
            access_token_expiry_time: expiryTime,
            access_token_gen_time: expiresIn,
          },
        });

        angularReference.tceplayerConfigFn({
          detail: {
            ...configData.detail,
            minEraserArea: 10000000000,
          },
        });
      });

      // Initialize player
      zone.run(() => {
        const subscription = angularReference.tcePlayerLoadedFn().subscribe({
          next: () => {
            console.log("TCE Player loaded and ready!");
            isPlayerInitializedRef.current = true;
            setIsPlayerInitialized(true);
          },
          error: (error) => {
            console.error("TCE Player loading error:", error);
          },
        });

        // Store subscription for cleanup
        angularReferenceRef.current.subscription = subscription;

        console.log("Calling angularReference.tceplayerInitFn()");
        angularReference.tceplayerInitFn();
      });
    },
    [accessToken, expiresIn, expiryTime, asset]
  );

  useEffect(() => {
    if (!isResourcesLoaded || !playerContainerRef.current) return;

    const container = playerContainerRef.current;

    // Clear existing content
    container.innerHTML = "";

    let tcePlayerElement = null;

    console.log("Creating TCE Player element...");

    // Create tce-player element
    tcePlayerElement = document.createElement("tce-player");

    console.log("TCE Player element created:", tcePlayerElement);

    // Add event listener
    tcePlayerElement.addEventListener("loadplayer", handleLoadPlayer);

    // Append to container
    container.appendChild(tcePlayerElement);

    console.log("TCE Player element appended to container");

    return () => {
      console.log("Cleaning up TCE Player...");

      if (tcePlayerElement) {
        tcePlayerElement.removeEventListener("loadplayer", handleLoadPlayer);
      }

      // Clear container
      if (container) {
        container.innerHTML = "";
      }

      if (angularReferenceRef.current?.subscription) {
        angularReferenceRef.current.subscription.unsubscribe();
      }
    };
  }, [isResourcesLoaded, handleLoadPlayer]);

  return (
    <div
      style={{
        position: "relative",
        minWidth: "80vw",
        backgroundColor: "transparent",
        width: "80vw",
        margin: "0 1vw",
        height: "calc(100vh - 100px)",
        overflow: "hidden",
      }}
    >
      <div
        id="parentId"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <div ref={playerContainerRef} className="absolute w-[993px]" />
      </div>
    </div>
  );
};

export default TCEPlayer;
