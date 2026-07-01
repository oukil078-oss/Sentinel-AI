"""Pydantic request/response models."""
from typing import Optional, Literal
from pydantic import BaseModel, Field, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str


class PredictRequest(BaseModel):
    time: float = 0.0
    amount: float = Field(..., ge=0.0)
    model: Literal["knn", "random_forest", "logistic_regression", "decision_tree", "svm"] = "random_forest"
    threshold: float = Field(0.5, ge=0.0, le=1.0)
    v1: float = 0.0
    v2: float = 0.0
    v3: float = 0.0
    v4: float = 0.0
    v5: float = 0.0
    v6: float = 0.0
    v7: float = 0.0
    v8: float = 0.0
    v9: float = 0.0
    v10: float = 0.0
    v11: float = 0.0
    v12: float = 0.0
    v13: float = 0.0
    v14: float = 0.0
    v15: float = 0.0
    v16: float = 0.0
    v17: float = 0.0
    v18: float = 0.0
    v19: float = 0.0
    v20: float = 0.0
    v21: float = 0.0
    v22: float = 0.0
    v23: float = 0.0
    v24: float = 0.0
    v25: float = 0.0
    v26: float = 0.0
    v27: float = 0.0
    v28: float = 0.0


class CaseCreate(BaseModel):
    case_id: Optional[str] = None
    tx_id: str
    title: str
    description: Optional[str] = ""
    amount: float = 0.0
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    assignee: Optional[str] = None
    risk_score: float = 0.0
    note: Optional[str] = None


class CaseUpdate(BaseModel):
    status: Optional[Literal["new", "in_review", "escalated", "resolved", "false_positive"]] = None
    priority: Optional[Literal["low", "medium", "high", "critical"]] = None
    assignee: Optional[str] = None
    note: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class RuleCreate(BaseModel):
    name: str
    description: str = ""
    rule_type: Literal["amount", "velocity", "geo", "time", "merchant"] = "amount"
    condition: str  # e.g. "amount > 5000"
    threshold: float = 0.0
    action: Literal["flag", "block", "review"] = "flag"
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    active: bool = True


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    threshold: Optional[float] = None
    action: Optional[Literal["flag", "block", "review"]] = None
    severity: Optional[Literal["low", "medium", "high", "critical"]] = None
    active: Optional[bool] = None


class TransactionFilter(BaseModel):
    status: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    q: Optional[str] = None
