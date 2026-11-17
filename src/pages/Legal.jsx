import { company } from "../data.js";
import { PageHero, usePageMeta } from "../components/shared.jsx";

const contactLine = (
  <>
    <a href={`mailto:${company.email}`}>{company.email}</a> or <a href={company.phoneHref}>{company.phone}</a>
  </>
);

function LegalPage({ crumb, title, accent, description, note, sections }) {
  return (
    <>
      <PageHero crumb={crumb} title={title} accent={accent} description={description} />
      <section className="section">
        <div className="wrap legal">
          {note && <p className="note">{note}</p>}
          {sections.map(([h, body]) => (
            <section key={h}>
              <h2>{h}</h2>
              <p>{body}</p>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

export function Privacy() {
  usePageMeta("Privacy Policy", "How information submitted through the GLEITS website is handled.");
  return (
    <LegalPage
      crumb="Privacy Policy"
      title="Your information,"
      accent="handled with care."
      description="A clear overview of the information this website collects and how it is used."
      note="Draft website policy · Company-specific retention periods and legal review are pending. This draft must be reviewed before public production use."
      sections={[
        ["1. Who we are", <>This website represents {company.name}, located at {company.address} For privacy enquiries, contact {contactLine}.</>],
        [
          "2. Information you provide",
          "The enquiry form collects your name, email and project description. You may also provide your company, phone number, service interest and estimated budget. The careers form collects your name, email, role of interest and a short introduction, and optionally your phone number. Please avoid including passwords, financial credentials, sensitive personal records or confidential client data.",
        ],
        [
          "3. How information is used",
          "Submitted details are used to review your enquiry or interest in working with us, communicate with you and understand the services you are seeking. They are saved on the website’s server. Information is not sold or used for unrelated marketing through this website.",
        ],
        [
          "4. Security and spam prevention",
          "The forms validate input and use a hidden spam field. Access to stored submissions must be restricted to authorized operators.",
        ],
        [
          "5. Storage and retention",
          <>The company must confirm its retention schedule and deletion process before public launch. Contact {contactLine} to request access, correction or deletion of information you submitted; requests are reviewed against applicable obligations.</>,
        ],
        [
          "6. Cookies and external links",
          "This website does not add advertising or analytics cookies. External links lead to websites with their own policies, which this website does not control.",
        ],
        ["7. Updates", "This policy may be revised when services or information-handling practices change. Material changes should be accompanied by an updated policy date following company review."],
      ]}
    />
  );
}

export function Terms() {
  usePageMeta("Terms & Conditions", "General information about using the GLEITS website and making an enquiry.");
  return (
    <LegalPage
      crumb="Terms & Conditions"
      title="Clear expectations."
      accent="Better partnerships."
      description="General information about using this website and making an enquiry."
      sections={[
        ["1. Website information", `The information on this website introduces ${company.name}, its services and project collection. Service descriptions are general and subject to a discovery discussion, resource availability and a written agreement.`],
        ["2. Project enquiries", "Submitting an enquiry does not create a contract, confirm a quotation or commit either party to a delivery timeline. Scope, fees, acceptance criteria, support arrangements and ownership terms are agreed separately in writing."],
        ["3. Portfolio and technology information", "Project labels distinguish projects awaiting details and proposed solutions. Illustrative visuals are identified. Listed technologies are options for consideration and do not guarantee specialist availability for a particular engagement."],
        ["4. Acceptable use", "Please use the website lawfully. Do not attempt unauthorized access, disrupt the service, submit abusive content or use forms to distribute unsolicited messages. You are responsible for the accuracy of the information you provide."],
        ["5. Intellectual property", "The GLEITS name and original logo remain the property of their respective owner. Third-party product names, technology marks, images and project branding belong to their respective owners. Project-specific intellectual property rights are defined in the relevant agreement."],
        ["6. External websites and availability", "Linked websites operate independently and may change. The company does not promise continuous availability of this website. Any limitations of liability and jurisdiction-specific requirements must be confirmed through legal review before public launch."],
        ["7. Contact", <>For questions, contact {contactLine}. Our address is {company.address}</>],
      ]}
    />
  );
}
