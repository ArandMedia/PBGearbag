import { apiClient } from "./api";
import { tokenStorage } from "./token-storage";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  ageConfirmed: boolean;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  playStyle?: string[];
  skillLevel?: string;
  homeField?: string;
  favoritePosition?: string;
  isVerified: boolean;
  isActive: boolean;
  roles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  verificationToken?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  ageConfirmed: boolean;
  acceptedTerms: boolean;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  playStyle?: string[];
  skillLevel?: string | null;
  homeField?: string;
  favoritePosition?: string;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    await this.saveTokens(response.data);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    await this.saveTokens(response.data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  }
  async getPublicUser(id:string):Promise<User>{return (await apiClient.get<User>(`/users/${id}`)).data}

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await apiClient.put<User>("/users/profile", data);
    return response.data;
  }

  async uploadAvatar(imageUri: string): Promise<{ avatarUrl: string }> {
    const formData = new FormData();

    // Extract filename from URI
    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("file", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  async uploadBanner(imageUri: string): Promise<{ bannerUrl: string }> {
    const formData = new FormData();

    const filename = imageUri.split("/").pop() || "banner.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("file", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post("/users/banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  private async saveTokens(authResponse: AuthResponse): Promise<void> {
    await tokenStorage.set("accessToken", authResponse.accessToken);
    await tokenStorage.set("refreshToken", authResponse.refreshToken);
    await tokenStorage.set("userId", authResponse.user.id);
  }

  private async clearTokens(): Promise<void> {
    await tokenStorage.remove("accessToken");
    await tokenStorage.remove("refreshToken");
    await tokenStorage.remove("userId");
  }

  async hasToken(): Promise<boolean> {
    const token = await tokenStorage.get("accessToken");
    return !!token;
  }
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post("/auth/verify-email", { token });
  }
  async resendVerification(
    email: string,
  ): Promise<{ verificationToken?: string }> {
    return (await apiClient.post("/auth/resend-verification", { email })).data;
  }
  async forgotPassword(email: string): Promise<{ resetToken?: string }> {
    return (await apiClient.post("/auth/forgot-password", { email })).data;
  }
  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { token, password });
  }
}

export const authService = new AuthService();
