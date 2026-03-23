import { useEffect, useRef } from "react";
import { createEditorSocket } from "../services/wsService";

export default function useWebSocket(projectId, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    socketRef.current = createEditorSocket(projectId, onMessage);
    return () => {
      socketRef.current?.deactivate();
      socketRef.current = null;
    };
  }, [projectId, onMessage]);

  return socketRef;
}
