# ==========================================
# STAGE 1: Build Go Aggregator Binary
# ==========================================
FROM golang:1.20-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY main.go ./
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o go-aggregator .

# ==========================================
# STAGE 2: Secure Production Runner
# ==========================================
FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/go-aggregator .
EXPOSE 8080
ENV PORT=8080
CMD ["./go-aggregator"]
