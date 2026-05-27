package com.writerapp.websocket;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class EditorMessage {
    private Long projectId;
    private Integer sectionNumber;
    private String text;
    private String messageType;
    private String editedBy;
    private LocalDateTime updatedAt;
}
