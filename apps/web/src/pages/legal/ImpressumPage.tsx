import { LegalPageLayout } from "./LegalPageLayout";

export const ImpressumPage = () => {
  return (
    <LegalPageLayout title="Impressum" lastUpdated="2024">
      <div>
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
          <strong>Nebula Supply</strong>
          <br />
          Musterstraße 123
          <br />
          12345 Musterstadt
          <br />
          Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          <strong>E-Mail:</strong> info@nebula.supply
          <br />
          <strong>Telefon:</strong> +49 (0) 123 456789
        </p>

        <h2>Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
          <br />
          DE123456789
        </p>

        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          Nebula Supply
          <br />
          Musterstraße 123
          <br />
          12345 Musterstadt
        </p>

        <h2>Haftungsausschluss</h2>
        
        <h3>Haftung für Inhalte</h3>
        <p>
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
          Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. 
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten 
          nach den allgemeinen Gesetzen verantwortlich.
        </p>

        <h3>Haftung für Links</h3>
        <p>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen 
          Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
          Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der 
          Seiten verantwortlich.
        </p>

        <h3>Urheberrecht</h3>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
          dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der 
          Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung 
          des jeweiligen Autors bzw. Erstellers.
        </p>
      </div>
    </LegalPageLayout>
  );
};

