package es.pixelchat.exceptions;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@RegisterForReflection
public class ErrorResponse {
    private final String code;
    private final String message;
    private final List<FieldViolation> violations;

    @Getter
    @Builder
    public static class FieldViolation {
        private final String field;
        private final String code;
    }
}
