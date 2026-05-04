FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["Soomboon.sln", "./"]
COPY ["Soomboon.Api/Soomboon.Api.csproj", "Soomboon.Api/"]
COPY ["Soomboon.Core/Soomboon.Core.csproj", "Soomboon.Core/"]
COPY ["Soomboon.Infrastructure/Soomboon.Infrastructure.csproj", "Soomboon.Infrastructure/"]
COPY ["Soomboon.Tests/Soomboon.Tests.csproj", "Soomboon.Tests/"]
RUN dotnet restore "Soomboon.Api/Soomboon.Api.csproj"

# Copy source and build
COPY . .
WORKDIR /src/Soomboon.Api
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Soomboon.Api.dll"]
