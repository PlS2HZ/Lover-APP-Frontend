/* eslint-disable no-unused-vars */
import React from 'react'; // นำเข้า React เพื่อใช้สร้าง Component
// นำเข้า Component Overlay ต่างๆ ที่แยกไฟล์ไว้ตามเทศกาล/ฤดูกาล
import NewYearOverlay from './overlays/NewYearOverlay'; // Overlay ปีใหม่
import ChineseNewYearOverlay from './overlays/ChineseNewYearOverlay'; // Overlay ตรุษจีน
import ChristmasOverlay from './overlays/ChristmasOverlay'; // Overlay คริสต์มาส
import WinterOverlay from './overlays/WinterOverlay'; // Overlay ฤดูหนาว
import SummerOverlay from './overlays/SummerOverlay'; // Overlay ฤดูร้อน
import DayNightOverlay from './overlays/DayNightOverlay'; // Overlay กลางวัน/กลางคืน
import RainyOverlay from './overlays/RainyOverlay'; // Overlay ฤดูฝน

// สร้าง Component ชื่อ SeasonalOverlay รับ props ชื่อ themeId (รหัสธีมปัจจุบัน)
const SeasonalOverlay = ({ themeId }) => {
  // ใช้ switch case เพื่อเลือกแสดง Component ตาม themeId ที่ได้รับมา
  switch (themeId) {
    case 'newyear': return <NewYearOverlay />; // ถ้าเป็นธีม 'newyear' ให้แสดง Overlay ปีใหม่
    case 'chinese': return <ChineseNewYearOverlay />; // ถ้าเป็นธีม 'chinese' ให้แสดง Overlay ตรุษจีน
    case 'christmas': return <ChristmasOverlay />; // ถ้าเป็นธีม 'christmas' ให้แสดง Overlay คริสต์มาส
    case 'winter': return <WinterOverlay />; // ถ้าเป็นธีม 'winter' ให้แสดง Overlay ฤดูหนาว (หิมะ)
    case 'summer': return <SummerOverlay />; // ถ้าเป็นธีม 'summer' ให้แสดง Overlay ฤดูร้อน (แดด/ทะเล)
    case 'rainy': return <RainyOverlay />; // ถ้าเป็นธีม 'rainy' ให้แสดง Overlay ฤดูฝน (ฝนตก)
    case 'day': // กรณี 'day' (กลางวัน)
    case 'night': return <DayNightOverlay mode={themeId} />; // หรือ 'night' (กลางคืน) ให้ใช้ DayNightOverlay พร้อมส่ง mode ไป
    default: return null; // ถ้าไม่ตรงกับเคสไหนเลย ให้คืนค่า null (ไม่แสดง Overlay)
  }
};

export default SeasonalOverlay; // ส่งออก Component เพื่อให้ไฟล์อื่นนำไปใช้งาน