import { useState } from "react";
import { MapPin, User, Building, Phone, ArrowRight, Copy, Check, Package, Truck } from "lucide-react";
import { CheckoutData } from "./CheckoutFlow";
import { cn } from "../../utils/cn";

interface AddressFormProps {
  data: CheckoutData;
  onChange: (data: CheckoutData) => void;
  onNext: () => void;
}

const countries = [
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
  { code: "CH", name: "Schweiz" },
  { code: "FR", name: "Frankreich" },
  { code: "IT", name: "Italien" },
  { code: "ES", name: "Spanien" },
  { code: "NL", name: "Niederlande" },
  { code: "BE", name: "Belgien" },
  { code: "DK", name: "Dänemark" },
  { code: "SE", name: "Schweden" },
  { code: "NO", name: "Norwegen" },
  { code: "FI", name: "Finnland" },
];

export const AddressForm = ({ data, onChange, onNext }: AddressFormProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const updateDeliveryType = (type: "address" | "paketstation") => {
    onChange({
      ...data,
      deliveryType: type,
    });
  };

  const updatePaketstation = (field: string, value: string) => {
    onChange({
      ...data,
      paketstation: {
        postnummer: data.paketstation?.postnummer || "",
        stationNumber: data.paketstation?.stationNumber || "",
        city: data.paketstation?.city || "",
        postalCode: data.paketstation?.postalCode || "",
        [field]: value,
      },
    });
  };

  const updateShippingAddress = (field: string, value: string) => {
    onChange({
      ...data,
      shippingAddress: {
        ...data.shippingAddress,
        [field]: value,
      },
    });
  };

  const updateBillingAddress = (field: string, value: string) => {
    onChange({
      ...data,
      billingAddress: {
        ...data.billingAddress,
        [field]: value,
      },
    });
  };

  const copyShippingToBilling = () => {
    onChange({
      ...data,
      billingAddress: {
        ...data.shippingAddress,
        sameAsShipping: true,
      },
    });
    setCopiedField("shipping");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyBillingToShipping = () => {
    onChange({
      ...data,
      shippingAddress: {
        ...data.billingAddress,
      },
    });
    setCopiedField("billing");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isPaketstationValid = !!(
    data.paketstation?.postnummer &&
    data.paketstation?.stationNumber &&
    data.paketstation?.city &&
    data.paketstation?.postalCode
  );

  const isShippingValid = data.deliveryType === "paketstation" 
    ? isPaketstationValid
    : !!(
      data.shippingAddress.firstName &&
      data.shippingAddress.lastName &&
      data.shippingAddress.address1 &&
      data.shippingAddress.city &&
      data.shippingAddress.postalCode
    );

  const isBillingValid = data.billingAddress.sameAsShipping || !!(
    data.billingAddress.firstName &&
    data.billingAddress.lastName &&
    data.billingAddress.address1 &&
    data.billingAddress.city &&
    data.billingAddress.postalCode
  );

  return (
    <div className="space-y-8">
      {/* Delivery Type Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Truck className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Lieferart wählen</h3>
            <p className="text-sm text-slate-400">Wie möchtest du deine Bestellung erhalten?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateDeliveryType("address")}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-left",
              data.deliveryType === "address"
                ? "border-orange-500 bg-orange-500/10"
                : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <MapPin className={cn(
                "h-5 w-5",
                data.deliveryType === "address" ? "text-orange-400" : "text-slate-400"
              )} />
              <span className="font-semibold text-white">Lieferadresse</span>
            </div>
            <p className="text-sm text-slate-400">
              Lieferung direkt zu deiner Wunschadresse
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateDeliveryType("paketstation")}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-left",
              data.deliveryType === "paketstation"
                ? "border-orange-500 bg-orange-500/10"
                : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className={cn(
                "h-5 w-5",
                data.deliveryType === "paketstation" ? "text-orange-400" : "text-slate-400"
              )} />
              <span className="font-semibold text-white">DHL Packstation</span>
            </div>
            <p className="text-sm text-slate-400">
              Abholung an deiner DHL Packstation
            </p>
          </button>
        </div>
      </div>

      {/* Paketstation Form */}
      {data.deliveryType === "paketstation" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Package className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">DHL Packstation Details</h3>
              <p className="text-sm text-slate-400">Gib deine Packstation-Informationen ein</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Postnummer *
              </label>
              <input
                type="text"
                value={data.paketstation?.postnummer || ""}
                onChange={(e) => updatePaketstation("postnummer", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="z.B. 12345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Packstation Nummer *
              </label>
              <input
                type="text"
                value={data.paketstation?.stationNumber || ""}
                onChange={(e) => updatePaketstation("stationNumber", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="z.B. 123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stadt *
              </label>
              <input
                type="text"
                value={data.paketstation?.city || ""}
                onChange={(e) => updatePaketstation("city", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="Berlin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                PLZ *
              </label>
              <input
                type="text"
                value={data.paketstation?.postalCode || ""}
                onChange={(e) => updatePaketstation("postalCode", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="10115"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-slate-300">
              ℹ️ Deine Postnummer findest du in deiner DHL App oder auf deiner DHL Kundenkarte.
            </p>
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {data.deliveryType === "address" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <MapPin className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Lieferadresse</h3>
              <p className="text-sm text-slate-400">Wo soll deine Bestellung ankommen?</p>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Vorname *
            </label>
            <input
              type="text"
              value={data.shippingAddress.firstName}
              onChange={(e) => updateShippingAddress("firstName", e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              placeholder="Max"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nachname *
            </label>
            <input
              type="text"
              value={data.shippingAddress.lastName}
              onChange={(e) => updateShippingAddress("lastName", e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              placeholder="Mustermann"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Firma (optional)
          </label>
          <input
            type="text"
            value={data.shippingAddress.company || ""}
            onChange={(e) => updateShippingAddress("company", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            placeholder="Mustermann GmbH"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Straße und Hausnummer *
          </label>
          <input
            type="text"
            value={data.shippingAddress.address1}
            onChange={(e) => updateShippingAddress("address1", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            placeholder="Musterstraße 123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Adresszusatz (optional)
          </label>
          <input
            type="text"
            value={data.shippingAddress.address2 || ""}
            onChange={(e) => updateShippingAddress("address2", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            placeholder="Wohnung 4, 2. Stock"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stadt *
            </label>
            <input
              type="text"
              value={data.shippingAddress.city}
              onChange={(e) => updateShippingAddress("city", e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              placeholder="Berlin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              PLZ *
            </label>
            <input
              type="text"
              value={data.shippingAddress.postalCode}
              onChange={(e) => updateShippingAddress("postalCode", e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              placeholder="10115"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Land *
            </label>
            <select
              value={data.shippingAddress.country}
              onChange={(e) => updateShippingAddress("country", e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Telefon (optional)
          </label>
          <input
            type="tel"
            value={data.shippingAddress.phone || ""}
            onChange={(e) => updateShippingAddress("phone", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            placeholder="+49 30 12345678"
          />
        </div>
        </div>
      )}

      {/* Billing Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Building className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Rechnungsadresse</h3>
              <p className="text-sm text-slate-400">Für die Rechnung</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={copyShippingToBilling}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                copiedField === "shipping"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              )}
            >
              {copiedField === "shipping" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedField === "shipping" ? "Kopiert!" : "Von Lieferadresse"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50 border border-slate-600">
          <input
            type="checkbox"
            id="sameAsShipping"
            checked={data.billingAddress.sameAsShipping}
            onChange={(e) => {
              onChange({
                ...data,
                billingAddress: {
                  ...data.billingAddress,
                  sameAsShipping: e.target.checked,
                },
              });
            }}
            className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
          />
          <label htmlFor="sameAsShipping" className="text-sm text-slate-300">
            Rechnungsadresse ist identisch mit Lieferadresse
          </label>
        </div>

        {!data.billingAddress.sameAsShipping && (
          <div className="space-y-4 pl-4 border-l-2 border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vorname *
                </label>
                <input
                  type="text"
                  value={data.billingAddress.firstName}
                  onChange={(e) => updateBillingAddress("firstName", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Max"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nachname *
                </label>
                <input
                  type="text"
                  value={data.billingAddress.lastName}
                  onChange={(e) => updateBillingAddress("lastName", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Firma (optional)
              </label>
              <input
                type="text"
                value={data.billingAddress.company || ""}
                onChange={(e) => updateBillingAddress("company", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="Mustermann GmbH"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Straße und Hausnummer *
              </label>
              <input
                type="text"
                value={data.billingAddress.address1}
                onChange={(e) => updateBillingAddress("address1", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="Musterstraße 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Adresszusatz (optional)
              </label>
              <input
                type="text"
                value={data.billingAddress.address2 || ""}
                onChange={(e) => updateBillingAddress("address2", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="Wohnung 4, 2. Stock"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stadt *
                </label>
                <input
                  type="text"
                  value={data.billingAddress.city}
                  onChange={(e) => updateBillingAddress("city", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Berlin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  PLZ *
                </label>
                <input
                  type="text"
                  value={data.billingAddress.postalCode}
                  onChange={(e) => updateBillingAddress("postalCode", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="10115"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Land *
                </label>
                <select
                  value={data.billingAddress.country}
                  onChange={(e) => updateBillingAddress("country", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Telefon (optional)
              </label>
              <input
                type="tel"
                value={data.billingAddress.phone || ""}
                onChange={(e) => updateBillingAddress("phone", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="+49 30 12345678"
              />
            </div>
          </div>
        )}
      </div>

      {/* Delivery Instructions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <User className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Lieferhinweise</h3>
            <p className="text-sm text-slate-400">Besondere Anweisungen für die Lieferung</p>
          </div>
        </div>

        <textarea
          value={data.deliveryInstructions || ""}
          onChange={(e) => onChange({ ...data, deliveryInstructions: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
          placeholder="z.B. Bitte bei Nachbarn abgeben, Klingel defekt, etc."
        />
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-6 border-t border-slate-700">
        <button
          onClick={onNext}
          disabled={!isShippingValid || !isBillingValid}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300",
            isShippingValid && isBillingValid
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-lg"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          <span>Weiter zur Zahlung</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

