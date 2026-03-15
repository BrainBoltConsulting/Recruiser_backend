# Schedule Status API

Get schedule details, interview status, and report status by schedule ID. Use this when you need a single “see status” view for a scheduled interview (e.g. dashboards, other services).

---

## Endpoint

| Method | Path | Description |
|--------|------|--------------|
| **GET** | `/meetings/schedule/:scheduleId/status` | Returns schedule, candidate, job, interview status, and report status |

**Path parameter**

- `scheduleId` (string) – Schedule ID (e.g. from scheduling or from list APIs).

**Response:** `200 OK` with JSON body (see below).  
**Errors:** `404` if schedule is not found.

---

## Response: Schedule status

| Field | Type | Description |
|-------|------|--------------|
| `scheduleId` | string | Schedule ID |
| `status` | enum | **Interview status** (see below) |
| `scheduledDatetime` | string (ISO date) \| null | Scheduled time |
| `meetingLink` | string \| null | Meeting link |
| `attendedDatetime` | string (ISO date) \| null | When candidate joined |
| `createdOn`, `updatedAt` | string \| null | Timestamps |
| `candidateId` | number | Candidate ID |
| `jobId` | string | Job ID |
| `candidate` | object | Candidate summary (candidateId, email, firstName, lastName, phoneNo) |
| `job` | object | Job summary (jobId, jobTitle, yearsOfExp, jobDesc, manager) |
| `reportStatus` | object | Report status and data (see below) |

---

## Interview status (`status`)

| Value | Meaning |
|-------|---------|
| `SCHEDULED` | Interview not started (candidate has not joined) |
| `IN_PROGRESS` | Candidate joined; interview in progress |
| `COMPLETED` | Interview finished |

---

## Report status (`reportStatus`)

| Field | Type | Description |
|-------|------|--------------|
| `status` | enum \| null | **Report status** (see below) |
| `reportMaster` | object \| null | Report data when report exists; `null` otherwise |

**Report status (`reportStatus.status`)**

| Value | When |
|-------|------|
| `null` | Interview not done yet (schedule status is SCHEDULED or IN_PROGRESS). Report N/A. |
| `IN_PROGRESS` | Interview COMPLETED; report not ready yet (generation in progress). |
| `COMPLETED` | Interview COMPLETED; report is ready. Use `reportMaster.reportUrl` to access. |

**When `reportMaster` is not null**

| Field | Type | Description |
|-------|------|-------------|
| `reportId` | string | Report ID |
| `reportS3key` | string \| null | Raw S3 key |
| `reportUrl` | string \| null | **Presigned URL** to open/download report (expires in 24h) |
| `review` | number \| null | Review value |
| `createdAt`, `updatedAt` | string \| null | Timestamps |
| `reportScores` | array | Score rows: rsId, reportId, ts, cs, js, ds, reportText, reportRemarks, createdOn, updatedAt |

---

## Example request

```http
GET /meetings/schedule/12345/status
```

---

## Example response (minimal)

```json
{
  "scheduleId": "12345",
  "status": "COMPLETED",
  "scheduledDatetime": "2025-03-20T14:00:00.000Z",
  "meetingLink": "https://...",
  "attendedDatetime": "2025-03-20T14:05:00.000Z",
  "createdOn": "2025-03-15T10:00:00.000Z",
  "updatedAt": null,
  "candidateId": 1,
  "jobId": "456",
  "candidate": {
    "candidateId": 1,
    "email": "candidate@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "phoneNo": "+1234567890"
  },
  "job": {
    "jobId": "456",
    "jobTitle": "Software Engineer",
    "yearsOfExp": 3,
    "jobDesc": "...",
    "manager": {
      "managerId": "789",
      "managerEmail": "manager@company.com",
      "firstName": "John",
      "lastName": "Manager",
      "company": "Acme Inc"
    }
  },
  "reportStatus": {
    "status": "COMPLETED",
    "reportMaster": {
      "reportId": "101",
      "reportS3key": "reports/...",
      "reportUrl": "https://...?X-Amz-Signature=...",
      "review": 0,
      "createdAt": "2025-03-20T15:00:00.000Z",
      "updatedAt": null,
      "reportScores": [
        {
          "rsId": "1",
          "reportId": "101",
          "ts": 85,
          "cs": 80,
          "js": 90,
          "ds": 75,
          "reportText": null,
          "reportRemarks": null,
          "createdOn": "2025-03-20T15:00:00.000Z",
          "updatedAt": null
        }
      ]
    }
  }
}
```

---

## Usage for other APIs

- **Base URL:** Use your backend base URL (e.g. `https://api.example.com` or env `BACKEND_URL`).
- **Auth:** This endpoint does not require auth in the current implementation.
- **When to call:** After you have a `scheduleId` (e.g. from create-schedule, list, or webhook). Call once per schedule when you need full status + report info.
- **Report file:** If `reportStatus.status === 'COMPLETED'` and `reportStatus.reportMaster.reportUrl` is set, open that URL in browser or use it in a GET request to download the report; it expires in 24 hours.
