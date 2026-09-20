import { useEffect, useRef } from "react";
import { createEditorSocket } from "../services/wsService";

export default function useWebSocket(projectId, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    try {
      const client = createEditorSocket(projectId, onMessage);
      socketRef.current = client;
    } catch {
      // Ignore websocket connect errors in fallback mode
    }

    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.deactivate();
        } catch {
          // ignore
        }
      }
    };
  }, [projectId, onMessage]);

  return socketRef;
}
