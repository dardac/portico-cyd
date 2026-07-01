import {
  buildingProtocols,
  emergencyContacts,
  evacuationZones,
  firstSafetyMeasures,
} from "@/lib/security/protocols";

function IconPhone() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="protocol-panel-icon protocol-panel-icon--emergency"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A9.022 9.022 0 0 1 2.43 8.326 9.01 9.01 0 0 1 2 5V3.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="protocol-panel-icon protocol-panel-icon--safety"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 1.944A11.954 11.954 0 0 1 2.5 14.5 11.954 11.954 0 0 0 10 18.056c5.093 0 9.8-3.217 11.5-7.73A11.954 11.954 0 0 1 10 1.944Zm4.88 4.323a.75.75 0 0 0-1.061-1.06l-5.591 5.59-2.29-2.29a.75.75 0 1 0-1.06 1.06l2.823 2.823a.75.75 0 0 0 1.061 0l6.152-6.123Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="protocol-panel-icon protocol-panel-icon--zone"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="protocol-panel-icon protocol-panel-icon--zone"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V4.25A2.25 2.25 0 0 0 15.75 2H4.25ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 6 6.75Zm.75 2.25h.75a.75.75 0 0 0 0-1.5h-.75a.75.75 0 0 0 0 1.5ZM6 10.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm.75 2.25h.75a.75.75 0 0 0 0-1.5h-.75a.75.75 0 0 0 0 1.5ZM10 6.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm.75 2.25h.75a.75.75 0 0 0 0-1.5h-.75a.75.75 0 0 0 0 1.5ZM10 10.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm.75 2.25h.75a.75.75 0 0 0 0-1.5h-.75a.75.75 0 0 0 0 1.5ZM13.5 6.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm.75 2.25h.75a.75.75 0 0 0 0-1.5h-.75a.75.75 0 0 0 0 1.5ZM13.5 10.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SecurityProtocolsPage() {
  return (
    <div className="page-content mx-auto max-w-2xl space-y-5">
      <header className="page-header">
        <h1 className="page-title">Protocolos de seguridad</h1>
        <p className="page-subtitle">
          Contactos de emergencia, medidas inmediatas y zonas de reunión en el
          Pórtico del Ávila.
        </p>
      </header>

      <section className="protocol-panel">
        <header className="protocol-panel-header">
          <IconPhone />
          <h2 className="protocol-panel-title">Contactos de emergencia</h2>
        </header>
        <p className="protocol-panel-lead">
          Números de referencia en Venezuela y Caracas. En urgencia inmediata
          marca{" "}
          <a href="tel:171" className="protocol-inline-link">
            171
          </a>{" "}
          o{" "}
          <a href="tel:911" className="protocol-inline-link">
            911
          </a>
          .
        </p>
        <ul className="protocol-contact-list">
          {emergencyContacts.map((contact) => (
            <li key={contact.id} className="protocol-contact-row">
              <div className="protocol-contact-info">
                <p className="protocol-contact-name">{contact.name}</p>
                <p className="protocol-contact-description">
                  {contact.description}
                </p>
              </div>
              <div className="protocol-contact-phones">
                {contact.phones.map((entry) => (
                  <a
                    key={entry.tel}
                    href={`tel:${entry.tel}`}
                    className="protocol-phone-badge"
                  >
                    {entry.phone}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="protocol-panel protocol-panel--safety">
        <header className="protocol-panel-header">
          <IconShield />
          <h2 className="protocol-panel-title protocol-panel-title--safety">
            Primeras medidas de seguridad
          </h2>
        </header>
        <ul className="protocol-safety-list">
          {firstSafetyMeasures.map((measure) => (
            <li key={measure.id} className="protocol-safety-item">
              <span className="protocol-safety-label">{measure.label}:</span>{" "}
              {measure.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="protocol-panel">
        <header className="protocol-panel-header">
          <IconMapPin />
          <h2 className="protocol-panel-title protocol-panel-title--zone">
            Zonas de seguridad y evacuación
          </h2>
        </header>
        <ul className="protocol-zone-list">
          {evacuationZones.map((zone) => (
            <li key={zone.id} className="protocol-zone-card">
              <span className="protocol-zone-badge">{zone.badge}</span>
              <p className="protocol-zone-title">{zone.title}</p>
              <p className="protocol-zone-description">{zone.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="protocol-panel">
        <header className="protocol-panel-header">
          <IconBuilding />
          <h2 className="protocol-panel-title protocol-panel-title--zone">
            Protocolos en el edificio
          </h2>
        </header>
        <ul className="protocol-zone-list">
          {buildingProtocols.map((protocol) => (
            <li key={protocol.id} className="protocol-zone-card">
              <span className="protocol-zone-badge">{protocol.badge}</span>
              <p className="protocol-zone-title">{protocol.title}</p>
              <ul className="protocol-building-steps">
                {protocol.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="protocol-panel-footnote">
          Después de llamar a emergencias, avisa a vigilancia del Pórtico del
          Ávila indicando torre, piso y apartamento.
        </p>
      </section>
    </div>
  );
}
