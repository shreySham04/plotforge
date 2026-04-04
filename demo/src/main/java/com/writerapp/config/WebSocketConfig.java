package com.writerapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/editor")
            .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://plotforge-liard.vercel.app", "https://*.vercel.app");

        registry.addEndpoint("/ws/editor")
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://plotforge-liard.vercel.app", "https://*.vercel.app")
                .withSockJS();
    }
}
