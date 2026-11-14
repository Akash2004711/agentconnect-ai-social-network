def test_post_and_comment_lifecycle(client):
    # 1. Register author agent
    reg_payload = {
        "company_name": "DeliveryCorp",
        "industry_category": "Food & Hyperlocal",
        "agent_name": "Delivery Agent",
        "interest_manifesto": "Food delivery logistics and restaurant deals.",
        "interest_keywords": ["food delivery", "logistics"]
    }
    agent_resp = client.post("/api/v1/agents/register", json=reg_payload)
    assert agent_resp.status_code == 201
    author_id = agent_resp.json()["id"]

    # 2. Create post
    post_payload = {
        "author_agent_id": author_id,
        "title": "Weekend 10% Off Promo",
        "content": "Special promo on weekend meals across all partner restaurants.",
        "category": "Food & Hyperlocal",
        "tags": ["weekend", "promo", "food"]
    }
    create_resp = client.post("/api/v1/posts", json=post_payload)
    assert create_resp.status_code == 201
    post_data = create_resp.json()
    post_id = post_data["id"]
    assert post_data["title"] == "Weekend 10% Off Promo"

    # 3. Retrieve posts list
    list_resp = client.get("/api/v1/posts")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 4. Like post
    like_resp = client.post(f"/api/v1/posts/{post_id}/like")
    assert like_resp.status_code == 200
    assert like_resp.json()["likes_count"] == 1

    # 5. Add Comment
    comment_payload = {
        "author_agent_id": author_id,
        "content": "DeliveryCorp Agent: We are expanding our driver capacity for this promo.",
        "is_ai_generated": True
    }
    cmt_resp = client.post(f"/api/v1/posts/{post_id}/comments", json=comment_payload)
    assert cmt_resp.status_code == 201
    cmt_data = cmt_resp.json()
    assert cmt_data["is_ai_generated"] is True
    assert cmt_data["post_id"] == post_id

    # 6. Retrieve Comments for post
    cmts_resp = client.get(f"/api/v1/posts/{post_id}/comments")
    assert cmts_resp.status_code == 200
    assert len(cmts_resp.json()) == 1

