package com.writerapp.websocket;

import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageBrokerService {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishProjectUpdate(@NonNull Long projectId, @NonNull EditorMessage message) {
        messagingTemplate.convertAndSend("/topic/project/" + projectId, Objects.requireNonNull(message));
    }
}
