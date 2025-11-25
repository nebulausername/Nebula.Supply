import { useState, useEffect } from "react";
import { 
  DollarSign, 
  MapPin, 
  Clock, 
  Users, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Phone,
  Navigation,
  Calendar,
  TrendingUp,
  Activity
} from "lucide-react";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/currency";

interface CashPaymentSession {
  id: string;
  userId: number;
  userName: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending_selfie" | "selfie_verified" | "location_selected" | "time_selected" | "confirmed" | "completed" | "cancelled";
  selfieVerification?: {
    required: boolean;
    completed: boolean;
    sessionId?: string;
    challenge?: string;
    verifiedAt?: Date;
    score?: number;
  };
  meetupDetails?: {
    locationId: string;
    locationName: string;
    selectedDate: string;
    selectedTime: string;
    staffMember?: string;
    confirmationCode: string;
    instructions: string[];
  };
  createdAt: Date;
  expiresAt: Date;
  securityLevel: "standard" | "enhanced" | "premium";
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
  todayBookings: number;
  maxBookings: number;
  utilization: number;
}

interface CashPaymentStats {
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  cancelledSessions: number;
  totalRevenue: number;
  averageAmount: number;
  successRate: number;
  topLocation: string;
  peakHour: string;
}

export const CashPaymentDashboard = () => {
  const [sessions, setSessions] = useState<CashPaymentSession[]>([]);
  const [locations, setLocations] = useState<SafeMeetLocation[]>([]);
  const [stats, setStats] = useState<CashPaymentStats | null>(null);
  const [selectedSession, setSelectedSession] = useState<CashPaymentSession | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed">("all");

  // Mock Data - In Production: API Calls
  useEffect(() => {
    const mockSessions: CashPaymentSession[] = [
      {
        id: "cash_123456_001",
        userId: 123456,
        userName: "Max Mustermann",
        orderId: "NEB-CASH-ABC123",
        amount: 89.99,
        currency: "EUR",
        status: "confirmed",
        selfieVerification: {
          required: true,
          completed: true,
          sessionId: "selfie_123456_001",
          challenge: "NEBULA-CASH-2024",
          verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          score: 87
        },
        meetupDetails: {
          locationId: "berlin_alexanderplatz",
          locationName: "Alexanderplatz - Saturn",
          selectedDate: "25.12.2024",
          selectedTime: "14:00",
          staffMember: "+49 30 12345678",
          confirmationCode: "ABC123",
          instructions: [
            "Treffe dich am 25.12.2024 um 14:00 Uhr",
            "Ort: Alexanderplatz - Saturn",
            "Adresse: Alexanderplatz 1, 10178 Berlin",
            "Bestätigungscode: ABC123",
            "Staff-Kontakt: +49 30 12345678",
            "Haupteingang bei Saturn - Nebula Staff trägt orange Kappe"
          ]
        },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        securityLevel: "enhanced"
      },
      {
        id: "cash_789012_002",
        userId: 789012,
        userName: "Anna Schmidt",
        orderId: "NEB-CASH-DEF456",
        amount: 149.50,
        currency: "EUR",
        status: "pending_selfie",
        selfieVerification: {
          required: true,
          completed: false,
          challenge: "SAFE-MEET-VERIFIED"
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        expiresAt: new Date(Date.now() + 29 * 30 * 60 * 1000),
        securityLevel: "enhanced"
      },
      {
        id: "cash_345678_003",
        userId: 345678,
        userName: "Tom Weber",
        orderId: "NEB-CASH-GHI789",
        amount: 199.99,
        currency: "EUR",
        status: "completed",
        selfieVerification: {
          required: true,
          completed: true,
          sessionId: "selfie_345678_003",
          challenge: "BARZAHLUNG-SICHER",
          verifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          score: 92
        },
        meetupDetails: {
          locationId: "berlin_hbf",
          locationName: "Berlin Hauptbahnhof - Starbucks",
          selectedDate: "24.12.2024",
          selectedTime: "16:30",
          staffMember: "+49 30 87654321",
          confirmationCode: "GHI789",
          instructions: [
            "Treffe dich am 24.12.2024 um 16:30 Uhr",
            "Ort: Berlin Hauptbahnhof - Starbucks",
            "Adresse: Europaplatz 1, 10557 Berlin",
            "Bestätigungscode: GHI789",
            "Staff-Kontakt: +49 30 87654321",
            "Starbucks im Hauptbahnhof - Nebula Staff mit grünem Hoodie"
          ]
        },
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        securityLevel: "premium"
      }
    ];

    const mockLocations: SafeMeetLocation[] = [
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
        todayBookings: 3,
        maxBookings: 5,
        utilization: 60
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
        todayBookings: 5,
        maxBookings: 8,
        utilization: 62.5
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
        todayBookings: 2,
        maxBookings: 6,
        utilization: 33.3
      }
    ];

    const mockStats: CashPaymentStats = {
      totalSessions: 47,
      completedSessions: 38,
      pendingSessions: 6,
      cancelledSessions: 3,
      totalRevenue: 4567.89,
      averageAmount: 97.19,
      successRate: 80.85,
      topLocation: "Berlin Hauptbahnhof",
      peakHour: "16:00-17:00"
    };

    setSessions(mockSessions);
    setLocations(mockLocations);
    setStats(mockStats);
  }, []);

  const filteredSessions = sessions.filter(session => {
    switch (filter) {
      case "pending":
        return session.status === "pending_selfie" || session.status === "selfie_verified" || session.status === "location_selected" || session.status === "time_selected";
      case "confirmed":
        return session.status === "confirmed";
      case "completed":
        return session.status === "completed";
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "confirmed":
        return "bg-blue-500/20 text-blue-400";
      case "pending_selfie":
      case "selfie_verified":
      case "location_selected":
      case "time_selected":
        return "bg-yellow-500/20 text-yellow-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending_selfie":
        return "Selfie ausstehend";
      case "selfie_verified":
        return "Selfie verifiziert";
      case "location_selected":
        return "Ort gewählt";
      case "time_selected":
        return "Zeit gewählt";
      case "confirmed":
        return "Bestätigt";
      case "completed":
        return "Abgeschlossen";
      case "cancelled":
        return "Abgebrochen";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Cash Payment Dashboard</h2>
          <p className="text-slate-400">Verwalte Bargeld-Zahlungen und Safe-Meet Termine</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Activity className="h-5 w-5 text-green-400" />
          </div>
          <span className="text-sm text-slate-400">Live</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400">Gesamtumsatz</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-xs text-green-400">+12.5% diese Woche</div>
          </div>

          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-sm text-slate-400">Erfolgsrate</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.successRate}%</div>
            <div className="text-xs text-green-400">+2.1% diese Woche</div>
          </div>

          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <span className="text-sm text-slate-400">Ausstehend</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.pendingSessions}</div>
            <div className="text-xs text-slate-400">Sessions</div>
          </div>

          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-sm text-slate-400">Durchschnitt</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.averageAmount)}</div>
            <div className="text-xs text-slate-400">Pro Session</div>
          </div>
        </div>
      )}

      {/* Safe-Meet Locations */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Safe-Meet Standorte</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.map((location) => (
            <div key={location.id} className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-slate-600">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm">{location.name}</h4>
                  <p className="text-xs text-slate-400">{location.address}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Auslastung heute:</span>
                  <span className="text-white">{location.todayBookings}/{location.maxBookings}</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full",
                      location.utilization > 80 ? "bg-red-500" :
                      location.utilization > 60 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${location.utilization}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Shield className={cn(
                    "h-3 w-3",
                    location.safetyLevel === "high" ? "text-green-400" : "text-yellow-400"
                  )} />
                  <span className="text-slate-400">
                    {location.safetyLevel === "high" ? "Hoch" : "Mittel"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Cash Payment Sessions</h3>
          <div className="flex gap-2">
            {["all", "pending", "confirmed", "completed"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                  filter === filterType
                    ? "bg-orange-500 text-white"
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                )}
              >
                {filterType === "all" ? "Alle" :
                 filterType === "pending" ? "Ausstehend" :
                 filterType === "confirmed" ? "Bestätigt" : "Abgeschlossen"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Session</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Betrag</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Termin</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm font-medium text-white">{session.orderId}</div>
                      <div className="text-xs text-slate-400">{session.id}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm text-white">{session.userName}</div>
                      <div className="text-xs text-slate-400">ID: {session.userId}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-semibold text-white">
                      {formatCurrency(session.amount, session.currency)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getStatusColor(session.status)
                    )}>
                      {getStatusText(session.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {session.meetupDetails ? (
                      <div>
                        <div className="text-sm text-white">
                          {session.meetupDetails.selectedDate} {session.meetupDetails.selectedTime}
                        </div>
                        <div className="text-xs text-slate-400">
                          {session.meetupDetails.locationName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Session Details</h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Session ID</label>
                    <div className="text-sm font-mono text-white">{selectedSession.id}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Order ID</label>
                    <div className="text-sm font-mono text-white">{selectedSession.orderId}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">User</label>
                    <div className="text-sm text-white">{selectedSession.userName} (ID: {selectedSession.userId})</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Betrag</label>
                    <div className="text-sm font-semibold text-white">
                      {formatCurrency(selectedSession.amount, selectedSession.currency)}
                    </div>
                  </div>
                </div>

                {/* Selfie Verification */}
                {selectedSession.selfieVerification && (
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                    <h4 className="font-semibold text-white mb-3">Selfie-Verifikation</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Status:</span>
                        <span className={cn(
                          "ml-2 px-2 py-1 rounded-full text-xs",
                          selectedSession.selfieVerification.completed 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {selectedSession.selfieVerification.completed ? "Verifiziert" : "Ausstehend"}
                        </span>
                      </div>
                      {selectedSession.selfieVerification.score && (
                        <div>
                          <span className="text-slate-400">Score:</span>
                          <span className="ml-2 text-white">{selectedSession.selfieVerification.score}/100</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Challenge:</span>
                        <span className="ml-2 font-mono text-white">{selectedSession.selfieVerification.challenge}</span>
                      </div>
                      {selectedSession.selfieVerification.verifiedAt && (
                        <div>
                          <span className="text-slate-400">Verifiziert:</span>
                          <span className="ml-2 text-white">
                            {selectedSession.selfieVerification.verifiedAt.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Meetup Details */}
                {selectedSession.meetupDetails && (
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                    <h4 className="font-semibold text-white mb-3">Safe-Meet Details</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-400">Termin:</span>
                        <span className="text-white">
                          {selectedSession.meetupDetails.selectedDate} um {selectedSession.meetupDetails.selectedTime} Uhr
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <span className="text-slate-400">Ort:</span>
                        <span className="text-white">{selectedSession.meetupDetails.locationName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-400">Staff:</span>
                        <span className="text-white">{selectedSession.meetupDetails.staffMember}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-orange-400" />
                        <span className="text-slate-400">Code:</span>
                        <span className="font-mono text-white">{selectedSession.meetupDetails.confirmationCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedSession.meetupDetails && (
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                      <Phone className="h-4 w-4" />
                      Staff kontaktieren
                    </button>
                  )}
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors">
                    <CheckCircle className="h-4 w-4" />
                    Als abgeschlossen markieren
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">
                    <AlertCircle className="h-4 w-4" />
                    Stornieren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

