# 📏 Coding Standards & Conventions: skilld-ai

> ข้อตกลงร่วมในการเขียนโค้ด การตั้งชื่อ และโครงสร้างไฟล์

---

## 1. General Principles

| Principle | Rule |
| :--- | :--- |
| **No `any`** | ห้ามใช้ `any` เด็ดขาด ต้องกำหนด Type ชัดเจน |
| **Fail Fast** | Validate ข้อมูลตั้งแต่ต้นทาง (Input/Payload) ด้วย Schema Library (`zod`, `pydantic`) |
| **4 UI States** | หน้าจอ/Component ที่ต่อ API ต้องมีครบ Loading, Empty, Error, Success |
| **Standard Result Envelope** | API ทุกตัวต้องห่อ Response ด้วย `{ "success": boolean, "data"?: T, "error"?: { "code": string, "message": string } }` |
| **Testing AAA Pattern** | ทุก Test Suite ต้องแบ่ง 3 ท่อนชัดเจน: Arrange (เตรียมข้อมูล) -> Act (รันฟังก์ชัน) -> Assert (ตรวจผลลัพธ์) |
| **Zero-Downtime DB** | ห้าม Rename column ใน production โดยตรง ให้ใช้ Expand-Contract pattern เสมอ |
