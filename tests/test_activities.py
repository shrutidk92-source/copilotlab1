from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # expect at least one activity present
    assert len(data) > 0


def test_signup_and_remove_participant():
    activity_name = "Swimming Club"
    email = "testuser@example.com"

    # ensure clean state
    if email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(email)

    # signup
    resp = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert resp.status_code == 200
    body = resp.json()
    assert f"Signed up {email}" in body.get("message", "")
    assert email in activities[activity_name]["participants"]

    # signing up again should return 400
    resp2 = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert resp2.status_code == 400

    # remove participant
    resp3 = client.delete(f"/activities/{activity_name}/participants?email={email}")
    assert resp3.status_code == 200
    body3 = resp3.json()
    assert f"Removed {email}" in body3.get("message", "")
    assert email not in activities[activity_name]["participants"]


def test_remove_nonexistent_participant():
    activity_name = "Painting Workshop"
    email = "doesnotexist@example.com"

    # make sure it's not present
    if email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity_name}/participants?email={email}")
    assert resp.status_code == 404
    body = resp.json()
    assert body.get("detail") == "Participant not found in this activity"
