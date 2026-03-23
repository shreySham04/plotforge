package com.writerapp.websocket;

import java.time.LocalDateTime;

import org.springframework.lang.NonNull;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CollaborationController {

    @MessageMapping("/project/{projectId}/edit")
    @SendTo("/topic/project/{projectId}")
    public com.writerapp.websocket.EditorMessage broadcastEdit(
            @DestinationVariable @NonNull Long projectId,
            @NonNull com.writerapp.websocket.EditorMessage message
    ) {
        message.setProjectId(projectId);
        if (message.getMessageType() == null || message.getMessageType().isBlank()) {
            message.setMessageType("EDIT");
        }
        if (message.getEditedBy() == null || message.getEditedBy().isBlank()) {
            message.setEditedBy("collaborator");
        }
        message.setUpdatedAt(LocalDateTime.now());
        return message;
    }
}
