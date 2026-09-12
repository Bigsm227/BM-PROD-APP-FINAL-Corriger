"""Backend tests for orders + two-license beats (iteration 4)."""
import os
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@bigsmedia.com"
ADMIN_PASSWORD = "BigS2026!Admin"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}


# --- Beats: two-license + preview -----------------------------------------
class TestBeatsPrices:
    def test_public_beats_have_two_prices(self):
        r = requests.get(f"{BASE_URL}/api/beats", timeout=30)
        assert r.status_code == 200
        beats = r.json()
        assert len(beats) >= 3
        for b in beats:
            assert "price_mp3" in b
            assert "price_wav" in b

    def test_afro_zouk_has_preview_url(self):
        r = requests.get(f"{BASE_URL}/api/beats", timeout=30)
        beats = r.json()
        afro = next((b for b in beats if "Afro Zouk" in b["title"]), None)
        assert afro is not None, "Afro Zouk beat missing"
        assert afro.get("preview_url"), "Afro Zouk preview_url is empty"


# --- Orders: public create + admin list + status cycle --------------------
class TestOrders:
    def test_create_order_public_no_auth(self):
        payload = {
            "beat_title": "TEST_Order Afro Zouk",
            "license": "MP3",
            "price": "15 000 FCFA",
            "method": "MyNita",
            "customer_name": "TEST_Buyer",
        }
        r = requests.post(f"{BASE_URL}/api/orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["beat_title"] == payload["beat_title"]
        assert data["license"] == "MP3"
        assert data["price"] == "15 000 FCFA"
        assert data["status"] == "nouveau"
        assert "id" in data
        pytest.order_id = data["id"]

    def test_admin_orders_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/orders", timeout=30)
        assert r.status_code == 401

    def test_admin_orders_lists_created(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/orders", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        orders = r.json()
        found = [o for o in orders if o["id"] == pytest.order_id]
        assert found, "Created order not found in admin list"
        assert found[0]["status"] == "nouveau"

    def test_patch_order_status_cycle(self, auth_headers):
        # nouveau -> en_cours
        r = requests.patch(f"{BASE_URL}/api/admin/orders/{pytest.order_id}",
                           json={"status": "en_cours"}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "en_cours"
        # en_cours -> traite
        r = requests.patch(f"{BASE_URL}/api/admin/orders/{pytest.order_id}",
                           json={"status": "traite"}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "traite"

    def test_patch_unknown_order_returns_404(self, auth_headers):
        r = requests.patch(f"{BASE_URL}/api/admin/orders/does-not-exist",
                           json={"status": "en_cours"}, headers=auth_headers, timeout=30)
        assert r.status_code == 404


# --- Admin: create beat with two prices -----------------------------------
class TestAdminCreateBeat:
    def test_create_beat_with_two_prices_appears_in_public(self, auth_headers):
        payload = {
            "title": "TEST_TwoPrice Beat",
            "genre": "TestGenre",
            "tempo": "100 BPM",
            "price_mp3": "12 345 FCFA",
            "price_wav": "23 456 FCFA",
            "published": True,
        }
        r = requests.post(f"{BASE_URL}/api/admin/beats", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["price_mp3"] == "12 345 FCFA"
        assert created["price_wav"] == "23 456 FCFA"
        beat_id = created["id"]
        # verify persistence via GET /api/beats
        r2 = requests.get(f"{BASE_URL}/api/beats", timeout=30)
        found = next((b for b in r2.json() if b["id"] == beat_id), None)
        assert found is not None
        assert found["price_mp3"] == "12 345 FCFA"
        assert found["price_wav"] == "23 456 FCFA"
        # cleanup
        requests.delete(f"{BASE_URL}/api/admin/beats/{beat_id}",
                        headers={"Authorization": auth_headers["Authorization"]}, timeout=30)
