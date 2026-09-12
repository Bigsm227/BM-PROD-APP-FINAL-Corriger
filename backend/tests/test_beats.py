"""Beats endpoints (public + admin CRUD/soft-delete)."""
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


class TestBeatsPublic:
    def test_get_beats_returns_seeded(self, s):
        r = s.get(f"{API}/beats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        titles = {b["title"] for b in data}
        expected = {"Afro Zouk Love Vol. 1", "Kalangu Lema vibe", "Niamey Trap Melodic"}
        assert expected.issubset(titles)
        for b in data:
            assert "_id" not in b
            assert b["published"] is True
            for k in ("id", "title", "genre", "tempo"):
                assert k in b


class TestAdminBeatsAuth:
    def test_admin_beats_requires_token(self, s):
        assert s.get(f"{API}/admin/beats", timeout=15).status_code == 401

    def test_admin_create_requires_token(self, s):
        r = s.post(f"{API}/admin/beats", json={"title": "x", "genre": "x", "tempo": "x"}, timeout=15)
        assert r.status_code == 401

    def test_admin_delete_requires_token(self, s):
        r = s.delete(f"{API}/admin/beats/nonexistent", timeout=15)
        assert r.status_code == 401


class TestAdminBeatsCRUD:
    def test_list_admin_beats(self, s, auth):
        r = s.get(f"{API}/admin/beats", headers=auth, timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_create_and_soft_delete_beat(self, s, auth):
        title = f"TEST_Beat_{uuid.uuid4().hex[:6]}"
        payload = {"title": title, "genre": "TestGenre", "tempo": "120 BPM", "published": True}
        cr = s.post(f"{API}/admin/beats", headers=auth, json=payload, timeout=15)
        assert cr.status_code == 200, cr.text
        beat = cr.json()
        assert beat["title"] == title
        assert "id" in beat
        bid = beat["id"]

        # Should appear in public list
        pub = s.get(f"{API}/beats", timeout=15).json()
        assert any(b["id"] == bid for b in pub)

        # Soft delete
        dr = s.delete(f"{API}/admin/beats/{bid}", headers=auth, timeout=15)
        assert dr.status_code == 200
        assert dr.json().get("success") is True

        # Public list should exclude it
        pub2 = s.get(f"{API}/beats", timeout=15).json()
        assert not any(b["id"] == bid for b in pub2)

        # Admin list should also exclude it
        admin_list = s.get(f"{API}/admin/beats", headers=auth, timeout=15).json()
        assert not any(b["id"] == bid for b in admin_list)

    def test_delete_nonexistent_beat(self, s, auth):
        r = s.delete(f"{API}/admin/beats/nonexistent-id", headers=auth, timeout=15)
        assert r.status_code == 404
