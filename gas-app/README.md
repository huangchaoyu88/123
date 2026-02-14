# Google Apps Script + Google Sheets 課程預約系統 MVP

此版本使用 **Google Apps Script Web App + Google Sheets** 實作 API 與前台頁面。

## 1) Spreadsheet 結構

請先建立一份 Google Spreadsheet，並在 Apps Script 專案中綁定此試算表。

系統會使用以下 4 個工作表（可執行 `setupSheets_()` 自動建立）：

### Courses
| 欄位 |
| --- |
| courseId |
| name |
| description |
| isActive |
| createdAtIso |
| updatedAtIso |

### Teachers
| 欄位 |
| --- |
| teacherId |
| name |
| email |
| createdAtIso |
| updatedAtIso |

### TimeSlots
| 欄位 |
| --- |
| slotId |
| courseId |
| teacherId |
| startAtIso |
| endAtIso |
| capacity |
| bookedCount |
| status |
| createdAtIso |
| updatedAtIso |

### Bookings
| 欄位 |
| --- |
| bookingId |
| slotId |
| courseId |
| studentName |
| studentEmail |
| status |
| createdAtIso |
| cancelledAtIso |

---

## 2) API 規格（Web App）

部署為 Web App 後，`exec URL` 即為 API Base URL。

### GET courses
```http
GET {BASE_URL}?route=courses
```

### GET slots?courseId=
```http
GET {BASE_URL}?route=slots&courseId=C001
```

### POST book
```http
POST {BASE_URL}
Content-Type: application/json

{
  "action": "book",
  "slotId": "S001",
  "studentName": "王小明",
  "studentEmail": "ming@example.com"
}
```

### POST cancel
```http
POST {BASE_URL}
Content-Type: application/json

{
  "action": "cancel",
  "bookingId": "B1730000000000",
  "token": "<ADMIN_TOKEN>"
}
```

---

## 3) 防超賣策略

`bookSlot_()` / `cancelBooking_()` 皆使用：

1. `LockService.getScriptLock().waitLock(...)`
2. 在 lock 內重新讀取 TimeSlots / Bookings
3. 驗證容量與狀態
4. 原子更新 `bookedCount`
5. 寫入或更新 Bookings
6. `releaseLock()`

這樣可避免同時預約造成超賣。

---

## 4) 時區與時間儲存策略

- **儲存：一律 ISO 字串（UTC）**，例如 `2026-03-01T02:00:00.000Z`。
- **顯示：一律轉為 `Asia/Taipei`**（例如 `yyyy/MM/dd HH:mm`）。
- 主要函式：
  - `toIso_(date)`：儲存格式
  - `formatTaipei_(isoString)`：顯示格式

---

## 5) 前台頁面

- `courses.html`：選課 → 選時段 → 填姓名與 Email → 預約。
- `admin.html`：簡易密碼登入取得 token，執行取消預約。

頁面都由 `doGet()` 提供：
- `?route=admin` 進 admin
- 其他情況進 courses

---

## 6) Script Properties 設定

在 Apps Script 專案中設定：

- `ADMIN_PASSWORD`: 管理後台密碼
- `ADMIN_TOKEN`: 管理 API token

路徑：`Project Settings` → `Script properties`。

---

## 7) 初始化資料

1. 將 `gas-app/Code.gs`、`gas-app/courses.html`、`gas-app/admin.html`、`gas-app/appsscript.json` 複製到 Apps Script 專案。
2. 執行 `setupSheets_()` 建立工作表與欄位。
3. 執行 `seedSampleData_()` 匯入範例資料。
4. Deploy → New deployment → Web app。
   - Execute as: Me
   - Who has access: Anyone (或依需求限制)

---

## 8) 專案檔案

- `gas-app/Code.gs`: API 與核心商業邏輯
- `gas-app/courses.html`: 使用者預約頁
- `gas-app/admin.html`: 管理員登入 / 取消頁
- `gas-app/appsscript.json`: Apps Script manifest
