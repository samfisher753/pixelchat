# Node 24 (LTS). Node 18 dejó de recibir parches de seguridad en abril de 2025
FROM node:24-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the current directory's contents into the container
COPY . /app

# Install project dependencies (npm ci: exactamente las versiones del package-lock, con sus parches)
RUN npm ci

# Se compila aquí y no al arrancar: si TypeScript falla, falla la build y no el contenedor en producción
RUN npm run build

# tini como proceso principal: le pasa a node el SIGTERM de docker stop (siendo PID 1, node lo
# ignoraría) y así se cierra al momento en vez de esperar 10 s a que Docker lo mate.
# node directamente y no npm start, que tampoco reenvía las señales.
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]