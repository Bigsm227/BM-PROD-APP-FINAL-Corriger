"""Big S Media Production - Backend API tests."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://bigsmedia-app.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@bigsmedia.com"
ADMIN_PASSWORD = "BigS2026!Admin"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Public ----------------
class TestPublic:
    def test_services(self, s):
        r = s.get(f"{API}/services", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 2
        ids = {x["id"] for x in data}
        assert ids == {"production", "numerisation"}
        for svc in data:
            assert svc.get("features") and isinstance(svc["features"], list)

    def test_portfolio_list_and_detail(self, s):
        r = s.get(f"{API}/portfolio", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        for p in items:
            assert "_id" not in p
            assert p["published"] is True
        pid = items[0]["id"]
        r2 = s.get(f"{API}/portfolio/{pid}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["id"] == pid

    def test_portfolio_404(self, s):
        r = s.get(f"{API}/portfolio/not-a-real-id", timeout=15)
        assert r.status_code == 404


# ---------------- Quotes & Appointments ----------------
class TestForms:
    def test_create_quote(self, s):
        payload = {
            "name": "TEST_QuoteUser",
            "email": "test_quote@example.com",
            "phone": "+33 6 00 00 00 00",
            "service_type": "production",
            "budget": "5000-10000",
            "message": "TEST quote message",
        }
        r = s.post(f"{API}/quotes", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["status"] == "nouveau"
        assert j["email"] == payload["email"]
        assert "id" in j

    def test_create_appointment(self, s):
        payload = {
            "name": "TEST_ApptUser",
            "email": "test_appt@example.com",
            "phone": "+33 6 11 11 11 11",
            "service_type": "numerisation",
            "date": "2026-02-15",
            "time": "10:30",
            "notes": "TEST appointment",
        }
        r = s.post(f"{API}/appointments", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["status"] == "en_attente"
        assert j["date"] == "2026-02-15"

    def test_quote_validation_bad_email(self, s):
        r = s.post(f"{API}/quotes", json={
            "name": "x", "email": "not-an-email", "service_type": "production", "message": "m"
        }, timeout=15)
        assert r.status_code == 422


# ---------------- Auth ----------------
class TestAuth:
    def test_login_success(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("token_type") == "bearer"

    def test_login_wrong(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_token(self, s):
        r = s.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_ok(self, s, auth):
        r = s.get(f"{API}/auth/me", headers=auth, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------------- Admin protected ----------------
class TestAdminUnauth:
    @pytest.mark.parametrize("path", [
        "/admin/stats", "/admin/quotes", "/admin/appointments", "/admin/portfolio",
    ])
    def test_endpoints_require_auth(self, s, path):
        r = s.get(f"{API}{path}", timeout=15)
        assert r.status_code == 401


class TestAdminFlows:
    def test_stats(self, s, auth):
        r = s.get(f"{API}/admin/stats", headers=auth, timeout=15)
        assert r.status_code == 200
        j = r.json()
        for k in ("quotes", "new_quotes", "appointments", "pending_appointments", "projects"):
            assert k in j
            assert isinstance(j[k], int)

    def test_update_quote_status(self, s, auth):
        # create then update
        pay = {"name": "TEST_Q2", "email": "t2@example.com", "service_type": "autre", "message": "m"}
        cr = s.post(f"{API}/quotes", json=pay, timeout=15)
        qid = cr.json()["id"]
        r = s.patch(f"{API}/admin/quotes/{qid}", headers=auth, json={"status": "en_cours"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "en_cours"
        # verify persistence
        list_r = s.get(f"{API}/admin/quotes", headers=auth, timeout=15)
        found = [x for x in list_r.json() if x["id"] == qid]
        assert found and found[0]["status"] == "en_cours"

    def test_update_appointment_status(self, s, auth):
        pay = {"name": "TEST_A2", "email": "a2@example.com", "service_type": "production", "date": "2026-03-01", "time": "14:00"}
        cr = s.post(f"{API}/appointments", json=pay, timeout=15)
        aid = cr.json()["id"]
        r = s.patch(f"{API}/admin/appointments/{aid}", headers=auth, json={"status": "confirme"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "confirme"

    def test_project_create_and_soft_delete(self, s, auth):
        payload = {
            "title": f"TEST_Project_{uuid.uuid4().hex[:6]}",
            "category": "Test",
            "description": "TEST project description",
            "image_url": "https://example.com/img.jpg",
            "year": "2026",
            "published": True,
        }
        cr = s.post(f"{API}/admin/portfolio", headers=auth, json=payload, timeout=15)
        assert cr.status_code == 200, cr.text
        pid = cr.json()["id"]

        # visible on public list
        pub = s.get(f"{API}/portfolio", timeout=15).json()
        assert any(p["id"] == pid for p in pub)

        # soft delete
        dr = s.delete(f"{API}/admin/portfolio/{pid}", headers=auth, timeout=15)
        assert dr.status_code == 200
        assert dr.json().get("success") is True

        # should disappear from public list
        pub2 = s.get(f"{API}/portfolio", timeout=15).json()
        assert not any(p["id"] == pid for p in pub2)

        # detail should now 404
        det = s.get(f"{API}/portfolio/{pid}", timeout=15)
        assert det.status_code == 404
