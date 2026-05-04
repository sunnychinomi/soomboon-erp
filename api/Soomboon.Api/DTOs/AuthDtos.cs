namespace Soomboon.Api.DTOs;

public record LoginRequest(string Username, string Password);

public record RegisterRequest(string Username, string Email, string Password, string? FullName);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserInfo User
);

public record UserInfo(
    string Id,
    string Username,
    string Email,
    string? FullName,
    IList<string> Roles
);
