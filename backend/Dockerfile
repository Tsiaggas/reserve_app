FROM node:18-alpine

# Ρύθμιση για προτίμηση IPv4
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Δημιουργία φακέλου εφαρμογής
WORKDIR /app

# Αντιγραφή αρχείων εξαρτήσεων
COPY package*.json ./

# Εγκατάσταση εξαρτήσεων με συγκεκριμένες εκδόσεις
RUN npm ci --only=production

# Αντιγραφή κώδικα εφαρμογής
COPY . .

# Ρύθμιση IPv4 στο container
RUN echo "prefer-ip-version=4" >> /etc/resolv.conf && \
    echo "precedence ::ffff:0:0/96 100" >> /etc/gai.conf

# Εκθεση θύρας
EXPOSE 8080

# Εντολή εκκίνησης
CMD ["node", "server.js"] 