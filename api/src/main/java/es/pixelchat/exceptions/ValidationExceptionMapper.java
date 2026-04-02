package es.pixelchat.exceptions;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.List;

@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        List<ErrorResponse.FieldViolation> violations = exception.getConstraintViolations().stream()
                .map(violation -> {
                    String propertyPath = violation.getPropertyPath().toString();
                    String field = propertyPath.contains(".")
                            ? propertyPath.substring(propertyPath.lastIndexOf('.') + 1)
                            : propertyPath;

                    String annotationName = violation.getConstraintDescriptor()
                            .getAnnotation().annotationType().getSimpleName();
                    String code = "validation." + toSnakeCase(annotationName);

                    return ErrorResponse.FieldViolation.builder()
                            .field(field)
                            .code(code)
                            .build();
                })
                .toList();

        ErrorResponse error = ErrorResponse.builder()
                .code("validation.error")
                .message("Error de validación")
                .violations(violations)
                .build();

        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(error)
                .build();
    }

    private String toSnakeCase(String camelCase) {
        return camelCase.replaceAll("([A-Z])", "_$1").toLowerCase().replaceFirst("^_", "");
    }
}
