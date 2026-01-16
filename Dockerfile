FROM node:20-slim AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm prisma generate

COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN pnpm build
RUN pnpm prune --prod

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY prisma ./prisma

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
