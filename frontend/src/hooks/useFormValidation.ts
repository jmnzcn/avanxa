import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

interface UseFormValidationOptions {
  showToast?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: ValidationRules,
  options: UseFormValidationOptions = {}
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const { addToast } = useToast();

  const {
    showToast = true,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  // Validate a single field
  const validateField = useCallback(
    (field: string, value: any): string | null => {
      const rule = validationRules[field];
      if (!rule) return null;

      // Required validation
      if (rule.required && (!value || value.toString().trim() === "")) {
        return "Este campo es requerido";
      }

      // Skip other validations if value is empty and not required
      if (!value || value.toString().trim() === "") {
        return null;
      }

      // Min length validation
      if (rule.minLength && value.toString().length < rule.minLength) {
        return `Mínimo ${rule.minLength} caracteres`;
      }

      // Max length validation
      if (rule.maxLength && value.toString().length > rule.maxLength) {
        return `Máximo ${rule.maxLength} caracteres`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value.toString())) {
        return "Formato inválido";
      }

      // Custom validation
      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [validationRules]
  );

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    setIsValidating(true);
    const newErrors: ValidationErrors = {};

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setIsValidating(false);

    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid && showToast) {
      addToast({
        type: "error",
        title: "Error de validación",
        message: "Por favor corrige los errores en el formulario",
      });
    }

    return isValid;
  }, [data, validationRules, validateField, showToast, addToast]);

  // Update field value
  const updateField = useCallback(
    (field: string, value: any) => {
      setData((prev) => ({ ...prev, [field]: value }));

      // Validate on change if enabled
      if (validateOnChange) {
        const error = validateField(field, value);
        setErrors((prev) => ({
          ...prev,
          [field]: error || "",
        }));
      }
    },
    [validateField, validateOnChange]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      // Validate on blur if enabled
      if (validateOnBlur) {
        const error = validateField(field, data[field]);
        setErrors((prev) => ({
          ...prev,
          [field]: error || "",
        }));
      }
    },
    [validateField, validateOnBlur, data]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  // Set form data
  const setFormData = useCallback((newData: Partial<T>) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Get field error
  const getFieldError = useCallback(
    (field: string): string | null => {
      return errors[field] || null;
    },
    [errors]
  );

  // Check if field has error
  const hasFieldError = useCallback(
    (field: string): boolean => {
      return !!errors[field];
    },
    [errors]
  );

  // Check if field is touched
  const isFieldTouched = useCallback(
    (field: string): boolean => {
      return !!touched[field];
    },
    [touched]
  );

  // Get form validity
  const isFormValid = useCallback((): boolean => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Get form completion percentage
  const getFormCompletion = useCallback((): number => {
    const totalFields = Object.keys(validationRules).length;
    const filledFields = Object.keys(data).filter(
      (key) => data[key] && data[key].toString().trim() !== ""
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  }, [data, validationRules]);

  return {
    data,
    errors,
    touched,
    isValidating,
    updateField,
    handleBlur,
    validateField,
    validateAll,
    resetForm,
    setFormData,
    getFieldError,
    hasFieldError,
    isFieldTouched,
    isFormValid,
    getFormCompletion,
  };
}
