# ==========================
# BUILD STAGE
# ==========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Install Node.js 20
RUN apt-get update && apt-get install -y curl

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

RUN apt-get install -y nodejs

RUN node -v
RUN npm -v

# Copy source
COPY . .

# Restore .NET
RUN dotnet restore

# Publish (.csproj will build React if configured)
RUN dotnet publish -c Release -o /app/publish

# ==========================
# RUNTIME STAGE
# ==========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "VivekMedicalProducts.dll"]