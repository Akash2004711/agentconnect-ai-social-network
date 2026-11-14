import pytest
from app.routing.engine import routing_engine
from app.models.agent import Agent, AgentPreference
from app.models.post import Post
from app.models.notification import RoutingLog, Notification
from app.services.embedding import embedding_service

def test_semantic_relevance_routing_pipeline(db_session):
    # Setup test agents
    swiggy_text = "Swiggy Food & Hyperlocal. Food delivery restaurant promotions and diwali discounts."
    swiggy = Agent(
        company_name="Swiggy Test",
        industry_category="Food & Hyperlocal",
        agent_name="Swiggy Agent",
        interest_manifesto=swiggy_text,
        interest_embedding=embedding_service.get_embedding(swiggy_text),
        is_active=True,
        auto_reply_enabled=True
    )
    db_session.add(swiggy)
    db_session.flush()

    phonepe_text = "PhonePe Payments & Fintech. UPI payments, cashback campaigns, food delivery offers and merchant discounts."
    phonepe = Agent(
        company_name="PhonePe Test",
        industry_category="Payments & Fintech",
        agent_name="PhonePe Agent",
        interest_manifesto=phonepe_text,
        interest_embedding=embedding_service.get_embedding(phonepe_text),
        is_active=True,
        auto_reply_enabled=True
    )
    db_session.add(phonepe)
    db_session.flush()
    phonepe_pref = AgentPreference(
        agent_id=phonepe.id,
        interest_keywords=["upi", "cashback", "food delivery", "discounts"],
        min_relevance_threshold=0.75
    )
    db_session.add(phonepe_pref)

    bajaj_text = "Bajaj Auto Automotive & Mobility. Automobile vehicle sales, 2-wheeler motorcycle financing and dealership."
    bajaj = Agent(
        company_name="Bajaj Auto Test",
        industry_category="Automotive & Mobility",
        agent_name="Bajaj Auto Agent",
        interest_manifesto=bajaj_text,
        interest_embedding=embedding_service.get_embedding(bajaj_text),
        is_active=True,
        auto_reply_enabled=True
    )
    db_session.add(bajaj)
    db_session.flush()
    bajaj_pref = AgentPreference(
        agent_id=bajaj.id,
        interest_keywords=["automobile", "motorcycle", "vehicle financing"],
        min_relevance_threshold=0.75
    )
    db_session.add(bajaj_pref)

    # Inactive agent
    inactive_agent = Agent(
        company_name="Inactive Logistics",
        industry_category="Logistics & Supply Chain",
        agent_name="Inactive Agent",
        interest_manifesto="Delivery logistics",
        interest_embedding=embedding_service.get_embedding("Delivery logistics"),
        is_active=False
    )
    db_session.add(inactive_agent)
    db_session.flush()

    db_session.commit()

    # Create post published by Swiggy
    post_title = "Get 5% off on all food deliveries during Diwali."
    post_content = "Celebrate this festive season with Swiggy! Enjoy flat 5% off on all restaurant orders above ₹299 across India. Open to payment partnerships."
    full_text = f"{post_title} {post_content}"

    post = Post(
        author_agent_id=swiggy.id,
        title=post_title,
        content=post_content,
        category="Food & Hyperlocal",
        tags=["diwali", "food-delivery", "festive-offers", "discount"],
        post_embedding=embedding_service.get_embedding(full_text)
    )
    db_session.add(post)
    db_session.commit()

    # Execute Routing Pipeline
    result = routing_engine.route_post(db_session, post.id)

    # 1. Author must NOT be notified
    assert not any(m["agent_id"] == swiggy.id for m in result["matches"])

    # 2. Inactive agent must be excluded in Stage A
    inactive_log = db_session.query(RoutingLog).filter(
        RoutingLog.post_id == post.id,
        RoutingLog.target_agent_id == inactive_agent.id
    ).first()
    assert inactive_log is not None
    assert inactive_log.status == "FILTERED_OUT"

    # 3. PhonePe must be NOTIFY with high relevance (>= 0.75)
    phonepe_log = db_session.query(RoutingLog).filter(
        RoutingLog.post_id == post.id,
        RoutingLog.target_agent_id == phonepe.id
    ).first()
    assert phonepe_log is not None
    assert phonepe_log.status == "NOTIFY"
    assert phonepe_log.rerank_score >= 0.75

    # 4. Bajaj Auto must be DO NOT NOTIFY with score below threshold
    bajaj_log = db_session.query(RoutingLog).filter(
        RoutingLog.post_id == post.id,
        RoutingLog.target_agent_id == bajaj.id
    ).first()
    assert bajaj_log is not None
    assert bajaj_log.status == "DO_NOT_NOTIFY"
    assert bajaj_log.rerank_score < 0.75

    # 5. Check notification created for PhonePe
    notif = db_session.query(Notification).filter(
        Notification.post_id == post.id,
        Notification.agent_id == phonepe.id
    ).first()
    assert notif is not None
    assert notif.status == "Delivered"

