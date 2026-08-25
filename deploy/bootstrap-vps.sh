#!/usr/bin/env bash
set -euo pipefail

APP_HOST="92-38-49-57.sslip.io"
APP_ROOT="/var/www/algan-miniapp"
DEPLOY_USER="algan-deploy"

if [[ -z "${DEPLOY_PUBLIC_KEY:-}" ]]; then
  echo "DEPLOY_PUBLIC_KEY is required" >&2
  exit 1
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

install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_ROOT/releases"

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

cat > /etc/nginx/sites-available/algan-miniapp <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $APP_HOST;
    root $APP_ROOT/current;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /_next/static/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        try_files \$uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
}
NGINX

ln -sfn /etc/nginx/sites-available/algan-miniapp /etc/nginx/sites-enabled/algan-miniapp
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q '^Status: active'; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
fi

certbot --nginx -d "$APP_HOST" --non-interactive --agree-tos --register-unsafely-without-email --redirect
systemctl enable --now certbot.timer >/dev/null 2>&1 || true

echo "VPS bootstrap complete for https://$APP_HOST"
