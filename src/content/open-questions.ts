export const legalQuestions = [
  "Does unpaid carpool matching in Mauritius need an NLTA licence, a public-service-vehicle licence, a contract-car permit, or another authorisation? Version A is built as a noticeboard. That assumption is not a legal opinion.",
  "Do ordinary motor policies in Mauritius cover a carpool passenger when no money changes hands? The app must not tell anyone they are insured.",
  "If people later exchange cash outside the app, does the product still count as unpaid? The software cannot see that. The terms should say what is forbidden, after counsel reviews them.",
  "Who is the data controller: a sole trader, or a company named Bojo Solutions? The registered name, BRN, and address are not in this repository and are not invented here.",
  "Data Protection Act 2017: is registration with the Data Protection Office required? What is the lawful basis for storing a driving-licence number? How long are phones, plates, and trip history kept? If a future server sits outside Mauritius, is that a cross-border transfer?",
  "Is 18 the right minimum age for both roles?",
  "Are gender-filtered trips lawful? They are not built.",
  "What must happen when someone reports a safety incident? Who is told, and what records must be kept?",
  "The English and French drafts need a Mauritius lawyer. Kreol Morisien is not provided.",
  "Are Rodrigues and the outer islands in scope, and do the same transport rules apply? This demo only matches mainland Mauritius.",
];

export const productQuestions = [
  "Are the match radii right: 10 km around each end, or 4 km from the straight-line corridor?",
  "Should weekday commute templates be added next?",
  "Should a request expire automatically before departure?",
  "Should a real SMS check happen before a phone number is shown? The demo only has a stub code.",
  "Should the plate stay hidden until people meet, instead of appearing after acceptance?",
  "Is there an official plate pattern that should be validated? The demo only checks length and characters.",
  "If licence or insurance files are uploaded later, who may view them and where are they stored?",
  "Should a second administrator be required before anyone can be approved? Self-review is already blocked.",
  "Is the public name “Carpool Mauritius”, or is there a shorter trade name?",
  "Do passengers need the same style of review as drivers, or only drivers?",
];

export const apiKeys = [
  {
    name: "VITE_GOOGLE_MAPS_API_KEY",
    required: "No",
    use: "Optional browser key for the Maps JavaScript API. Restrict it by HTTP referrer. The static demo uses a Mauritius place list and a schematic map when this is empty. Do not commit a real key. A key is visible in the built JavaScript.",
  },
  {
    name: "SMS provider key",
    required: "Not used",
    use: "Phone confirmation is a stub. No SMS account is called. A future server would need a provider Kevin chooses. No key name is invented as if an account exists.",
  },
  {
    name: "SMTP or email API key",
    required: "Not used",
    use: "Notices stay in the browser. The mail adapter records that nothing was sent.",
  },
];
