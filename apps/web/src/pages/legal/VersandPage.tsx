import { LegalPageLayout } from "./LegalPageLayout";

export const VersandPage = () => {
  return (
    <LegalPageLayout title="Versand & Zahlungsbedingungen" lastUpdated="2024">
      <div>
        <h2>Versandinformationen</h2>
        
        <h3>Versandkosten</h3>
        <p>
          Die Versandkosten richten sich nach dem Gewicht und der Größe der bestellten Ware sowie 
          nach dem Lieferort. Die genauen Versandkosten werden Ihnen im Rahmen des Bestellvorgangs 
          mitgeteilt.
        </p>

        <h3>Versand innerhalb Deutschlands</h3>
        <p>
          <strong>Standardversand:</strong> 2-5 Werktage
          <br />
          <strong>Kosten:</strong> 4,90 €
          <br />
          <strong>Expressversand:</strong> 1-2 Werktage
          <br />
          <strong>Kosten:</strong> 9,90 €
        </p>

        <h3>Versand in EU-Länder</h3>
        <p>
          <strong>Standardversand:</strong> 3-7 Werktage
          <br />
          <strong>Kosten:</strong> 9,90 €
          <br />
          <strong>Expressversand:</strong> 2-4 Werktage
          <br />
          <strong>Kosten:</strong> 19,90 €
        </p>

        <h3>Versand außerhalb der EU</h3>
        <p>
          Versand außerhalb der EU ist auf Anfrage möglich. Bitte kontaktieren Sie uns für 
          individuelle Versandkosten.
        </p>

        <h2>Zahlungsmethoden</h2>
        
        <h3>Verfügbare Zahlungsarten</h3>
        <ul>
          <li><strong>Vorkasse:</strong> Zahlung per Überweisung vor Versand</li>
          <li><strong>Kreditkarte:</strong> Visa, Mastercard, American Express</li>
          <li><strong>PayPal:</strong> Schnelle und sichere Zahlung</li>
          <li><strong>Bitcoin:</strong> Kryptowährungszahlung (Lightning & On-Chain)</li>
          <li><strong>Crypto Voucher:</strong> Sofortige Credits</li>
          <li><strong>Bargeld:</strong> Am Nebula-Schalter (nur nach Verifizierung)</li>
        </ul>

        <h3>Zahlungsbedingungen</h3>
        <p>
          Bei Zahlung per Vorkasse wird die Ware nach Zahlungseingang versandt. Bei anderen 
          Zahlungsmethoden erfolgt der Versand sofort nach Bestellbestätigung.
        </p>

        <h2>Lieferzeiten</h2>
        <p>
          Die Lieferzeiten beginnen mit dem Tag der Zahlung (bei Vorkasse) bzw. mit dem Tag 
          der Bestellbestätigung (bei anderen Zahlungsmethoden) und enden mit dem Tag der 
          Lieferung an den Empfänger.
        </p>
        <p>
          <strong>Wichtig:</strong> Bei Drops erfolgt die Lieferung erst nach erfolgreicher 
          Aktivierung des Drops und Produktion der Ware. Die Lieferzeit kann daher länger sein.
        </p>

        <h2>Versandbedingungen</h2>
        <p>
          Die Ware wird an die von Ihnen angegebene Lieferadresse versandt. Bitte stellen Sie 
          sicher, dass die Lieferadresse vollständig und korrekt ist. Für Fehler aufgrund 
          falscher Angaben übernehmen wir keine Haftung.
        </p>
      </div>
    </LegalPageLayout>
  );
};

