# Same-Day Booking & Slot Availability Feature

## 🎯 Overview

Enhanced the cash payment booking system to support:
1. **Same-day bookings** (not just from tomorrow)
2. **Real-time slot availability** checking
3. **Visual indicators** for booked vs available time slots

## ✨ Features Implemented

### 1. Same-Day Booking Support

**Previously:** Bookings started from tomorrow (+1 day)

**Now:** Bookings can be made for today (with 2-hour minimum lead time)

```typescript
// Date selection now starts from TODAY
const date = new Date();
date.setDate(date.getDate() + index); // index starts at 0 (today)
```

**Visual indicators:**
- 🟢 **"Heute"** badge for current day (green)
- 🔵 **"Morgen"** badge for next day (blue)

### 2. Booked Slot Detection

The system now tracks and displays which time slots are already reserved by other customers.

**Backend API:** `GET /api/checkout/booked-slots`

**Query Parameters:**
- `locationId` - ID of the meetup location
- `date` - Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "locationId": "vienna-1",
  "date": "2025-10-22",
  "bookedTimes": ["14:00", "15:30", "17:00"],
  "message": "3 Zeitslots bereits gebucht"
}
```

**Frontend Integration:**
```typescript
const fetchBookedSlots = async (locationId: string, date: string) => {
  const response = await fetch(`/api/checkout/booked-slots?locationId=${locationId}&date=${date}`);
  const data = await response.json();
  
  if (data.success) {
    setBookedSlots(prev => ({
      ...prev,
      [date]: data.bookedTimes
    }));
  }
};
```

### 3. Time Slot Status System

Each time slot now has one of three states:

#### 🟢 Available
- Time is at least 2 hours in the future
- Slot is NOT booked by another customer
- User can select this slot

```typescript
const isSlotAvailable = (date: string, time: string) => {
  return isTimeValid(date, time) && !isSlotBooked(date, time);
};
```

#### 🔴 Booked
- Another customer has reserved this time
- Displayed with:
  - Red border and background
  - Strike-through text
  - "Gebucht" label

#### ⚫ Too Soon
- Time is less than 2 hours from now
- Displayed grayed out
- "Zu nah" label
- Cannot be selected

### 4. Visual UI Components

**Time Slot Button States:**

```tsx
<button
  className={cn(
    "p-4 rounded-xl border-2 transition-all relative",
    isSelected
      ? "border-orange-500 bg-orange-500/20 scale-105"  // Selected
      : isBooked
        ? "border-red-500/50 bg-red-500/10 cursor-not-allowed"  // Booked
        : isAvailable
          ? "border-slate-600 bg-slate-700/50 hover:border-orange-400"  // Available
          : "border-slate-700 bg-slate-800/30 opacity-50"  // Too soon
  )}
>
  <div className={cn(
    "text-xl font-bold",
    isSelected ? "text-orange-400" 
      : isBooked ? "text-red-400 line-through"
      : isAvailable ? "text-white" 
      : "text-slate-600"
  )}>
    {timeString}
  </div>
  {statusText && (
    <div className={cn("text-xs mt-1 font-medium", statusColor)}>
      {statusText}
    </div>
  )}
</button>
```

**Legend Box:**

A helpful info box shows what each color means:

```
✓ Verfügbar & wählbar    (Orange border)
✗ Bereits gebucht        (Red border, strikethrough)
⊘ Zu nah (min. 2h)       (Gray, disabled)
```

### 5. Auto-Refresh on Date Change

When the user selects a new date, the system automatically fetches booked slots:

```tsx
onClick={() => {
  setSelectedDate(dateString);
  setSelectedTime(""); // Reset time selection
  if (selectedLocation) {
    fetchBookedSlots(selectedLocation.id, dateString);
  }
}}
```

### 6. Enhanced Validation

**Button state:** Only enabled when slot is truly available

```tsx
disabled={!selectedDate || !selectedTime || !isSlotAvailable(selectedDate, selectedTime)}
```

**On confirm:** Triple validation

```typescript
const handleDateTimeConfirm = () => {
  if (!selectedDate || !selectedTime) {
    alert('Bitte wähle Datum und Uhrzeit');
    return;
  }

  if (isSlotBooked(selectedDate, selectedTime)) {
    alert('Dieser Zeitslot ist bereits gebucht. Bitte wähle eine andere Zeit.');
    return;
  }

  if (!isTimeValid(selectedDate, selectedTime)) {
    alert('Der Termin muss mindestens 2 Stunden in der Zukunft liegen');
    return;
  }

  setCurrentStep("confirmation");
};
```

## 📁 Modified Files

### Frontend
- `apps/web/src/components/checkout/CashPaymentFlow.tsx`
  - Added `bookedSlots` state
  - Implemented `fetchBookedSlots`, `isSlotBooked`, `isSlotAvailable`
  - Updated date grid to start from today (index 0)
  - Enhanced time slot UI with 3-state system
  - Added legend/info box
  - Auto-refresh on date change

### Backend
- `apps/api-server/src/routes/checkout.ts`
  - New endpoint: `GET /api/checkout/booked-slots`
  - Returns list of booked times for a location/date
  - Mock data for testing (today has 3 booked slots: 14:00, 15:30, 17:00)

## 🔄 User Flow

1. User selects **Barzahlung** payment method
2. User completes selfie verification
3. User selects meetup location
4. System fetches booked slots for **today**
5. User sees date calendar (starting from TODAY)
6. User clicks on a date → system fetches booked slots for that date
7. Time grid shows:
   - ✅ Available slots (clickable)
   - ❌ Booked slots (red, strikethrough)
   - ⊘ Too soon slots (grayed out)
8. User can only select available slots
9. Button only enables for valid + available slots
10. On confirm, system validates again
11. Booking proceeds ✅

## 🧪 Testing

**Test Scenario 1: Same-Day Booking**
- Navigate to cash payment flow
- Verify calendar starts with "Heute" badge
- Select today's date
- Verify times less than 2 hours from now are disabled

**Test Scenario 2: Booked Slots**
- Select today's date
- Look for times: 14:00, 15:30, 17:00
- Verify they show:
  - Red border
  - Strikethrough text
  - "Gebucht" label
  - Not clickable

**Test Scenario 3: Available Slots**
- Select today's date
- Look for times 2+ hours in future (not 14:00/15:30/17:00)
- Verify they show:
  - Normal border
  - White text
  - Hoverable
  - Clickable

**Test Scenario 4: Date Switch**
- Select today → see some booked slots
- Switch to tomorrow → see NO booked slots (empty array)
- Switch back to today → see booked slots again

## 🔮 Future Production Implementation

**Database Schema:**
```sql
CREATE TABLE cash_appointments (
  id VARCHAR(36) PRIMARY KEY,
  location_id VARCHAR(50) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36),
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_slot (location_id, appointment_date, appointment_time, status)
);
```

**Backend Query:**
```typescript
// GET /api/checkout/booked-slots
const bookedSlots = await db.query(`
  SELECT appointment_time 
  FROM cash_appointments 
  WHERE location_id = ? 
    AND appointment_date = ? 
    AND status IN ('pending', 'confirmed')
  ORDER BY appointment_time ASC
`, [locationId, date]);

return bookedSlots.map(slot => slot.appointment_time);
```

**Booking Creation:**
```typescript
// POST /api/checkout/cash-booking
await db.query(`
  INSERT INTO cash_appointments 
  (id, location_id, appointment_date, appointment_time, user_id, order_id, status)
  VALUES (?, ?, ?, ?, ?, ?, 'pending')
`, [uuid(), locationId, date, time, userId, orderId]);
```

## ✅ Success Criteria

- [x] Users can book appointments for **same day** (not just tomorrow)
- [x] System fetches and displays **booked time slots**
- [x] Visual distinction between available/booked/too-soon
- [x] Strike-through text for booked slots
- [x] "Heute" and "Morgen" badges
- [x] Auto-fetch on date change
- [x] Triple validation (booking check included)
- [x] Info legend explaining colors
- [x] Backend API endpoint for booked slots
- [x] Clean, responsive UI

## 🎨 UI/UX Improvements

1. **Color-coded states** make availability instantly clear
2. **Strike-through text** prevents confusion about booked slots
3. **Info legend** educates users about the system
4. **Auto-refresh** on date change provides seamless experience
5. **"Heute" badge** highlights same-day booking capability
6. **Disabled state** for unavailable slots prevents frustration

## 🚀 Status

**READY FOR TESTING** ✅

All features implemented and working with mock data. Ready for production database integration.





