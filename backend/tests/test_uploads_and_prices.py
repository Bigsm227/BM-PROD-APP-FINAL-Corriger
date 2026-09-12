"""New feature coverage: beat prices, preview_url persistence, upload auth + object serve."""
import io
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@bigsmedia.com"
ADMIN_PASSWORD = "BigS2026!Admin"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def auth(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# ---- Beat prices in seeded data ----
class TestBeatPrices:
    def test_seeded_beats_have_prices(self, s):
        r = s.get(f"{API}/beats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        seeded_titles = {"Afro Zouk Love Vol. 1", "Kalangu Lema vibe", "Niamey Trap Melodic"}
        seeded = [b for b in data if b["title"] in seeded_titles]
        assert len(seeded) == 3
        for b in seeded:
            assert b.get("price"), f"Missing price on {b['title']}"
            assert "FCFA" in b["price"].upper()


# ---- Admin create with price + preview_url persistence ----
class TestBeatCreateWithPriceAndPreview:
    def test_create_with_price_preview_persists(self, s, auth):
        title = f"TEST_Beat_{uuid.uuid4().hex[:6]}"
        payload = {
            "title": title,
            "genre": "Test",
            "tempo": "100 BPM",
            "price": "12 345 FCFA",
            "preview_url": "https://example.com/preview.mp3",
            "published": True,
        }
        cr = s.post(f"{API}/admin/beats", headers=auth, json=payload, timeout=15)
        assert cr.status_code == 200, cr.text
        beat = cr.json()
        bid = beat["id"]
        assert beat["price"] == "12 345 FCFA"
        assert beat["preview_url"] == "https://example.com/preview.mp3"

        # Verify via GET /api/beats persistence
        pub = s.get(f"{API}/beats", timeout=15).json()
        found = next((b for b in pub if b["id"] == bid), None)
        assert found is not None
        assert found["price"] == "12 345 FCFA"
        assert found["preview_url"] == "https://example.com/preview.mp3"

        # Cleanup
        s.delete(f"{API}/admin/beats/{bid}", headers=auth, timeout=15)


# ---- Upload endpoint auth + object serve ----
class TestUpload:
    def test_upload_requires_auth(self, s):
        files = {"file": ("test.txt", io.BytesIO(b"hi"), "text/plain")}
        r = s.post(f"{API}/upload", files=files, timeout=30)
        assert r.status_code == 401

    def test_upload_and_public_serve(self, s, auth):
        content = b"hello-bigsmedia-" + uuid.uuid4().hex.encode()
        files = {"file": (f"test-{uuid.uuid4().hex[:6]}.txt", io.BytesIO(content), "text/plain")}
        r = s.post(f"{API}/upload", headers=auth, files=files, timeout=60)
        # Storage might not be initialised in preview; accept 502/402 but only if not otherwise reachable
        if r.status_code in (402, 502):
            pytest.skip(f"Object storage unavailable in preview: {r.status_code} {r.text}")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "path" in body and body["path"]
        # Public GET
        g = s.get(f"{API}/files/{body['path']}", timeout=30)
        assert g.status_code == 200
        assert g.content == content


# ---- Admin project create + servable image ----
class TestProjectCreateAndImage:
    def test_create_project_appears_in_portfolio(self, s, auth):
        title = f"TEST_Project_{uuid.uuid4().hex[:6]}"
        payload = {
            "title": title,
            "category": "TestCat",
            "description": "desc",
            "image_url": "https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e",
            "year": "2026",
            "published": True,
        }
        cr = s.post(f"{API}/admin/portfolio", headers=auth, json=payload, timeout=15)
        assert cr.status_code == 200, cr.text
        pid = cr.json()["id"]
        pub = s.get(f"{API}/portfolio", timeout=15).json()
        assert any(p["id"] == pid for p in pub)
        # Cleanup
        s.delete(f"{API}/admin/portfolio/{pid}", headers=auth, timeout=15)
