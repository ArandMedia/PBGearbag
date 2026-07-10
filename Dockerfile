FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm install
COPY . .
RUN npm run build --workspace=@pbg/backend || npm run build --prefix backend
EXPOSE 3000
CMD ["npm", "run", "start:prod", "--workspace=@pbg/backend"]
