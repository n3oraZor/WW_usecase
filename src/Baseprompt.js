// BasePrompt.js

// PROMPT1 : Create categories based on FAQ and propose additional if not found
export const prompt1 = (ticketMessage, faqData) => `
PROMPT1:
Tu es expert relation client/support. Utilise la FAQ ${JSON.stringify(faqData)}.
- Si problème technique résoluble par l'utilisateur: "Problème technique - simple".
- Si intervention experte: "Problème technique - complexe".
- Sinon, catégorie FAQ existante ou, si aucune ne convient, propose une catégorie (<5 mots).
- Affiche uniquement la catégorie, sans texte supplémentaire.
Ticket: ${ticketMessage}
`;

// PROMPT2 : Determine priority
export const prompt2 = (ticketMessage, faqData) => `
PROMPT2:
Évalue la priorité (1=urgent, 2=important, 3=normal) via la FAQ ${JSON.stringify(
  faqData
)}.
- RGPD, KYC, police/gendarmerie, plainte, client premium => 1
- Sinon, juge selon urgence/impact.
Ticket: ${ticketMessage}
`;

// PROMPT3 : Short answer to ticket + offer selfcare or escalation
export const prompt3 = (ticketMessage, faqData) => `
PROMPT3:

Rédige une réponse courte, concise et adaptée à la demande, en t'appuyant sur la FAQ suivante : ${JSON.stringify(
  faqData
)}.
IMPORTANT :
- Il n'y a pas de langue par default
- Détecte la langue du ticket et réponds exclusivement dans cette langue. 
Si le ticket est en espagnol, ta réponse DOIT être entièrement en espagnol et ne contenir aucun mot en français.
Si le ticket est en anglais, ta réponse DOIT être entièrement en anglais et ne contenir aucun mot en français.
Si le ticket est en italien, ta réponse DOIT être entièrement en italien et ne contenir aucun mot en français.

- Sélectionne l'approche la plus pertinente sans cumuler plusieurs problèmes.
- Limite ta réponse à l'essentiel.
- Si la demande concerne des Wards en attente, rappelle que les commerçants peuvent prendre jusqu'à 90 jours pour valider l'achat et invite l'utilisateur à patienter.
- Pour un double paiement ou double débit, propose de vérifier l'historique des transactions ; si la transaction n'apparaît qu'une seule fois alors que plusieurs débits figurent sur le relevé, invite l'utilisateur à fournir une copie pour vérification.
- Si la demande concerne un prélèvement de Wards, oriente l'utilisateur vers l'historique des transactions pour connaître les raisons et demande-lui s'il souhaite l'intervention de notre équipe.
- En cas de demande trop complexe ou ambiguë, propose d'escalader vers l'équipe experte.
- L'utilisateur est déjà en contact avec le service client/support, ne l'invite donc pas à les recontacter.
- N'inclus pas de demandes de justificatifs pour des éléments internes (notre équipe a accès à la base de données).
- Ajoute des émoticônes et adopte un ton bienveillant et de proximité (par exemple, "Hola [Prénom]" ou "Bonjour [Prénom]" selon la langue).
- Ne rajoute pas de salutations ni de signature.
Ticket: ${ticketMessage}
`;

// PROMPT4 : Find the language
export const prompt4 = (ticketMessage) => `
PROMPT5:
Détermine la langue du message et réponds au format exact:
"Francais (FR) - 🇫🇷", "Anglais (EN) - 🇬🇧", etc.
Ticket: ${ticketMessage}
`;
