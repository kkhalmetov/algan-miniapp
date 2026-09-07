#!/usr/bin/env bash
set -euo pipefail

APP_HOST="algan-bot.online"
WWW_HOST="www.algan-bot.online"
APP_ROOT="/var/www/algan-miniapp"
ACME_ROOT="/var/www/letsencrypt"
DEPLOY_USER="algan-deploy"
API_ORIGIN="${API_ORIGIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-algansupport@gmail.com}"

if [[ -z "${DEPLOY_PUBLIC_KEY:-}" ]]; then
  echo "DEPLOY_PUBLIC_KEY is required" >&2
  exit 1
fi

if [[ -n "$API_ORIGIN" && ! "$API_ORIGIN" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "API_ORIGIN must be an HTTPS origin without a path" >&2
  exit 1
fi

if [[ ! "$LETSENCRYPT_EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "LETSENCRYPT_EMAIL must be a valid contact email" >&2
  exit 1
fi

CONNECT_SRC="'self' https://open.er-api.com"
if [[ -n "$API_ORIGIN" ]]; then
  CONNECT_SRC="$CONNECT_SRC $API_ORIGIN"
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx rsync

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
printf '%s\n' "$DEPLOY_PUBLIC_KEY" > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_ROOT" "$APP_ROOT/releases"
install -d -m 755 "$ACME_ROOT/.well-known/acme-challenge"

cat > /usr/local/bin/algan-activate <<'ACTIVATE'
#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="/var/www/algan-miniapp"
RELEASE="${1:-}"
[[ "$RELEASE" =~ ^[0-9a-f]{40}$ ]] || { echo "Invalid release id" >&2; exit 1; }
[[ -d "$APP_ROOT/releases/$RELEASE" ]] || { echo "Release does not exist" >&2; exit 1; }
ln -sfn "$APP_ROOT/releases/$RELEASE" "$APP_ROOT/current.next"
mv -Tf "$APP_ROOT/current.next" "$APP_ROOT/current"
ACTIVATE
chmod 755 /usr/local/bin/algan-activate

cat > /etc/nginx/sites-available/algan-miniapp <<NGINX_HTTP
server {
    listen 80;
    listen [::]:80;
    server_name $APP_HOST $WWW_HOST;
    server_tokens off;
    root $APP_ROOT/current;
    index index.html;

    location ^~ /.well-known/acme-challenge/ {
        root $ACME_ROOT;
        default_type text/plain;
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }
}
NGINX_HTTP

ln -sfn /etc/nginx/sites-available/algan-miniapp /etc/nginx/sites-enabled/algan-miniapp
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

certbot certonly --webroot --webroot-path "$ACME_ROOT" \
  -d "$APP_HOST" -d "$WWW_HOST" \
  --non-interactive --agree-tos --email "$LETSENCRYPT_EMAIL" --no-eff-email --keep-until-expiring

install -d -m 755 /etc/nginx/snippets
cat > /etc/nginx/snippets/algan-security-headers.conf <<SECURITY_HEADERS
add_header Content-Security-Policy "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'self' https://telegram.org https://*.telegram.org; form-action 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src $CONNECT_SRC; manifest-src 'self'; media-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests" always;
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header X-Permitted-Cross-Domain-Policies "none" always;
SECURITY_HEADERS

cat > /etc/nginx/sites-available/algan-miniapp <<NGINX_HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $APP_HOST $WWW_HOST;
    server_tokens off;

    location ^~ /.well-known/acme-challenge/ {
        root $ACME_ROOT;
        default_type text/plain;
        try_files \$uri =404;
    }

    location / {
        return 301 https://$APP_HOST\$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $WWW_HOST;
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/$APP_HOST/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$APP_HOST/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    include /etc/nginx/snippets/algan-security-headers.conf;
    return 301 https://$APP_HOST\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $APP_HOST;
    server_tokens off;
    root $APP_ROOT/current;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/$APP_HOST/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$APP_HOST/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    include /etc/nginx/snippets/algan-security-headers.conf;

    location / {
        try_files \$uri \$uri/ /index.html;
        include /etc/nginx/snippets/algan-security-headers.conf;
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    location /_next/static/ {
        try_files \$uri =404;
        include /etc/nginx/snippets/algan-security-headers.conf;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        try_files \$uri =404;
        include /etc/nginx/snippets/algan-security-headers.conf;
        expires 30d;
        add_header Cache-Control "public";
    }
}
NGINX_HTTPS

nginx -t
systemctl reload nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q '^Status: active'; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
fi

install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'RENEWAL_HOOK'
#!/usr/bin/env bash
systemctl reload nginx
RENEWAL_HOOK
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
systemctl enable --now certbot.timer >/dev/null 2>&1 || true

echo "VPS bootstrap complete for https://$APP_HOST"
