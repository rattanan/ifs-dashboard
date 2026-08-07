import type { DashboardSlug, MetricDefinition } from "./types";

const fleetReadiness: MetricDefinition[] = [
  {
    id: "fleet-readiness.aircraft-list",
    dashboard: "fleet-readiness",
    title: "สถานะอากาศยานรายลำ (Top 10)",
    description: "ทะเบียนอากาศยาน ชั่วโมงบิน สถานะปัจจุบัน และภารกิจล่าสุด",
    sourceElementId: "334d7563-0b47-4ef6-8b74-2a0c9b2a35b7",
    sourceDataSourceId: "a51043d3-fe9d-4aee-b100-3f0077e66c00",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT TYPE AS "type", MCH_CODE AS "aircraft", MCH_NAME AS "model",
        CF$_C_STATUS AS "status", CF$_C_CONDITION AS "condition", SERIAL_NO AS "serialNo",
        CF$_C_RESPONSE AS "response"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND SUP_MCH_CODE <> 'TXX' AND CONTRACT = :site
      ORDER BY TYPE, MCH_CODE FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "fleet-readiness.status-summary",
    dashboard: "fleet-readiness",
    title: "สรุปสถานะความพร้อมตามประเภท",
    description: "จำนวนอากาศยานพร้อมใช้ ซ่อมบำรุง รออะไหล่ และ Grounded",
    sourceElementId: "334d7563-0b47-4ef6-8b74-2a0c9b2a35b7",
    sourceDataSourceId: "a51043d3-fe9d-4aee-b100-3f0077e66c00",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT TYPE AS "type", CF$_C_STATUS AS "status", COUNT(*) AS "value"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND SUP_MCH_CODE <> 'TXX' AND CONTRACT = :site
      GROUP BY TYPE, CF$_C_STATUS ORDER BY TYPE, COUNT(*) DESC`,
  },
  {
    id: "fleet-readiness.availability-trend",
    dashboard: "fleet-readiness",
    title: "แนวโน้ม Availability Rate",
    description: "อัตราความพร้อมใช้งานย้อนหลังตามช่วงเวลาที่ระบบมีข้อมูล",
    sourceElementId: "334d7563-0b47-4ef6-8b74-2a0c9b2a35b7",
    sourceDataSourceId: "a51043d3-fe9d-4aee-b100-3f0077e66c00",
    allowedFilters: ["site"],
    kind: "line",
    size: "lg",
    sql: `SELECT 'Current' AS "label",
        ROUND(CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(CASE
          WHEN UPPER(NVL(CF$_C_STATUS, '')) IN ('MISSION READY', 'READY', 'AVAILABLE') THEN 1 ELSE 0 END
        ) * 100 / COUNT(*) END, 2) AS "value"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND SUP_MCH_CODE <> 'TXX' AND CONTRACT = :site`,
  },
  {
    id: "fleet-readiness.kpis",
    dashboard: "fleet-readiness",
    title: "ตัวชี้วัด Fleet Reliability",
    description: "ตัวชี้วัด MTBF, MTTR, Aircraft on Ground, Flight Hours และ Utilization",
    sourceElementId: "fleet-readiness-kpis",
    sourceDataSourceId: "fleet-readiness-kpis",
    allowedFilters: ["site"],
    kind: "summary",
    size: "wide",
    sql: `SELECT COUNT(*) AS "aircraftTotal"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND SUP_MCH_CODE <> 'TXX' AND CONTRACT = :site`,
  },
  {
    id: "fleet-readiness.unit-availability",
    dashboard: "fleet-readiness",
    title: "Availability Rate ตามฐานบิน",
    description: "เปรียบเทียบอากาศยานพร้อมใช้ตามหน่วยบินและพื้นที่รับผิดชอบ",
    sourceElementId: "fleet-readiness-units",
    sourceDataSourceId: "fleet-readiness-units",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT TYPE AS "unit", COUNT(*) AS "total",
        SUM(CASE WHEN UPPER(NVL(CF$_C_STATUS, '')) IN ('MISSION READY', 'READY', 'AVAILABLE') THEN 1 ELSE 0 END) AS "available"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND SUP_MCH_CODE <> 'TXX' AND CONTRACT = :site
      GROUP BY TYPE ORDER BY TYPE`,
  },
];

const maintenance: MetricDefinition[] = [
  {
    id: "maintenance.aircraft-list",
    dashboard: "maintenance",
    title: "รายการอากาศยานตามสถานะ",
    description: "ทะเบียนอากาศยาน แบบ หมายเลขเครื่อง และสถานะความพร้อม",
    sourceElementId: "334d7563-0b47-4ef6-8b74-2a0c9b2a35b7",
    sourceDataSourceId: "a51043d3-fe9d-4aee-b100-3f0077e66c00",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT TYPE AS "Type", MCH_NAME AS "Description", MCH_CODE AS "Aircraft",
        CF$_C_CONDITION AS "Condition", MCH_TYPE AS "Machine Type", SERIAL_NO AS "Serial No"
      FROM EQUIPMENT_FUNCTIONAL_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND CF$_C_CONDITION <> 'อื่น ๆ' AND CONTRACT = :site
      ORDER BY TYPE, MCH_CODE`,
  },
  {
    id: "maintenance.wo-work-type",
    dashboard: "maintenance",
    title: "จำนวนงานคงค้าง แยกตามประเภทของงาน",
    description: "Backlog ของงานซ่อมเปรียบเทียบตาม Work Type",
    sourceElementId: "6bbfc058-8de9-41a5-a93d-e65d437769b9",
    sourceDataSourceId: "338d65ff-7cc7-4d6a-a8c3-6ce4973dc1a3",
    allowedFilters: ["site"], kind: "bar", size: "lg",
    sql: `SELECT NVL(WORK_TYPE_ID, 'ไม่ระบุ') AS "label", COUNT(WORK_TYPE_ID) AS "value"
      FROM ACTIVE_SEPARATE_OVERVIEW
      WHERE GROUP_ID IS NOT NULL AND CONTRACT = :site
      GROUP BY WORK_TYPE_ID ORDER BY COUNT(WORK_TYPE_ID) DESC`,
  },
  {
    id: "maintenance.wo-by-aircraft",
    dashboard: "maintenance",
    title: "งานรอดำเนินการตามอากาศยาน",
    description: "WO ที่ยังเปิด แยกตามทะเบียนอากาศยาน",
    sourceElementId: "9e5e5e5a-93e8-46f6-93d2-79582c4d31c6",
    sourceDataSourceId: "338d65ff-7cc7-4d6a-a8c3-6ce4973dc1a3",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT NVL(MCH_CODE, 'ไม่ระบุ') AS "Aircraft", NVL(WORK_TYPE_ID, 'ไม่ระบุ') AS "Work Type",
        COUNT(WORK_TYPE_ID) AS "WO Count"
      FROM ACTIVE_SEPARATE_OVERVIEW
      WHERE GROUP_ID IS NOT NULL AND CONTRACT = :site
      GROUP BY MCH_CODE, WORK_TYPE_ID ORDER BY MCH_CODE, WORK_TYPE_ID`,
  },
  {
    id: "maintenance.wo-status",
    dashboard: "maintenance",
    title: "WO แยกตามสถานะ",
    description: "Work Order lifecycle และจำนวนงานในแต่ละขั้นตอน",
    sourceElementId: "7eb1ee6e-b249-4243-ae53-25d300f62a55",
    sourceDataSourceId: "338d65ff-7cc7-4d6a-a8c3-6ce4973dc1a3",
    allowedFilters: ["site"], kind: "bar", size: "lg",
    sql: `SELECT STATE AS "label", COUNT(WO_NO) AS "value"
      FROM ACTIVE_SEPARATE_OVERVIEW
      WHERE GROUP_ID IS NOT NULL AND CONTRACT = :site
      GROUP BY STATE ORDER BY COUNT(WO_NO) DESC`,
  },
  {
    id: "maintenance.fault-report",
    dashboard: "maintenance",
    title: "Fault Report ที่สร้างใหม่",
    description: "รายการความขัดข้องใหม่ที่ยังต้องประเมินหรือดำเนินการ",
    sourceElementId: "7eb1ee6e-b249-4243-ae53-25d300f62a55",
    sourceDataSourceId: "338d65ff-7cc7-4d6a-a8c3-6ce4973dc1a3",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT WO_NO AS "WO No", MCH_CODE AS "Aircraft", ERR_DESCR AS "Fault", STATE AS "Status"
      FROM ACTIVE_SEPARATE_OVERVIEW
      WHERE GROUP_ID IS NOT NULL AND STATE = 'FaultReport' AND CONTRACT = :site
      ORDER BY WO_NO DESC`,
  },
  {
    id: "maintenance.wo-packages",
    dashboard: "maintenance",
    title: "WO Package แยกตามอากาศยาน",
    description: "ชุดงานซ่อมที่มี Work Order เชื่อมโยงและยังไม่ปิด",
    sourceElementId: "1f4fb9fd-273d-403d-8af8-76a36f101d5a",
    sourceDataSourceId: "e076d552-6f9f-4f1d-8a2e-6dcb5ee251bf",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT MCH_CODE AS "Aircraft", WO_NO AS "WO No", ERR_DESCR AS "Description", STATE AS "Status"
      FROM ACTIVE_SEPARATE_ELS_VIEW
      WHERE CONTRACT = :site AND WORK_ORDER_CONNECTION_API.Has_Connection_Down(WO_NO) = 'TRUE'
        AND STATE NOT IN ('Finished','Cancelled')
      ORDER BY MCH_CODE, WO_NO`,
  },
  {
    id: "maintenance.grounded-list",
    dashboard: "maintenance",
    title: "อากาศยานหยุดบินเกิน 7 วัน",
    description: "รายละเอียดการวัด TSN ล่าสุดของอากาศยานที่เกินเกณฑ์",
    sourceElementId: "6a2a808c-3c48-45cb-b5ff-9d379d5d8e5f",
    sourceDataSourceId: "a51d1ed5-6da4-4339-809e-0dce92c71699",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT MCH_CODE AS "Aircraft", REG_DATE AS "Last Flight", MEASURED_VALUE AS "TSN",
        ROUND(SYSDATE - REG_DATE, 2) AS "Grounded Days"
      FROM EQUIP_OBJECT_MEAS_GROUP_CFV
      WHERE SYSDATE - REG_DATE > 7 AND TEST_POINT_ID = 'TSN' AND CF$_C_MCH_TYPE = 'AIRCRAFT'
        AND CONTRACT = :site AND EQUIPMENT_OBJECT_API.Get_OPERATIONAL_STATUS(CONTRACT, MCH_CODE) <> 'Scrapped'
      ORDER BY REG_DATE`,
  },
  {
    id: "maintenance.pm-calendar",
    dashboard: "maintenance",
    title: "แผน PM ภายใน 6 เดือน",
    description: "กำหนดการ PM แบบ Calendar พร้อม Action และ WO",
    sourceElementId: "04e0fb2b-2bc7-4bf4-913b-ef38e95e0ab3",
    sourceDataSourceId: "1a10310c-bf94-400e-80c0-65ab768021c8",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT PM_ACTION_CALENDAR_PLAN_API.Get_Mch_Code(PM_NO, PM_REVISION) AS "Aircraft",
        PM_NO AS "PM No", CF$_C_ACTION AS "Action", PLANNED_DATE AS "Planned Date", WO_NO AS "WO No",
        GENERATION_DATE AS "Generation Date"
      FROM PM_ACTION_CALENDAR_PLAN_CFV
      WHERE PLANNED_DATE - SYSDATE < 180
        AND (WORK_ORDER_API.Get_State(WO_NO) NOT IN ('Canceled','Finished') OR WO_NO IS NULL)
        AND PM_ACTION_API.Get_State(PM_NO, PM_REVISION) <> 'Obsolete'
        AND GENERATION_TYPE = 'Calendar'
        AND PM_ACTION_API.Get_Connection_Type(PM_NO, PM_REVISION) = 'EQUIPMENT'
        AND CF$_C_WORK_TYPE IN ('WPK')
        AND PM_ACTION_API.Get_Contract_Id(PM_NO, PM_REVISION) = :site
      ORDER BY PLANNED_DATE`,
  },
  {
    id: "maintenance.mmr-planned",
    dashboard: "maintenance",
    title: "รายการใบเบิก MMR ที่รอการอนุมัติ",
    description: "Maintenance Material Requisition ที่อยู่ในสถานะ Planned",
    sourceElementId: "143f15e1-3254-485d-8b0b-42f2a5e7a886",
    sourceDataSourceId: "a6a1a57c-9d91-4f88-ae2d-ce30a4851421",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT MAINT_MATERIAL_ORDER_NO AS "MMR No", WO_NO AS "WO No", DUE_DATE AS "Due Date"
      FROM MAINT_MATERIAL_REQUISITION_UIV
      WHERE STATE = 'Planned'
        AND IFSAPP.WORK_ORDER_API.Get_Contract(WO_NO) = :site
      ORDER BY DUE_DATE`,
  },
  {
    id: "maintenance.mmr-released",
    dashboard: "maintenance",
    title: "รายการใบเบิก MMR ที่อนุมัติแล้ว",
    description: "Maintenance Material Requisition ที่อยู่ในสถานะ Released",
    sourceElementId: "143f15e1-3254-485d-8b0b-42f2a5e7a886",
    sourceDataSourceId: "a6a1a57c-9d91-4f88-ae2d-ce30a4851421",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT MAINT_MATERIAL_ORDER_NO AS "MMR No", WO_NO AS "WO No", DUE_DATE AS "Due Date",
        CF$_RECEIVE_BY AS "Receive By", CF$_WH_STATUS AS "Warehouse Status"
      FROM MAINT_MATERIAL_REQUISITION_CFV
      WHERE STATE = 'Released'
        AND IFSAPP.WORK_ORDER_API.Get_Contract(WO_NO) = :site
      ORDER BY DUE_DATE`,
  },
  {
    id: "maintenance.pm-500-hours",
    dashboard: "maintenance",
    title: "PM ของ Aircraft ที่ครบกำหนดใน 500 Hrs",
    description: "PM แบบ Condition ที่เหลือชั่วโมงต่ำกว่า 500 ชั่วโมง",
    sourceElementId: "1ea50eb2-110a-477b-9d65-d5ec000c26fb",
    sourceDataSourceId: "02d8b1ef-72d9-498a-8a2e-e87314a5c9b3",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT PM_ACTION_CALENDAR_PLAN_API.Get_Mch_Code(PM_NO, PM_REVISION) AS "Aircraft",
        PM_NO AS "PM No", CF$_C_ACTION AS "Action", PLANNED_VALUE AS "Planned",
        CF$_C_TSO AS "TSO", CF$_C_REMAIN AS "Remaining", WO_NO AS "WO No"
      FROM PM_ACTION_CALENDAR_PLAN_CFV
      WHERE CF$_C_REMAIN < 500
        AND (WORK_ORDER_API.Get_State(WO_NO) NOT IN ('Canceled','Finished') OR WO_NO IS NULL)
        AND PM_ACTION_API.Get_State(PM_NO, PM_REVISION) <> 'Obsolete'
        AND GENERATION_TYPE = 'Condition' AND PLANNED_VALUE <> 0
        AND CF$_C_WORK_TYPE IN ('WPK','ALS')
        AND PM_ACTION_API.Get_Contract_Id(PM_NO, PM_REVISION) = :site
      ORDER BY CF$_C_REMAIN`,
  },
  {
    id: "maintenance.new-part-update",
    dashboard: "maintenance",
    title: "New Part Update",
    description: "Part serial ที่ยังไม่มีค่า TSN และ TSO",
    sourceElementId: "1ea50eb2-110a-477b-9d65-d5ec000c26fb",
    sourceDataSourceId: "02d8b1ef-72d9-498a-8a2e-e87314a5c9b3",
    allowedFilters: [], kind: "table", size: "wide",
    sql: `SELECT recent.PART_NO AS "Part No",
        UPPER(PART_CATALOG_API.Get_Description(recent.PART_NO)) AS "Description",
        recent.SERIAL_NO AS "Serial No", recent.STATE AS "Status",
        recent.CF$_C_SERIAL_TSN AS "TSN", recent.CF$_C_SERIAL_TSO AS "TSO",
        recent.DATE_CREATED AS "Date Created", recent.DATE_CHANGED AS "Date Changed",
        recent.WARRANTY_EXPIRES AS "Warranty Expires"
      FROM (
        SELECT PART_NO, SERIAL_NO, STATE, CF$_C_SERIAL_TSN, CF$_C_SERIAL_TSO,
            DATE_CREATED, DATE_CHANGED, WARRANTY_EXPIRES
        FROM PART_SERIAL_CATALOG_CFV
        WHERE CF$_C_SERIAL_TSN IS NULL AND CF$_C_SERIAL_TSO IS NULL
          AND ROWNUM <= 30
      ) recent
      ORDER BY recent.DATE_CREATED DESC`,
  },
  {
    id: "maintenance.component-life",
    dashboard: "maintenance",
    title: "Component เหลืออายุใช้งานน้อยกว่า 100 ชั่วโมง: Life Limits",
    description: "Life Limit, TSO และ Remaining Hours ของ Component",
    sourceElementId: "fcacbaf4-45a0-49a3-b6e9-11fb11e1a668",
    sourceDataSourceId: "7bfbf38a-7bcc-4826-85db-7ecdad28eed8",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT MCH_CODE AS "Component", CF$_C_LIFELIMIT AS "Life Limit",
        CF$_C_TSO AS "TSO", CF$_C_REMAINHR AS "Remaining Hours", SUP_MCH_CODE AS "Aircraft"
      FROM EQUIPMENT_SERIAL_UIV_CFV
      WHERE CONTRACT = :site AND CF$_C_REMAINHR < 100 AND CF$_C_AVL = 'Yes'
        AND OPERATIONAL_STATUS <> 'Scrapped' AND SUP_MCH_CODE NOT IN ('0000','XXXX')
      ORDER BY CF$_C_REMAINHR`,
  },
  {
    id: "maintenance.component-midlife",
    dashboard: "maintenance",
    title: "Component ใกล้ครบ Mid Life",
    description: "ชิ้นส่วนที่เหลืออายุ Mid Life อยู่ในช่วงต่ำกว่า 100 ชั่วโมง",
    sourceElementId: "fcacbaf4-45a0-49a3-b6e9-11fb11e1a668",
    sourceDataSourceId: "7bfbf38a-7bcc-4826-85db-7ecdad28eed8",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT MCH_CODE AS "Component", CF$_C_MIDLIFELIMIT AS "Mid Life Limit",
        CF$_C_TSO AS "TSO", CF$_C_MIDREMAINHR AS "Mid Remain Hr", SUP_MCH_CODE AS "Aircraft"
      FROM EQUIPMENT_SERIAL_UIV_CFV
      WHERE CONTRACT = :site AND CF$_C_MIDREMAINHR > -1000 AND CF$_C_MIDREMAINHR < 100
        AND CF$_C_AVL = 'Yes' AND OPERATIONAL_STATUS <> 'Scrapped'
        AND SUP_MCH_CODE NOT IN ('0000','XXXX')
      ORDER BY CF$_C_MIDREMAINHR`,
  },
  {
    id: "maintenance.component-calendar-due",
    dashboard: "maintenance",
    title: "Component ถึงกำหนดตาม Calendar",
    description: "ชิ้นส่วนที่มีกำหนดตาม Calendar ภายใน 180 วัน",
    sourceElementId: "fcacbaf4-45a0-49a3-b6e9-11fb11e1a668",
    sourceDataSourceId: "7bfbf38a-7bcc-4826-85db-7ecdad28eed8",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT MCH_CODE AS "Component", CF$_C_CAL_PLAN AS "Calendar Plan",
        CF$_C_CAL_DUE_DATE AS "Due Date", CF$_C_CAL_DUE_DATE - SYSDATE AS "Days Remaining",
        SUP_MCH_CODE AS "Aircraft"
      FROM EQUIPMENT_SERIAL_UIV_CFV
      WHERE CONTRACT = :site AND CF$_C_CAL_DUE_DATE - SYSDATE < 180
        AND CF$_C_AVL = 'Yes' AND OPERATIONAL_STATUS <> 'Scrapped'
        AND SUP_MCH_CODE NOT IN ('0000','XXXX')
      ORDER BY CF$_C_CAL_DUE_DATE`,
  },
];

const budget: MetricDefinition[] = [
  {
    id: "budget.summary",
    dashboard: "budget",
    title: "ภาพรวมงบประมาณ",
    description: "งบตั้งต้น ใช้จริง ผูกพัน และคงเหลือของโครงการ",
    sourceElementId: "41dd09bf-c14d-417a-891f-75fb50754ae2",
    sourceDataSourceId: "8183cea7-3fbe-432d-9477-72daf540c389",
    allowedFilters: ["projectId"],
    kind: "summary",
    size: "wide",
    sql: `SELECT ROUND(SUM(ESTIMATED), 2) AS "budget", ROUND(SUM(ACTUAL), 2) AS "actual",
        ROUND(SUM(COMMITTED), 2) AS "committed", ROUND(SUM(ESTIMATED - ACTUAL), 2) AS "balance"
      FROM PROJ_CON_DET_SUM_COST_PROJECT
      WHERE (:projectId IS NULL OR PROJECT_ID = UPPER(:projectId))`,
  },
  {
    id: "budget.utilization",
    dashboard: "budget",
    title: "สัดส่วนการใช้จ่าย",
    description: "เปอร์เซ็นต์งบที่ใช้จริงเทียบกับงบทั้งหมด",
    sourceElementId: "612bacf3-ab66-455a-96de-49cd497a0168",
    sourceDataSourceId: "8183cea7-3fbe-432d-9477-72daf540c389",
    allowedFilters: ["projectId"],
    kind: "gauge",
    size: "md",
    valueLabel: "%",
    sql: `SELECT ROUND(CASE WHEN SUM(ESTIMATED) = 0 THEN 0 ELSE SUM(ACTUAL) / SUM(ESTIMATED) * 100 END, 2) AS "value"
      FROM PROJ_CON_DET_SUM_COST_PROJECT
      WHERE (:projectId IS NULL OR PROJECT_ID = UPPER(:projectId))`,
  },
  {
    id: "budget.cost-elements",
    dashboard: "budget",
    title: "งบตามหมวดค่าใช้จ่าย",
    description: "งบและการใช้จริงในแต่ละ Cost Element",
    sourceElementId: "b1210fe9-7ec5-4d1b-a103-90c7d05958a8",
    sourceDataSourceId: "8183cea7-3fbe-432d-9477-72daf540c389",
    allowedFilters: ["projectId"],
    kind: "bar",
    size: "lg",
    sql: `SELECT NVL(COST_ELEMENT_DESCRIPTION, 'ไม่ระบุ') AS "label", ROUND(SUM(ACTUAL), 2) AS "value"
      FROM PROJ_CON_DET_SUM_COST_PROJECT
      WHERE (:projectId IS NULL OR PROJECT_ID = UPPER(:projectId))
      GROUP BY COST_ELEMENT_DESCRIPTION ORDER BY SUM(ACTUAL) DESC FETCH FIRST 10 ROWS ONLY`,
  },
  {
    id: "budget.overdue-invoices",
    dashboard: "budget",
    title: "Invoice เกินกำหนด",
    description: "จำนวนใบแจ้งหนี้ผู้ขายที่ยังไม่ชำระและเลยกำหนด",
    sourceElementId: "318c059a-1ec4-423f-a1aa-54a06468348a",
    sourceDataSourceId: "14869763-1479-4468-bd50-2e493567c80e",
    allowedFilters: ["projectId"],
    kind: "kpi",
    size: "sm",
    valueLabel: "ใบ",
    sql: `SELECT COUNT(*) AS "value" FROM INVOICE
      WHERE (:projectId IS NULL OR PROJECT_ID = UPPER(:projectId))
        AND PARTY_TYPE = PARTY_TYPE_API.Decode('SUPPLIER')
        AND OBJSTATE NOT IN ('Cancelled','PaidPosted') AND DUE_DATE < SYSDATE`,
  },
  {
    id: "budget.po-closed",
    dashboard: "budget",
    title: "ยอดจ่ายรับพัสดุแล้ว",
    description: "มูลค่า PO line ที่รับของหรือปิดรายการแล้ว",
    sourceElementId: "f8fd7504-a684-480c-b5a4-3670d10c67be",
    sourceDataSourceId: "57197ecb-57e0-433f-a5a1-425b49aab6a2",
    allowedFilters: ["fiscalYear"],
    kind: "kpi",
    size: "sm",
    valueLabel: "บาท",
    sql: `SELECT ROUND(NVL(SUM(BUY_QTY_DUE * BUY_UNIT_PRICE), 0), 2) AS "value"
      FROM PURCHASE_ORDER_LINE_ALL_CFV
      WHERE (:fiscalYear IS NULL OR CF$_C_BUDGET_YEAR = UPPER(:fiscalYear))
        AND STATE IN ('Closed','Received')`,
  },
  {
    id: "budget.po-open",
    dashboard: "budget",
    title: "ยอดรอรับพัสดุ",
    description: "มูลค่า PO line ที่ยังไม่ปิดหรือยกเลิก",
    sourceElementId: "25c8cdf5-c244-4bc8-82f7-cfd6cc3f957d",
    sourceDataSourceId: "36dea8dd-86ab-420a-bb5e-35c8ce257fdb",
    allowedFilters: ["fiscalYear"],
    kind: "kpi",
    size: "sm",
    valueLabel: "บาท",
    sql: `SELECT ROUND(NVL(SUM(BUY_QTY_DUE * BUY_UNIT_PRICE), 0), 2) AS "value"
      FROM PURCHASE_ORDER_LINE_ALL_CFV
      WHERE (:fiscalYear IS NULL OR CF$_C_BUDGET_YEAR = UPPER(:fiscalYear))
        AND STATE NOT IN ('Closed','Cancelled')`,
  },
  {
    id: "budget.projects",
    dashboard: "budget",
    title: "สรุปโครงการงบประมาณ",
    description: "ตารางเปรียบเทียบงบ ใช้จริง ผูกพัน และคงเหลือ",
    sourceElementId: "bb75d829-0d53-482f-b59c-7ebaaddb349d",
    sourceDataSourceId: "8183cea7-3fbe-432d-9477-72daf540c389",
    allowedFilters: ["projectId"],
    kind: "table",
    size: "wide",
    sql: `SELECT PROJECT_ID AS "Project", ROUND(SUM(ESTIMATED), 2) AS "Budget",
        ROUND(SUM(ACTUAL), 2) AS "Actual", ROUND(SUM(COMMITTED), 2) AS "Committed",
        ROUND(SUM(ESTIMATED - ACTUAL), 2) AS "Balance"
      FROM PROJ_CON_DET_SUM_COST_PROJECT
      WHERE (:projectId IS NULL OR PROJECT_ID = UPPER(:projectId))
      GROUP BY PROJECT_ID ORDER BY PROJECT_ID FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "budget.balance-by-project",
    dashboard: "budget",
    title: "งบคงเหลือตามโครงการ",
    description: "เปรียบเทียบงบคงเหลือของโครงการที่มีมูลค่าสูง",
    sourceElementId: "f8fd7504-a684-480c-b5a4-3670d10c67be",
    sourceDataSourceId: "8183cea7-3fbe-432d-9477-72daf540c389",
    allowedFilters: ["projectId"], kind: "bar", size: "lg",
    sql: `SELECT PROJECT_ID AS "label", ROUND(SUM(ESTIMATED - ACTUAL), 2) AS "value"
      FROM PROJ_CON_DET_SUM_COST_PROJECT
      WHERE (:projectId IS NULL OR PROJECT_ID = UPPER(:projectId))
      GROUP BY PROJECT_ID ORDER BY SUM(ESTIMATED - ACTUAL) DESC FETCH FIRST 10 ROWS ONLY`,
  },
  {
    id: "budget.utilization-by-project",
    dashboard: "budget",
    title: "Budget Utilization รายโครงการ",
    description: "สัดส่วนใช้จริงเทียบงบประมาณของแต่ละโครงการ",
    sourceElementId: "6192f161-284c-4688-a467-f60341092d3d",
    sourceDataSourceId: "8183cea7-3fbe-432d-9477-72daf540c389",
    allowedFilters: ["projectId"], kind: "bar", size: "lg",
    sql: `SELECT PROJECT_ID AS "label", ROUND(CASE WHEN SUM(ESTIMATED)=0 THEN 0 ELSE SUM(ACTUAL)*100/SUM(ESTIMATED) END, 2) AS "value"
      FROM PROJ_CON_DET_SUM_COST_PROJECT
      WHERE (:projectId IS NULL OR PROJECT_ID = UPPER(:projectId))
      GROUP BY PROJECT_ID ORDER BY 2 DESC FETCH FIRST 10 ROWS ONLY`,
  },
];

const inventory: MetricDefinition[] = [
  {
    id: "inventory.mr-status",
    dashboard: "inventory",
    title: "MR line ตามสถานะ",
    description: "รายการ Material Requisition ที่คลังต้องดำเนินการ",
    sourceElementId: "bc6903d8-3220-4084-8303-cf12019b1ca4",
    sourceDataSourceId: "fa1d6bc1-d977-480e-8925-112a883429b1",
    allowedFilters: ["site"],
    kind: "bar",
    size: "lg",
    sql: `SELECT STATUS_CODE AS "label", COUNT(*) AS "value"
      FROM MATERIAL_REQUIS_LINE_CFV WHERE CONTRACT = :site
        AND STATUS_CODE IN ('Released','Reserved','Partially Delivered')
      GROUP BY STATUS_CODE ORDER BY COUNT(*) DESC`,
  },
  {
    id: "inventory.mmr-warehouse",
    dashboard: "inventory",
    title: "MMR line ในคลัง",
    description: "ขั้นตอน New, Preparing และ Waiting for Issue",
    sourceElementId: "53f9bf72-7c31-4cd8-8e6f-123e6019113d",
    sourceDataSourceId: "4bfa63b9-8656-4eda-9b06-45cefa474e6d",
    allowedFilters: ["site"],
    kind: "donut",
    size: "md",
    sql: `SELECT NVL(CF$_C_WH_STATUS, 'New') AS "label", COUNT(*) AS "value"
      FROM MAINT_MATERIAL_REQ_LINE_CFV
      WHERE WORK_ORDER_API.Get_Contract(WO_NO) = :site
        AND MAINT_MATERIAL_REQUISITION_API.Get_State(MAINT_MATERIAL_ORDER_NO) = 'Released'
      GROUP BY CF$_C_WH_STATUS ORDER BY COUNT(*) DESC`,
  },
  {
    id: "inventory.po-receipt",
    dashboard: "inventory",
    title: "PO รอตรวจรับ",
    description: "Purchase Order ที่อยู่ในสถานะ To be Inspected",
    sourceElementId: "040966dc-5dab-4687-9051-6777c8fe239c",
    sourceDataSourceId: "93f25d50-9730-4c58-a319-d29efe42c0ae",
    allowedFilters: ["site"],
    kind: "bar",
    size: "md",
    sql: `SELECT STATE AS "label", COUNT(*) AS "value"
      FROM RECEIPT_INFO WHERE CONTRACT = :site
        AND STATE = 'To be Inspected'
      GROUP BY STATE ORDER BY COUNT(*) DESC`,
  },
  {
    id: "inventory.returns",
    dashboard: "inventory",
    title: "Turn-in / Unserviceable",
    description: "พัสดุจาก Work Order ที่รอส่งคืนหรือแยกเป็นของชำรุด",
    sourceElementId: "f15ea9dc-a79e-4876-947e-0817cd5b8067",
    sourceDataSourceId: "efa7afbf-240a-4d3d-9a0d-ef7fe7b0cda6",
    allowedFilters: ["site"],
    kind: "donut",
    size: "md",
    sql: `SELECT CF$_C_RETURN_TYPE AS "label", COUNT(*) AS "value"
      FROM WORK_ORDER_RETURNS_UIV_CFV
      WHERE CONTRACT = :site AND CF$_C_RETURN_TYPE IN ('Turn In','Unserviceable')
        AND QTY_TO_RETURN - QTY_RETURNED <> 0 AND CF$_STATE_WT <> 'Cancelled'
      GROUP BY CF$_C_RETURN_TYPE`,
  },
  {
    id: "inventory.expiring",
    dashboard: "inventory",
    title: "ใกล้หมดอายุภายใน 2 เดือน",
    description: "Lot/Serial ที่มีวันหมดอายุภายใน 60 วัน",
    sourceElementId: "55642097-6f22-4722-a700-703b74b62ba7",
    sourceDataSourceId: "d2b7c49c-dad9-430b-9048-029e5bf70dd3",
    allowedFilters: ["site", "locationSearch"],
    kind: "table",
    size: "wide",
    sql: `SELECT PART_NO AS "Part No", QTY_ONHAND AS "Qty", LOT_BATCH_NO AS "Lot",
        SERIAL_NO AS "Serial", LOCATION_NO AS "Location", EXPIRATION_DATE AS "Expire Date"
      FROM INVENTORY_PART_IN_STOCK_UIV
      WHERE CONTRACT = :site AND EXPIRATION_DATE BETWEEN TRUNC(SYSDATE) AND TRUNC(SYSDATE) + 60
        AND (:locationSearch IS NULL OR LOCATION_NO LIKE '%' || :locationSearch || '%')
      ORDER BY EXPIRATION_DATE FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.low-stock",
    dashboard: "inventory",
    title: "ต่ำกว่าจุดสั่งซื้อ",
    description: "พัสดุคงเหลือรวมต่ำกว่า Order Point ของแต่ละ Part",
    sourceElementId: "10d7592b-6454-40a7-adc4-1744fa2dce48",
    sourceDataSourceId: "11462411-0c36-4aa1-ab8b-65083ff4aa8d",
    allowedFilters: ["site", "locationGroup"],
    kind: "table",
    size: "wide",
    sql: `WITH STOCK AS (
        SELECT S.CONTRACT, S.PART_NO, ROUND(SUM(S.QTY_ONHAND), 2) AS ON_HAND
        FROM INVENTORY_PART_IN_STOCK_UIV S
        JOIN INVENTORY_LOCATION L ON L.CONTRACT = S.CONTRACT AND L.LOCATION_NO = S.LOCATION_NO
        WHERE S.CONTRACT = :site AND (:locationGroup IS NULL OR L.LOCATION_GROUP = :locationGroup)
        GROUP BY S.CONTRACT, S.PART_NO
      )
      SELECT PART_NO AS "Part No", ON_HAND AS "On Hand",
        INVENTORY_PART_PLANNING_API.Get_Order_Point_Qty(CONTRACT, PART_NO) AS "Order Point"
      FROM STOCK
      WHERE ON_HAND < INVENTORY_PART_PLANNING_API.Get_Order_Point_Qty(CONTRACT, PART_NO)
      ORDER BY ON_HAND FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.incoming",
    dashboard: "inventory",
    title: "PO ตรวจเสร็จ รอรับเข้าคลัง",
    description: "PO receipt ที่อยู่ในสถานะ To be Received",
    sourceElementId: "6972498d-f745-470b-8ff2-718396e778e8",
    sourceDataSourceId: "8f08c7da-1574-4cd0-a8a0-8e8459f31d87",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT SOURCE_REF1 AS "PO", SOURCE_REF2 AS "Line", INVENTORY_PART AS "Part No",
        INV_QTY_ARRIVED AS "Qty", STATE AS "Status", RECEIPT_NO AS "Receipt"
      FROM RECEIPT_INFO WHERE CONTRACT = :site
        AND STATE = 'To be Received'
      ORDER BY SOURCE_REF1 FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.mr-lines",
    dashboard: "inventory",
    title: "MR Line รอคลังดำเนินการ",
    description: "รายละเอียดใบเบิกพัสดุที่ Released, Reserved หรือส่งบางส่วน",
    sourceElementId: "10d7592b-6454-40a7-adc4-1744fa2dce48",
    sourceDataSourceId: "fa1d6bc1-d977-480e-8925-112a883429b1",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT ORDER_NO AS "MR", LINE_NO AS "Line", PART_NO AS "Part No", QTY_DUE AS "Qty",
        QTY_ASSIGNED AS "Assigned", QTY_SHIPPED AS "Issued", DUE_DATE AS "Due Date", STATUS_CODE AS "Status"
      FROM MATERIAL_REQUIS_LINE_CFV WHERE CONTRACT = :site
        AND STATUS_CODE IN ('Released','Reserved','Partially Delivered')
      ORDER BY DUE_DATE FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.turn-in-lines",
    dashboard: "inventory",
    title: "Turn-in จาก Work Order",
    description: "รายการพัสดุที่ต้องส่งคืนคลังและยังคืนไม่ครบ",
    sourceElementId: "fa9fbd2d-f573-45f3-8fbf-c44f9b2310b7",
    sourceDataSourceId: "efa7afbf-240a-4d3d-9a0d-ef7fe7b0cda6",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT WO_NO AS "WO No", LINE_NO AS "Line", PART_NO AS "Part No", QTY_TO_RETURN AS "To Return",
        QTY_RETURNED AS "Returned", CF$_C_RETURN_STATUS AS "Status", CF$_C_PERSON_MANAGE AS "Owner"
      FROM WORK_ORDER_RETURNS_UIV_CFV WHERE CONTRACT = :site AND CF$_C_RETURN_TYPE = 'Turn In'
        AND QTY_TO_RETURN - QTY_RETURNED <> 0 AND CF$_STATE_WT <> 'Cancelled'
      ORDER BY WO_NO FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.mmr-new",
    dashboard: "inventory",
    title: "รายการ MMR line ใหม่",
    description: "MMR ที่อนุมัติแล้วและอยู่ในสถานะ New",
    sourceElementId: "53f9bf72-7c31-4cd8-8e6f-123e6019113d",
    sourceDataSourceId: "4bfa63b9-8656-4eda-9b06-45cefa474e6d",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT PART_NO AS "Part No", MAINT_MATERIAL_ORDER_NO AS "MMR No", LINE_ITEM_NO AS "Line No",
        WO_NO AS "WO No", PLAN_QTY AS "Plan Qty", CF$_C_WH_STATUS AS "Warehouse Status",
        CF$_C_PRODUCT_FAMILY AS "Product Family"
      FROM MAINT_MATERIAL_REQ_LINE_CFV
      WHERE WORK_ORDER_API.Get_Contract(WO_NO) = :site
        AND CF$_C_WH_STATUS_DB = (SELECT WAREHOUSE_STATUS_CFP.Encode('NEW') FROM dual)
        AND MAINT_MATERIAL_REQUISITION_API.Get_State(MAINT_MATERIAL_ORDER_NO) = 'Released'
      ORDER BY MAINT_MATERIAL_ORDER_NO, LINE_ITEM_NO FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.mmr-preparing",
    dashboard: "inventory",
    title: "รายการ MMR line ที่กำลังจัดเตรียม",
    description: "MMR ที่อนุมัติแล้วและอยู่ในสถานะ Preparing",
    sourceElementId: "53f9bf72-7c31-4cd8-8e6f-123e6019113d",
    sourceDataSourceId: "4bfa63b9-8656-4eda-9b06-45cefa474e6d",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT PART_NO AS "Part No", MAINT_MATERIAL_ORDER_NO AS "MMR No", LINE_ITEM_NO AS "Line No",
        WO_NO AS "WO No", QTY AS "Qty", CF$_C_WH_STATUS AS "Warehouse Status"
      FROM MAINT_MATERIAL_REQ_LINE_CFV
      WHERE WORK_ORDER_API.Get_Contract(WO_NO) = :site
        AND CF$_C_WH_STATUS_DB = (SELECT WAREHOUSE_STATUS_CFP.Encode('Preparing') FROM dual)
        AND MAINT_MATERIAL_REQUISITION_API.Get_State(MAINT_MATERIAL_ORDER_NO) = 'Released'
      ORDER BY MAINT_MATERIAL_ORDER_NO, LINE_ITEM_NO FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.mmr-waiting-issue",
    dashboard: "inventory",
    title: "รายการ MMR line ที่พร้อมเบิก",
    description: "MMR ที่อนุมัติแล้วและรอจ่ายพัสดุ",
    sourceElementId: "53f9bf72-7c31-4cd8-8e6f-123e6019113d",
    sourceDataSourceId: "4bfa63b9-8656-4eda-9b06-45cefa474e6d",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT PART_NO AS "Part No", MAINT_MATERIAL_ORDER_NO AS "MMR No", LINE_ITEM_NO AS "Line No",
        WO_NO AS "WO No", QTY AS "Qty", CF$_C_WH_STATUS AS "Warehouse Status"
      FROM MAINT_MATERIAL_REQ_LINE_CFV
      WHERE WORK_ORDER_API.Get_Contract(WO_NO) = :site
        AND CF$_C_WH_STATUS_DB = (SELECT WAREHOUSE_STATUS_CFP.Encode('Waiting for Issue') FROM dual)
        AND MAINT_MATERIAL_REQUISITION_API.Get_State(MAINT_MATERIAL_ORDER_NO) = 'Released'
      ORDER BY MAINT_MATERIAL_ORDER_NO, LINE_ITEM_NO FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.pick-list-released",
    dashboard: "inventory",
    title: "รายการใบเบิก Maintenance Material Requisition",
    description: "Pick List ของงานซ่อมที่อยู่ในสถานะ Released",
    sourceElementId: "6972498d-f745-470b-8ff2-718396e778e8",
    sourceDataSourceId: "8f08c7da-1574-4cd0-a8a0-8e8459f31d87",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT PICK_LIST_NO AS "Pick List No", PICK_LIST_DESCRIPTION AS "Description",
        CREATED_BY AS "Created By", PICK_LIST_SOURCE_REF AS "Source Ref", DATE_REQUIRED AS "Date Required"
      FROM PICK_LIST
      WHERE CONTRACT = :site
        AND OBJSTATE = (SELECT PICK_LIST_API.FINITE_STATE_ENCODE__('Released') FROM dual)
      ORDER BY DATE_REQUIRED FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "inventory.unserviceable-lines",
    dashboard: "inventory",
    title: "Unserviceable จาก Work Order",
    description: "รายการพัสดุชำรุดที่ยังส่งคืนไม่ครบ",
    sourceElementId: "fa9fbd2d-f573-45f3-8fbf-c44f9b2310b7",
    sourceDataSourceId: "efa7afbf-240a-4d3d-9a0d-ef7fe7b0cda6",
    allowedFilters: ["site"], kind: "table", size: "wide",
    sql: `SELECT WO_NO AS "WO No", LINE_NO AS "Line", PART_NO AS "Part No", QTY_TO_RETURN AS "To Return",
        QTY_RETURNED AS "Returned", CF$_C_RETURN_STATUS AS "Status", CF$_C_PERSON_MANAGE AS "Owner"
      FROM WORK_ORDER_RETURNS_UIV_CFV
      WHERE CONTRACT = :site AND CF$_C_RETURN_TYPE = 'Unserviceable'
        AND QTY_TO_RETURN - QTY_RETURNED <> 0 AND CF$_STATE_WT <> 'Cancelled'
      ORDER BY WO_NO FETCH FIRST 30 ROWS ONLY`,
  },
];

const procurement: MetricDefinition[] = [
  {
    id: "procurement.rfq-status",
    dashboard: "procurement",
    title: "Requests for Quotation",
    description: "RFQ สำหรับจัดซื้อและจ้างซ่อมแยกตามสถานะ",
    sourceElementId: "f6a8509f-fdf5-41f7-a2f8-4c49c6a470e7",
    sourceDataSourceId: "ce5272af-7fec-4101-b51e-fd52e61515a6",
    allowedFilters: ["site", "buyer"],
    kind: "bar",
    size: "lg",
    sql: `SELECT STATE AS "label", COUNT(*) AS "value" FROM INQUIRY_ORDER_CFV
      WHERE CONTRACT = :site AND STATE <> 'Cancelled'
        AND BUYER_CODE LIKE NVL(:buyer, '%')
      GROUP BY STATE ORDER BY COUNT(*) DESC`,
  },
  {
    id: "procurement.pr-count",
    dashboard: "procurement",
    title: "PR รอดำเนินการ",
    description: "Purchase Requisition line ที่ยังอยู่ในกระบวนการ",
    sourceElementId: "1eb9f4e0-84ae-4dd5-abd6-97010b3dd267",
    sourceDataSourceId: "99d00bed-2fa3-4008-9b32-0143b41d40f4",
    allowedFilters: ["site", "buyer", "supplier"],
    kind: "kpi",
    size: "sm",
    valueLabel: "รายการ",
    sql: `SELECT COUNT(*) AS "value" FROM PURCHASE_REQ_LINE_ALL_CFV
      WHERE CONTRACT = :site AND OBJSTATE IN ('Planned','Released','Request Created','Partially Authorized','Authorized')
        AND BUYER_CODE LIKE NVL(:buyer, '%') AND NVL(VENDOR_NO, '%') LIKE NVL(:supplier, '%')`,
  },
  {
    id: "procurement.po-status",
    dashboard: "procurement",
    title: "PO รอดำเนินการ",
    description: "Purchase Order ที่ยังไม่ปิด แยกตามสถานะ",
    sourceElementId: "3ce67969-99ee-4f30-a3d0-5c4de94c81f3",
    sourceDataSourceId: "27005b1d-43ec-44fb-8e42-2bb6b1c8f145",
    allowedFilters: ["site", "buyer", "supplier"],
    kind: "donut",
    size: "md",
    sql: `SELECT OBJSTATE AS "label", COUNT(*) AS "value" FROM PURCHASE_ORDER
      WHERE CONTRACT = :site AND OBJSTATE IN ('Stopped','Confirmed','Released','Planned')
        AND BUYER_CODE LIKE NVL(:buyer, '%') AND VENDOR_NO LIKE NVL(:supplier, '%')
      GROUP BY OBJSTATE ORDER BY COUNT(*) DESC`,
  },
  {
    id: "procurement.po-lines",
    dashboard: "procurement",
    title: "รายการ PO ที่กำลังจัดซื้อ",
    description: "PO line ที่ยังเปิด พร้อม Part No จำนวน และกำหนดรับ สำหรับเชื่อมกับอะไหล่ที่มีความเสี่ยง",
    sourceElementId: "3ce67969-99ee-4f30-a3d0-5c4de94c81f3",
    sourceDataSourceId: "27005b1d-43ec-44fb-8e42-2bb6b1c8f145",
    allowedFilters: ["site", "buyer", "supplier"],
    kind: "table",
    size: "wide",
    sql: `SELECT ORDER_NO AS "PO", LINE_NO AS "Line", PART_NO AS "Part No",
        BUY_QTY_DUE AS "Qty", PLANNED_RECEIPT_DATE AS "Planned Receipt", OBJSTATE AS "Status",
        BUYER_CODE AS "Buyer", VENDOR_NO AS "Supplier"
      FROM PURCHASE_ORDER_LINE_ALL
      WHERE CONTRACT = :site AND OBJSTATE IN ('Stopped','Confirmed','Released','Planned')
        AND BUYER_CODE LIKE NVL(:buyer, '%') AND VENDOR_NO LIKE NVL(:supplier, '%')
      ORDER BY PLANNED_RECEIPT_DATE, ORDER_NO FETCH FIRST 50 ROWS ONLY`,
  },
  {
    id: "procurement.overdue",
    dashboard: "procurement",
    title: "PO เกินกำหนด",
    description: "Order line ที่เลย Planned Receipt Date",
    sourceElementId: "37d8f99f-c130-462c-8d6b-a8502c0323cd",
    sourceDataSourceId: "a9c929c9-a639-40de-8b6d-0388d308b2a7",
    allowedFilters: ["buyer", "supplier"],
    kind: "kpi",
    size: "sm",
    valueLabel: "รายการ",
    sql: `SELECT COUNT(*) AS "value" FROM PURCHASE_ORDER_LINE_ALL
      WHERE OBJSTATE IN ('Confirmed','Released','Planned') AND PLANNED_RECEIPT_DATE < SYSDATE + 1
        AND BUYER_CODE LIKE NVL(:buyer, '%') AND VENDOR_NO LIKE NVL(:supplier, '%')`,
  },
  {
    id: "procurement.delivery-rate",
    dashboard: "procurement",
    title: "Delivery ตรงเวลา",
    description: "สัดส่วน Order line ที่ส่งมอบตรงเวลาภายใน 1 ปี",
    sourceElementId: "edc5b3d3-e409-4a08-a85a-b75c7415e17d",
    sourceDataSourceId: "88718f8d-9a10-4954-baa5-6fff81c0e353",
    allowedFilters: ["buyer", "supplier"],
    kind: "gauge",
    size: "md",
    valueLabel: "%",
    sql: `SELECT ROUND(CASE WHEN SUM(COUNT_ORDER_LINE) = 0 THEN 0
        ELSE SUM(COUNT_ON_TIME_ORDER_LINE) * 100 / SUM(COUNT_ORDER_LINE) END, 0) AS "value"
      FROM PURCHASE_ORDER_LINE_DETAIL
      WHERE STATE IN ('Arrived','Received','Closed') AND COUNT_ORDER_LINE > 0
        AND PURCHASE_BUYER LIKE NVL(:buyer, '%') AND SUPPLIER LIKE NVL(:supplier, '%')`,
  },
  {
    id: "procurement.quality",
    dashboard: "procurement",
    title: "Supplier Quality",
    description: "สถานะคุณภาพจากรายการเสียหาย ไม่ครบ และปกติ",
    sourceElementId: "8ad6e784-fac9-48b4-b669-66436aa95672",
    sourceDataSourceId: "fce3d2a5-43af-4267-bb67-d8b6dedea3a7",
    allowedFilters: ["buyer", "supplier"],
    kind: "donut",
    size: "md",
    sql: `SELECT CASE WHEN COUNT_DAMAGE_ORDER_LINE = 1 THEN 'เสียหาย'
        WHEN COUNT_INCOMPLETE_ORDER_LINE = 1 THEN 'ไม่ครบ' ELSE 'ปกติ' END AS "label",
        COUNT(*) AS "value" FROM PURCHASE_ORDER_LINE_DETAIL
      WHERE STATE IN ('Arrived','Received','Closed') AND PR_LATEST_ARRIVAL_DATE_ID > SYSDATE - 365
        AND PURCHASE_BUYER LIKE NVL(:buyer, '%') AND SUPPLIER LIKE NVL(:supplier, '%')
      GROUP BY CASE WHEN COUNT_DAMAGE_ORDER_LINE = 1 THEN 'เสียหาย'
        WHEN COUNT_INCOMPLETE_ORDER_LINE = 1 THEN 'ไม่ครบ' ELSE 'ปกติ' END`,
  },
  {
    id: "procurement.reliability",
    dashboard: "procurement",
    title: "Supplier Reliability",
    description: "ความตรงต่อเวลาของผู้ขายในรอบ 1 ปี",
    sourceElementId: "571fbb13-b293-4355-a393-a7de9bb601eb",
    sourceDataSourceId: "51bcb1ac-a683-4b33-9d3d-189004c62f91",
    allowedFilters: ["buyer", "supplier"],
    kind: "donut",
    size: "md",
    sql: `SELECT CASE WHEN COUNT_ON_TIME_ORDER_LINE = 1 THEN 'ตรงเวลา'
        WHEN COUNT_EARLY_ORDER_LINE = 1 THEN 'ก่อนกำหนด' ELSE 'ล่าช้า' END AS "label",
        COUNT(*) AS "value" FROM PURCHASE_ORDER_LINE_DETAIL
      WHERE STATE IN ('Arrived','Received','Closed')
        AND NVL(PR_LATEST_ARRIVAL_DATE_ID, POL_PROMISED_DEL_DATE_ID) > SYSDATE - 365
        AND PURCHASE_BUYER LIKE NVL(:buyer, '%') AND SUPPLIER LIKE NVL(:supplier, '%')
      GROUP BY CASE WHEN COUNT_ON_TIME_ORDER_LINE = 1 THEN 'ตรงเวลา'
        WHEN COUNT_EARLY_ORDER_LINE = 1 THEN 'ก่อนกำหนด' ELSE 'ล่าช้า' END`,
  },
  {
    id: "procurement.arrivals",
    dashboard: "procurement",
    title: "แนวโน้มของเข้า",
    description: "จำนวน PO ที่มีกำหนดรับ แยกตามสัปดาห์",
    sourceElementId: "1bb26030-9f43-411f-a08b-9f8d89a96fb0",
    sourceDataSourceId: "e2ac175b-f1a3-4726-9b32-434bdf288800",
    allowedFilters: ["buyer", "supplier"],
    kind: "line",
    size: "lg",
    sql: `SELECT TO_CHAR(PLANNED_RECEIPT_DATE, 'IYYY-IW') AS "label", COUNT(*) AS "value"
      FROM PURCHASE_ORDER_LINE_ALL
      WHERE OBJSTATE IN ('Confirmed','Released') AND PLANNED_RECEIPT_DATE < SYSDATE + 1
        AND BUYER_CODE LIKE NVL(:buyer, '%') AND VENDOR_NO LIKE NVL(:supplier, '%')
      GROUP BY TO_CHAR(PLANNED_RECEIPT_DATE, 'IYYY-IW')
      ORDER BY TO_CHAR(PLANNED_RECEIPT_DATE, 'IYYY-IW') FETCH FIRST 12 ROWS ONLY`,
  },
  {
    id: "procurement.mr-lines",
    dashboard: "procurement",
    title: "MR สำหรับจัดซื้อ/จ้างซ่อม",
    description: "รายการ Material Requisition ที่ยังต้องดำเนินการ",
    sourceElementId: "f6a8509f-fdf5-41f7-a2f8-4c49c6a470e7",
    sourceDataSourceId: "fa1d6bc1-d977-480e-8925-112a883429b1",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT ORDER_NO AS "MR", LINE_NO AS "Line", PART_NO AS "Part No",
        QTY_DUE AS "Qty", UNIT_MEAS AS "UoM", STATUS_CODE AS "Status", CF$_C_PRIORITY AS "Priority"
      FROM MATERIAL_REQUIS_LINE_CFV WHERE CONTRACT = :site
        AND STATUS_CODE IN ('Released','Reserved','Partially Delivered')
      ORDER BY ORDER_NO, LINE_NO FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "procurement.rfq-lines",
    dashboard: "procurement",
    title: "RFQ ที่อยู่ระหว่างดำเนินการ",
    description: "รายการ Request for Quotation ตามผู้ซื้อและสถานะ",
    sourceElementId: "1eb9f4e0-84ae-4dd5-abd6-97010b3dd267",
    sourceDataSourceId: "ce5272af-7fec-4101-b51e-fd52e61515a6",
    allowedFilters: ["site", "buyer"], kind: "table", size: "wide",
    sql: `SELECT INQUIRY_NO AS "RFQ", BUYER_CODE AS "Buyer", STATE AS "Status"
      FROM INQUIRY_ORDER_CFV WHERE CONTRACT = :site AND STATE <> 'Cancelled'
        AND BUYER_CODE LIKE NVL(:buyer, '%')
      ORDER BY INQUIRY_NO FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "procurement.po-to-send",
    dashboard: "procurement",
    title: "Purchase Orders to Send",
    description: "PO ที่อยู่ระหว่าง Planned, Released, Confirmed หรือ Stopped",
    sourceElementId: "3ce67969-99ee-4f30-a3d0-5c4de94c81f3",
    sourceDataSourceId: "27005b1d-43ec-44fb-8e42-2bb6b1c8f145",
    allowedFilters: ["site", "buyer", "supplier"], kind: "table", size: "wide",
    sql: `SELECT ORDER_NO AS "PO", BUYER_CODE AS "Buyer", VENDOR_NO AS "Supplier", OBJSTATE AS "Status"
      FROM PURCHASE_ORDER WHERE CONTRACT = :site AND OBJSTATE IN ('Stopped','Confirmed','Released','Planned')
        AND BUYER_CODE LIKE NVL(:buyer, '%') AND VENDOR_NO LIKE NVL(:supplier, '%')
      ORDER BY ORDER_NO FETCH FIRST 30 ROWS ONLY`,
  },
  {
    id: "procurement.delivery-analysis",
    dashboard: "procurement",
    title: "Delivery Order Analysis",
    description: "จำนวนรายการส่งตรงเวลา ก่อนกำหนด และล่าช้า",
    sourceElementId: "be27cc5d-2c58-4d47-b28d-464b724e1cec",
    sourceDataSourceId: "7f922ebb-0d4e-4755-8114-d3d955550728",
    allowedFilters: ["buyer", "supplier"], kind: "bar", size: "lg",
    sql: `SELECT CASE WHEN COUNT_ON_TIME_ORDER_LINE = 1 THEN 'On time'
        WHEN COUNT_EARLY_ORDER_LINE = 1 THEN 'Early' ELSE 'Late' END AS "label", COUNT(*) AS "value"
      FROM PURCHASE_ORDER_LINE_DETAIL
      WHERE STATE IN ('Arrived','Received','Closed')
        AND PURCHASE_BUYER LIKE NVL(:buyer, '%') AND SUPPLIER LIKE NVL(:supplier, '%')
      GROUP BY CASE WHEN COUNT_ON_TIME_ORDER_LINE = 1 THEN 'On time'
        WHEN COUNT_EARLY_ORDER_LINE = 1 THEN 'Early' ELSE 'Late' END`,
  },
  {
    id: "procurement.pr-approval-status",
    dashboard: "procurement",
    title: "สถานะการจัดทำ PR",
    description: "สถานะ Purchase Requisition จาก PR line ใน Oracle IFS",
    sourceElementId: "1eb9f4e0-84ae-4dd5-abd6-97010b3dd267",
    sourceDataSourceId: "99d00bed-2fa3-4008-9b32-0143b41d40f4",
    allowedFilters: ["site", "buyer", "supplier"], kind: "bar", size: "lg",
    sql: `SELECT OBJSTATE AS "label", COUNT(*) AS "value"
      FROM PURCHASE_REQ_LINE_ALL_CFV
      WHERE CONTRACT = :site AND OBJSTATE IN ('Planned','Released','Request Created','Partially Authorized','Authorized')
        AND BUYER_CODE LIKE NVL(:buyer, '%') AND NVL(VENDOR_NO, '%') LIKE NVL(:supplier, '%')
      GROUP BY OBJSTATE ORDER BY COUNT(*) DESC`,
  },
];

const summary: MetricDefinition[] = [
  {
    id: "summary.budget",
    dashboard: "summary",
    title: "ภาพรวมงบประมาณ",
    description: "งบประมาณประจำปีและยอดจ่ายจริงของ Project ID ที่เลือก",
    sourceElementId: "41dd09bf-c14d-417a-891f-75fb50754ae2",
    sourceDataSourceId: "8183cea7-3fbe-432d-9477-72daf540c389",
    allowedFilters: ["projectId"],
    kind: "summary",
    size: "wide",
    sql: `SELECT ROUND(SUM(ESTIMATED), 2) AS "estimated",
        ROUND(SUM(ACTUAL), 2) AS "actual"
      FROM PROJ_CON_DET_SUM_COST_PROJECT
      WHERE PROJECT_ID = UPPER(NVL(:projectId, 'B6800'))`,
  },
  {
    id: "summary.aircraft-readiness",
    dashboard: "summary",
    title: "จำนวนอากาศยานที่ใช้งานได้",
    description: "ข้อมูลสำหรับ Donut Chart และตารางสรุป Fleet Availability",
    sourceElementId: "334d7563-0b47-4ef6-8b74-2a0c9b2a35b7",
    sourceDataSourceId: "a51043d3-fe9d-4aee-b100-3f0077e66c00",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT TYPE AS "type", CF$_C_STATUS AS "status",
        COUNT(CF$_C_STATUS) AS "value"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE CF$_C_STATUS IS NOT NULL AND CF$_C_STATUS <> 'xxx'
        AND MCH_TYPE = 'AIRCRAFT' AND CONTRACT = :site
      GROUP BY TYPE, CF$_C_STATUS ORDER BY COUNT(CF$_C_STATUS) DESC`,
  },
  {
    id: "summary.aircraft-condition",
    dashboard: "summary",
    title: "สถานะอากาศยาน แยกตามแผนและประเภท",
    description: "ข้อมูล Condition ที่หน้า Dashboard นำไปสร้าง Pivot Matrix",
    sourceElementId: "334d7563-0b47-4ef6-8b74-2a0c9b2a35b7",
    sourceDataSourceId: "a51043d3-fe9d-4aee-b100-3f0077e66c00",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT TYPE AS "type", CF$_C_CONDITION AS "condition"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND SUP_MCH_CODE <> 'TXX'
        AND CONTRACT = :site`,
  },
  {
    id: "summary.aircraft-list",
    dashboard: "summary",
    title: "รายการสถานะอากาศยาน",
    description: "รายละเอียดสถานะอากาศยานรายเครื่องสำหรับ Drill-down",
    sourceElementId: "334d7563-0b47-4ef6-8b74-2a0c9b2a35b7",
    sourceDataSourceId: "a51043d3-fe9d-4aee-b100-3f0077e66c00",
    allowedFilters: ["site"],
    kind: "table",
    size: "wide",
    sql: `SELECT TYPE AS "Type", MCH_NAME AS "Aircraft Name", MCH_CODE AS "Aircraft No",
        CF$_C_STATUS AS "Status", CF$_C_RESPONSE AS "Response"
      FROM EQUIPMENT_FUNCTIONAL_UIV_CFV
      WHERE MCH_TYPE = 'AIRCRAFT' AND SUP_MCH_CODE <> 'TXX'
        AND CONTRACT = :site
      ORDER BY TYPE, CF$_C_STATUS, MCH_NAME`,
  },
  {
    id: "summary.pr-status",
    dashboard: "summary",
    title: "สถานะการจัดทำ PR",
    description: "Workflow การขอซื้อหรือขอจ้างและสถานะการอนุมัติ",
    sourceElementId: "summary-pr-status",
    sourceDataSourceId: "C_APPROVAL_PUR",
    allowedFilters: [],
    kind: "table",
    size: "wide",
    sql: `SELECT * FROM C_APPROVAL_PUR
      WHERE LU_NAME = 'PurchaseRequisition'`,
  },
];

export const metricCatalog: MetricDefinition[] = [
  ...summary,
  ...fleetReadiness,
  ...maintenance,
  ...budget,
  ...inventory,
  ...procurement,
];

export const dashboardSlugs: DashboardSlug[] = [
  "summary",
  "fleet-readiness",
  "maintenance",
  "budget",
  "inventory",
  "procurement",
];

export const dashboardMeta: Record<DashboardSlug, { title: string; subtitle: string; accent: string }> = {
  summary: {
    title: "Summary",
    subtitle: "ภาพรวมงบประมาณ อากาศยาน และงานซ่อมจาก Oracle IFSAPP",
    accent: "purple",
  },
  "fleet-readiness": {
    title: "Fleet Readiness",
    subtitle: "Mission Ready, Availability, MTBF และ MTTR ของฝูงบิน",
    accent: "blue",
  },
  maintenance: {
    title: "แผนกช่างและวางแผนการซ่อม",
    subtitle: "ความพร้อมอากาศยาน งานซ่อม และแผนบำรุงรักษา",
    accent: "cyan",
  },
  budget: {
    title: "แผนกงบประมาณ",
    subtitle: "ติดตามงบประมาณ การใช้จ่าย และภาระผูกพัน",
    accent: "indigo",
  },
  inventory: {
    title: "แผนกคลังพัสดุ",
    subtitle: "สถานะพัสดุ การรับเข้า การเบิก และสินค้าคงคลัง",
    accent: "emerald",
  },
  procurement: {
    title: "แผนกจัดซื้อ จ้างซ่อม",
    subtitle: "RFQ, PR, PO และประสิทธิภาพผู้ขาย",
    accent: "amber",
  },
};

export function getMetricsForDashboard(dashboard: DashboardSlug) {
  return metricCatalog.filter((metric) => metric.dashboard === dashboard);
}

export function getMetric(metricId: string) {
  return metricCatalog.find((metric) => metric.id === metricId);
}
