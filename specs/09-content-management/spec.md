# 09 - 內容管理（Banner / 新聞 / 跑馬燈）

> **允許角色**：ADMIN（全部操作）

---

## Banner 管理

> **路由前綴**：`/admin/banners`

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/admin/banners/list` | 查詢 Banner 列表 |
| GET | `/admin/banners/{id}` | 取得 Banner 詳情 |
| POST | `/admin/banners` | 新增 Banner |
| PUT | `/admin/banners/{id}` | 更新 Banner |
| DELETE | `/admin/banners/{id}` | 刪除 Banner |
| PUT | `/admin/banners/{id}/status` | 發布/下線 |
| PUT | `/admin/banners/reorder` | 重新排序 |

### Banner 資料結構
```typescript
interface BannerRes {
  id: string;
  title: string;
  imageUrl: string;
  linkType: 'STORE' | 'LOTTERY' | 'URL' | 'NONE';
  linkTarget: string | null;
  storeId: string | null;
  storeName: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  sortOrder: number;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}
```

### 新增/更新 Banner
```typescript
interface BannerCreateReq {
  title: string;          // 必填
  imageUrl: string;       // 必填（S3 URL）
  linkType: string;       // STORE / LOTTERY / URL / NONE
  linkTarget?: string;
  storeId?: string;
  sortOrder?: number;
  startAt?: string;
  endAt?: string;
}
```

### 拖曳排序
```
PUT /api/admin/banners/reorder
Body: { ids: string[] }   // 依新順序排列的 Banner ID 陣列
```

---

## 新聞管理

> **路由前綴**：`/admin/news`

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/admin/news/list` | 查詢新聞列表 |
| GET | `/admin/news/{id}` | 取得新聞詳情 |
| POST | `/admin/news` | 新增新聞 |
| PUT | `/admin/news/{id}` | 更新新聞 |
| DELETE | `/admin/news/{id}` | 刪除新聞 |
| PUT | `/admin/news/{id}/publish` | 發布 |
| PUT | `/admin/news/{id}/unpublish` | 下線 |

### 新聞資料結構
```typescript
interface NewsRes {
  id: string;
  title: string;
  summary: string;
  content: string;      // HTML 格式（富文本）
  coverImageUrl: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
}
```

### 新增新聞
```typescript
interface NewsCreateReq {
  title: string;
  summary?: string;
  content: string;              // 必填（富文本 HTML）
  coverImageUrl?: string;
  publishImmediately?: boolean; // true = 新增後立即發布
}
```

**富文本編輯器**：CKEditor5 Classic（專案已安裝 `@ckeditor/ckeditor5-vue`）

---

## 跑馬燈管理

> **路由前綴**：`/admin/marquee`

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/admin/marquee` | 取得所有跑馬燈 |
| POST | `/admin/marquee` | 新增 |
| PUT | `/admin/marquee/{id}` | 更新 |
| DELETE | `/admin/marquee/{id}` | 刪除 |
| PUT | `/admin/marquee/{id}/toggle` | 啟用/停用 |

### 跑馬燈資料結構
```typescript
interface MarqueeRes {
  id: string;
  content: string;            // 純文字（不含 HTML）
  type: 'INFO' | 'WIN' | 'SYSTEM';
  isActive: boolean;
  sortOrder: number;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}
```

---

## 圖片上傳 API

```
POST /api/admin/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

```
file: File
type: 'BANNER' | 'NEWS' | 'PRODUCT' | 'PRIZE'
```

```typescript
interface UploadRes {
  url: string;   // S3 公開 URL，填入 imageUrl
  key: string;
}
```
