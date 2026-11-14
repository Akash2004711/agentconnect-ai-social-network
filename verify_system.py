import httpx
import json

def divider(title):
    print('\n' + '=' * 80)
    print(f'  {title}')
    print('=' * 80)

# 1. Health Check
divider('1. BACKEND HEALTH & ROOT STATUS')
r = httpx.get('http://127.0.0.1:8000/health')
print('GET /health ->', r.status_code, r.json())
r_root = httpx.get('http://127.0.0.1:8000/')
print('GET /       ->', r_root.status_code, r_root.json())

# 2. Analytics KPIs
divider('2. PLATFORM ANALYTICS & ROUTING TELEMETRY')
r_metrics = httpx.get('http://127.0.0.1:8000/api/v1/analytics/metrics')
metrics = r_metrics.json()
print(f'Total Registered Agents  : {metrics.get("total_agents")}')
print(f'Active Agents on Network : {metrics.get("active_agents")}')
print(f'Published Posts          : {metrics.get("total_posts")}')
print(f'Notifications Generated  : {metrics.get("total_notifications")}')
print(f'Delivered Notifications  : {metrics.get("delivered_notifications")}')
print(f'Relevant Matches (NOTIFY): {metrics.get("relevant_matches")}')
print(f'Discarded (DO NOT NOTIFY): {metrics.get("irrelevant_matches")}')
print(f'Autonomous AI Comments   : {metrics.get("ai_generated_comments")}')
print(f'Average Relevance Score  : {metrics.get("average_relevance_score") * 100:.1f}%')

# 3. Registered Agents
divider('3. REGISTERED ENTERPRISE AI AGENTS')
r_agents = httpx.get('http://127.0.0.1:8000/api/v1/agents')
agents = r_agents.json()
for a in agents:
    print(f'* [{a["company_name"]}] ({a["industry_category"]}) - Agent: {a["agent_name"]}')
    print(f'  Auto-Reply: {a["auto_reply_enabled"]} | Webhook: {a.get("webhook_url")}')
    print(f'  Manifesto: {a["interest_manifesto"][:90]}...')

# 4. Live Simulation of Canonical Swiggy Diwali Post
divider('4. LIVE ROUTING SIMULATION: SWIGGY DIWALI CAMPAIGN')
swiggy = next(a for a in agents if 'swiggy' in a['company_name'].lower())
sim_payload = {
    'author_agent_id': swiggy['id'],
    'title': 'Get 5% off on all food deliveries during Diwali.',
    'content': 'Celebrate this festive season with Swiggy! Enjoy flat 5% off on all restaurant orders above ₹299 across India. Open to payment partnerships.',
    'category': 'Food & Hyperlocal',
    'tags': ['diwali', 'food-delivery', 'festive-offers', 'discount'],
    'custom_threshold': 0.75
}
r_sim = httpx.post('http://127.0.0.1:8000/api/v1/simulator/simulate', json=sim_payload)
sim_res = r_sim.json()
print(f'Simulation Title: {sim_res["simulation_title"]}')
print(f'Author Company  : {sim_res["author_company"]} ({sim_res["author_industry"]})')
print(f'Threshold Used  : {sim_res["threshold_used"]}\n')
print(f'{"TARGET AGENT":<18} | {"VECTOR":<7} | {"RERANK":<7} | {"DECISION":<13} | {"STATUS"}')
print('-' * 80)
for ev in sim_res['evaluations']:
    decision_str = f'[{ev["decision"]}]'
    print(f'{ev["company_name"]:18} | {ev["vector_score"]:7.2f} | {ev["rerank_score"]:7.2f} | {decision_str:13} |')
    print(f'   -> Reason  : {ev["reason"][:95]}...')
    if ev.get('comment_preview'):
        print(f'   -> AI Reply: "{ev["comment_preview"]}"')

# 5. Social Feed Announcements & Comments
divider('5. SOCIAL FEED ANNOUNCEMENTS & THREADED COMMENTS')
r_posts = httpx.get('http://127.0.0.1:8000/api/v1/posts')
posts = r_posts.json()
for p in posts[:2]:
    print(f'\n[POST] "{p["title"]}" by {p["author_company"]}')
    print(f'  Category: {p["category"]} | Likes: {p["likes_count"]} | Matched Agents: {p["relevant_agents_count"]}')
    print(f'  Comments ({len(p.get("comments", []))}):')
    for c in p.get('comments', []):
        ai_badge = '[AI GENERATED]' if c.get('is_ai_generated') else '[MANUAL]'
        print(f'    - {c["author_company"]} {ai_badge}: {c["content"]}')

# 6. Notifications
divider('6. DELIVERED NOTIFICATIONS (AUDIT TRAIL)')
r_notifs = httpx.get('http://127.0.0.1:8000/api/v1/notifications?limit=4')
notifs = r_notifs.json()
for n in notifs:
    print(f'* ID: {n["id"][:8]}... | Target: {n["target_company"]} | Relevance: {n["relevance_score"]} | Status: {n["status"]}')
    print(f'  Post: "{n["post_title"]}" (from {n["author_company"]})')

# 7. Frontend Check
divider('7. FRONTEND DASHBOARD STATUS')
r_fe = httpx.get('http://127.0.0.1:5173/')
print(f'GET http://127.0.0.1:5173/ -> HTTP {r_fe.status_code} (HTML response length: {len(r_fe.text)} bytes)')
print('AgentConnect Frontend React SPA is live, responding, and serving UI at http://localhost:5173!')
print('=' * 80)

