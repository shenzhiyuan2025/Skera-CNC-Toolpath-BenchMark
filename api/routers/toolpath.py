import math
import re
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel


router = APIRouter(prefix="/toolpath", tags=["toolpath"])


class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class IssueCategory(str, Enum):
    safety = "safety"
    efficiency = "efficiency"
    stability = "stability"
    surface = "surface"
    tool_life = "tool_life"
    gcode_quality = "gcode_quality"
    strategy = "strategy"
    failfast = "failfast"


class IssueModel(BaseModel):
    code: str
    category: IssueCategory
    severity: Severity
    message: str
    line_no: Optional[int] = None
    suggestion: Optional[str] = None
    penalty: float = 0.0


class SegmentModel(BaseModel):
    line_no: int
    mode: str
    start: Dict[str, float]
    end: Dict[str, float]
    length: float
    feed: Optional[float]


class ScoreBreakdownModel(BaseModel):
    safety: float
    efficiency: float
    stability: float
    surface: float
    tool_life: float
    gcode_quality: float
    strategy: float
    total: float


class EvaluationResponse(BaseModel):
    fail_fast: bool
    score: ScoreBreakdownModel
    issues: List[IssueModel]
    simulation: List[SegmentModel]
    metrics: Dict[str, float]
    suggestions: List[str]


@dataclass
class Pose:
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    a: float = 0.0
    b: float = 0.0
    c: float = 0.0

    def to_dict(self) -> Dict[str, float]:
        return {
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "a": self.a,
            "b": self.b,
            "c": self.c,
        }


@dataclass
class Segment:
    line_no: int
    mode: str
    start: Pose
    end: Pose
    feed: Optional[float]

    @property
    def length(self) -> float:
        return math.sqrt(
            (self.end.x - self.start.x) ** 2
            + (self.end.y - self.start.y) ** 2
            + (self.end.z - self.start.z) ** 2
        )

    @property
    def has_xy_motion(self) -> bool:
        return abs(self.end.x - self.start.x) > 1e-9 or abs(self.end.y - self.start.y) > 1e-9

    @property
    def rotary_jump(self) -> float:
        return max(abs(self.end.a - self.start.a), abs(self.end.b - self.start.b), abs(self.end.c - self.start.c))


SUPPORTED_GCODES = {0, 1, 2, 3, 4, 17, 18, 19, 20, 21, 28, 40, 41, 42, 43, 49, 53, 54, 55, 56, 57, 58, 59, 61, 64, 73, 80, 81, 82, 83, 84, 85, 86, 89, 90, 91, 92, 93, 94, 95, 98, 99}
SUPPORTED_MCODES = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 30}
WEIGHTS = {
    "safety": 30.0,
    "efficiency": 12.0,
    "stability": 10.0,
    "surface": 20.0,
    "tool_life": 5.0,
    "gcode_quality": 8.0,
    "strategy": 15.0,
}
MACHINE_LIMITS = {
    "x": (-150.0, 150.0),
    "y": (-150.0, 150.0),
    "z": (-120.0, 200.0),
    "a": (-120.0, 120.0),
    "b": (-120.0, 120.0),
    "c": (-99999.0, 99999.0),
}
SAFE_Z = 10.0
MAX_TILT = 90.0
MAX_LOWZ_ROTARY_JUMP = 15.0
TOKEN_PATTERN = re.compile(r"([A-Za-z])\s*([-+]?\d+(?:\.\d+)?)")
MAX_SIMULATION_SEGMENTS = 1200
MAX_ISSUES = 2000


def _clean_line(line: str) -> str:
    no_semicolon = line.split(";")[0]
    return re.sub(r"\([^)]*\)", "", no_semicolon).strip().upper()


def _decode_upload_bytes(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-16", "gb18030"):
        try:
            decoded = data.decode(encoding)
        except UnicodeDecodeError:
            continue
        if decoded.strip():
            return decoded
    return data.decode("utf-8", errors="ignore")


def _append_issue(issues: List[IssueModel], issue: IssueModel, dropped_count: int) -> int:
    if len(issues) < MAX_ISSUES:
        issues.append(issue)
        return dropped_count
    return dropped_count + 1


def _parse_gcode(gcode: str) -> Tuple[List[Segment], List[IssueModel], Dict[str, float]]:
    issues: List[IssueModel] = []
    metrics: Dict[str, float] = {
        "total_lines": 0.0,
        "motion_segments": 0.0,
        "rapid_distance": 0.0,
        "cutting_distance": 0.0,
        "total_distance": 0.0,
        "estimated_time_min": 0.0,
        "short_segments": 0.0,
        "retract_count": 0.0,
        "feed_changes": 0.0,
    }
    segments: List[Segment] = []
    state = Pose()
    absolute_mode = True
    motion_mode = "G0"
    feed = 1200.0
    last_feed = feed
    dropped_issue_count = 0

    for line_no, raw in enumerate(gcode.splitlines(), start=1):
        cleaned = _clean_line(raw)
        if not cleaned:
            continue
        metrics["total_lines"] += 1
        tokens = TOKEN_PATTERN.findall(cleaned)
        if not tokens:
            continue

        words: Dict[str, float] = {}
        gcodes: List[int] = []
        mcodes: List[int] = []
        for letter, num in tokens:
            value = float(num)
            letter = letter.upper()
            words[letter] = value
            if letter == "G":
                gcodes.append(int(value))
            if letter == "M":
                mcodes.append(int(value))

        for g in gcodes:
            if g not in SUPPORTED_GCODES:
                dropped_issue_count = _append_issue(
                    issues,
                    IssueModel(
                        code="FAIL_C_001",
                        category=IssueCategory.failfast,
                        severity=Severity.critical,
                        message=f"红线C：G{g} 不在 LinuxCNC 支持列表",
                        line_no=line_no,
                        suggestion="检查后处理机床目标是否为 LinuxCNC",
                        penalty=100,
                    ),
                    dropped_issue_count,
                )
        for m in mcodes:
            if m not in SUPPORTED_MCODES:
                dropped_issue_count = _append_issue(
                    issues,
                    IssueModel(
                        code="FAIL_C_002",
                        category=IssueCategory.failfast,
                        severity=Severity.critical,
                        message=f"红线C：M{m} 不在 LinuxCNC 支持列表",
                        line_no=line_no,
                        suggestion="替换不兼容 M 代码并更新后处理模板",
                        penalty=100,
                    ),
                    dropped_issue_count,
                )

        if 90 in gcodes:
            absolute_mode = True
        if 91 in gcodes:
            absolute_mode = False

        for g in gcodes:
            if g in (0, 1, 2, 3):
                motion_mode = f"G{g}"

        if "F" in words:
            feed = words["F"]
            if abs(feed - last_feed) > 1e-6:
                metrics["feed_changes"] += 1
                last_feed = feed

        axis_letters = ("X", "Y", "Z", "A", "B", "C")
        if not any(letter in words for letter in axis_letters):
            continue

        start = Pose(state.x, state.y, state.z, state.a, state.b, state.c)
        end = Pose(state.x, state.y, state.z, state.a, state.b, state.c)

        for axis in axis_letters:
            if axis not in words:
                continue
            current = getattr(state, axis.lower())
            target_val = words[axis] if absolute_mode else current + words[axis]
            setattr(end, axis.lower(), target_val)

        seg = Segment(line_no=line_no, mode=motion_mode, start=start, end=end, feed=feed if motion_mode != "G0" else None)
        if len(segments) < MAX_SIMULATION_SEGMENTS:
            segments.append(seg)
        metrics["motion_segments"] += 1
        metrics["total_distance"] += seg.length
        if seg.length < 0.2:
            metrics["short_segments"] += 1
        if seg.mode == "G0":
            metrics["rapid_distance"] += seg.length
            if seg.end.z > seg.start.z + 0.5:
                metrics["retract_count"] += 1
        else:
            metrics["cutting_distance"] += seg.length
            feed_val = max(seg.feed or 1.0, 1.0)
            metrics["estimated_time_min"] += seg.length / feed_val

        for axis, (low, high) in MACHINE_LIMITS.items():
            val = getattr(end, axis)
            if val < low or val > high:
                dropped_issue_count = _append_issue(
                    issues,
                    IssueModel(
                        code="FAIL_D_001",
                        category=IssueCategory.failfast,
                        severity=Severity.critical,
                        message=f"红线D：{axis.upper()} 轴越界 {val:.3f}，限制 [{low}, {high}]",
                        line_no=line_no,
                        suggestion="检查工件零点、刀具长度补偿与后处理行程限制",
                        penalty=100,
                    ),
                    dropped_issue_count,
                )

        if seg.mode == "G0" and seg.has_xy_motion and min(seg.start.z, seg.end.z) < SAFE_Z:
            dropped_issue_count = _append_issue(
                issues,
                IssueModel(
                    code="FAIL_A_001",
                    category=IssueCategory.failfast,
                    severity=Severity.critical,
                    message=f"红线A：Safe Z({SAFE_Z}mm)以下发生 G0 XY 快移",
                    line_no=line_no,
                    suggestion="快移前先抬刀到 Safe Z 以上",
                    penalty=100,
                ),
                dropped_issue_count,
            )

        max_tilt = max(abs(end.a), abs(end.b))
        if max_tilt > MAX_TILT:
            dropped_issue_count = _append_issue(
                issues,
                IssueModel(
                    code="FAIL_B_001",
                    category=IssueCategory.failfast,
                    severity=Severity.critical,
                    message=f"红线B：刀轴倾角 {max_tilt:.2f}° 超出安全包络 {MAX_TILT}°",
                    line_no=line_no,
                    suggestion="降低 A/B 轴倾角上限或改用分度加工策略",
                    penalty=100,
                ),
                dropped_issue_count,
            )

        if min(seg.start.z, seg.end.z) < SAFE_Z and seg.rotary_jump > MAX_LOWZ_ROTARY_JUMP:
            dropped_issue_count = _append_issue(
                issues,
                IssueModel(
                    code="STB_001",
                    category=IssueCategory.stability,
                    severity=Severity.high,
                    message=f"低高度旋转跳变过大（{seg.rotary_jump:.2f}°）",
                    line_no=line_no,
                    suggestion="低高度区间减小旋转轴步进，避免抖动与干涉风险",
                    penalty=4,
                ),
                dropped_issue_count,
            )

        state = end

    if dropped_issue_count > 0 and len(issues) < MAX_ISSUES:
        issues.append(
            IssueModel(
                code="INFO_001",
                category=IssueCategory.gcode_quality,
                severity=Severity.info,
                message=f"问题数量过多，已截断显示，省略 {dropped_issue_count} 条",
                suggestion="建议先按关键红线问题分批修复后再复评",
                penalty=0,
            )
        )

    return segments, issues, metrics


def _score(segments: List[Segment], issues: List[IssueModel], metrics: Dict[str, float]) -> Tuple[ScoreBreakdownModel, List[str], bool]:
    fail_fast = any(issue.category == IssueCategory.failfast for issue in issues)
    dimension_penalty = {k: 0.0 for k in WEIGHTS.keys()}

    for issue in issues:
        if issue.category == IssueCategory.failfast:
            dimension_penalty["safety"] += 50
            continue
        category_to_key = {
            IssueCategory.safety: "safety",
            IssueCategory.efficiency: "efficiency",
            IssueCategory.stability: "stability",
            IssueCategory.surface: "surface",
            IssueCategory.tool_life: "tool_life",
            IssueCategory.gcode_quality: "gcode_quality",
            IssueCategory.strategy: "strategy",
        }
        key = category_to_key.get(issue.category)
        if key:
            dimension_penalty[key] += issue.penalty

    rapid_ratio = metrics["rapid_distance"] / max(metrics["total_distance"], 1e-6)
    short_ratio = metrics["short_segments"] / max(metrics["motion_segments"], 1.0)

    if rapid_ratio > 0.45:
        dimension_penalty["efficiency"] += (rapid_ratio - 0.45) * 20
        issues.append(
            IssueModel(
                code="EFF_001",
                category=IssueCategory.efficiency,
                severity=Severity.medium,
                message=f"空走比例偏高：{rapid_ratio:.1%}",
                suggestion="优化刀路排序，减少无效换刀位移",
                penalty=(rapid_ratio - 0.45) * 20,
            )
        )
    if short_ratio > 0.25:
        dimension_penalty["stability"] += (short_ratio - 0.25) * 20
        issues.append(
            IssueModel(
                code="STB_002",
                category=IssueCategory.stability,
                severity=Severity.medium,
                message=f"短线段密度偏高：{short_ratio:.1%}",
                suggestion="提高曲线拟合公差并启用刀路平滑",
                penalty=(short_ratio - 0.25) * 20,
            )
        )
    if metrics["feed_changes"] > 30:
        delta = (metrics["feed_changes"] - 30) * 0.15
        dimension_penalty["surface"] += delta
        issues.append(
            IssueModel(
                code="SUR_001",
                category=IssueCategory.surface,
                severity=Severity.low,
                message=f"进给切换过于频繁：{int(metrics['feed_changes'])} 次",
                suggestion="降低细碎 F 指令，按工序段分组设置进给",
                penalty=delta,
            )
        )
    if metrics["retract_count"] > max(8, metrics["motion_segments"] * 0.1):
        delta = min(5.0, metrics["retract_count"] * 0.2)
        dimension_penalty["strategy"] += delta
        issues.append(
            IssueModel(
                code="STR_001",
                category=IssueCategory.strategy,
                severity=Severity.low,
                message=f"抬刀次数偏多：{int(metrics['retract_count'])} 次",
                suggestion="合并相邻加工区域，减少不必要的回退与抬刀",
                penalty=delta,
            )
        )

    scores = {
        key: max(0.0, WEIGHTS[key] - dimension_penalty[key])
        for key in WEIGHTS.keys()
    }
    total = sum(scores.values())

    suggestions: List[str] = []
    if fail_fast:
        suggestions.append("先清除所有红线问题，再进行评分优化。")
    if rapid_ratio > 0.45:
        suggestions.append("启用区域分组和最短路径排序，降低空走比例。")
    if short_ratio > 0.25:
        suggestions.append("减小离散化密度或启用样条平滑，提升联动稳定性。")
    if metrics["feed_changes"] > 30:
        suggestions.append("按工序段统一进给策略，减少频繁 F 切换。")
    if not suggestions:
        suggestions.append("当前刀路质量稳定，可进一步针对表面纹理做精加工参数调优。")

    return (
        ScoreBreakdownModel(
            safety=round(scores["safety"], 2),
            efficiency=round(scores["efficiency"], 2),
            stability=round(scores["stability"], 2),
            surface=round(scores["surface"], 2),
            tool_life=round(scores["tool_life"], 2),
            gcode_quality=round(scores["gcode_quality"], 2),
            strategy=round(scores["strategy"], 2),
            total=round(total, 2),
        ),
        suggestions,
        fail_fast,
    )


def _build_simulation(segments: List[Segment], max_items: int = 1200) -> List[SegmentModel]:
    sampled = segments[:max_items]
    return [
        SegmentModel(
            line_no=s.line_no,
            mode=s.mode,
            start=s.start.to_dict(),
            end=s.end.to_dict(),
            length=round(s.length, 4),
            feed=s.feed,
        )
        for s in sampled
    ]


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_toolpath(
    file: Optional[UploadFile] = File(default=None),
    gcode_text: str = Form(default=""),
):
    text_source = gcode_text or ""
    source = text_source
    if file is not None:
        data = await file.read()
        file_source = _decode_upload_bytes(data)
        source = file_source if file_source.strip() else text_source

    if not source.strip():
        raise HTTPException(status_code=400, detail="请上传刀路文件或输入 G 代码文本")

    segments, issues, metrics = _parse_gcode(source)
    score, suggestions, fail_fast = _score(segments, issues, metrics)

    response = EvaluationResponse(
        fail_fast=fail_fast,
        score=score,
        issues=issues,
        simulation=_build_simulation(segments),
        metrics={
            key: round(value, 4) for key, value in metrics.items()
        },
        suggestions=suggestions,
    )
    return response
