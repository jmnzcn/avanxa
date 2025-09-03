import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "@/services/authService";
import {
  AuthContextType,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  User,
  AuthTokens,
} from "@/types/auth";

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; tokens: AuthTokens } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

// Reducer function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = await authService.getCurrentUser();
        // If we get here, the user is authenticated
        // We'll get tokens from cookies, so we don't need to store them
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, tokens: { accessToken: "", refreshToken: "" } },
        });
      } catch (error) {
        // User is not authenticated
        dispatch({ type: "AUTH_LOGOUT" });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "AUTH_START" });
      const { user, tokens } = await authService.login(credentials);
      dispatch({ type: "AUTH_SUCCESS", payload: { user, tokens } });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error de inicio de sesión";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      throw error;
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: "AUTH_START" });
      const { user, tokens } = await authService.register(credentials);
      dispatch({ type: "AUTH_SUCCESS", payload: { user, tokens } });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error de registro";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const { tokens } = await authService.refreshToken();
      // Update tokens in state
      if (state.user) {
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: state.user, tokens },
        });
      }
    } catch (error) {
      // If refresh fails, logout the user
      dispatch({ type: "AUTH_LOGOUT" });
      throw error;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
