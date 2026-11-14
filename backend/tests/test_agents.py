def test_agent_registration_and_auth(client):
    payload = {
        "company_name": "TestCorp",
        "industry_category": "Payments & Fintech",
        "agent_name": "TestCorp Agent",
        "description": "Fintech payment processing agent",
        "interest_manifesto": "Focuses on UPI payments, online merchant checkout, and cashback discount offers.",
        "interest_keywords": ["upi", "cashback", "payments", "checkout"],
        "webhook_url": "http://127.0.0.1:8000/api/v1/mock-webhook/testcorp",
        "auto_reply_enabled": True,
        "min_relevance_threshold": 0.75
    }
    resp = client.post("/api/v1/agents/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["company_name"] == "TestCorp"
    assert "api_key" in data
    assert data["api_key"].startswith("agnt_live_")
    agent_id = data["id"]

    # Verify duplicate registration rejection
    dup_resp = client.post("/api/v1/agents/register", json=payload)
    assert dup_resp.status_code == 409

    # Verify retrieval
    get_resp = client.get(f"/api/v1/agents/{agent_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["company_name"] == "TestCorp"

    # Test Deactivation & Activation
    deact_resp = client.post(f"/api/v1/agents/{agent_id}/deactivate")
    assert deact_resp.status_code == 200
    assert deact_resp.json()["is_active"] is False

    act_resp = client.post(f"/api/v1/agents/{agent_id}/activate")
    assert act_resp.status_code == 200
    assert act_resp.json()["is_active"] is True

