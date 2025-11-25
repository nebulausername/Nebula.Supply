import { useState, useEffect } from "react";
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Camera,
  User,
  Phone,
  Navigation,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { CheckoutData } from "./CheckoutFlow";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/currency";

interface CashPaymentFlowProps {
  data: CheckoutData;
  amount: number;
  onComplete: () => void;
  onCancel: () => void;
}

interface SafeMeetLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  type: "shopping_center" | "train_station" | "public_place" | "partner_location";
  safetyLevel: "high" | "medium" | "low";
  features: string[];
  staffContact?: string;
  notes?: string;
  availability: {
    [key: string]: Array<{
      start: string;
      end: string;
      maxBookings: number;
      currentBookings: number;
    }>;
  };
}

interface CashPaymentSession {
  id: string;
  status: "pending_selfie" | "selfie_uploaded" | "selfie_verified" | "location_selected" | "time_selected" | "confirmed";
  selfieVerification?: {
    required: boolean;
    completed: boolean;
    handSign: string;
    handSignEmoji: string;
    handSignInstructions: string;
    photoUrl?: string;
    verificationStatus: "pending" | "uploaded" | "approved" | "rejected";
  };
  meetupDetails?: {
    locationId: string;
    locationName: string;
    selectedDate: string;
    selectedTime: string;
    confirmationCode: string;
    instructions: string[];
  };
  securityLevel: "standard" | "enhanced" | "premium";
}

const safeMeetLocations: SafeMeetLocation[] = [
  {
    id: "berlin_alexanderplatz",
    name: "Alexanderplatz - Saturn",
    address: "Alexanderplatz 1, 10178 Berlin",
    city: "Berlin",
    type: "shopping_center",
    safetyLevel: "high",
    features: ["Überwachung", "Sicherheitspersonal", "Zugänglich", "Parkplätze"],
    staffContact: "+49 30 12345678",
    notes: "Haupteingang bei Saturn - Nebula Staff trägt orange Kappe",
    availability: {
      monday: [{ start: "10:00", end: "20:00", maxBookings: 5, currentBookings: 0 }],
      tuesday: [{ start: "10:00", end: "20:00", maxBookings: 5, currentBookings: 0 }],
      wednesday: [{ start: "10:00", end: "20:00", maxBookings: 5, currentBookings: 0 }],
      thursday: [{ start: "10:00", end: "20:00", maxBookings: 5, currentBookings: 0 }],
      friday: [{ start: "10:00", end: "20:00", maxBookings: 5, currentBookings: 0 }],
      saturday: [{ start: "10:00", end: "20:00", maxBookings: 5, currentBookings: 0 }],
      sunday: [{ start: "12:00", end: "18:00", maxBookings: 3, currentBookings: 0 }]
    }
  },
  {
    id: "berlin_hbf",
    name: "Berlin Hauptbahnhof - Starbucks",
    address: "Europaplatz 1, 10557 Berlin",
    city: "Berlin",
    type: "train_station",
    safetyLevel: "high",
    features: ["24/7 Sicherheit", "Bahnanschluss", "Überdacht", "Kameraüberwachung"],
    staffContact: "+49 30 87654321",
    notes: "Starbucks im Hauptbahnhof - Nebula Staff mit grünem Hoodie",
    availability: {
      monday: [{ start: "06:00", end: "22:00", maxBookings: 8, currentBookings: 0 }],
      tuesday: [{ start: "06:00", end: "22:00", maxBookings: 8, currentBookings: 0 }],
      wednesday: [{ start: "06:00", end: "22:00", maxBookings: 8, currentBookings: 0 }],
      thursday: [{ start: "06:00", end: "22:00", maxBookings: 8, currentBookings: 0 }],
      friday: [{ start: "06:00", end: "22:00", maxBookings: 8, currentBookings: 0 }],
      saturday: [{ start: "06:00", end: "22:00", maxBookings: 8, currentBookings: 0 }],
      sunday: [{ start: "08:00", end: "22:00", maxBookings: 6, currentBookings: 0 }]
    }
  },
  {
    id: "berlin_potsdamer_platz",
    name: "Potsdamer Platz - Arkaden",
    address: "Potsdamer Platz 1, 10785 Berlin",
    city: "Berlin",
    type: "shopping_center",
    safetyLevel: "high",
    features: ["Zentrale Lage", "Sicherheitsdienst", "Parkhaus", "ÖPNV"],
    staffContact: "+49 30 11223344",
    notes: "Arkaden Eingang - Nebula Staff mit blauem Rucksack",
    availability: {
      monday: [{ start: "10:00", end: "21:00", maxBookings: 6, currentBookings: 0 }],
      tuesday: [{ start: "10:00", end: "21:00", maxBookings: 6, currentBookings: 0 }],
      wednesday: [{ start: "10:00", end: "21:00", maxBookings: 6, currentBookings: 0 }],
      thursday: [{ start: "10:00", end: "21:00", maxBookings: 6, currentBookings: 0 }],
      friday: [{ start: "10:00", end: "21:00", maxBookings: 6, currentBookings: 0 }],
      saturday: [{ start: "10:00", end: "21:00", maxBookings: 6, currentBookings: 0 }],
      sunday: [{ start: "13:00", end: "19:00", maxBookings: 4, currentBookings: 0 }]
    }
  }
];

// Hand gestures for verification (matching bot system)
const handSigns = [
  { emoji: "✌️", name: "Peace-Zeichen", instructions: "Zeige das Peace-Zeichen (V-Zeichen)" },
  { emoji: "👍", name: "Daumen hoch", instructions: "Zeige einen Daumen nach oben" },
  { emoji: "👌", name: "OK-Zeichen", instructions: "Bilde einen Kreis mit Daumen und Zeigefinger" },
  { emoji: "🤘", name: "Rock-On", instructions: "Strecke Zeige- und kleinen Finger aus" },
  { emoji: "🤟", name: "Love-You", instructions: "Strecke Daumen, Zeige- und kleinen Finger aus" },
  { emoji: "🤞", name: "Daumen drücken", instructions: "Kreuze deine Zeige- und Mittelfinger" },
  { emoji: "🤙", name: "Call me", instructions: "Bilde mit Daumen und kleinem Finger ein Telefon" },
  { emoji: "🖖", name: "Spock-Gruß", instructions: "Trenne Zeige- und Mittelfinger von Ring- und kleinem Finger" }
];

const getRandomHandSign = () => {
  return handSigns[Math.floor(Math.random() * handSigns.length)];
};

const generateConfirmationCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const CashPaymentFlow = ({ data, amount, onComplete, onCancel }: CashPaymentFlowProps) => {
  const [currentStep, setCurrentStep] = useState<"selfie" | "location" | "time" | "confirmation">("selfie");
  const handSign = getRandomHandSign();
  const [session, setSession] = useState<CashPaymentSession>({
    id: `cash_${Date.now()}`,
    status: "pending_selfie",
    selfieVerification: {
      required: true,
      completed: false,
      handSign: handSign.name,
      handSignEmoji: handSign.emoji,
      handSignInstructions: handSign.instructions,
      verificationStatus: "pending"
    },
    securityLevel: "enhanced"
  });
  const [selectedLocation, setSelectedLocation] = useState<SafeMeetLocation | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('sessionId', session.id);
      formData.append('handSign', session.selfieVerification!.handSign);
      formData.append('handSignEmoji', session.selfieVerification!.handSignEmoji);
      formData.append('handSignInstructions', session.selfieVerification!.handSignInstructions);
      formData.append('userId', data.shippingAddress.firstName || 'guest'); // In production, use actual user ID
      formData.append('orderId', session.id);
      
      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/checkout/cash-verification', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update session status
      setSession(prev => ({
        ...prev,
        status: "selfie_uploaded",
        selfieVerification: {
          ...prev.selfieVerification!,
          photoUrl: previewUrl || undefined,
          verificationStatus: "uploaded"
        }
      }));
      
      // For now, auto-approve after a few seconds (in production, admin would approve)
      setTimeout(() => {
        handleSelfieApproved();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to upload selfie:', error);
      alert('Fehler beim Hochladen. Bitte versuche es erneut.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelfieApproved = () => {
    setSession(prev => ({
      ...prev,
      status: "selfie_verified",
      selfieVerification: {
        ...prev.selfieVerification!,
        completed: true,
        verificationStatus: "approved"
      }
    }));
    setCurrentStep("location");
  };

  const handleSelfieComplete = () => {
    // Deprecated - replaced by handleSelfieUpload
    handleSelfieApproved();
  };

  const handleLocationSelect = (location: SafeMeetLocation) => {
    setSelectedLocation(location);
    setCurrentStep("time");
    
    // Fetch booked slots for today when location is selected
    const today = new Date().toISOString().split('T')[0];
    fetchBookedSlots(location.id, today);
  };

  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep("confirmation");
  };

  // Calculate min and max dates for date picker
  const getMinDate = () => {
    // Allow same-day bookings!
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days in future
    return maxDate.toISOString().split('T')[0];
  };

  // Fetch booked time slots for a specific date and location
  const fetchBookedSlots = async (locationId: string, date: string) => {
    try {
      const response = await fetch(`/api/checkout/booked-slots?locationId=${locationId}&date=${date}`);
      const data = await response.json();
      
      if (data.success) {
        setBookedSlots(prev => ({
          ...prev,
          [date]: data.bookedTimes
        }));
        console.log(`✅ Gebuchte Slots für ${date}:`, data.bookedTimes);
      }
    } catch (error) {
      console.error('Failed to fetch booked slots:', error);
      // On error, assume no bookings
      setBookedSlots(prev => ({
        ...prev,
        [date]: []
      }));
    }
  };

  // Check if a time slot is already booked
  const isSlotBooked = (date: string, time: string) => {
    return bookedSlots[date]?.includes(time) || false;
  };

  // Validate time is at least 2 hours in future
  const isTimeValid = (selectedDate: string, selectedTime: string) => {
    if (!selectedDate || !selectedTime) return false;
    
    const selected = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    return selected >= minTime;
  };

  // Check if time slot is available (not booked AND in valid time)
  const isSlotAvailable = (date: string, time: string) => {
    return isTimeValid(date, time) && !isSlotBooked(date, time);
  };

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

  const handleConfirm = () => {
    const confirmationCode = generateConfirmationCode();
    setSession(prev => ({
      ...prev,
      status: "confirmed",
      meetupDetails: {
        locationId: selectedLocation!.id,
        locationName: selectedLocation!.name,
        selectedDate,
        selectedTime,
        confirmationCode,
        instructions: [
          `Treffe dich am ${selectedDate} um ${selectedTime} Uhr`,
          `Ort: ${selectedLocation!.name}`,
          `Adresse: ${selectedLocation!.address}`,
          `Bestätigungscode: ${confirmationCode}`,
          `Staff-Kontakt: ${selectedLocation!.staffContact}`,
          selectedLocation!.notes || ""
        ]
      }
    }));
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {["selfie", "location", "time", "confirmation"].map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                currentStep === step
                  ? "bg-orange-500 text-white"
                  : ["selfie", "location", "time", "confirmation"].indexOf(currentStep) > index
                  ? "bg-green-500 text-white"
                  : "bg-slate-700 text-slate-400"
              )}
            >
              {["selfie", "location", "time", "confirmation"].indexOf(currentStep) > index ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 3 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2",
                  ["selfie", "location", "time", "confirmation"].indexOf(currentStep) > index
                    ? "bg-green-500"
                    : "bg-slate-700"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === "selfie" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Camera className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hand-Geste Verifikation</h3>
            <p className="text-slate-400">
              Für Bargeld-Zahlungen benötigen wir eine Selfie-Verifikation mit Handzeichen
            </p>
          </div>

          {session.selfieVerification?.verificationStatus === "pending" && (
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-orange-400" />
                    <span className="font-medium text-orange-400">Handzeichen-Challenge</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">
                    Mache ein Selfie mit diesem Handzeichen:
                  </p>
                  <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="text-8xl">
                      {session.selfieVerification?.handSignEmoji}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-xl text-white mb-2">
                        {session.selfieVerification?.handSign}
                      </div>
                      <div className="text-slate-300">
                        {session.selfieVerification?.handSignInstructions}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Anleitung:</h4>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>Zeige das oben angezeigte Handzeichen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>Halte deine Hand deutlich sichtbar neben dein Gesicht</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>Mache ein klares Selfie</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>Lade das Foto hoch zur Überprüfung</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="font-semibold text-white mb-2 block">Selfie hochladen:</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileSelect}
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                    />
                  </label>

                  {previewUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400 mb-2">Vorschau:</p>
                      <img 
                        src={previewUrl} 
                        alt="Selfie Preview" 
                        className="w-full max-w-md mx-auto rounded-lg border-2 border-slate-600"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Wichtige Hinweise</span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-300">
                    <div>• Verwende gute Beleuchtung</div>
                    <div>• Keine Filter oder Effekte</div>
                    <div>• Gesicht und Handzeichen müssen klar erkennbar sein</div>
                    <div>• Admin prüft das Foto vor Freigabe</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {session.selfieVerification?.verificationStatus === "uploaded" && (
            <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Warte auf Admin-Freigabe</h4>
                  <p className="text-slate-300">
                    Dein Selfie wird gerade von unserem Team überprüft. Dies dauert in der Regel nur wenige Minuten.
                  </p>
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-400 mb-2">Dein hochgeladenes Foto:</p>
                    <img 
                      src={previewUrl} 
                      alt="Uploaded Selfie" 
                      className="w-full max-w-sm mx-auto rounded-lg border-2 border-blue-500/50"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              disabled={isUploading || session.selfieVerification?.verificationStatus === "uploaded"}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSelfieUpload}
              disabled={!selectedFile || isUploading || session.selfieVerification?.verificationStatus === "uploaded"}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300",
                !selectedFile || isUploading || session.selfieVerification?.verificationStatus === "uploaded"
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
              )}
            >
              {isUploading ? "Wird hochgeladen..." : session.selfieVerification?.verificationStatus === "uploaded" ? "Hochgeladen ✓" : "Selfie absenden"}
            </button>
          </div>
        </div>
      )}

      {currentStep === "location" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Safe-Meet Ort wählen</h3>
            <p className="text-slate-400">
              Wähle einen sicheren Treffpunkt für deine Bargeld-Zahlung
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {safeMeetLocations.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className="p-6 rounded-xl border border-slate-600 bg-slate-800/50 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-slate-700">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{location.name}</h4>
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        location.safetyLevel === "high" 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {location.safetyLevel === "high" ? "🛡️ Hoch" : "⚠️ Mittel"}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{location.address}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {location.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    {location.notes && (
                      <p className="text-xs text-slate-500">{location.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("selfie")}
              className="flex items-center gap-2 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
          </div>
        </div>
      )}

      {currentStep === "time" && selectedLocation && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Termin wählen</h3>
            <p className="text-slate-400">
              Wähle einen passenden Termin für dein Safe-Meet
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="h-5 w-5 text-blue-400" />
              <div>
                <h4 className="font-semibold text-white">{selectedLocation.name}</h4>
                <p className="text-sm text-slate-400">{selectedLocation.address}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Date Selection - Visual Calendar */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  📅 Datum wählen *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
                  {Array.from({ length: 14 }).map((_, index) => {
                    const date = new Date();
                    date.setDate(date.getDate() + index); // Start from TODAY
                    const dateString = date.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateString;
                    const isToday = index === 0;
                    const isTomorrow = index === 1;
                    
                    return (
                      <button
                        key={dateString}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateString);
                          setSelectedTime(""); // Reset time when changing date
                          if (selectedLocation) {
                            fetchBookedSlots(selectedLocation.id, dateString);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center",
                          isSelected
                            ? "border-orange-500 bg-orange-500/20 scale-105"
                            : "border-slate-600 bg-slate-700/50 hover:border-orange-400 hover:bg-orange-500/10"
                        )}
                      >
                        <div className="text-xs text-slate-400 mb-1">
                          {date.toLocaleDateString('de-DE', { weekday: 'short' })}
                        </div>
                        <div className={cn(
                          "text-lg font-bold",
                          isSelected ? "text-orange-400" : "text-white"
                        )}>
                          {date.getDate()}
                        </div>
                        <div className="text-xs text-slate-400">
                          {date.toLocaleDateString('de-DE', { month: 'short' })}
                        </div>
                        {isToday && (
                          <div className="text-xs text-green-400 mt-1 font-semibold">
                            Heute
                          </div>
                        )}
                        {isTomorrow && (
                          <div className="text-xs text-blue-400 mt-1">
                            Morgen
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection - Visual Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    🕐 Uhrzeit wählen *
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {Array.from({ length: 21 }).map((_, index) => {
                      // Generate time slots from 10:00 to 20:00 in 30-minute intervals
                      const hour = Math.floor(10 + index * 0.5);
                      const minute = (index % 2) * 30;
                      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      const isSelected = selectedTime === timeString;
                      
                      // Check different states
                      const isBooked = isSlotBooked(selectedDate, timeString);
                      const isTooSoon = !isTimeValid(selectedDate, timeString);
                      const isAvailable = isSlotAvailable(selectedDate, timeString);
                      
                      let statusText = "";
                      let statusColor = "";
                      
                      if (isBooked) {
                        statusText = "Gebucht";
                        statusColor = "text-red-400";
                      } else if (isTooSoon) {
                        statusText = "Zu nah";
                        statusColor = "text-slate-500";
                      } else if (isSelected) {
                        statusText = "✓ Gewählt";
                        statusColor = "text-orange-400";
                      }
                      
                      return (
                        <button
                          key={timeString}
                          type="button"
                          onClick={() => isAvailable && setSelectedTime(timeString)}
                          disabled={!isAvailable}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all relative",
                            isSelected
                              ? "border-orange-500 bg-orange-500/20 scale-105"
                              : isBooked
                                ? "border-red-500/50 bg-red-500/10 cursor-not-allowed"
                                : isAvailable
                                  ? "border-slate-600 bg-slate-700/50 hover:border-orange-400 hover:bg-orange-500/10"
                                  : "border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed",
                          )}
                        >
                          <div className={cn(
                            "text-xl font-bold",
                            isSelected 
                              ? "text-orange-400" 
                              : isBooked
                                ? "text-red-400 line-through"
                                : isAvailable 
                                  ? "text-white" 
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
                      );
                    })}
                  </div>
                  
                  {/* Info Box */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                    <div className="flex items-start gap-2 text-xs">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-orange-500/20 border-2 border-orange-500"></div>
                          <span className="text-slate-300">Verfügbar & wählbar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-red-500/10 border-2 border-red-500/50"></div>
                          <span className="text-slate-300">Bereits gebucht</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-slate-800/30 border-2 border-slate-700"></div>
                          <span className="text-slate-300">Zu nah (min. 2h Vorlauf)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Opening Hours Info */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-sm">Öffnungszeiten</span>
                </div>
                <p className="text-sm text-slate-300">
                  Täglich von 10:00 bis 20:00 Uhr
                </p>
              </div>

              {/* Validation Info */}
              {selectedDate && selectedTime && !isTimeValid(selectedDate, selectedTime) && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Der Termin muss mindestens 2 Stunden in der Zukunft liegen
                    </span>
                  </div>
                </div>
              )}

              {/* Preview */}
              {selectedDate && selectedTime && isTimeValid(selectedDate, selectedTime) && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">Gewählter Termin</span>
                  </div>
                  <p className="text-sm text-white">
                    {new Date(selectedDate).toLocaleDateString('de-DE', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} um {selectedTime} Uhr
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("location")}
              className="flex items-center gap-2 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
            <button
              onClick={handleDateTimeConfirm}
              disabled={!selectedDate || !selectedTime || !isSlotAvailable(selectedDate, selectedTime)}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300",
                selectedDate && selectedTime && isSlotAvailable(selectedDate, selectedTime)
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              )}
            >
              Termin bestätigen
            </button>
          </div>
        </div>
      )}

      {currentStep === "confirmation" && selectedLocation && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Safe-Meet bestätigen</h3>
            <p className="text-slate-400">
              Überprüfe deine Termindetails und bestätige die Bargeld-Zahlung
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h4 className="font-semibold text-white mb-3">Termindetails</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">
                      {selectedDate ? new Date(selectedDate).toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : selectedDate} um {selectedTime} Uhr
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">{selectedLocation.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">{selectedLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">{selectedLocation.staffContact}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <h4 className="font-semibold text-white mb-3">Zahlungsdetails</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Betrag:</span>
                    <span className="font-semibold text-white">{formatCurrency(amount, "EUR")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Zahlungsart:</span>
                    <span className="font-semibold text-white">Bargeld (Safe-Meet)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Sicherheit:</span>
                    <span className="font-semibold text-green-400">Maximal</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold text-white mb-3">Anweisungen</h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>• Komme pünktlich zum vereinbarten Termin</div>
                  <div>• Sage dem Staff den Bestätigungscode</div>
                  <div>• Bezahle den vereinbarten Betrag</div>
                  <div>• Erhalte deine Bestellung</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                <h4 className="font-semibold text-white mb-3">Bestätigungscode</h4>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-orange-400">
                    {generateConfirmationCode()}
                  </span>
                  <button
                    onClick={() => copyToClipboard(generateConfirmationCode(), "code")}
                    className="p-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-300 transition-colors"
                  >
                    {copiedField === "code" ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Zeige diesen Code dem Nebula Staff zur Bestätigung
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("time")}
              className="flex items-center gap-2 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              <CheckCircle className="h-5 w-5" />
              Safe-Meet bestätigen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

