"""HTTP checks for the local MVP using an isolated SQLite database."""
import base64
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server


class QuietHandler(server.AppHandler):
    def log_message(self, *_args):
        pass


class ApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(dir=server.ROOT)
        server.DB = Path(cls.temp.name) / "test.sqlite3"
        server.init_db(demo=True)
        cls.http = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        cls.base = f"http://127.0.0.1:{cls.http.server_port}"
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.thread.join(timeout=2)
        cls.temp.cleanup()

    def request(self, path, body=None, cookie=None):
        data = None if body is None else json.dumps(body).encode()
        headers = {"Content-Type": "application/json"}
        if cookie:
            headers["Cookie"] = cookie
        req = Request(self.base + "/api" + path, data=data, headers=headers,
                      method="POST" if body is not None else "GET")
        try:
            response = urlopen(req, timeout=5)
        except HTTPError as error:
            response = error
        raw = response.read()
        return response.status, json.loads(raw), response.headers.get("Set-Cookie", "")

    def login(self, email, password):
        code, data, header = self.request("/login", {"email": email, "password": password})
        self.assertEqual(code, 200, data)
        return header.split(";", 1)[0]

    def test_admin_settings_and_account_status(self):
        admin = self.login("admin@madaagri.test", "admin123")
        code, data, _ = self.request("/register", {"name": "Acheteur Suspendu", "email": "suspendu@example.test",
                                             "password": "password123", "role": "buyer"})
        self.assertEqual(code, 200)
        uid = data["user"]["id"]
        code, _, _ = self.request(f"/users/{uid}/active", {"active": False}, cookie=admin)
        self.assertEqual(code, 200)
        code, _, _ = self.request("/login", {"email": "suspendu@example.test", "password": "password123"})
        self.assertEqual(code, 401)
        code, _, _ = self.request(f"/users/{uid}/active", {"active": True}, cookie=admin)
        self.assertEqual(code, 200)
        code, _, _ = self.request("/login", {"email": "suspendu@example.test", "password": "password123"})
        self.assertEqual(code, 200)
        code, data, _ = self.request("/admin", cookie=admin)
        original = data["settings"]
        configured = {**original, "service_fee": 500, "commission_percent": 2.5}
        try:
            code, _, _ = self.request("/admin/settings", configured, cookie=admin)
            self.assertEqual(code, 200)
            code, data, _ = self.request("/bootstrap")
            self.assertEqual(data["catalog_config"]["service_fee"], 500)
            buyer = self.login("acheteur@madaagri.test", "acheteur123")
            code, data, _ = self.request("/orders", {"items": [{"product_id": 1, "quantity": 1}],
                                     "delivery_method": "pickup", "payment_method": "at_delivery"}, cookie=buyer)
            self.assertEqual(code, 201, data)
            self.assertEqual(data["known_total"], data["subtotal"] + 500)
        finally:
            self.request("/admin/settings", original, cookie=admin)

    def test_catalog_auth_and_permissions(self):
        code, data, _ = self.request("/bootstrap")
        self.assertEqual(code, 200)
        self.assertGreaterEqual(len(data["products"]), 6)
        buyer = self.login("acheteur@madaagri.test", "acheteur123")
        code, _, _ = self.request("/producer/products", cookie=buyer)
        self.assertEqual(code, 403)
        code, _, _ = self.request("/admin", cookie=buyer)
        self.assertEqual(code, 403)

    def test_static_files_are_limited_to_the_frontend_and_assets(self):
        def get(path):
            try:
                response = urlopen(self.base + path, timeout=5)
            except HTTPError as error:
                response = error
            return response.status, response.read()
        for path in ("/madaagri.sqlite3", "/server.py", "/assets/../server.py", "/tests/test_api.py"):
            code, body = get(path)
            self.assertNotIn(b"SQLite format", body, path)
            self.assertNotIn(b"import sqlite3", body, path)
            self.assertNotIn(b"import server", body, path)
        code, body = get("/assets/product-photos/tomates.webp")
        self.assertEqual((code, body[:4]), (200, b"RIFF"))
        code, body = get("/commandes/12")  # client-side route
        self.assertIn(code, (200, 503))  # 503 only when the React build is missing

    def test_phone_verification(self):
        code, data, header = self.request("/register", {"name": "Fara Rakoto", "email": "fara@example.test",
                                                    "password": "password123", "role": "buyer",
                                                    "phone": "+261 34 12 345 28"})
        self.assertEqual(code, 200, data)
        self.assertEqual(data["user"]["phone_verified"], 0)
        cookie = header.split(";", 1)[0]
        code, _, _ = self.request("/phone/send", {})
        self.assertEqual(code, 401)
        code, data, _ = self.request("/phone/send", {"phone": "12"}, cookie=cookie)
        self.assertEqual(code, 400)
        code, data, _ = self.request("/phone/send", {}, cookie=cookie)
        self.assertEqual(code, 200, data)
        self.assertEqual((data["phone"], len(data["demo_code"])), ("+261341234528", 6))
        code, _, _ = self.request("/phone/send", {}, cookie=cookie)
        self.assertEqual(code, 429)
        wrong = "000000" if data["demo_code"] != "000000" else "111111"
        code, _, _ = self.request("/phone/verify", {"code": wrong}, cookie=cookie)
        self.assertEqual(code, 400)
        code, _, _ = self.request("/phone/verify", {"code": data["demo_code"]}, cookie=cookie)
        self.assertEqual(code, 200)
        code, data, _ = self.request("/bootstrap", cookie=cookie)
        self.assertEqual(data["user"]["phone_verified"], 1)

    def test_delivery_quote_flow(self):
        buyer = self.login("acheteur@madaagri.test", "acheteur123")
        producer = self.login("producteur@madaagri.test", "producteur123")
        code, data, _ = self.request("/orders", {"items": [{"product_id": 1, "quantity": 1}],
                                 "delivery_method": "delivery", "payment_method": "mvola",
                                 "delivery_address": "Lot II M 45, Analamahitsy"}, cookie=buyer)
        self.assertEqual(code, 201, data)
        oid = data["id"]
        code, _, _ = self.request(f"/orders/{oid}/status", {"status": "accepted"}, cookie=producer)
        self.assertEqual(code, 409)
        code, data, _ = self.request(f"/orders/{oid}/delivery", {"fee": 2000, "zone": "Antananarivo",
                                                            "responsible": "Ferme Rakoto"}, cookie=producer)
        self.assertEqual((code, data["delivery_status"]), (200, "quoted"))
        code, _, _ = self.request(f"/orders/{oid}/delivery/accept", {"accepted": True}, cookie=buyer)
        self.assertEqual(code, 200)
        for status in ("accepted", "preparing", "ready"):
            code, data, _ = self.request(f"/orders/{oid}/status", {"status": status}, cookie=producer)
            self.assertEqual(code, 200, data)
        code, _, _ = self.request(f"/orders/{oid}/status", {"status": "delivered"}, cookie=producer)
        self.assertEqual(code, 409)
        code, _, _ = self.request(f"/orders/{oid}/delivery/status", {"status": "in_transit"}, cookie=producer)
        self.assertEqual(code, 200)
        code, _, _ = self.request(f"/orders/{oid}/status", {"status": "delivered"}, cookie=producer)
        self.assertEqual(code, 200)

    def test_demo_moderation_queue(self):
        admin = self.login("admin@madaagri.test", "admin123")
        code, data, _ = self.request("/admin", cookie=admin)
        self.assertEqual(code, 200)
        self.assertGreaterEqual(len([p for p in data["products"] if p["status"] == "pending"]), 3)
        self.assertGreaterEqual(len([u for u in data["users"] if u["role"] == "producer" and not u["verified"]]), 3)

    def test_producer_product_lifecycle_and_claim(self):
        buyer = self.login("acheteur@madaagri.test", "acheteur123")
        producer = self.login("producteur@madaagri.test", "producteur123")
        admin = self.login("admin@madaagri.test", "admin123")
        payload = {"name": "Carottes du jardin", "category": "Légumes", "price": 2400,
                   "unit": "kg", "stock": 8, "region": "Antsirabe", "image": "tomates.png",
                   "description": "Récolte locale"}
        code, _, _ = self.request("/products", payload, cookie=producer)
        self.assertEqual(code, 201)
        code, data, _ = self.request("/producer/products", cookie=producer)
        product = next(p for p in data["products"] if p["name"] == payload["name"])
        pid = product["id"]
        self.assertEqual(product["status"], "pending")
        code, data, _ = self.request("/bootstrap")
        self.assertNotIn(pid, [p["id"] for p in data["products"]])

        code, _, _ = self.request(f"/products/{pid}/moderate", {"status": "published"}, cookie=buyer)
        self.assertEqual(code, 403)
        code, _, _ = self.request(f"/products/{pid}/moderate", {"status": "published"}, cookie=admin)
        self.assertEqual(code, 200)
        code, _, _ = self.request(f"/products/{pid}/update", {"stock": 5}, cookie=buyer)
        self.assertEqual(code, 403)
        code, data, _ = self.request(f"/products/{pid}/update", {"stock": 5}, cookie=producer)
        self.assertEqual((code, data["status"]), (200, "published"))
        code, data, _ = self.request("/bootstrap")
        self.assertEqual(next(p["stock"] for p in data["products"] if p["id"] == pid), 5)
        code, data, _ = self.request("/orders", {"items": [{"product_id": pid, "quantity": 2}],
                      "delivery_method": "pickup", "payment_method": "at_delivery"}, cookie=buyer)
        self.assertEqual(code, 201, data)
        order_code = data["code"]
        code, data, _ = self.request("/orders", cookie=producer)
        order = next(o for o in data["orders"] if o["code"] == order_code)
        self.assertEqual(order["payment_status"], "pending")
        for status in ("accepted", "preparing", "ready", "delivered"):
            code, data, _ = self.request(f"/orders/{order['id']}/status", {"status": status}, cookie=producer)
            self.assertEqual(code, 200, data)
        code, _, _ = self.request(f"/orders/{order['id']}/payment", {"reference": "Reçu 12345"}, cookie=buyer)
        self.assertEqual(code, 403)
        code, data, _ = self.request(f"/orders/{order['id']}/payment", {"reference": "Reçu 12345"}, cookie=producer)
        self.assertEqual((code, data["payment_status"]), (200, "confirmed"))
        code, _, _ = self.request("/claims", {"order_code": order_code, "reason": "quality",
                                   "details": "Produit endommagé"}, cookie=buyer)
        self.assertEqual(code, 201)
        code, data, _ = self.request("/admin", cookie=admin)
        claim = next(c for c in data["claims"] if c["code"] == order_code)
        code, _, _ = self.request(f"/claims/{claim['id']}/resolve", {"status": "resolved",
                                   "resolution": "Remboursement à convenir avec le producteur"}, cookie=buyer)
        self.assertEqual(code, 403)
        code, data, _ = self.request(f"/claims/{claim['id']}/resolve", {"status": "resolved",
                                   "resolution": "Remboursement à convenir avec le producteur"}, cookie=admin)
        self.assertEqual(code, 200, data)
        code, data, _ = self.request("/admin", cookie=admin)
        self.assertEqual(next(c for c in data["claims"] if c["id"] == claim["id"])["status"], "resolved")
        code, data, _ = self.request(f"/products/{pid}/toggle", {}, cookie=producer)
        self.assertEqual((code, data["status"]), (200, "inactive"))
        code, data, _ = self.request("/bootstrap")
        self.assertNotIn(pid, [p["id"] for p in data["products"]])

    def test_cancellation_restores_stock_and_reset(self):
        buyer = self.login("acheteur@madaagri.test", "acheteur123")
        producer = self.login("producteur@madaagri.test", "producteur123")
        code, data, _ = self.request("/bootstrap")
        stock_before = next(p["stock"] for p in data["products"] if p["id"] == 1)
        code, data, _ = self.request("/orders", {"items": [{"product_id": 1, "quantity": 1}],
                                 "delivery_method": "pickup", "payment_method": "at_delivery"}, cookie=buyer)
        self.assertEqual(code, 201, data)
        order_code = data["code"]
        code, data, _ = self.request("/orders", cookie=producer)
        order = next(o for o in data["orders"] if o["code"] == order_code)
        oid = order["id"]
        code, _, _ = self.request(f"/orders/{oid}/payment", {"reference": "Cash receipt"}, cookie=producer)
        self.assertEqual(code, 400)
        code, _, _ = self.request(f"/orders/{oid}/status", {"status": "accepted"}, cookie=producer)
        self.assertEqual(code, 200)
        code, data, _ = self.request("/bootstrap")
        self.assertEqual(next(p["stock"] for p in data["products"] if p["id"] == 1), stock_before - 1)
        code, _, _ = self.request(f"/orders/{oid}/status", {"status": "cancelled", "reason": ""}, cookie=producer)
        self.assertEqual(code, 400)
        code, _, _ = self.request(f"/orders/{oid}/status", {"status": "cancelled", "reason": "Stock abîmé"}, cookie=producer)
        self.assertEqual(code, 200)
        code, data, _ = self.request("/bootstrap")
        self.assertEqual(next(p["stock"] for p in data["products"] if p["id"] == 1), stock_before)
        code, _, _ = self.request("/register", {"name": "Compte Reset", "email": "reset@example.test",
                                              "password": "password123", "role": "buyer"})
        self.assertEqual(code, 200)
        code, data, _ = self.request("/password-reset/request", {"email": "reset@example.test"})
        self.assertEqual(code, 200)
        code, _, _ = self.request("/password-reset/confirm", {"token": data["demo_token"],
                                                          "password": "newpassword123"})
        self.assertEqual(code, 200)
        code, _, _ = self.request("/login", {"email": "reset@example.test", "password": "password123"})
        self.assertEqual(code, 401)
        code, _, _ = self.request("/login", {"email": "reset@example.test", "password": "newpassword123"})
        self.assertEqual(code, 200)

    def test_photo_upload_and_unverified_producer(self):
        buyer = self.login("acheteur@madaagri.test", "acheteur123")
        producer = self.login("producteur@madaagri.test", "producteur123")
        sample = (b"\x89PNG\r\n\x1a\n" + b"0" * 24 + b"IEND\xaeB`\x82")
        payload = {"data": base64.b64encode(sample).decode()}
        code, _, _ = self.request("/uploads", payload, cookie=buyer)
        self.assertEqual(code, 403)
        code, data, _ = self.request("/uploads", payload, cookie=producer)
        self.assertEqual(code, 201, data)
        uploaded = server.ROOT / "assets" / "product-photos" / data["image"]
        try:
            self.assertEqual(uploaded.read_bytes(), sample)
            code, _, _ = self.request("/products", {"name": "Courgettes fraîches", "category": "Légumes",
                                 "price": 3000, "unit": "kg", "stock": 4, "region": "Antsirabe",
                                 "image": data["image"]}, cookie=producer)
            self.assertEqual(code, 201)
        finally:
            uploaded.unlink(missing_ok=True)
        code, _, _ = self.request("/register", {"name": "Ferme Test", "email": "ferme-test@example.test",
                                         "password": "password123", "role": "producer"})
        self.assertEqual(code, 200)
        unverified = self.login("ferme-test@example.test", "password123")
        code, _, _ = self.request("/products", {"name": "Patates", "category": "Légumes", "price": 1000,
                                  "unit": "kg", "stock": 1, "region": "Antsirabe",
                                  "image": "tomates.png"}, cookie=unverified)
        self.assertEqual(code, 403)


if __name__ == "__main__":
    unittest.main()
