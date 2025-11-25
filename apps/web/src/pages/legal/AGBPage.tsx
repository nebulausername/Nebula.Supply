import { LegalPageLayout } from "./LegalPageLayout";

export const AGBPage = () => {
  return (
    <LegalPageLayout title="Allgemeine Geschäftsbedingungen" lastUpdated="2024">
      <div>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Lieferung 
          von Waren, die Nebula Supply (nachfolgend "Verkäufer") über seinen Online-Shop an Verbraucher 
          und Unternehmer (nachfolgend "Kunde") verkauft.
        </p>

        <h2>2. Vertragspartner, Vertragsschluss</h2>
        <p>
          Der Kaufvertrag kommt zustande, indem der Kunde durch Absenden der Bestellung eine 
          verbindliche Bestellung abgibt und der Verkäufer diese durch Versand der Ware oder 
          durch eine ausdrückliche Bestellbestätigung annimmt.
        </p>

        <h2>3. Preise und Zahlungsbedingungen</h2>
        <p>
          Alle Preise verstehen sich in Euro inklusive der gesetzlichen Mehrwertsteuer. 
          Die Zahlung erfolgt per Vorkasse, Kreditkarte, PayPal, Bitcoin oder anderen 
          vereinbarten Zahlungsmethoden.
        </p>

        <h2>4. Lieferung und Versand</h2>
        <p>
          Die Lieferung erfolgt innerhalb Deutschlands und in die EU. Die Versandkosten werden 
          dem Kunden im Rahmen des Bestellvorgangs mitgeteilt. Die Lieferzeit beträgt in der 
          Regel 2-5 Werktage für Deutschland, 3-7 Werktage für EU-Länder.
        </p>

        <h2>5. Widerrufsrecht</h2>
        <p>
          Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag 
          zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag, an dem Sie oder ein 
          von Ihnen benannter Dritter die Waren in Besitz genommen haben.
        </p>

        <h2>6. Gewährleistung</h2>
        <p>
          Für Mängel an der Ware gelten die gesetzlichen Bestimmungen. Die Gewährleistungsfrist 
          beträgt 24 Monate ab Lieferung der Ware.
        </p>

        <h2>7. Datenschutz</h2>
        <p>
          Der Verkäufer erhebt, verarbeitet und nutzt personenbezogene Daten des Kunden nur, 
          soweit dies für die Abwicklung des Vertragsverhältnisses erforderlich ist. 
          Nähere Informationen finden Sie in unserer Datenschutzerklärung.
        </p>

        <h2>8. Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für alle 
          Streitigkeiten aus diesem Vertragsverhältnis ist, soweit der Kunde Kaufmann ist, 
          der Sitz des Verkäufers.
        </p>
      </div>
    </LegalPageLayout>
  );
};

