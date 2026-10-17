#!/usr/bin/env python3
"""MadaAgri Market local MVP: SQLite-backed API and static web server."""
from __future__ import annotations

import argparse
import base64
import binascii
import csv
import hashlib
import hmac
import io
import json
import os
import posixpath
import re
import secrets
import sqlite3
import threading
import time
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse
from urllib.parse import parse_qs

ROOT = Path(__file__).resolve().parent
DB = ROOT / "madaagri.sqlite3"
DIST = ROOT / "frontend" / "dist"  # React build (npm run build in frontend/)
SESSION_COOKIE = "madaagri_session"
SESSION_TTL = 60 * 60 * 24 * 7
PBKDF2_ROUNDS = 240_000
DEMO_MODE = False
LOGIN_FAILURES = {}
LOGIN_LOCK = threading.Lock()

PRODUCTS = [
    ("Tomates bien mûres", "Légumes", 3500, "kg", 24, "Antsirabe", "Ferme Rakoto", "tomates.png", "Récoltées à maturité, en agriculture familiale.", 4.9),
    ("Riz rouge de Madagascar", "Riz & céréales", 12000, "sac de 5 kg", 38, "Fianarantsoa", "Coopérative Vary Tsara", "riz-rouge.png", "Riz rouge parfumé, trié et conditionné par la coopérative.", 4.8),
    ("Brèdes mafana", "Feuilles & herbes", 2000, "botte", 18, "Analamanga", "Potager de Lalao", "bredes-mafana.png", "Feuilles fraîches cueillies le matin même.", 5.0),
    ("Bananes mûres", "Fruits", 4000, "régime", 16, "Mahajanga", "Ferme Soa", "bananes.png", "Bananes locales, mûries naturellement.", 4.7),
    ("Aubergines du jardin", "Légumes", 2500, "kg", 12, "Antsirabe", "Ferme Rakoto", "aubergines-piments.png", "Petite récolte de saison, cultivée sans intermédiaire.", 4.8),
    ("Piments rouges", "Légumes", 3000, "kg", 9, "Antananarivo", "Potager de Lalao", "aubergines-piments.png", "Piments frais au goût fruité et relevé.", 4.6),
]


class ManagedConnection(sqlite3.Connection):
    def __exit__(self, exc_type, exc_value, traceback):
        try:
            return super().__exit__(exc_type, exc_value, traceback)
        finally:
            self.close()


def connect():
    db = sqlite3.connect(DB, factory=ManagedConnection)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def valid_product_image(name):
    if name in {product[7] for product in PRODUCTS}:
        return True
    return bool(re.fullmatch(r"user-[a-f0-9]{24}\.(?:jpg|png|webp)", name) and
                (ROOT / "assets" / "product-photos" / name).is_file())


def init_db(demo=False):
    global DEMO_MODE
    DEMO_MODE = demo
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
          phone TEXT DEFAULT '', password_hash TEXT NOT NULL, role TEXT NOT NULL,
          verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS password_resets (
          token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY, producer_id INTEGER REFERENCES users(id),
          producer_name TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL,
          price INTEGER NOT NULL, unit TEXT NOT NULL, stock INTEGER NOT NULL,
          region TEXT NOT NULL, image TEXT NOT NULL, description TEXT NOT NULL,
          rating REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'published',
          min_qty INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, buyer_id INTEGER NOT NULL REFERENCES users(id),
          producer_id INTEGER, producer_name TEXT NOT NULL, status TEXT NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'pending', payment_method TEXT NOT NULL,
          delivery_method TEXT NOT NULL, delivery_address TEXT NOT NULL DEFAULT '',
          payment_phone TEXT NOT NULL DEFAULT '',
          note TEXT NOT NULL DEFAULT '', subtotal INTEGER NOT NULL, delivery_fee INTEGER,
          service_fee INTEGER NOT NULL DEFAULT 0, commission_amount INTEGER NOT NULL DEFAULT 0,
          delivery_zone TEXT NOT NULL DEFAULT '', delivery_responsible TEXT NOT NULL DEFAULT '',
          delivery_status TEXT NOT NULL DEFAULT 'to_arrange', delivery_fee_accepted INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER, name TEXT NOT NULL, unit TEXT NOT NULL, price INTEGER NOT NULL,
          quantity INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          text TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, read INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
          buyer_id INTEGER NOT NULL REFERENCES users(id), product_id INTEGER REFERENCES products(id),
          rating INTEGER NOT NULL, comment TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(order_id, product_id)
        );
        CREATE TABLE IF NOT EXISTS claims (
          id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
          buyer_id INTEGER NOT NULL REFERENCES users(id), reason TEXT NOT NULL,
          details TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS audit_events (
          id INTEGER PRIMARY KEY, actor_id INTEGER REFERENCES users(id), entity_type TEXT NOT NULL,
          entity_id INTEGER NOT NULL, action TEXT NOT NULL, details TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY, value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS phone_codes (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
          sent_at INTEGER NOT NULL
        );
        """)
        user_columns = {row[1] for row in db.execute("PRAGMA table_info(users)").fetchall()}
        if "active" not in user_columns:
            db.execute("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1")
        if "phone_verified" not in user_columns:
            db.execute("ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0")
        order_columns = {row[1] for row in db.execute("PRAGMA table_info(orders)").fetchall()}
        if "payment_phone" not in order_columns:
            db.execute("ALTER TABLE orders ADD COLUMN payment_phone TEXT NOT NULL DEFAULT ''")
        if "service_fee" not in order_columns:
            db.execute("ALTER TABLE orders ADD COLUMN service_fee INTEGER NOT NULL DEFAULT 0")
        if "commission_amount" not in order_columns:
            db.execute("ALTER TABLE orders ADD COLUMN commission_amount INTEGER NOT NULL DEFAULT 0")
        for name, definition in (
            ("delivery_zone", "TEXT NOT NULL DEFAULT ''"),
            ("delivery_responsible", "TEXT NOT NULL DEFAULT ''"),
            ("delivery_status", "TEXT NOT NULL DEFAULT 'to_arrange'"),
            ("delivery_fee_accepted", "INTEGER NOT NULL DEFAULT 0"),
        ):
            if name not in order_columns:
                db.execute("ALTER TABLE orders ADD COLUMN " + name + " " + definition)
        claim_columns = {row[1] for row in db.execute("PRAGMA table_info(claims)").fetchall()}
        if "resolution" not in claim_columns:
            db.execute("ALTER TABLE claims ADD COLUMN resolution TEXT NOT NULL DEFAULT ''")
        if "resolved_at" not in claim_columns:
            db.execute("ALTER TABLE claims ADD COLUMN resolved_at TEXT")
        for key, value in {
            "categories": ["Légumes", "Fruits", "Riz & céréales", "Feuilles & herbes", "Épices", "Autres"],
            "units": ["kg", "botte", "régime", "sac de 5 kg"],
            "zones": ["Antananarivo", "Antsirabe", "Fianarantsoa", "Mahajanga", "Analamanga"],
            "commission_percent": 0,
            "service_fee": 0,
        }.items():
            db.execute("INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)", (key, json.dumps(value, ensure_ascii=False)))
        legacy_categories = ["Légumes", "Fruits", "Riz & céréales", "Feuilles & herbes", "Autres"]
        legacy_zones = ["Antananarivo", "Antsirabe", "Fianarantsoa", "Mahajanga"]
        for key, old, new in (("categories", legacy_categories, legacy_categories[:-1] + ["Épices", "Autres"]),
                              ("zones", legacy_zones, legacy_zones + ["Analamanga"])):
            current = json.loads(db.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()[0])
            if current == old:
                db.execute("UPDATE settings SET value=? WHERE key=?", (json.dumps(new, ensure_ascii=False), key))
        count = db.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count == 0:
            for p in PRODUCTS:
                db.execute("""INSERT INTO products
                  (producer_name,name,category,price,unit,stock,region,image,description,rating,status)
                  VALUES (?,?,?,?,?,?,?,?,?,?, 'published')""",
                           (p[6],p[0],p[1],p[2],p[3],p[4],p[5],p[7],p[8],p[9]))
        else:
            # Repair initial local seed rows created by an earlier prototype build.
            for index, p in enumerate(PRODUCTS, 1):
                row = db.execute("SELECT id,price,image FROM products WHERE id=?", (index,)).fetchone()
                if row and row["image"] == p[7] and not isinstance(row["price"], int):
                    db.execute("""UPDATE products SET producer_name=?,name=?,category=?,price=?,unit=?,stock=?,
                                  region=?,description=?,rating=? WHERE id=?""",
                               (p[6],p[0],p[1],p[2],p[3],p[4],p[5],p[8],p[9],index))
        if demo:
            seed_user(db, "Acheteur Démo", "acheteur@madaagri.test", "acheteur123", "buyer")
            producer_id = seed_user(db, "Mamy Rakoto", "producteur@madaagri.test", "producteur123", "producer", True)
            seed_user(db, "Admin MadaAgri", "admin@madaagri.test", "admin123", "admin", True)
            seller_ids = {
                "Ferme Rakoto": producer_id,
                "Coopérative Vary Tsara": seed_user(db,"Coopérative Vary Tsara","coop@madaagri.test","coop12345","producer",True),
                "Potager de Lalao": seed_user(db,"Lalao Raveloson","lalao@madaagri.test","lalao12345","producer",True),
                "Ferme Soa": seed_user(db,"Soa Randria","soa@madaagri.test","fermesoa123","producer",True),
            }
            for seller, seller_id in seller_ids.items():
                db.execute("UPDATE products SET producer_id=? WHERE producer_name=?", (seller_id,seller))
            seed_demo_moderation(db, seller_ids)


DEMO_PENDING_PRODUCTS = [
    ("Bananes plantain", "Fruits", 3500, "régime", 10, "Mahajanga", "Ferme Soa", "bananes.png", "Bananes à cuire, récoltées cette semaine."),
    ("Brèdes morelle", "Feuilles & herbes", 1500, "botte", 20, "Analamanga", "Potager de Lalao", "bredes-mafana.png", "Brèdes tendres pour le romazava."),
    ("Riz rouge en vrac", "Riz & céréales", 2600, "kg", 40, "Fianarantsoa", "Coopérative Vary Tsara", "riz-rouge.png", "Riz rouge trié, vendu au kilo."),
]
DEMO_PRODUCERS_TO_VERIFY = [
    ("La ferme verte", "fermeverte@madaagri.test", "fermeverte123"),
    ("Mamy Tsara", "mamytsara@madaagri.test", "mamytsara123"),
    ("Rakoto Andry", "andry@madaagri.test", "rakotoandry123"),
]


def seed_demo_moderation(db, seller_ids):
    """Give the demo back-office something to review, once."""
    if db.execute("SELECT 1 FROM settings WHERE key='demo_moderation_seeded'").fetchone():
        return
    for name, email, password in DEMO_PRODUCERS_TO_VERIFY:
        seed_user(db, name, email, password, "producer")
    for p in DEMO_PENDING_PRODUCTS:
        if not db.execute("SELECT 1 FROM products WHERE name=? AND producer_name=?", (p[0], p[6])).fetchone():
            db.execute("""INSERT INTO products
              (producer_id,producer_name,name,category,price,unit,stock,region,image,description,rating,status)
              VALUES (?,?,?,?,?,?,?,?,?,?,0,'pending')""",
                       (seller_ids.get(p[6]), p[6], p[0], p[1], p[2], p[3], p[4], p[5], p[7], p[8]))
    db.execute("INSERT INTO settings(key,value) VALUES('demo_moderation_seeded','true')")


def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ROUNDS)
    return salt.hex() + ":" + digest.hex()


def check_password(password, stored):
    try:
        salt, expected = stored.split(":", 1)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ROUNDS).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def seed_user(db, name, email, password, role, verified=False):
    found = db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if found:
        return found["id"]
    cur = db.execute("INSERT INTO users(name,email,password_hash,role,verified) VALUES(?,?,?,?,?)",
                     (name, email, hash_password(password), role, int(verified)))
    return cur.lastrowid


class AppHandler(SimpleHTTPRequestHandler):
    server_version = "MadaAgri/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Static files are revalidated on every load so a new app.js or stylesheet is picked up at once.
        if getattr(self, "static_file", False):
            self.send_header("Cache-Control", "no-cache")
            self.static_file = False
        super().end_headers()

    def serve_frontend(self, path):
        """Product photos and fonts come from ./assets; everything else from the React build.
        Unknown paths fall back to index.html so client-side routes (/panier, /commandes/3…) load."""
        self.static_file = True
        path = posixpath.normpath("/" + path.lstrip("/"))  # "/assets/../x" must not escape ./assets
        if path.startswith("/assets/"):
            self.directory = str(ROOT)
            self.path = path
            return super().do_GET()
        index = DIST / "index.html"
        if not index.is_file():
            raw = "Interface non compilée : lancez « npm install » puis « npm run build » dans le dossier frontend.".encode()
            self.send_response(503)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
            return
        target = (DIST / path.lstrip("/")).resolve()
        inside = target == DIST.resolve() or DIST.resolve() in target.parents
        self.directory = str(DIST)
        self.path = path if inside and target.is_file() else "/index.html"
        return super().do_GET()

    def list_directory(self, path):
        self.send_error(HTTPStatus.NOT_FOUND)
        return None

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.log_date_time_string(), fmt % args))

    def json(self, data, status=200, headers=None):
        raw = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Content-Security-Policy", "default-src 'self' data:; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(raw)

    def body(self):
        try:
            limit = 3_000_000 if urlparse(self.path).path == "/api/uploads" else 100_000
            length = int(self.headers.get("Content-Length", "0"))
            if length < 0 or length > limit:
                return {}
            value = json.loads(self.rfile.read(length) or b"{}")
            return value if isinstance(value, dict) else {}
        except (ValueError, json.JSONDecodeError):
            return {}

    def current_user(self, db):
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        morsel = cookie.get(SESSION_COOKIE)
        if not morsel:
            return None
        token_hash = hashlib.sha256(morsel.value.encode()).hexdigest()
        row = db.execute("""SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
                            WHERE s.token_hash=? AND s.expires_at>? AND u.active=1""", (token_hash, int(time.time()))).fetchone()
        return dict(row) if row else None

    def require_user(self, db, roles=None):
        user = self.current_user(db)
        if not user:
            self.json({"error": "Connectez-vous pour continuer."}, 401)
            return None
        if roles and user["role"] not in roles:
            self.json({"error": "Accès réservé."}, 403)
            return None
        return user

    def do_GET(self):
        parsed = urlparse(self.path)
        tunnel = parse_qs(parsed.query).get("__mada")
        if tunnel and tunnel[0] and len(tunnel[0]) < 100:
            parsed = parsed._replace(path="/api/" + tunnel[0].strip("/"), query="")
        if parsed.path.startswith("/madaagri/"):
            parsed = parsed._replace(path="/api/" + parsed.path[len("/madaagri/"):])
        if not parsed.path.startswith("/api/"):
            return self.serve_frontend(unquote(parsed.path))
        with connect() as db:
            user = self.current_user(db)
            if parsed.path == "/api/bootstrap":
                products = [dict(r) for r in db.execute("SELECT * FROM products WHERE status='published' ORDER BY id")]
                result = {"products": products, "user": {k: user[k] for k in ("id","name","email","phone","role","verified","phone_verified")} if user else None,
                          "catalog_config": {key: json.loads(value) for key,value in db.execute("SELECT key,value FROM settings WHERE key IN ('categories','units','zones','service_fee')")}}
                if user:
                    result["notifications"] = [dict(r) for r in db.execute("SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 8", (user["id"],))]
                return self.json(result)
            if parsed.path == "/api/orders":
                if not user:
                    return self.json({"error": "Connectez-vous."}, 401)
                if user["role"] == "admin":
                    rows = db.execute("SELECT o.*,u.name AS buyer_name FROM orders o JOIN users u ON u.id=o.buyer_id ORDER BY o.id DESC")
                elif user["role"] == "producer":
                    rows = db.execute("SELECT o.*,u.name AS buyer_name FROM orders o JOIN users u ON u.id=o.buyer_id WHERE o.producer_id=? ORDER BY o.id DESC", (user["id"],))
                else:
                    rows = db.execute("SELECT o.*,u.name AS buyer_name FROM orders o JOIN users u ON u.id=o.buyer_id WHERE o.buyer_id=? ORDER BY o.id DESC", (user["id"],))
                orders = []
                for row in rows:
                    item = dict(row)
                    item["items"] = [dict(x) for x in db.execute("SELECT * FROM order_items WHERE order_id=?", (item["id"],))]
                    orders.append(item)
                return self.json({"orders": orders})
            if parsed.path == "/api/admin/export":
                if not user or user["role"] != "admin":
                    return self.json({"error": "Accès réservé."}, 403)
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["Référence","Acheteur","Producteur","Statut commande","Statut paiement","Sous-total Ar","Mode remise","Créée le"])
                for row in db.execute("""SELECT o.code,u.name,o.producer_name,o.status,o.payment_status,o.subtotal,
                                         o.delivery_method,o.created_at FROM orders o JOIN users u ON u.id=o.buyer_id ORDER BY o.id DESC"""):
                    writer.writerow(list(row))
                raw = output.getvalue().encode("utf-8-sig")
                self.send_response(200)
                self.send_header("Content-Type","text/csv; charset=utf-8")
                self.send_header("Content-Disposition",'attachment; filename="madaagri-commandes.csv"')
                self.send_header("Content-Length",str(len(raw)))
                self.send_header("X-Content-Type-Options","nosniff")
                self.end_headers()
                self.wfile.write(raw)
                return
            if parsed.path == "/api/producer/products":
                if not user or user["role"] not in ("producer", "admin"):
                    return self.json({"error": "Accès réservé aux producteurs."}, 403)
                rows = db.execute("SELECT * FROM products WHERE producer_id=? ORDER BY id DESC", (user["id"],))
                return self.json({"products": [dict(r) for r in rows]})
            if parsed.path == "/api/admin":
                if not user or user["role"] != "admin":
                    return self.json({"error": "Accès réservé."}, 403)
                return self.json({
                    "users": [dict(r) for r in db.execute("SELECT id,name,email,phone,phone_verified,role,verified,active,created_at FROM users ORDER BY id DESC")],
                    "products": [dict(r) for r in db.execute("SELECT * FROM products ORDER BY id DESC")],
                    "claims": [dict(r) for r in db.execute("SELECT c.*,o.code FROM claims c JOIN orders o ON o.id=c.order_id ORDER BY c.id DESC")],
                    "settings": {key: json.loads(value) for key,value in db.execute("SELECT key,value FROM settings")},
                    "metrics": {"orders": db.execute("SELECT COUNT(*) FROM orders").fetchone()[0],
                                "pending_products": db.execute("SELECT COUNT(*) FROM products WHERE status='pending'").fetchone()[0],
                                "open_claims": db.execute("SELECT COUNT(*) FROM claims WHERE status='open'").fetchone()[0]}
                })
            return self.json({"error": "Route inconnue."}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        tunnel = parse_qs(parsed.query).get("__mada")
        if tunnel and tunnel[0] and len(tunnel[0]) < 100:
            parsed = parsed._replace(path="/api/" + tunnel[0].strip("/"), query="")
        if parsed.path.startswith("/madaagri/"):
            parsed = parsed._replace(path="/api/" + parsed.path[len("/madaagri/"):])
        if not parsed.path.startswith("/api/"):
            return self.json({"error": "Route inconnue."}, 404)
        origin = self.headers.get("Origin")
        if origin and urlparse(origin).netloc != self.headers.get("Host"):
            return self.json({"error": "Origine refusée."}, 403)
        data = self.body()
        with connect() as db:
            user = self.current_user(db)
            if parsed.path == "/api/uploads":
                producer = self.require_user(db, ["producer", "admin"])
                if not producer:
                    return
                if not producer["verified"]:
                    return self.json({"error": "Votre profil attend une vérification."}, 403)
                try:
                    raw = base64.b64decode(data.get("data", ""), validate=True)
                    if not 24 <= len(raw) <= 2_000_000:
                        raise ValueError
                    if raw.startswith(b"\x89PNG\r\n\x1a\n") and raw.endswith(b"IEND\xaeB`\x82"):
                        extension = "png"
                    elif raw.startswith(b"\xff\xd8") and raw.endswith(b"\xff\xd9"):
                        extension = "jpg"
                    elif raw.startswith(b"RIFF") and raw[8:12] == b"WEBP":
                        extension = "webp"
                    else:
                        raise ValueError
                except (ValueError, TypeError, binascii.Error):
                    return self.json({"error": "Utilisez une photo PNG, JPEG ou WebP de 2 Mo maximum."}, 400)
                filename = "user-" + secrets.token_hex(12) + "." + extension
                destination = ROOT / "assets" / "product-photos" / filename
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(raw)
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (producer["id"], "upload", 0, "create", filename))
                return self.json({"image": filename}, 201)
            if parsed.path == "/api/register":
                name, email = str(data.get("name", "")).strip(), str(data.get("email", "")).strip().lower()
                password = str(data.get("password", ""))
                phone = str(data.get("phone", "")).strip()
                role = data.get("role", "buyer")
                if len(name) < 2 or "@" not in email or len(password) < 8 or role not in ("buyer", "producer"):
                    return self.json({"error": "Vérifiez les champs. Le mot de passe doit contenir au moins 8 caractères."}, 400)
                try:
                    cur = db.execute("INSERT INTO users(name,email,phone,password_hash,role) VALUES(?,?,?,?,?)",
                                     (name[:100], email[:160], phone[:40], hash_password(password), role))
                except sqlite3.IntegrityError:
                    return self.json({"error": "Cette adresse e-mail est déjà utilisée."}, 409)
                return self.login_user(db, cur.lastrowid)
            if parsed.path == "/api/login":
                identity = str(data.get("email", "")).strip()
                email = identity.lower()
                attempt_key = (self.client_address[0], email)
                now = int(time.time())
                with LOGIN_LOCK:
                    failures = [t for t in LOGIN_FAILURES.get(attempt_key, []) if now - t < 900]
                    LOGIN_FAILURES[attempt_key] = failures
                    if len(failures) >= 5:
                        return self.json({"error": "Trop de tentatives. Réessayez dans 15 minutes."}, 429)
                row = db.execute("SELECT * FROM users WHERE lower(email)=? OR phone=?", (email,identity)).fetchone()
                if not row or not row["active"] or not check_password(str(data.get("password", "")), row["password_hash"]):
                    with LOGIN_LOCK:
                        LOGIN_FAILURES.setdefault(attempt_key, []).append(now)
                    return self.json({"error": "Adresse e-mail ou mot de passe incorrect."}, 401)
                with LOGIN_LOCK:
                    LOGIN_FAILURES.pop(attempt_key, None)
                return self.login_user(db, row["id"])
            if parsed.path == "/api/password-reset/request":
                if not DEMO_MODE:
                    return self.json({"error": "La réinitialisation par e-mail doit être configurée par l’administrateur."}, 503)
                email = str(data.get("email", "")).strip().lower()
                row = db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
                if not row:
                    return self.json({"ok": True, "message": "Si le compte existe, une instruction de réinitialisation sera affichée."})
                token = secrets.token_urlsafe(24)
                db.execute("DELETE FROM password_resets WHERE user_id=?", (row["id"],))
                db.execute("INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES(?,?,?)",
                           (hashlib.sha256(token.encode()).hexdigest(),row["id"],int(time.time())+1800))
                return self.json({"ok":True,"demo_token":token,"message":"Code de démonstration valable 30 minutes."})
            if parsed.path == "/api/password-reset/confirm":
                token = str(data.get("token", ""))
                password = str(data.get("password", ""))
                if len(password) < 8 or not token:
                    return self.json({"error": "Le nouveau mot de passe doit contenir au moins 8 caractères."}, 400)
                token_hash = hashlib.sha256(token.encode()).hexdigest()
                reset = db.execute("SELECT user_id FROM password_resets WHERE token_hash=? AND expires_at>?",
                                   (token_hash,int(time.time()))).fetchone()
                if not reset:
                    return self.json({"error": "Code invalide ou expiré. Demandez un nouveau code."}, 400)
                db.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(password),reset["user_id"]))
                db.execute("DELETE FROM sessions WHERE user_id=?", (reset["user_id"],))
                db.execute("DELETE FROM password_resets WHERE user_id=?", (reset["user_id"],))
                return self.json({"ok":True,"message":"Mot de passe mis à jour."})
            if parsed.path == "/api/phone/send":
                account = self.require_user(db)
                if not account:
                    return
                phone = re.sub(r"[\s.-]", "", str(data.get("phone") or account["phone"] or ""))
                if not re.fullmatch(r"\+?\d{9,15}", phone):
                    return self.json({"error": "Indiquez un numéro de téléphone valide, par exemple +261 34 00 000 00."}, 400)
                now = int(time.time())
                previous = db.execute("SELECT sent_at FROM phone_codes WHERE user_id=?", (account["id"],)).fetchone()
                if previous and now - previous["sent_at"] < 30:
                    return self.json({"error": "Patientez 30 secondes avant de demander un nouveau code."}, 429)
                if not DEMO_MODE:
                    return self.json({"error": "L’envoi de SMS doit être configuré par l’administrateur."}, 503)
                code = f"{secrets.randbelow(1_000_000):06d}"
                if phone != account["phone"]:
                    db.execute("UPDATE users SET phone=?,phone_verified=0 WHERE id=?", (phone[:40], account["id"]))
                db.execute("INSERT OR REPLACE INTO phone_codes(user_id,code_hash,expires_at,attempts,sent_at) VALUES(?,?,?,0,?)",
                           (account["id"], hashlib.sha256(code.encode()).hexdigest(), now + 300, now))
                return self.json({"ok": True, "phone": phone, "expires_in": 300, "demo_code": code,
                                  "message": "Code de démonstration : aucun SMS n’est envoyé en local."})
            if parsed.path == "/api/phone/verify":
                account = self.require_user(db)
                if not account:
                    return
                code = re.sub(r"\D", "", str(data.get("code", "")))
                row = db.execute("SELECT * FROM phone_codes WHERE user_id=?", (account["id"],)).fetchone()
                if not row or row["expires_at"] < int(time.time()):
                    return self.json({"error": "Code expiré. Demandez un nouveau code."}, 400)
                if row["attempts"] >= 5:
                    return self.json({"error": "Trop d’essais. Demandez un nouveau code."}, 429)
                if len(code) != 6 or not hmac.compare_digest(hashlib.sha256(code.encode()).hexdigest(), row["code_hash"]):
                    db.execute("UPDATE phone_codes SET attempts=attempts+1 WHERE user_id=?", (account["id"],))
                    return self.json({"error": "Code incorrect. Vérifiez les 6 chiffres reçus."}, 400)
                db.execute("UPDATE users SET phone_verified=1 WHERE id=?", (account["id"],))
                db.execute("DELETE FROM phone_codes WHERE user_id=?", (account["id"],))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (account["id"], "user", account["id"], "phone_verified", account["phone"]))
                return self.json({"ok": True})
            if parsed.path == "/api/logout":
                cookie = SimpleCookie(self.headers.get("Cookie", ""))
                token = cookie.get(SESSION_COOKIE)
                if token:
                    db.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(token.value.encode()).hexdigest(),))
                return self.json({"ok": True}, headers={"Set-Cookie": SESSION_COOKIE + "=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"})
            if parsed.path == "/api/orders":
                buyer = self.require_user(db, ["buyer", "admin"])
                if not buyer:
                    return
                lines = data.get("items", [])
                if not isinstance(lines, list) or not lines or len(lines) > 30:
                    return self.json({"error": "Votre panier est vide ou invalide."}, 400)
                delivery = data.get("delivery_method", "pickup")
                payment = data.get("payment_method", "at_delivery")
                if delivery not in ("pickup", "delivery") or payment not in ("mvola", "orange_money", "at_delivery"):
                    return self.json({"error": "Mode de livraison ou paiement indisponible."}, 400)
                normalized, subtotal, producer_ids, producer_names = [], 0, set(), set()
                for line in lines:
                    try:
                        pid, qty = int(line.get("product_id")), int(line.get("quantity"))
                    except (TypeError, ValueError, AttributeError):
                        return self.json({"error": "Ligne de panier invalide."}, 400)
                    product = db.execute("SELECT * FROM products WHERE id=? AND status='published'", (pid,)).fetchone()
                    if not product or qty < product["min_qty"] or qty > product["stock"]:
                        return self.json({"error": "Stock ou quantité indisponible pour " + (product["name"] if product else "un produit") + "."}, 409)
                    normalized.append((product, qty))
                    subtotal += product["price"] * qty
                    if product["producer_id"]:
                        producer_ids.add(product["producer_id"])
                    producer_names.add(product["producer_name"])
                if len(producer_ids) > 1 or len(producer_names) > 1:
                    return self.json({"error": "Pour cette première version, commandez les produits d'un seul producteur à la fois."}, 400)
                address = str(data.get("delivery_address", "")).strip()[:240]
                if delivery == "delivery" and len(address) < 5:
                    return self.json({"error": "Indiquez votre quartier ou adresse de livraison."}, 400)
                payment_phone = str(data.get("payment_phone", "")).strip()[:24]
                producer_id = next(iter(producer_ids), None)
                producer_name = next(iter(producer_names))
                note = str(data.get("note", "")).strip()[:500]
                service_fee = int(json.loads(db.execute("SELECT value FROM settings WHERE key='service_fee'").fetchone()[0]))
                commission_percent = float(json.loads(db.execute("SELECT value FROM settings WHERE key='commission_percent'").fetchone()[0]))
                commission_amount = int(subtotal * commission_percent / 100 + 0.5)
                code = "MAD-" + time.strftime("%y%m%d") + "-" + secrets.token_hex(3).upper()
                cur = db.execute("""INSERT INTO orders(code,buyer_id,producer_id,producer_name,status,payment_status,
                    payment_method,delivery_method,delivery_address,payment_phone,note,subtotal,delivery_fee,service_fee,commission_amount,
                    delivery_status,delivery_fee_accepted)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (code,buyer["id"],producer_id,producer_name,"pending_confirmation","pending",payment,delivery,address,
                     payment_phone,note,subtotal,0 if delivery == "pickup" else None,service_fee,commission_amount,
                     "pickup" if delivery == "pickup" else "to_arrange",1 if delivery == "pickup" else 0))
                order_id = cur.lastrowid
                for product, qty in normalized:
                    db.execute("INSERT INTO order_items(order_id,product_id,name,unit,price,quantity) VALUES(?,?,?,?,?,?)",
                               (order_id,product["id"],product["name"],product["unit"],product["price"],qty))
                if producer_id:
                    db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)",
                               (producer_id,"Nouvelle commande " + code + " à confirmer."))
                return self.json({"ok": True, "id": order_id, "code": code, "status": "pending_confirmation",
                                  "payment_status": "pending", "subtotal": subtotal,
                                  "service_fee": service_fee, "known_total": subtotal + service_fee}, 201)
            if parsed.path == "/api/products":
                producer = self.require_user(db, ["producer", "admin"])
                if not producer:
                    return
                if not producer["verified"]:
                    return self.json({"error": "Votre compte producteur attend sa vérification par l'administration."}, 403)
                try:
                    name = str(data.get("name", "")).strip()[:120]
                    category = str(data.get("category", "Autres")).strip()[:60]
                    price, stock = int(data.get("price", 0)), int(data.get("stock", 0))
                    unit = str(data.get("unit", "")).strip()[:40]
                    region = str(data.get("region", "")).strip()[:80]
                    image = str(data.get("image", "tomates.png")).strip()
                    description = str(data.get("description", "")).strip()[:800]
                    if len(name) < 3 or price < 1 or stock < 0 or not unit or not region:
                        raise ValueError
                    categories = json.loads(db.execute("SELECT value FROM settings WHERE key='categories'").fetchone()[0])
                    units = json.loads(db.execute("SELECT value FROM settings WHERE key='units'").fetchone()[0])
                    zones = json.loads(db.execute("SELECT value FROM settings WHERE key='zones'").fetchone()[0])
                    if category not in categories or unit not in units or region not in zones:
                        return self.json({"error": "Choisissez une catégorie, une unité et une zone autorisées."}, 400)
                    if not valid_product_image(image):
                        return self.json({"error": "Photo non autorisée."}, 400)
                except (TypeError, ValueError):
                    return self.json({"error": "Renseignez un nom, un prix, une unité, une région et un stock valides."}, 400)
                db.execute("""INSERT INTO products(producer_id,producer_name,name,category,price,unit,stock,region,image,description,status)
                              VALUES(?,?,?,?,?,?,?,?,?,?, 'pending')""",
                           (producer["id"],producer["name"],name,category,price,unit,stock,region,image,description))
                return self.json({"ok": True, "message": "Fiche envoyée à la modération."}, 201)
            if parsed.path.startswith("/api/products/") and parsed.path.endswith("/update"):
                producer = self.require_user(db, ["producer", "admin"])
                if not producer:
                    return
                try:
                    pid = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Produit introuvable."}, 404)
                old = db.execute("SELECT * FROM products WHERE id=? AND producer_id=?", (pid, producer["id"])).fetchone()
                if not old:
                    return self.json({"error": "Produit introuvable."}, 404)
                if not producer["verified"]:
                    return self.json({"error": "Votre profil attend une vérification."}, 403)
                try:
                    name = str(data.get("name", old["name"])).strip()[:120]
                    category = str(data.get("category", old["category"])).strip()[:60]
                    price, stock = int(data.get("price", old["price"])), int(data.get("stock", old["stock"]))
                    unit = str(data.get("unit", old["unit"])).strip()[:40]
                    region = str(data.get("region", old["region"])).strip()[:80]
                    image = str(data.get("image", old["image"])).strip()
                    description = str(data.get("description", old["description"])).strip()[:800]
                    if len(name) < 3 or not category or price < 1 or stock < 0 or not unit or not region:
                        raise ValueError
                    categories = json.loads(db.execute("SELECT value FROM settings WHERE key='categories'").fetchone()[0])
                    units = json.loads(db.execute("SELECT value FROM settings WHERE key='units'").fetchone()[0])
                    zones = json.loads(db.execute("SELECT value FROM settings WHERE key='zones'").fetchone()[0])
                    if category not in categories or unit not in units or region not in zones:
                        return self.json({"error": "Choisissez une catégorie, une unité et une zone autorisées."}, 400)
                    if not valid_product_image(image):
                        return self.json({"error": "Photo non autorisée."}, 400)
                except (TypeError, ValueError):
                    return self.json({"error": "Renseignez un nom, un prix, une unité, une région et un stock valides."}, 400)
                content_changed = any(old[key] != value for key, value in (("name", name), ("category", category),
                    ("price", price), ("unit", unit), ("region", region), ("image", image), ("description", description)))
                status = "pending" if content_changed else old["status"]
                db.execute("""UPDATE products SET name=?,category=?,price=?,unit=?,stock=?,region=?,image=?,description=?,status=? WHERE id=?""",
                           (name, category, price, unit, stock, region, image, description, status, pid))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (producer["id"], "product", pid, "update", "Stock: %s → %s; statut: %s → %s" % (old["stock"], stock, old["status"], status)))
                return self.json({"ok": True, "status": status, "message": "Fiche mise à jour."})
            if parsed.path.startswith("/api/products/") and parsed.path.endswith("/toggle"):
                producer = self.require_user(db, ["producer", "admin"])
                if not producer:
                    return
                try:
                    pid = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Produit introuvable."}, 404)
                old = db.execute("SELECT status FROM products WHERE id=? AND producer_id=?", (pid, producer["id"])).fetchone()
                if not old:
                    return self.json({"error": "Produit introuvable."}, 404)
                status = "pending" if old["status"] == "inactive" else "inactive"
                db.execute("UPDATE products SET status=? WHERE id=?", (status, pid))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (producer["id"], "product", pid, "toggle", old["status"] + " → " + status))
                return self.json({"ok": True, "status": status})
            if parsed.path.startswith("/api/orders/") and parsed.path.endswith("/status") and not parsed.path.endswith("/delivery/status"):
                actor = self.require_user(db, ["producer", "admin"])
                if not actor:
                    return
                try:
                    order_id = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Commande introuvable."}, 404)
                order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                if not order or (actor["role"] == "producer" and order["producer_id"] != actor["id"]):
                    return self.json({"error": "Commande introuvable."}, 404)
                status = str(data.get("status", ""))
                transitions = {
                    "pending_confirmation": {"accepted", "cancelled"},
                    "accepted": {"preparing", "cancelled"},
                    "preparing": {"ready", "cancelled"},
                    "ready": {"delivered"},
                }
                if status not in transitions.get(order["status"], set()):
                    return self.json({"error": "Cette transition de commande n'est pas autorisée."}, 400)
                if status == "accepted" and order["delivery_method"] == "delivery" and not order["delivery_fee_accepted"]:
                    return self.json({"error": "L'acheteur doit accepter les frais de livraison avant confirmation."}, 409)
                if status == "delivered" and order["delivery_method"] == "delivery" and order["delivery_status"] != "in_transit":
                    return self.json({"error": "Démarrez d'abord la livraison avant de confirmer la remise."}, 409)
                reason = str(data.get("reason", "")).strip()[:500]
                if status == "cancelled" and len(reason) < 5:
                    return self.json({"error": "Indiquez un motif d'annulation d'au moins 5 caractères."}, 400)
                items = db.execute("SELECT product_id,quantity FROM order_items WHERE order_id=?", (order_id,)).fetchall()
                if status == "accepted":
                    for item in items:
                        if item["product_id"] is None:
                            continue
                        stock = db.execute("SELECT stock FROM products WHERE id=?", (item["product_id"],)).fetchone()
                        if not stock or stock["stock"] < item["quantity"]:
                            return self.json({"error": "Le stock a changé. Vérifiez la disponibilité avant de confirmer."}, 409)
                    for item in items:
                        if item["product_id"] is not None:
                            db.execute("UPDATE products SET stock=stock-? WHERE id=?", (item["quantity"],item["product_id"]))
                if status == "cancelled" and order["status"] in ("accepted","preparing"):
                    for item in items:
                        if item["product_id"] is not None:
                            db.execute("UPDATE products SET stock=stock+? WHERE id=?", (item["quantity"],item["product_id"]))
                db.execute("UPDATE orders SET status=? WHERE id=?", (status,order_id))
                if status == "delivered" and order["delivery_method"] == "delivery":
                    db.execute("UPDATE orders SET delivery_status='delivered' WHERE id=?", (order_id,))
                elif status == "cancelled" and order["delivery_method"] == "delivery":
                    db.execute("UPDATE orders SET delivery_status='failed' WHERE id=?", (order_id,))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (actor["id"], "order", order_id, "status", order["status"] + " → " + status + (" ; " + reason if reason else "")))
                db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)", (order["buyer_id"],"Votre commande " + order["code"] + " : " + status.replace("_"," ") + "."))
                return self.json({"ok": True, "status": status})
            if parsed.path.startswith("/api/orders/") and parsed.path.endswith("/delivery/accept"):
                buyer = self.require_user(db, ["buyer", "admin"])
                if not buyer:
                    return
                try:
                    order_id = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Commande introuvable."}, 404)
                order = db.execute("SELECT * FROM orders WHERE id=? AND buyer_id=?", (order_id,buyer["id"])).fetchone()
                if not order or order["status"] != "pending_confirmation" or order["delivery_status"] != "quoted":
                    return self.json({"error": "Aucun tarif de livraison à valider."}, 400)
                accepted = bool(data.get("accepted"))
                if accepted:
                    db.execute("UPDATE orders SET delivery_fee_accepted=1,delivery_status='confirmed' WHERE id=?", (order_id,))
                else:
                    db.execute("UPDATE orders SET status='cancelled',delivery_status='failed' WHERE id=?", (order_id,))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (buyer["id"], "order", order_id, "delivery_fee", "accepté" if accepted else "refusé"))
                if order["producer_id"]:
                    db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)",
                               (order["producer_id"],"Frais de livraison " + ("acceptés" if accepted else "refusés") + " pour " + order["code"] + "."))
                return self.json({"ok": True, "accepted": accepted})
            if parsed.path.startswith("/api/orders/") and parsed.path.endswith("/delivery/status"):
                actor = self.require_user(db, ["producer", "admin"])
                if not actor:
                    return
                try:
                    order_id = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Commande introuvable."}, 404)
                order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                if not order or (actor["role"] == "producer" and order["producer_id"] != actor["id"]):
                    return self.json({"error": "Commande introuvable."}, 404)
                status = str(data.get("status", ""))
                if order["delivery_method"] != "delivery" or order["status"] != "ready" or order["delivery_status"] != "confirmed" or status != "in_transit":
                    return self.json({"error": "Cette étape de livraison n'est pas disponible."}, 400)
                db.execute("UPDATE orders SET delivery_status='in_transit' WHERE id=?", (order_id,))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (actor["id"], "order", order_id, "delivery_status", "in_transit"))
                db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)",
                           (order["buyer_id"],"Votre commande " + order["code"] + " est en livraison."))
                return self.json({"ok": True, "delivery_status": "in_transit"})
            if parsed.path.startswith("/api/orders/") and parsed.path.endswith("/delivery"):
                actor = self.require_user(db, ["producer", "admin"])
                if not actor:
                    return
                try:
                    order_id = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Commande introuvable."}, 404)
                order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                if not order or (actor["role"] == "producer" and order["producer_id"] != actor["id"]):
                    return self.json({"error": "Commande introuvable."}, 404)
                try:
                    fee = int(data.get("fee"))
                    zone = str(data.get("zone", "")).strip()
                    responsible = str(data.get("responsible", "")).strip()[:120]
                    zones = json.loads(db.execute("SELECT value FROM settings WHERE key='zones'").fetchone()[0])
                    if order["delivery_method"] != "delivery" or order["status"] != "pending_confirmation" or not 0 <= fee <= 1_000_000 or zone not in zones or len(responsible) < 2:
                        raise ValueError
                except (TypeError, ValueError):
                    return self.json({"error": "Indiquez une zone, un responsable et des frais de livraison valides."}, 400)
                db.execute("""UPDATE orders SET delivery_fee=?,delivery_zone=?,delivery_responsible=?,
                           delivery_status='quoted',delivery_fee_accepted=0 WHERE id=?""",
                           (fee,zone,responsible,order_id))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (actor["id"], "order", order_id, "delivery_quote", "%s Ar · %s · %s" % (fee,zone,responsible)))
                db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)",
                           (order["buyer_id"],"Frais de livraison de " + str(fee) + " Ar à valider pour " + order["code"] + "."))
                return self.json({"ok": True, "delivery_fee": fee, "delivery_status": "quoted"})
            if parsed.path.startswith("/api/orders/") and parsed.path.endswith("/payment"):
                actor = self.require_user(db, ["producer", "admin"])
                if not actor:
                    return
                try:
                    order_id = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Commande introuvable."}, 404)
                order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                if not order or (actor["role"] == "producer" and order["producer_id"] != actor["id"]):
                    return self.json({"error": "Commande introuvable."}, 404)
                reference = str(data.get("reference", "")).strip()[:120]
                if order["payment_status"] != "pending" or order["status"] == "cancelled":
                    return self.json({"error": "Ce paiement ne peut plus être confirmé."}, 400)
                if order["payment_method"] == "at_delivery" and order["status"] != "delivered":
                    return self.json({"error": "Confirmez d'abord la remise de la commande."}, 400)
                if len(reference) < 5:
                    return self.json({"error": "Indiquez une référence ou un reçu vérifié."}, 400)
                db.execute("UPDATE orders SET payment_status='confirmed' WHERE id=?", (order_id,))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (actor["id"], "order", order_id, "payment_confirmed", reference))
                db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)",
                           (order["buyer_id"], "Paiement de la commande " + order["code"] + " confirmé manuellement."))
                return self.json({"ok": True, "payment_status": "confirmed"})
            if parsed.path.startswith("/api/products/") and parsed.path.endswith("/moderate"):
                admin = self.require_user(db, ["admin"])
                if not admin:
                    return
                try:
                    pid = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Produit introuvable."}, 404)
                status = data.get("status")
                if status not in ("published", "rejected"):
                    return self.json({"error": "Décision invalide."}, 400)
                row = db.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
                if not row:
                    return self.json({"error": "Produit introuvable."}, 404)
                db.execute("UPDATE products SET status=? WHERE id=?", (status,pid))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (admin["id"], "product", pid, "moderate", row["status"] + " → " + status))
                if row["producer_id"]:
                    db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)", (row["producer_id"],"Votre fiche « " + row["name"] + " » a été " + ("publiée." if status=="published" else "refusée.")))
                return self.json({"ok": True})
            if parsed.path.startswith("/api/users/") and parsed.path.endswith("/verify"):
                admin = self.require_user(db, ["admin"])
                if not admin:
                    return
                try:
                    uid = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Utilisateur introuvable."}, 404)
                result = db.execute("UPDATE users SET verified=? WHERE id=? AND role='producer'", (int(bool(data.get("verified", True))),uid))
                if not result.rowcount:
                    return self.json({"error": "Producteur introuvable."}, 404)
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (admin["id"], "user", uid, "verify", str(bool(data.get("verified", True)))))
                return self.json({"ok": True})
            if parsed.path.startswith("/api/users/") and parsed.path.endswith("/active"):
                admin = self.require_user(db, ["admin"])
                if not admin:
                    return
                try:
                    uid = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Utilisateur introuvable."}, 404)
                target = db.execute("SELECT id,role FROM users WHERE id=?", (uid,)).fetchone()
                if not target or target["role"] == "admin" or uid == admin["id"]:
                    return self.json({"error": "Ce compte ne peut pas être modifié."}, 403)
                active = int(bool(data.get("active")))
                db.execute("UPDATE users SET active=? WHERE id=?", (active, uid))
                if not active:
                    db.execute("DELETE FROM sessions WHERE user_id=?", (uid,))
                    if target["role"] == "producer":
                        db.execute("UPDATE products SET status='inactive' WHERE producer_id=? AND status='published'", (uid,))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (admin["id"], "user", uid, "active", str(active)))
                return self.json({"ok": True, "active": active})
            if parsed.path == "/api/admin/settings":
                admin = self.require_user(db, ["admin"])
                if not admin:
                    return
                try:
                    clean = {}
                    for key in ("categories", "units", "zones"):
                        value = data.get(key)
                        if not isinstance(value, list) or not 1 <= len(value) <= 30:
                            raise ValueError
                        entries = [str(item).strip() for item in value]
                        if any(not 1 <= len(item) <= 60 for item in entries) or len(set(entries)) != len(entries):
                            raise ValueError
                        clean[key] = entries
                    rate = float(data.get("commission_percent"))
                    fee = int(data.get("service_fee"))
                    if not 0 <= rate <= 100 or not 0 <= fee <= 1_000_000:
                        raise ValueError
                    clean["commission_percent"] = rate
                    clean["service_fee"] = fee
                except (TypeError, ValueError):
                    return self.json({"error": "Vérifiez les catégories, unités, zones et frais saisis."}, 400)
                for key, value in clean.items():
                    db.execute("UPDATE settings SET value=? WHERE key=?", (json.dumps(value, ensure_ascii=False), key))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (admin["id"], "settings", 0, "update", json.dumps(clean, ensure_ascii=False)))
                return self.json({"ok": True, "settings": clean})
            if parsed.path == "/api/claims":
                buyer = self.require_user(db, ["buyer", "admin"])
                if not buyer:
                    return
                code = str(data.get("order_code", "")).strip()
                order = db.execute("SELECT * FROM orders WHERE code=? AND buyer_id=?", (code,buyer["id"])).fetchone()
                if not order or order["status"] != "delivered":
                    return self.json({"error": "Une réclamation est possible après une commande livrée."}, 400)
                reason = str(data.get("reason", "other"))[:80]
                details = str(data.get("details", "")).strip()[:1000]
                db.execute("INSERT INTO claims(order_id,buyer_id,reason,details) VALUES(?,?,?,?)", (order["id"],buyer["id"],reason,details))
                if order["producer_id"]:
                    db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)", (order["producer_id"],"Une réclamation a été ouverte pour " + order["code"] + "."))
                return self.json({"ok": True}, 201)
            if parsed.path.startswith("/api/claims/") and parsed.path.endswith("/resolve"):
                admin = self.require_user(db, ["admin"])
                if not admin:
                    return
                try:
                    cid = int(parsed.path.split("/")[3])
                except (ValueError, IndexError):
                    return self.json({"error": "Réclamation introuvable."}, 404)
                claim = db.execute("SELECT * FROM claims WHERE id=?", (cid,)).fetchone()
                if not claim:
                    return self.json({"error": "Réclamation introuvable."}, 404)
                status = str(data.get("status", ""))
                resolution = str(data.get("resolution", "")).strip()[:1000]
                if claim["status"] != "open" or status not in ("resolved", "rejected") or len(resolution) < 5:
                    return self.json({"error": "Choisissez une décision et décrivez-la en cinq caractères au moins."}, 400)
                db.execute("UPDATE claims SET status=?,resolution=?,resolved_at=CURRENT_TIMESTAMP WHERE id=?",
                           (status, resolution, cid))
                db.execute("INSERT INTO audit_events(actor_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?)",
                           (admin["id"], "claim", cid, status, resolution))
                db.execute("INSERT INTO notifications(user_id,text) VALUES(?,?)",
                           (claim["buyer_id"], "Votre réclamation a été traitée : " + resolution[:140]))
                return self.json({"ok": True, "status": status})
            if parsed.path == "/api/reviews":
                buyer = self.require_user(db, ["buyer"])
                if not buyer:
                    return
                code = str(data.get("order_code", "")).strip()
                order = db.execute("SELECT * FROM orders WHERE code=? AND buyer_id=? AND status='delivered'", (code,buyer["id"])).fetchone()
                rating = data.get("rating")
                if not order or not isinstance(rating, int) or not 1 <= rating <= 5:
                    return self.json({"error": "L'avis est disponible après livraison. Choisissez une note de 1 à 5."}, 400)
                first = db.execute("SELECT product_id FROM order_items WHERE order_id=? LIMIT 1", (order["id"],)).fetchone()
                try:
                    db.execute("INSERT INTO reviews(order_id,buyer_id,product_id,rating,comment) VALUES(?,?,?,?,?)",
                               (order["id"],buyer["id"],first["product_id"],rating,str(data.get("comment",""))[:700]))
                except sqlite3.IntegrityError:
                    return self.json({"error": "Vous avez déjà évalué cette commande."}, 409)
                return self.json({"ok": True}, 201)
            return self.json({"error": "Route inconnue."}, 404)

    def login_user(self, db, user_id):
        token = secrets.token_urlsafe(32)
        db.execute("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
                   (hashlib.sha256(token.encode()).hexdigest(),user_id,int(time.time())+SESSION_TTL))
        user = db.execute("SELECT id,name,email,phone,role,verified,phone_verified FROM users WHERE id=?", (user_id,)).fetchone()
        return self.json({"ok": True, "user": dict(user)}, headers={
            "Set-Cookie": SESSION_COOKIE + "=" + token + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + str(SESSION_TTL)
        })

def main():
    parser = argparse.ArgumentParser(description="Lancer MadaAgri Market en local")
    parser.add_argument("--demo", action="store_true", help="Créer des comptes locaux de démonstration")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    args = parser.parse_args()
    init_db(args.demo)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), AppHandler)
    print("MadaAgri Market prêt sur http://127.0.0.1:%s" % args.port)
    if args.demo:
        print("Démo locale : acheteur@madaagri.test / acheteur123")
        print("Démo locale : producteur@madaagri.test / producteur123")
        print("Démo locale : coop@madaagri.test / coop12345")
        print("Démo locale : lalao@madaagri.test / lalao12345")
        print("Démo locale : soa@madaagri.test / fermesoa123")
        print("Démo locale : admin@madaagri.test / admin123")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

