"""
Sentinel AI — PostgreSQL Database Connector
==========================================
Replaces motor/pymongo MongoDB driver with asyncpg for Supabase PostgreSQL.
Provides a collection emulation layer to minimize changes in FastAPI routes.
"""
from __future__ import annotations

import os
import json
import logging
from datetime import datetime, timezone
import asyncpg

logger = logging.getLogger("sentinel.database")

def row_to_dict(row):
    if not row:
        return None
    d = dict(row)
    if "id" in d:
        d["_id"] = str(d["id"])
    return d

async def init_connection(conn):
    # Register JSON/JSONB codecs so we don't have to manually json.dumps/json.loads
    await conn.set_type_codec(
        'jsonb',
        encoder=json.dumps,
        decoder=json.loads,
        schema='pg_catalog'
    )
    await conn.set_type_codec(
        'json',
        encoder=json.dumps,
        decoder=json.loads,
        schema='pg_catalog'
    )

class Database:
    def __init__(self):
        self.pool = None
        self.users = UsersCollection(self)
        self.login_attempts = LoginAttemptsCollection(self)
        self.transactions = TransactionsCollection(self)
        self.cases = CasesCollection(self)
        self.rules = RulesCollection(self)
        self.audit_log = AuditLogCollection(self)
        self.ml_metrics = MLMetricsCollection(self)

    async def connect(self):
        database_url = os.environ["DATABASE_URL"]
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        logger.info("Connecting to PostgreSQL database pool...")
        self.pool = await asyncpg.create_pool(database_url, init=init_connection)
        await self.create_tables()

    async def disconnect(self):
        if self.pool:
            logger.info("Closing PostgreSQL database pool...")
            await self.pool.close()

    async def create_tables(self):
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # 1. users
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        name VARCHAR(255),
                        role VARCHAR(50),
                        avatar_url VARCHAR(500),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                """)
                # 2. login_attempts
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS login_attempts (
                        id SERIAL PRIMARY KEY,
                        identifier VARCHAR(255) UNIQUE NOT NULL,
                        count INTEGER DEFAULT 0,
                        locked_until TIMESTAMP WITH TIME ZONE
                    );
                    CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier);
                """)
                # 3. transactions
                v_cols = ", ".join([f"v{i} DOUBLE PRECISION DEFAULT 0.0" for i in range(1, 29)])
                await conn.execute(f"""
                    CREATE TABLE IF NOT EXISTS transactions (
                        id SERIAL PRIMARY KEY,
                        tx_id VARCHAR(255) UNIQUE NOT NULL,
                        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                        amount DOUBLE PRECISION NOT NULL,
                        currency VARCHAR(10) NOT NULL,
                        merchant VARCHAR(255) NOT NULL,
                        category VARCHAR(255) NOT NULL,
                        cardholder VARCHAR(255) NOT NULL,
                        card_brand VARCHAR(50) NOT NULL,
                        card_last4 VARCHAR(10) NOT NULL,
                        location VARCHAR(255) NOT NULL,
                        lat DOUBLE PRECISION NOT NULL,
                        lon DOUBLE PRECISION NOT NULL,
                        avatar VARCHAR(500),
                        fraud_score DOUBLE PRECISION NOT NULL,
                        predicted_fraud BOOLEAN NOT NULL,
                        risk_level VARCHAR(50) NOT NULL,
                        is_ground_truth_fraud BOOLEAN NOT NULL,
                        {v_cols},
                        time DOUBLE PRECISION DEFAULT 0.0
                    );
                    CREATE INDEX IF NOT EXISTS idx_transactions_tx_id ON transactions(tx_id);
                    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
                    CREATE INDEX IF NOT EXISTS idx_transactions_fraud_score ON transactions(fraud_score);
                """)
                # 4. cases
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS cases (
                        id SERIAL PRIMARY KEY,
                        case_id VARCHAR(255) UNIQUE NOT NULL,
                        tx_id VARCHAR(255) NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        amount DOUBLE PRECISION DEFAULT 0.0,
                        priority VARCHAR(50) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        assignee VARCHAR(255),
                        risk_score DOUBLE PRECISION DEFAULT 0.0,
                        notes JSONB DEFAULT '[]'::jsonb,
                        created_by VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        merchant VARCHAR(255),
                        cardholder VARCHAR(255),
                        avatar VARCHAR(500)
                    );
                    CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
                    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
                """)
                # 5. rules
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS rules (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        rule_type VARCHAR(50) NOT NULL,
                        condition VARCHAR(255) NOT NULL,
                        threshold DOUBLE PRECISION DEFAULT 0.0,
                        action VARCHAR(50) NOT NULL,
                        severity VARCHAR(50) NOT NULL,
                        active BOOLEAN DEFAULT TRUE,
                        hits INTEGER DEFAULT 0,
                        created_by VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS idx_rules_active ON rules(active);
                """)
                # 6. audit_log
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS audit_log (
                        id SERIAL PRIMARY KEY,
                        actor VARCHAR(255),
                        action VARCHAR(255) NOT NULL,
                        target VARCHAR(255),
                        result JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        ip VARCHAR(100),
                        details JSONB
                    );
                    CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
                """)
                # 7. ml_metrics
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS ml_metrics (
                        id SERIAL PRIMARY KEY,
                        metrics JSONB NOT NULL,
                        trained_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        dataset_size INTEGER NOT NULL,
                        smote_applied BOOLEAN DEFAULT TRUE
                    );
                """)

    # --- Users CRUD Helpers ---
    async def get_user_by_email(self, email: str):
        row = await self.pool.fetchrow("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", email)
        return row_to_dict(row)

    async def get_user_by_id(self, user_id):
        try:
            uid = int(user_id)
        except (ValueError, TypeError):
            return None
        row = await self.pool.fetchrow("SELECT * FROM users WHERE id = $1", uid)
        return row_to_dict(row)

    async def create_user(self, doc: dict):
        row = await self.pool.fetchrow(
            """
            INSERT INTO users (email, password_hash, name, role, avatar_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE
            SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
            RETURNING *
            """,
            doc["email"], doc["password_hash"], doc.get("name"),
            doc.get("role"), doc.get("avatar_url"), doc.get("created_at", datetime.now(timezone.utc))
        )
        return row_to_dict(row)

    async def update_user(self, email: str, updates: dict):
        if not updates:
            return
        fields = []
        values = []
        for i, (k, v) in enumerate(updates.items(), start=1):
            fields.append(f"{k} = ${i}")
            values.append(v)
        query = f"UPDATE users SET {', '.join(fields)} WHERE LOWER(email) = LOWER(${len(updates) + 1})"
        values.append(email)
        await self.pool.execute(query, *values)

    # --- Login Attempts Helpers ---
    async def get_login_attempt(self, identifier: str):
        row = await self.pool.fetchrow("SELECT * FROM login_attempts WHERE identifier = $1", identifier)
        return row_to_dict(row)

    async def delete_login_attempt(self, identifier: str):
        await self.pool.execute("DELETE FROM login_attempts WHERE identifier = $1", identifier)

    async def increment_login_attempt(self, identifier: str):
        row = await self.pool.fetchrow(
            """
            INSERT INTO login_attempts (identifier, count)
            VALUES ($1, 1)
            ON CONFLICT (identifier) DO UPDATE
            SET count = login_attempts.count + 1
            RETURNING *
            """,
            identifier
        )
        return row_to_dict(row)

    async def lock_login_attempt(self, identifier: str, locked_until: datetime):
        await self.pool.execute(
            "UPDATE login_attempts SET locked_until = $1 WHERE identifier = $2",
            locked_until, identifier
        )

    # --- Transactions Helpers ---
    async def count_transactions(self):
        return await self.pool.fetchval("SELECT COUNT(*) FROM transactions")

    async def count_fraud_transactions(self):
        return await self.pool.fetchval("SELECT COUNT(*) FROM transactions WHERE predicted_fraud = TRUE")

    async def count_transactions_with_filter(self, query: dict) -> int:
        status_filter, q, min_amount, max_amount = self._parse_transactions_query(query)
        conditions, params, _ = self._build_transactions_where(status_filter, q, min_amount, max_amount)
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        return await self.pool.fetchval(f"SELECT COUNT(*) FROM transactions {where_clause}", *params)

    async def get_total_amount(self) -> float:
        val = await self.pool.fetchval("SELECT SUM(amount) FROM transactions")
        return float(val) if val is not None else 0.0

    async def get_fraud_amount(self) -> float:
        val = await self.pool.fetchval("SELECT SUM(amount) FROM transactions WHERE predicted_fraud = TRUE")
        return float(val) if val is not None else 0.0

    async def get_hourly_series(self):
        rows = await self.pool.fetch("""
            SELECT 
                EXTRACT(HOUR FROM timestamp)::integer as hour,
                COUNT(*)::integer as total,
                SUM(CASE WHEN predicted_fraud = TRUE THEN 1 ELSE 0 END)::integer as fraud
            FROM transactions
            GROUP BY hour
            ORDER BY hour ASC
        """)
        return [dict(r) for r in rows]

    async def list_transactions(self, status_filter=None, q=None, min_amount=None, max_amount=None, limit=50, skip=0, sort_by="timestamp DESC"):
        conditions, params, param_idx = self._build_transactions_where(status_filter, q, min_amount, max_amount)
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Validate sort_by to avoid SQL injection
        allowed_sort_fields = {
            "timestamp", "amount", "fraud_score", "tx_id", "merchant", "cardholder"
        }
        sort_parts = sort_by.strip().split()
        if not sort_parts or sort_parts[0].lower() not in allowed_sort_fields:
            sort_clause = "ORDER BY timestamp DESC"
        else:
            field = sort_parts[0].lower()
            direction = sort_parts[1].upper() if len(sort_parts) > 1 and sort_parts[1].upper() in {"ASC", "DESC"} else "DESC"
            sort_clause = f"ORDER BY {field} {direction}"

        query = f"""
            SELECT * FROM transactions 
            {where_clause} 
            {sort_clause} 
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        items_rows = await self.pool.fetch(query, *(params + [limit, skip]))
        
        items = []
        for row in items_rows:
            d = dict(row)
            mapped_d = {}
            for k, v in d.items():
                if k.startswith("v") and k[1:].isdigit():
                    mapped_d[k.upper()] = v
                elif k == "time":
                    mapped_d["Time"] = v
                else:
                    mapped_d[k] = v
            items.append(mapped_d)

        return items

    async def get_transaction(self, tx_id: str):
        row = await self.pool.fetchrow("SELECT * FROM transactions WHERE tx_id = $1", tx_id)
        if not row:
            return None
        d = dict(row)
        mapped_d = {}
        for k, v in d.items():
            if k.startswith("v") and k[1:].isdigit():
                mapped_d[k.upper()] = v
            elif k == "time":
                mapped_d["Time"] = v
            else:
                mapped_d[k] = v
        return mapped_d

    async def insert_transactions(self, transactions: list):
        if not transactions:
            return
        v_cols = [f"v{i}" for i in range(1, 29)]
        cols = [
            "tx_id", "timestamp", "amount", "currency", "merchant", "category",
            "cardholder", "card_brand", "card_last4", "location", "lat", "lon",
            "avatar", "fraud_score", "predicted_fraud", "risk_level",
            "is_ground_truth_fraud", "time"
        ] + v_cols

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                records = []
                for tx in transactions:
                    rec = (
                        tx["tx_id"], tx["timestamp"], tx["amount"], tx["currency"], tx["merchant"], tx["category"],
                        tx["cardholder"], tx["card_brand"], tx["card_last4"], tx["location"], tx["lat"], tx["lon"],
                        tx.get("avatar"), tx["fraud_score"], tx["predicted_fraud"], tx["risk_level"],
                        tx["is_ground_truth_fraud"], tx.get("Time", 0.0)
                    ) + tuple(tx.get(f"V{i}", 0.0) for i in range(1, 29))
                    records.append(rec)
                
                placeholders = ", ".join([f"${i}" for i in range(1, len(cols) + 1)])
                query = f"""
                    INSERT INTO transactions ({", ".join(cols)})
                    VALUES ({placeholders})
                    ON CONFLICT (tx_id) DO NOTHING
                """
                await conn.executemany(query, records)

    def _parse_transactions_query(self, query: dict):
        status_filter = None
        if query.get("predicted_fraud") is True:
            status_filter = "fraud"
        elif query.get("predicted_fraud") is False:
            status_filter = "legitimate"

        min_amount = None
        max_amount = None
        if "amount" in query:
            min_amount = query["amount"].get("$gte")
            max_amount = query["amount"].get("$lte")

        q = None
        if "$or" in query:
            for term in query["$or"]:
                for val in term.values():
                    if isinstance(val, dict) and "$regex" in val:
                        q = val["$regex"]
                        break
                if q:
                    break
        return status_filter, q, min_amount, max_amount

    def _build_transactions_where(self, status_filter, q, min_amount, max_amount):
        conditions = []
        params = []
        param_idx = 1

        if status_filter == "fraud":
            conditions.append(f"predicted_fraud = ${param_idx}")
            params.append(True)
            param_idx += 1
        elif status_filter == "legitimate":
            conditions.append(f"predicted_fraud = ${param_idx}")
            params.append(False)
            param_idx += 1

        if min_amount is not None:
            conditions.append(f"amount >= ${param_idx}")
            params.append(min_amount)
            param_idx += 1

        if max_amount is not None:
            conditions.append(f"amount <= ${param_idx}")
            params.append(max_amount)
            param_idx += 1

        if q:
            conditions.append(f"(tx_id ILIKE ${param_idx} OR merchant ILIKE ${param_idx} OR cardholder ILIKE ${param_idx})")
            params.append(f"%{q}%")
            param_idx += 1
        return conditions, params, param_idx

    # --- Cases Helpers ---
    async def count_cases(self, query: dict):
        if not query:
            return await self.pool.fetchval("SELECT COUNT(*) FROM cases")
        status = query.get("status")
        if status:
            return await self.pool.fetchval("SELECT COUNT(*) FROM cases WHERE status = $1", status)
        return await self.pool.fetchval("SELECT COUNT(*) FROM cases")

    async def list_cases(self, status=None, priority=None, limit=50, skip=0):
        conditions = []
        params = []
        param_idx = 1
        if status:
            conditions.append(f"status = ${param_idx}")
            params.append(status)
            param_idx += 1
        if priority:
            conditions.append(f"priority = ${param_idx}")
            params.append(priority)
            param_idx += 1

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        query = f"""
            SELECT * FROM cases
            {where_clause}
            ORDER BY created_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        rows = await self.pool.fetch(query, *(params + [limit, skip]))
        return [row_to_dict(r) for r in rows]

    async def get_case(self, case_id):
        try:
            uid = int(case_id)
            row = await self.pool.fetchrow("SELECT * FROM cases WHERE id = $1", uid)
        except (ValueError, TypeError):
            row = await self.pool.fetchrow("SELECT * FROM cases WHERE case_id = $1", case_id)
        return row_to_dict(row)

    async def create_case(self, doc: dict):
        row = await self.pool.fetchrow(
            """
            INSERT INTO cases (
                case_id, tx_id, title, description, amount, priority, status,
                assignee, risk_score, notes, created_by, created_at, updated_at,
                merchant, cardholder, avatar
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
            """,
            doc["case_id"], doc["tx_id"], doc["title"], doc.get("description"), doc.get("amount", 0.0),
            doc["priority"], doc["status"], doc.get("assignee"), doc.get("risk_score", 0.0),
            doc.get("notes", []), doc["created_by"], doc.get("created_at", datetime.now(timezone.utc)),
            doc.get("updated_at", datetime.now(timezone.utc)), doc.get("merchant"),
            doc.get("cardholder"), doc.get("avatar")
        )
        return row_to_dict(row)

    async def update_case(self, case_id, set_fields: dict, note: dict = None):
        try:
            uid = int(case_id)
            selector_clause = "id = $1"
            selector_val = uid
        except (ValueError, TypeError):
            selector_clause = "case_id = $1"
            selector_val = case_id

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                current_notes_json = await conn.fetchval(f"SELECT notes FROM cases WHERE {selector_clause}", selector_val)
                notes = current_notes_json if current_notes_json is not None else []
                if isinstance(notes, str):
                    notes = json.loads(notes)

                if note:
                    notes.append(note)

                fields = []
                values = []
                idx = 2
                
                for k, v in set_fields.items():
                    fields.append(f"{k} = ${idx}")
                    values.append(v)
                    idx += 1

                fields.append(f"notes = ${idx}")
                values.append(notes)
                idx += 1

                fields.append(f"updated_at = ${idx}")
                values.append(datetime.now(timezone.utc))
                idx += 1

                query = f"UPDATE cases SET {', '.join(fields)} WHERE {selector_clause} RETURNING *"
                row = await conn.fetchrow(query, selector_val, *values)
                return row_to_dict(row)

    async def insert_cases(self, cases: list):
        if not cases:
            return
        cols = [
            "case_id", "tx_id", "title", "description", "amount", "priority", "status",
            "assignee", "risk_score", "notes", "created_by", "created_at", "updated_at",
            "merchant", "cardholder", "avatar"
        ]
        records = []
        for c in cases:
            rec = (
                c["case_id"], c["tx_id"], c["title"], c.get("description"), c.get("amount", 0.0),
                c["priority"], c["status"], c.get("assignee"), c.get("risk_score", 0.0),
                c.get("notes", []), c["created_by"], c["created_at"], c["updated_at"],
                c.get("merchant"), c.get("cardholder"), c.get("avatar")
            )
            records.append(rec)

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                placeholders = ", ".join([f"${i}" for i in range(1, len(cols) + 1)])
                query = f"""
                    INSERT INTO cases ({", ".join(cols)})
                    VALUES ({placeholders})
                    ON CONFLICT (case_id) DO NOTHING
                """
                await conn.executemany(query, records)

    # --- Rules Helpers ---
    async def count_rules(self, active=None):
        if active is not None:
            return await self.pool.fetchval("SELECT COUNT(*) FROM rules WHERE active = $1", active)
        return await self.pool.fetchval("SELECT COUNT(*) FROM rules")

    async def list_rules(self):
        rows = await self.pool.fetch("SELECT * FROM rules ORDER BY created_at DESC")
        return [row_to_dict(r) for r in rows]

    async def create_rule(self, doc: dict):
        row = await self.pool.fetchrow(
            """
            INSERT INTO rules (
                name, description, rule_type, condition, threshold, action, severity, active, hits, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            """,
            doc["name"], doc.get("description", ""), doc["rule_type"], doc["condition"], doc.get("threshold", 0.0),
            doc["action"], doc["severity"], doc.get("active", True), doc.get("hits", 0), doc["created_by"],
            doc.get("created_at", datetime.now(timezone.utc))
        )
        return row_to_dict(row)

    async def update_rule(self, rule_id, set_fields: dict):
        try:
            uid = int(rule_id)
        except (ValueError, TypeError):
            return None
        fields = []
        values = []
        for i, (k, v) in enumerate(set_fields.items(), start=1):
            fields.append(f"{k} = ${i}")
            values.append(v)
        query = f"UPDATE rules SET {', '.join(fields)} WHERE id = ${len(set_fields) + 1} RETURNING *"
        values.append(uid)
        row = await self.pool.fetchrow(query, *values)
        return row_to_dict(row)

    async def delete_rule(self, rule_id):
        try:
            uid = int(rule_id)
        except (ValueError, TypeError):
            return None
        res = await self.pool.execute("DELETE FROM rules WHERE id = $1", uid)
        
        class MockDeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        
        count = 0
        if res.startswith("DELETE "):
            try:
                count = int(res.split(" ")[1])
            except ValueError:
                pass
        return MockDeleteResult(count)

    async def insert_rules(self, rules: list):
        if not rules:
            return
        cols = [
            "name", "description", "rule_type", "condition", "threshold",
            "action", "severity", "active", "hits", "created_by", "created_at"
        ]
        records = []
        for r in rules:
            rec = (
                r["name"], r.get("description", ""), r["rule_type"], r["condition"], r.get("threshold", 0.0),
                r["action"], r["severity"], r.get("active", True), r.get("hits", 0), r["created_by"],
                r["created_at"]
            )
            records.append(rec)
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                placeholders = ", ".join([f"${i}" for i in range(1, len(cols) + 1)])
                query = f"""
                    INSERT INTO rules ({", ".join(cols)})
                    VALUES ({placeholders})
                """
                await conn.executemany(query, records)

    # --- Audit Log Helpers ---
    async def create_audit_log(self, doc: dict):
        row = await self.pool.fetchrow(
            """
            INSERT INTO audit_log (actor, action, target, result, created_at, ip, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            """,
            doc.get("actor"), doc["action"], doc.get("target"),
            doc.get("result"), doc.get("created_at", datetime.now(timezone.utc)),
            doc.get("ip"), doc.get("details")
        )
        return row_to_dict(row)

    async def list_audit_logs(self, limit=50, skip=0):
        rows = await self.pool.fetch(
            """
            SELECT * FROM audit_log
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            """,
            limit, skip
        )
        return [row_to_dict(r) for r in rows]

    async def count_audit_logs(self):
        return await self.pool.fetchval("SELECT COUNT(*) FROM audit_log")

    # --- ML Metrics Helpers ---
    async def get_ml_metrics(self):
        row = await self.pool.fetchrow("""
            SELECT * FROM ml_metrics
            ORDER BY trained_at DESC
            LIMIT 1
        """)
        return row_to_dict(row)

    async def save_ml_metrics(self, metrics: dict, dataset_size: int, smote_applied: bool):
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("DELETE FROM ml_metrics")
                row = await conn.fetchrow("""
                    INSERT INTO ml_metrics (metrics, trained_at, dataset_size, smote_applied)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                """, metrics, datetime.now(timezone.utc), dataset_size, smote_applied)
                return row_to_dict(row)

    async def delete_ml_metrics(self):
        await self.pool.execute("DELETE FROM ml_metrics")

    async def clear_transactions(self):
        await self.pool.execute("DELETE FROM transactions")

    async def clear_cases(self):
        await self.pool.execute("DELETE FROM cases")

    async def clear_rules(self):
        await self.pool.execute("DELETE FROM rules")


# --- Emulated collections ---

class UsersCollection:
    def __init__(self, db: Database):
        self.db = db
    async def find_one(self, query):
        if "email" in query:
            return await self.db.get_user_by_email(query["email"])
        if "_id" in query:
            return await self.db.get_user_by_id(query["_id"])
        return None
    async def insert_one(self, doc):
        return await self.db.create_user(doc)
    async def update_one(self, query, update_op):
        if "$set" in update_op:
            email = query.get("email")
            if email:
                await self.db.update_user(email, update_op["$set"])
    async def create_index(self, field, unique=False):
        pass


class LoginAttemptsCollection:
    def __init__(self, db: Database):
        self.db = db
    async def find_one(self, query):
        return await self.db.get_login_attempt(query["identifier"])
    async def delete_one(self, query):
        await self.db.delete_login_attempt(query["identifier"])
    async def update_one(self, query, update_op):
        if "$set" in update_op:
            await self.db.lock_login_attempt(query["identifier"], update_op["$set"]["locked_until"])
    async def find_one_and_update(self, query, update_op, upsert=False, return_document=None):
        if "$inc" in update_op and "count" in update_op["$inc"]:
            return await self.db.increment_login_attempt(query["identifier"])
    async def create_index(self, field, unique=False):
        pass


class TransactionsCollection:
    def __init__(self, db: Database):
        self.db = db
    async def count_documents(self, query):
        if not query:
            return await self.db.count_transactions()
        if len(query) == 1 and query.get("predicted_fraud") is True:
            return await self.db.count_fraud_transactions()
        return await self.db.count_transactions_with_filter(query)
    async def insert_many(self, docs):
        await self.db.insert_transactions(docs)
    async def delete_many(self, query):
        await self.db.clear_transactions()
    async def find_one(self, query, projection=None):
        return await self.db.get_transaction(query["tx_id"])
    def find(self, query, projection=None):
        return TransactionCursor(self.db, query)
    async def aggregate(self, pipeline):
        return AggregateCursor(self.db, pipeline)
    async def create_index(self, field, unique=False):
        pass


class TransactionCursor:
    def __init__(self, db: Database, query: dict):
        self.db = db
        self.query = query
        self._skip = 0
        self._limit = 50
        self._sort_field = None
        self._sort_order = -1
    def sort(self, field, order=-1):
        self._sort_field = field
        self._sort_order = order
        return self
    def skip(self, skip):
        self._skip = skip
        return self
    def limit(self, limit):
        self._limit = limit
        return self
    async def to_list(self, length=None):
        limit = length if length is not None else self._limit
        status_filter, q, min_amount, max_amount = self.db._parse_transactions_query(self.query)
        sort_by = "timestamp DESC"
        if self._sort_field:
            direction = "ASC" if self._sort_order == 1 else "DESC"
            sort_by = f"{self._sort_field} {direction}"
        items = await self.db.list_transactions(
            status_filter=status_filter, q=q,
            min_amount=min_amount, max_amount=max_amount,
            limit=limit, skip=self._skip,
            sort_by=sort_by
        )
        return items


class AggregateCursor:
    def __init__(self, db: Database, pipeline: list):
        self.db = db
        self.pipeline = pipeline
    async def to_list(self, length=None):
        if len(self.pipeline) == 1 and "$group" in self.pipeline[0] and self.pipeline[0]["$group"].get("_id") is None:
            val = await self.db.get_total_amount()
            return [{"_id": None, "total": val}]
        
        if len(self.pipeline) == 2 and "$match" in self.pipeline[0] and self.pipeline[0]["$match"].get("predicted_fraud") is True:
            val = await self.db.get_fraud_amount()
            return [{"_id": None, "total": val}]

        if len(self.pipeline) >= 1 and "$group" in self.pipeline[0] and isinstance(self.pipeline[0]["$group"].get("_id"), dict) and "$hour" in self.pipeline[0]["$group"]["_id"]:
            rows = await self.db.get_hourly_series()
            return [{"_id": r["hour"], "total": r["total"], "fraud": r["fraud"]} for r in rows]

        return []


class CasesCollection:
    def __init__(self, db: Database):
        self.db = db
    async def count_documents(self, query):
        return await self.db.count_cases(query)
    def find(self, query):
        return CaseCursor(self.db, query)
    async def find_one(self, query):
        case_id = query.get("_id") or query.get("case_id")
        return await self.db.get_case(case_id)
    async def insert_one(self, doc):
        return await self.db.create_case(doc)
    async def update_one(self, query, update_op):
        case_id = query.get("_id") or query.get("case_id")
        set_fields = update_op.get("$set", {})
        push_op = update_op.get("$push", {})
        note = push_op.get("notes")
        res = await self.db.update_case(case_id, set_fields, note=note)
        class MockUpdateResult:
            def __init__(self, matched_count):
                self.matched_count = matched_count
        return MockUpdateResult(1 if res else 0)
    async def insert_many(self, docs):
        await self.db.insert_cases(docs)
    async def delete_many(self, query):
        await self.db.clear_cases()
    async def create_index(self, field, unique=False):
        pass


class CaseCursor:
    def __init__(self, db: Database, query: dict):
        self.db = db
        self.query = query
        self._skip = 0
        self._limit = 50
    def sort(self, field, order=-1):
        return self
    def skip(self, skip):
        self._skip = skip
        return self
    def limit(self, limit):
        self._limit = limit
        return self
    async def to_list(self, length=None):
        limit = length if length is not None else self._limit
        status = self.query.get("status")
        priority = self.query.get("priority")
        return await self.db.list_cases(status=status, priority=priority, limit=limit, skip=self._skip)


class RulesCollection:
    def __init__(self, db: Database):
        self.db = db
    async def count_documents(self, query):
        active = query.get("active")
        return await self.db.count_rules(active=active)
    def find(self, query):
        return RuleCursor(self.db, query)
    async def insert_one(self, doc):
        return await self.db.create_rule(doc)
    async def update_one(self, query, update_op):
        rule_id = query.get("_id") or query.get("id")
        set_fields = update_op.get("$set", {})
        res = await self.db.update_rule(rule_id, set_fields)
        class MockUpdateResult:
            def __init__(self, matched_count):
                self.matched_count = matched_count
        return MockUpdateResult(1 if res else 0)
    async def delete_one(self, query):
        rule_id = query.get("_id") or query.get("id")
        return await self.db.delete_rule(rule_id)
    async def delete_many(self, query):
        await self.db.clear_rules()
    async def insert_many(self, docs):
        await self.db.insert_rules(docs)
    async def create_index(self, field, unique=False):
        pass


class RuleCursor:
    def __init__(self, db: Database, query: dict):
        self.db = db
        self.query = query
    def sort(self, field, order=-1):
        return self
    async def to_list(self, length=None):
        return await self.db.list_rules()


class AuditLogCollection:
    def __init__(self, db: Database):
        self.db = db
    async def insert_one(self, doc):
        return await self.db.create_audit_log(doc)
    def find(self, query):
        return AuditCursor(self.db, query)
    async def count_documents(self, query):
        return await self.db.count_audit_logs()
    async def create_index(self, field, unique=False):
        pass


class AuditCursor:
    def __init__(self, db: Database, query: dict):
        self.db = db
        self.query = query
        self._skip = 0
        self._limit = 50
    def sort(self, field, order=-1):
        return self
    def skip(self, skip):
        self._skip = skip
        return self
    def limit(self, limit):
        self._limit = limit
        return self
    async def to_list(self, length=None):
        limit = length if length is not None else self._limit
        return await self.db.list_audit_logs(limit=limit, skip=self._skip)


class MLMetricsCollection:
    def __init__(self, db: Database):
        self.db = db
    async def delete_many(self, query):
        await self.db.delete_ml_metrics()
    async def insert_one(self, doc):
        return await self.db.save_ml_metrics(doc["metrics"], doc["dataset_size"], doc["smote_applied"])
    async def find_one(self, query, sort=None):
        return await self.db.get_ml_metrics()
