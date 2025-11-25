import type { LeadTime } from "@nebula/shared";

const leadTimeMap: Record<LeadTime, { title: string; description?: string }> = {
  same_day: {
    title: "Versand heute",
    description: "Bestellungen bis 18:00 Uhr werden heute verschickt."
  },
  "2_days": {
    title: "Lieferzeit 2 Tage",
    description: "Schneller Versand per Express innerhalb Deutschlands."
  },
  "1_week": {
    title: "Lieferzeit 1 Woche",
    description: "Handfinish & Qualitätscheck dauern ein paar Tage länger."
  },
  preorder: {
    title: "Vorbestellung",
    description: "Wir fertigen dein Paar, Versand startet in Kürze."
  }
};

export const formatLeadTime = (leadTime: LeadTime) => leadTimeMap[leadTime] ?? leadTimeMap["2_days"];
