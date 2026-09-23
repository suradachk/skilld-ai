# 📏 Coding Standards & Conventions: skilld

> ข้อตกลงร่วมในการเขียนโค้ด การตั้งชื่อ และโครงสร้างไฟล์

---

## 1. General Principles

| Principle | Rule |
| :--- | :--- |
| **No `any`** | ห้ามใช้ `any` เด็ดขาด ต้องกำหนด Type ชัดเจน |
| **Fail Fast** | Validate ข้อมูลตั้งแต่ต้นทาง (Input/Payload) ด้วย Schema Library |
| **4 UI States** | หน้าจอ/Component ที่ต่อ API ต้องมีครบ Loading, Empty, Error, Success |
