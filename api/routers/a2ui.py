import json
import time
from datetime import date
from typing import Any, Dict, Generator, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from api.config import supabase


router = APIRouter(prefix="/a2ui", tags=["a2ui"])


class A2UIActionRequest(BaseModel):
    action: str
    context: Dict[str, Any] = Field(default_factory=dict)
    values: Dict[str, Any] = Field(default_factory=dict)


def _sse(event: str, data: Dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


def _ui_message(title: str, components: list, description: Optional[str] = None) -> Dict[str, Any]:
    msg: Dict[str, Any] = {
        "version": "demo-1.0",
        "components": components,
        "metadata": {"title": title, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
    }
    if description:
        msg["metadata"]["description"] = description
    return msg


@router.get("/health")
async def health():
    try:
        resp = supabase.table("restaurants").select("id").limit(1).execute()
        return {"ok": True, "restaurants_sample": len(resp.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/restaurants")
async def list_restaurants(limit: int = 10):
    try:
        resp = supabase.table("restaurants").select("id,name,city,cuisine,price_level,rating").limit(limit).execute()
        return {"data": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/restaurant/stream")
async def restaurant_stream(q: str = Query("", description="User request text")):
    started_at_ms = int(time.time() * 1000)
    request_id = f"req_{started_at_ms}"

    def gen() -> Generator[str, None, None]:
        yield _sse("meta", {"requestId": request_id, "startedAtMs": started_at_ms})

        loading = _ui_message(
            title="餐厅预订",
            description="正在查询可预订餐厅…",
            components=[
                {
                    "type": "card",
                    "id": "loading",
                    "properties": {"title": "正在查询…", "description": "请稍候，正在从数据库检索餐厅"},
                    "children": [
                        {
                            "type": "list",
                            "id": "loading_list",
                            "properties": {
                                "items": [
                                    {"label": "阶段", "value": "连接数据库"},
                                    {"label": "阶段", "value": "查询餐厅"},
                                    {"label": "阶段", "value": "准备可交互UI"},
                                ]
                            },
                        }
                    ],
                }
            ],
        )
        yield _sse("a2ui", {"message": loading, "serverTimeMs": int(time.time() * 1000)})

        time.sleep(0.35)

        text = (q or "").strip()
        city = None
        cuisine = None
        for c in ["Shanghai", "Beijing", "Shenzhen", "Hangzhou", "上海", "北京", "深圳", "杭州"]:
            if c.lower() in text.lower():
                city = "Shanghai" if c in ["Shanghai", "上海"] else "Beijing" if c in ["Beijing", "北京"] else "Shenzhen" if c in ["Shenzhen", "深圳"] else "Hangzhou"
                break

        for cu in ["Sichuan", "Japanese", "Italian", "French", "Seafood", "Vegetarian", "Chinese", "川菜", "日料", "意大利", "法餐", "海鲜", "素食", "中餐"]:
            if cu.lower() in text.lower():
                cuisine = (
                    "Sichuan"
                    if cu in ["Sichuan", "川菜"]
                    else "Japanese"
                    if cu in ["Japanese", "日料"]
                    else "Italian"
                    if cu in ["Italian", "意大利"]
                    else "French"
                    if cu in ["French", "法餐"]
                    else "Seafood"
                    if cu in ["Seafood", "海鲜"]
                    else "Vegetarian"
                    if cu in ["Vegetarian", "素食"]
                    else "Chinese"
                )
                break

        query = supabase.table("restaurants").select("id,name,city,cuisine,price_level,rating").limit(8)
        if city:
            query = query.eq("city", city)
        if cuisine:
            query = query.eq("cuisine", cuisine)

        resp = query.execute()
        restaurants = resp.data or []

        results_components = []
        if not restaurants:
            results_components.append(
                {
                    "type": "card",
                    "id": "no-results",
                    "properties": {"title": "没有匹配餐厅", "description": "请换个城市/菜系试试：上海/北京/深圳/杭州 + 川菜/日料/意大利/法餐/海鲜"},
                }
            )
        else:
            cards = []
            for r in restaurants:
                cards.append(
                    {
                        "type": "card",
                        "id": f"r_{r['id']}",
                        "properties": {
                            "title": r["name"],
                            "description": f"{r['city']} · {r['cuisine']} · 评分 {r['rating']} · ￥等级 {r['price_level']}",
                        },
                        "children": [
                            {
                                "type": "button",
                                "id": f"book_{r['id']}",
                                "properties": {
                                    "label": "预订这家",
                                    "variant": "primary",
                                    "action": "open_booking_form",
                                    "context": {"restaurantId": r["id"], "restaurantName": r["name"]},
                                },
                            }
                        ],
                    }
                )

            results_components.append(
                {
                    "type": "card",
                    "id": "results",
                    "properties": {"title": "可预订餐厅", "description": "点击“预订这家”进入填写信息"},
                    "children": [
                        {
                            "type": "list",
                            "id": "restaurant_cards",
                            "properties": {"grid": True},
                            "children": cards,
                        }
                    ],
                }
            )

        results = _ui_message(title="餐厅预订", components=results_components)
        yield _sse("a2ui", {"message": results, "serverTimeMs": int(time.time() * 1000)})
        yield _sse("done", {"requestId": request_id, "endedAtMs": int(time.time() * 1000)})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.post("/action")
async def handle_action(payload: A2UIActionRequest):
    action = payload.action
    context = payload.context or {}
    values = payload.values or {}

    if action == "open_booking_form":
        restaurant_id = context.get("restaurantId")
        restaurant_name = context.get("restaurantName")
        if not restaurant_id:
            raise HTTPException(status_code=400, detail="restaurantId is required")

        form = _ui_message(
            title="填写预订信息",
            description=f"{restaurant_name or '所选餐厅'}",
            components=[
                {
                    "type": "card",
                    "id": "booking",
                    "properties": {"title": "预订信息", "description": restaurant_name or ""},
                    "children": [
                        {
                            "type": "form",
                            "id": "booking_form",
                            "properties": {
                                "action": "create_reservation",
                                "fields": ["contact_name", "contact_phone", "date", "time", "guests", "note"],
                                "context": {"restaurantId": restaurant_id, "restaurantName": restaurant_name},
                            },
                            "children": [
                                {"type": "input", "id": "contact_name", "properties": {"label": "姓名", "required": True, "placeholder": "张三"}},
                                {"type": "input", "id": "contact_phone", "properties": {"label": "手机号", "placeholder": "13800000000"}},
                                {"type": "input", "id": "date", "properties": {"label": "日期", "type": "date", "required": True}},
                                {"type": "input", "id": "time", "properties": {"label": "时间", "type": "time", "required": True}},
                                {"type": "input", "id": "guests", "properties": {"label": "人数", "type": "number", "required": True, "placeholder": "2"}},
                                {"type": "input", "id": "note", "properties": {"label": "备注", "placeholder": "靠窗/不吃辣等"}},
                                {"type": "button", "id": "submit", "properties": {"label": "确认预订", "variant": "primary", "fullWidth": True, "submit": True}},
                            ],
                        }
                    ],
                }
            ],
        )
        return {"message": "请填写预订信息", "a2uiData": form}

    if action == "create_reservation":
        restaurant_id = context.get("restaurantId")
        restaurant_name = context.get("restaurantName")
        if not restaurant_id:
            raise HTTPException(status_code=400, detail="restaurantId is required")

        contact_name = (values.get("contact_name") or "").strip()
        if not contact_name:
            raise HTTPException(status_code=400, detail="contact_name is required")

        try:
            guests = int(values.get("guests") or 0)
        except Exception:
            guests = 0

        if guests <= 0:
            raise HTTPException(status_code=400, detail="guests must be > 0")

        dt = values.get("date")
        tm = values.get("time")
        if not dt or not tm:
            raise HTTPException(status_code=400, detail="date and time are required")

        insert_payload = {
            "restaurant_id": restaurant_id,
            "contact_name": contact_name,
            "contact_phone": (values.get("contact_phone") or "").strip() or None,
            "date": dt,
            "time": tm,
            "guests": guests,
            "note": (values.get("note") or "").strip() or None,
        }

        resp = supabase.table("reservations").insert(insert_payload).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create reservation")

        reservation = resp.data[0]
        confirmation = _ui_message(
            title="预订成功",
            description=f"{restaurant_name or ''}",
            components=[
                {
                    "type": "card",
                    "id": "confirmed",
                    "properties": {
                        "title": "已确认",
                        "description": f"{contact_name} · {reservation['date']} {reservation['time']} · {guests}人",
                    },
                    "children": [
                        {
                            "type": "list",
                            "id": "details",
                            "properties": {
                                "items": [
                                    {"label": "订单号", "value": reservation["id"]},
                                    {"label": "餐厅", "value": restaurant_name or restaurant_id},
                                    {"label": "状态", "value": reservation["status"]},
                                ]
                            },
                        }
                    ],
                }
            ],
        )
        return {"message": "预订已创建并写入数据库", "a2uiData": confirmation}

    raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
