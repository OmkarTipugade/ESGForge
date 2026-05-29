import api from "./api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "@/types";

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/login/", data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<User> {
    const res = await api.post<User>("/auth/register/", data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>("/auth/me/");
    return res.data;
  },

  async refreshToken(refresh: string): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/refresh/", { refresh });
    return res.data;
  },
};
