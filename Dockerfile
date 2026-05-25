# ==========================================
# STAGE 1: Build Frontend Assets
# ==========================================
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY client/ ./client/
COPY shared/ ./shared/
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json ./
RUN npm run build

# ==========================================
# STAGE 2: Build Backend Server
# ==========================================
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server/ ./server/
COPY shared/ ./shared/
COPY tsconfig.json ./
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# ==========================================
# STAGE 3: Final Production Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --only=production
COPY --from=client-builder /app/dist/public ./dist/public
COPY --from=server-builder /app/dist/index.js ./dist/index.js

EXPOSE 5000
CMD ["node", "dist/index.js"]
